import { predict, softmax } from './wasm.js';
import { remediate, circuitBreakerScaleUp } from './remediate.js';
import { publishAnomalyEvent } from './nats-publisher.js';
import { forecast } from './forecaster.js';
import { pushMetrics, pushForecastMetric } from './metrics-pusher.js';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
const LOKI_URL = process.env.LOKI_URL || 'http://localhost:3100';
const JAEGER_URL = process.env.JAEGER_URL || 'http://localhost:16686';

const TARGET_SERVICE = process.env.TARGET_SERVICE || 'payment-service';
const REMEDIATION_ENABLED = process.env.REMEDIATION_ENABLED !== 'false'; // on by default
const PREDICTIVE_SCALING_ENABLED = process.env.PREDICTIVE_SCALING_ENABLED !== 'false'; // on by default
const CIRCUIT_BREAKER_ENABLED = process.env.CIRCUIT_BREAKER_ENABLED !== 'false'; // on by default
const SOFTMAX_TEMPERATURE = parseFloat(process.env.SOFTMAX_TEMPERATURE || '1.5');
const FORECAST_INTERVAL_MS = parseInt(process.env.FORECAST_INTERVAL_MS || '60000'); // run forecast every 60s
const POLL_INTERVAL_MS = 2000;
const FETCH_TIMEOUT_MS = 1500;

// Helper with AbortController for strict timeouts
async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      console.warn(`[TIMEOUT] Fetch aborted for ${url} (exceeded ${FETCH_TIMEOUT_MS}ms)`);
    } else {
      console.error(`[ERROR] Fetch failed for ${url}:`, err.message);
    }
    return null;
  }
}

async function getPrometheusMetrics() {
  const cpuQuery = encodeURIComponent(`sum(rate(process_cpu_seconds_total{job="${TARGET_SERVICE}"}[1m])) * 100`);
  const latQuery = encodeURIComponent(`histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="${TARGET_SERVICE}"}[1m])) by (le))`);

  const [cpuRes, latRes] = await Promise.all([
    fetchWithTimeout(`${PROMETHEUS_URL}/api/v1/query?query=${cpuQuery}`),
    fetchWithTimeout(`${PROMETHEUS_URL}/api/v1/query?query=${latQuery}`)
  ]);

  let cpu = 0;
  let latency = 0;

  if (cpuRes?.data?.result?.length > 0) {
    cpu = parseFloat(cpuRes.data.result[0].value[1]);
  }
  
  if (latRes?.data?.result?.length > 0) {
    const parsedLat = parseFloat(latRes.data.result[0].value[1]);
    if (!isNaN(parsedLat)) latency = parsedLat;
  }

  return { cpu, latency };
}

async function getJaegerTrace() {
  const data = await fetchWithTimeout(`${JAEGER_URL}/api/traces?service=${TARGET_SERVICE}&limit=1`);
  if (!data || !data.data || data.data.length === 0) return 0.0;
  
  // Extract duration from the root span of the most recent trace
  const spans = data.data[0].spans;
  if (!spans || spans.length === 0) return 0.0;
  
  const durationUs = spans[0].duration;
  return durationUs / 1000000.0; // convert microseconds to seconds
}

async function getLokiLog() {
  const query = encodeURIComponent(`{service_name="${TARGET_SERVICE}"}`);
  const data = await fetchWithTimeout(`${LOKI_URL}/loki/api/v1/query_range?query=${query}&limit=1`);
  
  if (!data?.data?.result?.length || !data.data.result[0].values?.length) {
    return 'NO_LOGS';
  }
  
  return data.data.result[0].values[0][1];
}

