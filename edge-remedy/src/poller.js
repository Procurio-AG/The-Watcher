import { predict } from './wasm.js';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
const LOKI_URL = process.env.LOKI_URL || 'http://localhost:3100';
const JAEGER_URL = process.env.JAEGER_URL || 'http://localhost:16686';

const TARGET_SERVICE = process.env.TARGET_SERVICE || 'payment-service';
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
    
    // 3. Compute argmax state
    const logitsArray = Array.from(outputLogits);
    const maxLogit = Math.max(...logitsArray);
    const state = logitsArray.indexOf(maxLogit);
    
    console.log(`\n[WASM RESULT] Logits: [${logitsArray.map(l => l.toFixed(3)).join(', ')}]`);
    
    if (state === 0) {
      console.log(`[STATUS] ✅ State 0 (Healthy). No action required.`);
    } else {
      console.warn(`[WARNING] 🚨 State ${state} Anomaly detected! Edge Wasm emitting remediation signal.`);
      // If we were interfacing K8s, it would happen here. Per user request, we just output logits.
    }
  } catch (err) {
    console.error(`[CRITICAL] Error in poller loop:`, err);
  }
}

console.log(`Starting Edge Telemetry Poller for ${TARGET_SERVICE}`);
console.log(`Polling every ${POLL_INTERVAL_MS}ms with a ${FETCH_TIMEOUT_MS}ms strict timeout.`);
setInterval(poll, POLL_INTERVAL_MS);
// Run initial pass immediately
poll();
