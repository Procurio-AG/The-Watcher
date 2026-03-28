import asyncio
import os
from collections import deque
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter

router = APIRouter()

GATEWAY_URL = os.environ.get("GATEWAY_URL", "http://localhost:8000")

_lock = asyncio.Lock()
_logs: deque[str] = deque(maxlen=200)
_state = {
    "status": "idle",
    "started_at": None,
    "finished_at": None,
    "exit_code": None,
    "last_message": "Simulation has not been started.",
}
_running = False


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log(msg: str):
    _logs.append(msg)
    _state["last_message"] = msg


async def _send_requests(client: httpx.AsyncClient, endpoint: str, count: int,
                         chaos: Optional[str] = None, concurrency: int = 5,
                         timeout: float = 12.0):
    """Send concurrent requests to an endpoint, optionally with chaos headers."""
    headers = {}
    if chaos:
        headers["x-chaos-trigger"] = chaos

    sem = asyncio.Semaphore(concurrency)

    async def _one():
        async with sem:
            try:
                resp = await client.get(f"{GATEWAY_URL}/{endpoint}", headers=headers, timeout=timeout)
                return resp.status_code
            except httpx.TimeoutException:
                return -1
            except Exception:
                return 0

    tasks = [_one() for _ in range(count)]
    results = await asyncio.gather(*tasks)
    ok = sum(1 for s in results if 200 <= s < 400)
    err = sum(1 for s in results if s >= 400)
    timeout_count = sum(1 for s in results if s <= 0)
    return ok, err, timeout_count


async def _run_simulation():
    global _running
    try:
        async with httpx.AsyncClient() as client:
            # ── Phase 1: Baseline ──────────────────────────────────────
            _log("━━━ [1/4] Baseline — establishing normal traffic ━━━")
            for i in range(4):
                ok, err, to = await _send_requests(client, "users", 5, concurrency=5)
                await _send_requests(client, "stations", 5, concurrency=5)
                _log(f"  Baseline {i+1}/4: {ok} ok, {err} errors, {to} timeouts")
                await asyncio.sleep(1.5)
            _log("  ✓ Baseline complete — normal metrics established")

            await asyncio.sleep(2)

            # ── Phase 2: Error Spike on Notification Service ───────────
            _log("")
            _log("━━━ [2/4] ATTACK: Error injection → Notification Service ━━━")
            _log("  Sending requests with x-chaos-trigger: error header...")
            for i in range(5):
                ok, err, to = await _send_requests(client, "notify", 10, chaos="error", concurrency=5, timeout=5.0)
                _log(f"  Error wave {i+1}/5: {ok} ok, {err} errors (HTTP 500), {to} timeouts")
                await asyncio.sleep(1)
            _log("  ✗ Error attack complete — error rate spiked")

            await asyncio.sleep(2)

            # ── Phase 3: Latency Attack on Payment Service ─────────────
            _log("")
            _log("━━━ [3/4] ATTACK: Latency injection → Payment Service ━━━")
            _log("  Sending requests with x-chaos-trigger: latency header...")
            _log("  ChaosMiddleware will inject 10s blocking sleep...")
            # Send only 2 at a time to not completely kill the gateway
            for i in range(3):
                ok, err, to = await _send_requests(client, "payments", 3, chaos="latency", concurrency=2, timeout=15.0)
                _log(f"  Latency wave {i+1}/3: {ok} ok, {err} errors, {to} timeouts (10s blocking)")
                await asyncio.sleep(1)
            _log("  ✗ Latency attack complete — P95 latency spiked")

            await asyncio.sleep(3)

            # ── Phase 4: Recovery ──────────────────────────────────────
            _log("")
            _log("━━━ [4/4] Recovery — verifying services heal ━━━")
            for i in range(4):
                ok1, err1, to1 = await _send_requests(client, "users", 5, concurrency=3, timeout=8.0)
                ok2, err2, to2 = await _send_requests(client, "stations", 5, concurrency=3, timeout=8.0)
                ok = ok1 + ok2
                err = err1 + err2
                to = to1 + to2
                _log(f"  Recovery {i+1}/4: {ok} ok, {err} errors, {to} timeouts")
                await asyncio.sleep(2)

            _log("  ✓ Recovery complete")
            _log("")
            _log("══════════════════════════════════════════════════════")
            _log("  Attack Simulation Complete")
            _log("  Check the dashboard for latency spikes and error rate changes")
            _log("══════════════════════════════════════════════════════")

        _state["status"] = "completed"
        _state["exit_code"] = 0
        _state["finished_at"] = _utc_now()
        _state["last_message"] = "Simulation completed successfully."

    except Exception as exc:
        _log(f"  ERROR: {exc}")
        _state["status"] = "failed"
        _state["exit_code"] = 1
        _state["finished_at"] = _utc_now()
        _state["last_message"] = f"Simulation failed: {exc}"
    finally:
        _running = False


@router.get("")
async def get_simulation_status():
    return {
        **_state,
        "logs": list(_logs),
    }


@router.post("/attack-resolve")
async def run_attack_and_resolve():
    global _running

    async with _lock:
        if _running:
            return {
                **_state,
                "logs": list(_logs),
            }

        _running = True
        _logs.clear()
        _state["status"] = "running"
        _state["started_at"] = _utc_now()
        _state["finished_at"] = None
        _state["exit_code"] = None
        _state["last_message"] = "Starting attack simulation..."

        asyncio.create_task(_run_simulation())

    return {
        **_state,
        "logs": list(_logs),
    }
