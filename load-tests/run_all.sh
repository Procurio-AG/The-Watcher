#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────
# SOLUTION Attack Orchestrator
# 
# Runs the complete attack sequence: baseline → latency → cpu → error
# Each run exports metrics to Prometheus (if available) and writes
# JSON summaries to load-tests/results/
#
# Usage:
#   ./run_all.sh                              # Full sequence, localhost
#   K6_BASE_URL=http://gateway:8000 ./run_all.sh  # Against K8s cluster
#   ./run_all.sh --with-prometheus            # Enable Prometheus export
# ────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
PROM_FLAG=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --with-prometheus)
      PROM_FLAG="--out experimental-prometheus-rw"
      echo "📊 Prometheus Remote Write enabled"
      ;;
  esac
done

# Ensure results directory exists
mkdir -p "${RESULTS_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       SOLUTION — Attack Orchestrator v1.0           ║${NC}"
echo -e "${CYAN}║       \"15 Seconds to Survival, Minutes to Cure\"     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Target: ${YELLOW}${K6_BASE_URL:-http://localhost:8000}${NC}"
echo -e "  Results: ${YELLOW}${RESULTS_DIR}${NC}"
echo ""

# ─── Phase 1: Baseline Booking Flow ─────────────────────────────────────
echo -e "${GREEN}━━━ [1/4] Baseline Booking Flow (2m 45s) ━━━${NC}"
echo "  Establishing normal traffic metrics..."
k6 run ${PROM_FLAG} "${SCRIPT_DIR}/scenarios/booking_flow.js" || true
echo -e "${GREEN}  ✓ Baseline complete${NC}"
echo ""

# Brief pause between attacks — let metrics settle
sleep 5

# ─── Phase 2: Latency Attack — Payment Service ──────────────────────────
echo -e "${RED}━━━ [2/4] ATTACK: Latency Injection → Payment Service (1m 30s) ━━━${NC}"
echo "  Injecting 10s latency via ChaosMiddleware..."
echo "  Expected: P95 > 1.5s, Wasm detection in <15s"
k6 run ${PROM_FLAG} "${SCRIPT_DIR}/attacks/latency.js" || true
echo -e "${RED}  ✗ Attack complete — check if Wasm detector fired${NC}"
echo ""

sleep 5

# ─── Phase 3: CPU Starvation — Ticket Service ───────────────────────────
echo -e "${RED}━━━ [3/4] ATTACK: CPU Starvation → Ticket Service (1m 10s) ━━━${NC}"
echo "  Flooding with 150 VUs, zero sleep..."
echo "  Expected: CPU > 85%, thread pool exhaustion"
k6 run ${PROM_FLAG} "${SCRIPT_DIR}/attacks/cpu_starvation.js" || true
echo -e "${RED}  ✗ Attack complete — check CPU metrics${NC}"
echo ""

sleep 5

# ─── Phase 4: Error Spike — Notification Service ────────────────────────
echo -e "${RED}━━━ [4/4] ATTACK: Error Spike → Notification Service (1m) ━━━${NC}"
echo "  Injecting 70% 500 errors via ChaosMiddleware..."
echo "  Expected: Error rate > 5%, clear OTel trace anomaly"
k6 run ${PROM_FLAG} "${SCRIPT_DIR}/attacks/error_spike.js" || true
echo -e "${RED}  ✗ Attack complete — check error rate${NC}"
echo ""

# ─── Summary ─────────────────────────────────────────────────────────────
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 Attack Sequence Complete             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Results saved to: ${YELLOW}${RESULTS_DIR}/${NC}"
echo ""
echo "  Next steps:"
echo "    1. Check Jaeger for traces with X-Attack-Type tags"
echo "    2. Review Grafana dashboards for SLA breaches"
echo "    3. Verify Wasm Edge Module fired remediation"
echo ""
