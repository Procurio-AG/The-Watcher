/**
 * Predictive Forecaster — queries Prometheus for historical metrics and uses
 * triple exponential smoothing (Holt-Winters) to forecast upcoming CPU and
 * request-rate trends.  When a predicted breach is detected, it triggers
 * proactive scaling *before* the spike actually hits.
 *
 * Design choices:
 *  - Pure JS, zero ML-library deps — keeps the edge image tiny.
 *  - Seasonal period defaults to 1 hour (3600s) sampled at 5-minute steps,
 *    giving 12 data-points per season.  This captures hourly traffic patterns
 *    well while remaining lightweight.
 *  - Falls back gracefully when Prometheus has insufficient history — the
 *    poller simply continues with its existing reactive path.
 */

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
const TARGET_SERVICE = process.env.TARGET_SERVICE || 'payment-service';

// Forecast configuration (overridable via env)
const FORECAST_HORIZON_MINUTES = parseInt(process.env.FORECAST_HORIZON_MINUTES || '10');
const HISTORY_HOURS = parseInt(process.env.FORECAST_HISTORY_HOURS || '24');
const SEASONAL_PERIOD = parseInt(process.env.FORECAST_SEASONAL_PERIOD || '12'); // data-points per season
const STEP_SECONDS = 300; // 5-minute resolution

// Thresholds for proactive action
const CPU_FORECAST_THRESHOLD = parseFloat(process.env.CPU_FORECAST_THRESHOLD || '70');
const RPS_FORECAST_SPIKE_RATIO = parseFloat(process.env.RPS_FORECAST_SPIKE_RATIO || '2.0');

// ---------------------------------------------------------------------------
// Prometheus helpers
// ---------------------------------------------------------------------------

async function queryRange(promql, startEpoch, endEpoch, step) {
  const url =
    `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(promql)}` +
    `&start=${startEpoch}&end=${endEpoch}&step=${step}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data?.result?.length > 0) {
      return json.data.result[0].values.map(([_ts, v]) => parseFloat(v));
    }
  } catch { /* Prometheus unavailable — degrade gracefully */ }
  return null;
}

async function fetchHistoricalCpu() {
  const now = Math.floor(Date.now() / 1000);
  const start = now - HISTORY_HOURS * 3600;
  return queryRange(
    `sum(rate(process_cpu_seconds_total{job="${TARGET_SERVICE}"}[5m])) * 100`,
    start, now, STEP_SECONDS,
  );
}

async function fetchHistoricalRps() {
  const now = Math.floor(Date.now() / 1000);
  const start = now - HISTORY_HOURS * 3600;
  return queryRange(
    `sum(rate(http_request_duration_seconds_count{job="${TARGET_SERVICE}"}[5m]))`,
    start, now, STEP_SECONDS,
  );
}

// ---------------------------------------------------------------------------
// Holt-Winters triple exponential smoothing
// ---------------------------------------------------------------------------

function holtWinters(series, seasonLen, alpha = 0.3, beta = 0.1, gamma = 0.3, horizonSteps = 2) {
  if (!series || series.length < seasonLen * 2) return null;

  // Filter out NaN/Infinity values
  series = series.map(v => (isFinite(v) ? v : 0));

  // Initialise level & trend from first season
  let level = series.slice(0, seasonLen).reduce((a, b) => a + b, 0) / seasonLen;
  let trend = 0;
  for (let i = 0; i < seasonLen; i++) {
    trend += (series[seasonLen + i] - series[i]) / seasonLen;
  }
  trend /= seasonLen;

  // Initialise seasonal indices
  const seasonal = new Array(seasonLen);
  for (let i = 0; i < seasonLen; i++) {
    seasonal[i] = series[i] / (isFinite(level) && level !== 0 ? level : 1);
  }

  // Walk through series
  for (let t = seasonLen; t < series.length; t++) {
    const val = series[t];
    const sIdx = t % seasonLen;
    const prevLevel = level;

    level = alpha * (val / (isFinite(seasonal[sIdx]) && seasonal[sIdx] !== 0 ? seasonal[sIdx] : 1)) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[sIdx] = gamma * (val / (isFinite(level) && level !== 0 ? level : 1)) + (1 - gamma) * seasonal[sIdx];
  }

  // Forecast
  const forecasts = [];
  for (let h = 1; h <= horizonSteps; h++) {
    const sIdx = (series.length + h) % seasonLen;
    forecasts.push((level + h * trend) * (isFinite(seasonal[sIdx]) && seasonal[sIdx] !== 0 ? seasonal[sIdx] : 1));
  }

  return forecasts;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the forecast and return a recommendation.
 *
 * @returns {Promise<{
 *   shouldPreScale: boolean,
 *   reason: string|null,
 *   forecastCpu: number[]|null,
 *   forecastRps: number[]|null,
 *   currentAvgRps: number|null,
 * }>}
 */
export async function forecast() {
  const horizonSteps = Math.max(1, Math.round(FORECAST_HORIZON_MINUTES / (STEP_SECONDS / 60)));

  const [cpuHistory, rpsHistory] = await Promise.all([
    fetchHistoricalCpu(),
    fetchHistoricalRps(),
  ]);

  const result = {
    shouldPreScale: false,
    reason: null,
    forecastCpu: null,
    forecastRps: null,
    currentAvgRps: null,
  };

  if (!cpuHistory && !rpsHistory) {
    console.log('[FORECAST] Insufficient Prometheus history — skipping predictive pass.');
    return result;
  }

  // CPU forecast
  if (cpuHistory) {
    result.forecastCpu = holtWinters(cpuHistory, SEASONAL_PERIOD, 0.3, 0.1, 0.3, horizonSteps);
    if (result.forecastCpu) {
      const peakCpu = Math.max(...result.forecastCpu);
      if (peakCpu >= CPU_FORECAST_THRESHOLD) {
        result.shouldPreScale = true;
        result.reason = `Predicted CPU ${peakCpu.toFixed(1)}% in next ${FORECAST_HORIZON_MINUTES}m (threshold ${CPU_FORECAST_THRESHOLD}%)`;
      }
    }
  }

  // RPS forecast — flag if predicted RPS is ≥ SPIKE_RATIO × current average
  if (rpsHistory) {
    const recentWindow = rpsHistory.slice(-SEASONAL_PERIOD);
    result.currentAvgRps = recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length;

    result.forecastRps = holtWinters(rpsHistory, SEASONAL_PERIOD, 0.3, 0.1, 0.3, horizonSteps);
    if (result.forecastRps && result.currentAvgRps > 0) {
      const peakRps = Math.max(...result.forecastRps);
      const ratio = peakRps / result.currentAvgRps;
      if (ratio >= RPS_FORECAST_SPIKE_RATIO) {
        result.shouldPreScale = true;
        result.reason = (result.reason ? result.reason + ' | ' : '') +
          `Predicted RPS spike ${peakRps.toFixed(1)} (${ratio.toFixed(1)}× current avg ${result.currentAvgRps.toFixed(1)})`;
      }
    }
  }

  return result;
}
