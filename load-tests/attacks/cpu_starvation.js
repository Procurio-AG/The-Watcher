import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { getConfig, baseHeaders, chaosHeaders, checkResponse } from '../lib/helpers.js';
import { attackPhaseActive, PHASE, ticketLatency, ticketConcurrency, buildSummaryHandler } from '../lib/prometheus.js';

// ─── CPU Starvation Attack: Ticket Service ──────────────────────────────
//
// Target:   Ticket Service (via gateway /tickets)
// Goal:     Spike CPU/RAM to trigger Wasm Edge detection in <15s
// Method:   Volumetric flood — 150 concurrent VUs with zero sleep,
//           mixing search queries and reservation attempts.
//
// How it works:
//   FastAPI's uvicorn runs a limited number of async workers.
//   150 concurrent requests with no pause between iterations will:
//   1. Saturate the event loop with concurrent handler coroutines
//   2. Each search iterates over DB.values() — CPU-bound in-process
//   3. Reserve calls mutate shared state → GIL contention in CPython
//   4. Randomized params prevent any response caching
//
// The Wasm Edge Module monitors CPU% via /var/log/host metrics.
// SLA threshold is 85% CPU (from sla-thresholds-configmap.yaml).
//
// Run:      k6 run attacks/cpu_starvation.js
// ────────────────────────────────────────────────────────────────────────

const config = getConfig();

export const options = {
  scenarios: {
    // Phase 1: Baseline — light load
    baseline: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10s',
      exec: 'baseline',
      tags: { phase: 'baseline' },
    },
    // Phase 2: Ramp — aggressive climb to 150 VUs
    cpu_ramp: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '10s', target: 75 },   // Fast ramp
        { duration: '10s', target: 150 },  // Full pressure
      ],
      exec: 'attack',
      startTime: '10s',
      tags: { phase: 'ramp' },
    },
    // Phase 3: Sustained — hold at maximum pressure
    cpu_sustained: {
      executor: 'constant-vus',
      vus: 150,
      duration: '30s',
      exec: 'attack',
      startTime: '30s',
      tags: { phase: 'sustained' },
    },
    // Phase 4: Cooldown — ramp down
    cooldown: {
      executor: 'ramping-vus',
      startVUs: 150,
      stages: [
        { duration: '10s', target: 0 },
      ],
      exec: 'observe',
      startTime: '60s',
      tags: { phase: 'cooldown' },
    },
  },
  thresholds: {
    'http_req_duration{phase:baseline}':  [`p(95)<${config.thresholds.p95_latency_ms}`],
    'http_req_duration{phase:sustained}': [{
      threshold: `p(95)<${config.thresholds.p95_latency_ms}`,
      abortOnFail: false,
    }],
  },
};

// ─── Random Parameter Generator ─────────────────────────────────────────
// Generates varied station IDs to prevent caching and force CPU work.
function randomStationId() {
  // Mix of existing IDs (1, 2) and non-existent ones to force full scan + 404 handling
  const ids = ['1', '2', '3', '99', '100', '999', 'abc', 'station-' + __VU];
  return ids[Math.floor(Math.random() * ids.length)];
}

// ─── Phase 1: Baseline ─────────────────────────────────────────────────
export function baseline() {
  attackPhaseActive.add(PHASE.BASELINE);
  ticketConcurrency.add(__VU);
  const headers = baseHeaders('cpu_baseline');

  group('Baseline — Ticket Search', function () {
    const res = http.get(
      `${config.base_url}${config.endpoints.tickets}?start_station_id=1&end_station_id=2`,
      { headers }
    );
    checkResponse(res, 'baseline-ticket-search');
    ticketLatency.add(res.timings.duration, { phase: 'baseline' });
  });

  sleep(1);
}

// ─── Phase 2 & 3: Attack (Ramp + Sustained) ─────────────────────────────
export function attack() {
  attackPhaseActive.add(PHASE.CPU_STARVATION);
  ticketConcurrency.add(__VU);
  const headers = chaosHeaders('cpu_starvation', 'cpu');

  // Mix 1: Rapid-fire ticket searches with random params
  group('CPU Storm — Ticket Search', function () {
    const startId = randomStationId();
    const endId   = randomStationId();
    const res = http.get(
      `${config.base_url}${config.endpoints.tickets}?start_station_id=${startId}&end_station_id=${endId}`,
      { headers }
    );
    ticketLatency.add(res.timings.duration, { phase: 'attack' });
    checkResponse(res, 'attack-ticket-search');
  });

  // Mix 2: Reservation attempts — causes write contention
  // Every 3rd iteration, try to reserve a ticket
  if (__ITER % 3 === 0) {
    group('CPU Storm — Ticket Reserve', function () {
      const ticketId = randomStationId();  // Reusing randomizer for ticket IDs
      const res = http.post(
        `${config.base_url}${config.endpoints.tickets}/${ticketId}/reserve`,
        null,
        { headers }
      );
      ticketLatency.add(res.timings.duration, { phase: 'attack' });
      // Don't check status — 404s are expected and intentional (they still cost CPU)
      check(res, {
        'reserve responded': (r) => r.status > 0,
      });
    });
  }

  // NO SLEEP — this is the key to CPU starvation.
  // Each VU loops as fast as possible.
}

// ─── Phase 4: Cooldown/Observe ──────────────────────────────────────────
export function observe() {
  attackPhaseActive.add(PHASE.BASELINE);
  ticketConcurrency.add(__VU);
  const headers = baseHeaders('cpu_observe');

  group('Post-Attack — Ticket Search', function () {
    const res = http.get(
      `${config.base_url}${config.endpoints.tickets}?start_station_id=1&end_station_id=2`,
      { headers }
    );

    check(res, {
      'post-attack: status 200': (r) => r.status === 200,
      'post-attack: latency recovered': (r) => r.timings.duration < 2000,
    });

    ticketLatency.add(res.timings.duration, { phase: 'cooldown' });
    checkResponse(res, 'cooldown-ticket-search');
  });

  sleep(0.5);
}

// ─── Summary Export ─────────────────────────────────────────────────────
export const handleSummary = buildSummaryHandler('cpu_starvation');
