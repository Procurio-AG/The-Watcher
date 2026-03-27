import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom Metrics (shared across all scripts) ─────────────────────────
export const errorRate   = new Rate('chaos_error_rate');
export const reqDuration = new Trend('chaos_req_duration', true);
export const totalErrors = new Counter('chaos_total_errors');
export const totalReqs   = new Counter('chaos_total_requests');

// ─── Config Loader ──────────────────────────────────────────────────────
// Reads config.json from disk at init time. Environment variables override:
//   K6_BASE_URL  → overrides config.base_url
//   K6_USER_ID   → overrides config.default_user_id
const CONFIG_PATH = __ENV.K6_CONFIG_PATH || '../config.json';

let _config = null;

export function getConfig() {
  if (_config) return _config;

  const raw = open(CONFIG_PATH);
  _config = JSON.parse(raw);

  // Allow env-var overrides for CI/K8s flexibility
  if (__ENV.K6_BASE_URL) {
    _config.base_url = __ENV.K6_BASE_URL;
  }
  if (__ENV.K6_USER_ID) {
    _config.default_user_id = __ENV.K6_USER_ID;
  }

  return _config;
}

// ─── Unique ID Generator ─────────────────────────────────────────────────
// Simple UUID v4-ish generator for X-Chaos-ID.
// k6 doesn't have crypto.randomUUID(), so we roll our own.
function generateChaosId() {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) id += '-';
  }
  return id;
}

// ─── Header Builders ────────────────────────────────────────────────────
// Every request in the suite carries telemetry correlation headers.
// This is Task C: the Central Brain uses X-Chaos-ID to correlate
// k6 spikes with Pixie eBPF memory dumps.

export function baseHeaders(attackType) {
  const config = getConfig();
  return {
    'Content-Type': 'application/json',
    'x-user-id':     config.default_user_id,
    'X-Chaos-ID':    generateChaosId(),
    'X-Attack-Type': attackType || 'baseline',
  };
}

export function chaosHeaders(attackType, chaosTrigger) {
  const headers = baseHeaders(attackType);
  if (chaosTrigger) {
    headers['x-chaos-trigger'] = chaosTrigger;
  }
  return headers;
}

// ─── Response Checker ───────────────────────────────────────────────────
// Standardized check wrapper that feeds custom metrics.
// Only 5xx counts as a system error — 400s are domain-level (e.g. seats exhausted)
// and not indicative of infrastructure failure.
export function checkResponse(res, name, expectedStatus) {
  expectedStatus = expectedStatus || 200;

  const passed = check(res, {
    [`${name} status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name} latency < 2s`]: (r) => r.timings.duration < 2000,
  });

  // Feed custom metrics regardless of pass/fail
  reqDuration.add(res.timings.duration, { endpoint: name });
  totalReqs.add(1, { endpoint: name });
  errorRate.add(res.status >= 500);   // Only 5xx = system error

  if (res.status >= 500) {
    totalErrors.add(1, { endpoint: name });
  }

  return passed;
}

// ─── Booking Flow Steps ─────────────────────────────────────────────────
// Full end-to-end booking workflow, reusable from baseline and attack scripts.
// Returns { stations, tickets, order, payment, finalOrder } or nulls on failure.

export function runBookingFlow(headers) {
  const config = getConfig();
  const base   = config.base_url;
  const ep     = config.endpoints;
  const seed   = config.seed_data;
  let result   = {};

  // Step 1: GET /stations
  group('1. Fetch Stations', function () {
    const res = http.get(`${base}${ep.stations}`, { headers });
    checkResponse(res, 'GET /stations');
    if (res.status === 200) {
      result.stations = res.json();
    }
  });

  // Step 2: GET /tickets?start_station_id=1&end_station_id=2
  group('2. Search Tickets', function () {
    const url = `${base}${ep.tickets}?start_station_id=${seed.start_station_id}&end_station_id=${seed.end_station_id}`;
    const res = http.get(url, { headers });
    checkResponse(res, 'GET /tickets');
    if (res.status === 200) {
      result.tickets = res.json();
    }
  });

  // Step 3: POST /orders — create order
  group('3. Create Order', function () {
    const payload = JSON.stringify({ ticket_id: seed.ticket_id });
    const res = http.post(`${base}${ep.orders}`, payload, { headers });
    checkResponse(res, 'POST /orders');
    if (res.status === 200) {
      result.order = res.json();
    }
  });

  // Step 4: POST /payments — process payment
  if (result.order) {
    group('4. Process Payment', function () {
      const payload = JSON.stringify({
        order_id: result.order.id,
        amount:   seed.ticket_price,
      });
      const res = http.post(`${base}${ep.payments}`, payload, { headers });
      checkResponse(res, 'POST /payments');
      if (res.status === 200) {
        result.payment = res.json();
      }
    });
  }

  // Step 5: GET /orders/{id} — verify final status
  if (result.order) {
    group('5. Verify Order', function () {
      const res = http.get(`${base}${ep.orders}/${result.order.id}`, { headers });
      checkResponse(res, 'GET /orders/{id}');
      if (res.status === 200) {
        result.finalOrder = res.json();
      }
    });
  }

  return result;
}
