import http from 'k6/http';
import { check, sleep } from 'k6';

// Run with: k6 run k6_stress_test.js
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '1m', target: 50 },   // Stay at target
    { duration: '30s', target: 300 }, // Spike to induce resource starvation & latency
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // 15-second SLA criteria: if p(95) latency creeps over 2s due to lack of CPU/memory
    http_req_duration: ['p(95)<2000'],
  },
};

const GATEWAY_URL = __ENV.GATEWAY_URL || 'http://localhost:8000';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': '1', // Mock Auth Header bypassing actual JWT token fetch phase
  };

  // Stress-testing the core order-service which hits ticket-service,
  // naturally triggering OOM or blocking thread loops.
  const payload = JSON.stringify({ ticket_id: "1" });

  const res = http.post(`${GATEWAY_URL}/orders`, payload, { headers });

  check(res, {
    'is status 200': (r) => r.status === 200,
    'latency < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
