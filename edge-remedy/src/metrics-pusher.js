import client from 'prom-client';

const PUSHGATEWAY_URL = process.env.PUSHGATEWAY_URL || 'http://pushgateway-service:9091';
const TARGET_SERVICE = process.env.TARGET_SERVICE || 'payment-service';
const JOB_NAME = 'edge-remedy';

// --- Gauges ---

const anomalyScoreGauge = new client.Gauge({
  name: 'watcher_anomaly_score',
  help: 'ML anomaly probability: P(class1) + P(class2) after temperature-scaled softmax. Range 0.0-1.0.',
  labelNames: ['exported_service'],
});

const anomalyStateGauge = new client.Gauge({
  name: 'watcher_anomaly_state',
  help: 'Discrete anomaly state from ONNX argmax (0=healthy, 1=anomaly, 2=severe). For debugging alongside anomaly_score.',
  labelNames: ['exported_service'],
});

const forecastSpikeGauge = new client.Gauge({
  name: 'watcher_forecast_spike',
  help: 'Predictive spike indicator from Holt-Winters forecast (0=no spike, 1=spike predicted).',
  labelNames: ['exported_service'],
});

const lastPushTimestampGauge = new client.Gauge({
  name: 'watcher_last_push_timestamp',
  help: 'Unix timestamp of the last successful metric push. Used by KEDA to detect stale metrics.',
  labelNames: ['exported_service'],
});

// Use a dedicated registry so we only push our gauges, not default Node.js metrics
const registry = new client.Registry();
registry.registerMetric(anomalyScoreGauge);
registry.registerMetric(anomalyStateGauge);
registry.registerMetric(forecastSpikeGauge);
registry.registerMetric(lastPushTimestampGauge);

const gateway = new client.Pushgateway(PUSHGATEWAY_URL, {}, registry);

/**
 * Push ML anomaly metrics to Prometheus Pushgateway.
 *
 * @param {string} service - Target service name (e.g. "payment-service")
 * @param {number} anomalyScore - P(class1) + P(class2) from softmax [0.0 - 1.0]
 * @param {number} state - Discrete state from argmax (0, 1, or 2)
 * @returns {Promise<{ success: boolean }>}
 */
export async function pushMetrics(service, anomalyScore, state) {
  anomalyScoreGauge.set({ exported_service: service }, anomalyScore);
  anomalyStateGauge.set({ exported_service: service }, state);
  lastPushTimestampGauge.set({ exported_service: service }, Math.floor(Date.now() / 1000));

  try {
    await gateway.pushAdd({ jobName: JOB_NAME, groupings: { instance: TARGET_SERVICE } });
    return { success: true };
  } catch (err) {
    console.error(`[METRICS-PUSH] Failed to push to Pushgateway at ${PUSHGATEWAY_URL}:`, err.message);
    return { success: false };
  }
}

/**
 * Push forecast spike indicator to Prometheus Pushgateway.
 *
 * @param {string} service - Target service name
 * @param {boolean} spikeDetected - Whether a predictive spike was detected
 * @returns {Promise<{ success: boolean }>}
 */
export async function pushForecastMetric(service, spikeDetected) {
  forecastSpikeGauge.set({ exported_service: service }, spikeDetected ? 1 : 0);
  lastPushTimestampGauge.set({ exported_service: service }, Math.floor(Date.now() / 1000));

  try {
    await gateway.pushAdd({ jobName: JOB_NAME, groupings: { instance: TARGET_SERVICE } });
    return { success: true };
  } catch (err) {
    console.error(`[METRICS-PUSH] Failed to push forecast metric:`, err.message);
    return { success: false };
  }
}