async function poll() {
  console.log(`\n--- [${new Date().toISOString()}] Polling Telemetry for ${TARGET_SERVICE} ---`);
  
  try {
    // 1. Fetch concurrently to ensure ~1.5s max total latency
    const [metrics, traceDuration, logLine] = await Promise.all([
      getPrometheusMetrics(),
      getJaegerTrace(),
      getLokiLog()
    ]);
    
    console.log(`Inputs retrieved:`);
    console.log(`  CPU:            ${metrics.cpu.toFixed(2)}%`);
    console.log(`  Latency (P95):  ${metrics.latency.toFixed(4)}s`);
    console.log(`  Trace Duration: ${traceDuration.toFixed(4)}s`);
    console.log(`  Log Line:       "${logLine.substring(0, 50)}${logLine.length > 50 ? '...' : ''}"`);

    // 2. Feed the Edge Wasm Module
    const outputLogits = await predict({
      logLine,
      cpu: metrics.cpu,
      latency: metrics.latency,
      traceDuration
    });

    // 3. Compute softmax probabilities and argmax state
    const logitsArray = Array.from(outputLogits);
    const probs = softmax(logitsArray, SOFTMAX_TEMPERATURE);
    const anomalyScore = probs[1] + probs[2]; // P(class1) + P(class2)
    const state = logitsArray.indexOf(Math.max(...logitsArray));

    console.log(`\n[WASM RESULT] Logits: [${logitsArray.map(l => l.toFixed(3)).join(', ')}]`);
    console.log(`[SOFTMAX]     Probs:  [${probs.map(p => p.toFixed(4)).join(', ')}] (T=${SOFTMAX_TEMPERATURE})`);
    console.log(`[SOFTMAX]     Anomaly Score: ${anomalyScore.toFixed(4)}`);

    // 4. Always push metric to Pushgateway (healthy or not) so KEDA has a fresh value
    const pushResult = await pushMetrics(TARGET_SERVICE, anomalyScore, state);

    if (pushResult.success) {
      console.log(`[METRICS-PUSH] Pushed anomaly_score=${anomalyScore.toFixed(4)} to Pushgateway`);
    } else {
      console.warn(`[METRICS-PUSH] Failed to push to Pushgateway`);
    }

    // 5. Act on anomaly
    if (state === 0) {
      console.log(`[STATUS] State 0 (Healthy). No action required.`);
    } else {
      console.warn(`[WARNING] State ${state} Anomaly detected! anomaly_score=${anomalyScore.toFixed(4)}`);

      // Publish to NATS for LangGraph brain (Phase 3 deep RCA)
      await publishAnomalyEvent(TARGET_SERVICE, state, { cpu: metrics.cpu, latency: metrics.latency, traceDuration });

      if (REMEDIATION_ENABLED) {
        // Restart is always direct — HPA cannot restart pods
        await remediate(TARGET_SERVICE, state);

        // Scaling: KEDA handles it via the pushed anomaly_score metric.
        // Circuit breaker: if Pushgateway is down, fall back to direct K8s scale.
        if (!pushResult.success && CIRCUIT_BREAKER_ENABLED) {
          console.warn(`[CIRCUIT-BREAKER] Pushgateway unreachable, falling back to direct scale`);
          await circuitBreakerScaleUp(TARGET_SERVICE);
        }
      } else {
        console.log(`[REMEDIATE] Remediation disabled (REMEDIATION_ENABLED=false). Skipping.`);
      }
    }
  } catch (err) {
    console.error(`[CRITICAL] Error in poller loop:`, err);
  }
}

// ---------------------------------------------------------------------------
// Predictive scaling loop — runs on a slower cadence than the reactive poller
// ---------------------------------------------------------------------------
async function predictiveScalingPass() {
  if (!PREDICTIVE_SCALING_ENABLED || !REMEDIATION_ENABLED) return;

  console.log(`\n--- [${new Date().toISOString()}] Predictive Forecast for ${TARGET_SERVICE} ---`);

  try {
    const result = await forecast();

    if (result.forecastCpu) {
      console.log(`[FORECAST] CPU forecast (next steps): [${result.forecastCpu.map(v => v.toFixed(1)).join(', ')}]%`);
    }
    if (result.forecastRps) {
      console.log(`[FORECAST] RPS forecast (next steps): [${result.forecastRps.map(v => v.toFixed(1)).join(', ')}]`);
      console.log(`[FORECAST] Current avg RPS: ${result.currentAvgRps?.toFixed(1)}`);
    }

    // Push forecast metric to Pushgateway — KEDA uses this alongside anomaly_score
    const forecastPush = await pushForecastMetric(TARGET_SERVICE, result.shouldPreScale);

    if (result.shouldPreScale) {
      console.warn(`[FORECAST] Predictive spike detected for ${TARGET_SERVICE}`);
      console.warn(`[FORECAST] ${result.reason}`);

      if (forecastPush.success) {
        console.log(`[FORECAST] Pushed forecast_spike=1 to Pushgateway — KEDA will handle scaling`);
      } else if (CIRCUIT_BREAKER_ENABLED && REMEDIATION_ENABLED) {
        console.warn(`[CIRCUIT-BREAKER] Pushgateway unreachable during forecast, falling back to direct scale`);
        await circuitBreakerScaleUp(TARGET_SERVICE);
      }
    } else {
      console.log(`[FORECAST] No predicted spike. Holding steady.`);
    }
  } catch (err) {
    console.error(`[FORECAST] Error in predictive pass:`, err.message);
  }
}

console.log(`Starting Edge Telemetry Poller for ${TARGET_SERVICE}`);
console.log(`Polling every ${POLL_INTERVAL_MS}ms with a ${FETCH_TIMEOUT_MS}ms strict timeout.`);
console.log(`Predictive scaling: ${PREDICTIVE_SCALING_ENABLED ? 'ENABLED' : 'DISABLED'} (every ${FORECAST_INTERVAL_MS / 1000}s)`);
setInterval(poll, POLL_INTERVAL_MS);
setInterval(predictiveScalingPass, FORECAST_INTERVAL_MS);
// Run initial passes immediately
poll();
setTimeout(predictiveScalingPass, 5000); // slight delay to let first poll complete
