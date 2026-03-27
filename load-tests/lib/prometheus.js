import { Trend, Counter, Gauge } from 'k6/metrics';

// ─── Attack-Specific Metrics ────────────────────────────────────────────
// These are exported to Prometheus with tags that let Grafana dashboards
// overlay "Attack Phase" bands on top of service health panels.

// Latency attack metrics (Task B - Payment Service)
export const paymentLatency    = new Trend('attack_payment_latency', true);
export const paymentP95        = new Trend('attack_payment_p95', true);

// CPU starvation metrics (Task B - Ticket Service)
export const ticketLatency     = new Trend('attack_ticket_latency', true);
export const ticketConcurrency = new Gauge('attack_ticket_concurrent_vus');

// Error spike metrics (Task B - Notification Service)  
export const notifyErrorCount  = new Counter('attack_notify_5xx_count');
export const notifyErrorRate   = new Trend('attack_notify_error_rate');

// Phase marker — lets the Visualizer know which attack is active
export const attackPhaseActive = new Gauge('attack_phase_active');

// ─── Phase Labels ───────────────────────────────────────────────────────
// Map to numeric codes for Grafana annotations:
//   0 = baseline, 1 = latency, 2 = cpu_starvation, 3 = error_spike
export const PHASE = {
  BASELINE:       0,
  LATENCY:        1,
  CPU_STARVATION: 2,
  ERROR_SPIKE:    3,
};

// ─── Handle Summary ─────────────────────────────────────────────────────
// Writes a JSON summary to load-tests/results/ for post-analysis.
// k6 calls this automatically at the end of a test run.
// NOTE: Run k6 from the load-tests/ directory for correct path resolution.
export function buildSummaryHandler(testName) {
  return function handleSummary(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename  = `./results/${testName}_${timestamp}.json`;
    const output    = {};
    output[filename] = JSON.stringify(data, null, 2);

    // Also print to stdout for CI pipelines
    output['stdout'] = JSON.stringify(
      {
        test:          testName,
        timestamp:     new Date().toISOString(),
        vus_max:       data.metrics.vus_max ? data.metrics.vus_max.values.max : 0,
        http_reqs:     data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
        error_rate:    data.metrics.chaos_error_rate ? data.metrics.chaos_error_rate.values.rate : 0,
        p95_duration:  data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0,
      },
      null,
      2
    ) + '\n';

    return output;
  };
}
