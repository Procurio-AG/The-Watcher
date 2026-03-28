import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Three-phase stress test:
//   Phase 1 — Baseline: light traffic, everything healthy
//   Phase 2 — Attack:   chaos headers + volumetric spike, services break
//   Phase 3 — Observe:  attack stops, watch K8s healing kick in
//
// Run with: GATEWAY_URL=http://localhost:30080 k6 run k6_stress_test.js
export const options = {
  scenarios: {
    // Phase 1: Baseline — quick healthy snapshot
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '8s',
      exec: 'baseline',
      tags: { phase: 'baseline' },
    },
    // Phase 2: Attack — instant chaos spike
    attack: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '3s',  target: 300 },  // Instant spike
        { duration: '17s', target: 300 },  // Sustained overload
      ],
      exec: 'attack',
      startTime: '8s',
      tags: { phase: 'attack' },
    },
    // Phase 3: Observe — light traffic, watch recovery
    observe: {
      executor: 'constant-vus',
      vus: 10,
      duration: '25s',
      exec: 'observe',
      startTime: '33s',  // 5s gap after attack
      tags: { phase: 'observe' },
    },
  },
  thresholds: {
    'http_req_duration{phase:baseline}': ['p(95)<2000'],
    'http_req_duration{phase:attack}': [{ threshold: 'p(95)<2000', abortOnFail: false }],
    'http_req_duration{phase:observe}': [{ threshold: 'p(95)<2000', abortOnFail: false }],
  },
};

const GATEWAY_URL = __ENV.GATEWAY_URL || 'http://localhost:8000';

const CHAOS_TYPES = ['error', 'cpu', 'error', 'cpu', 'error'];  // Heavy on errors + CPU burn, avoid latency (blocks workers permanently)
const ORDER_PAYLOAD = JSON.stringify({ ticket_id: '1' });

// ─── Phase 1: Baseline ─────────────────────────────────────────────
export function baseline() {
  group('Baseline — Normal Traffic', function () {
    const res = http.post(`${GATEWAY_URL}/orders`, ORDER_PAYLOAD, {
      headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
    });
    check(res, {
      'baseline: status 200': (r) => r.status === 200,
      'baseline: latency < 2s': (r) => r.timings.duration < 2000,
    });
  });
  sleep(1);
}

// ─── Phase 2: Attack ────────────────────────────────────────────────
export function attack() {
  group('Attack — Chaos + Overload', function () {
    // 60% of requests carry a random chaos header to amplify breakage
    const injectChaos = Math.random() < 0.6;
    const chaosType = CHAOS_TYPES[Math.floor(Math.random() * CHAOS_TYPES.length)];

    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': '1',
    };
    if (injectChaos) {
      headers['x-chaos-trigger'] = chaosType;
    }

    const res = http.post(`${GATEWAY_URL}/orders`, ORDER_PAYLOAD, {
      headers,
      timeout: '15s',
    });
    check(res, {
      'attack: got response': (r) => r.status > 0,
      'attack: is error (expected)': (r) => r.status >= 500 || r.timings.duration > 2000,
    });
  });
  sleep(0.2); // Minimal sleep — keep pressure high
}

// ─── Phase 3: Observe Recovery ──────────────────────────────────────
export function observe() {
  group('Observe — Recovery Check', function () {
    const res = http.post(`${GATEWAY_URL}/orders`, ORDER_PAYLOAD, {
      headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
      timeout: '10s',
    });
    check(res, {
      'recover: status 200': (r) => r.status === 200,
      'recover: latency < 2s': (r) => r.timings.duration < 2000,
    });
  });
  sleep(1);
}
