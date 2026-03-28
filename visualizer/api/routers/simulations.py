import asyncio
import os
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException

router = APIRouter()

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT_PATH = REPO_ROOT / "load-tests" / "run_all.sh"

_process: Optional[asyncio.subprocess.Process] = None
_lock = asyncio.Lock()
_logs: deque[str] = deque(maxlen=120)
_state = {
    "status": "idle",
    "started_at": None,
    "finished_at": None,
    "exit_code": None,
    "last_message": "Simulation has not been started.",
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _consume_process(process: asyncio.subprocess.Process) -> None:
    global _process

    if process.stdout is not None:
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            decoded = line.decode("utf-8", errors="replace").rstrip()
            if decoded:
                _logs.append(decoded)
                _state["last_message"] = decoded

    exit_code = await process.wait()
    _state["status"] = "completed" if exit_code == 0 else "failed"
    _state["exit_code"] = exit_code
    _state["finished_at"] = _utc_now()

    if exit_code == 0:
        _state["last_message"] = _logs[-1] if _logs else "Simulation completed."
    elif not _logs:
        _state["last_message"] = "Simulation failed."

    _process = None


@router.get("")
async def get_simulation_status():
    return {
        **_state,
        "logs": list(_logs),
    }


@router.post("/attack-resolve")
async def run_attack_and_resolve():
    global _process

    if not SCRIPT_PATH.exists():
        raise HTTPException(status_code=404, detail=f"Simulation script not found at {SCRIPT_PATH}")

    async with _lock:
        if _process is not None and _process.returncode is None:
            return {
                **_state,
                "logs": list(_logs),
            }

        _logs.clear()
        _state["status"] = "running"
        _state["started_at"] = _utc_now()
        _state["finished_at"] = None
        _state["exit_code"] = None
        _state["last_message"] = "Starting attack and resolve simulation..."

        env = os.environ.copy()
        _process = await asyncio.create_subprocess_exec(
            "bash",
            str(SCRIPT_PATH),
            cwd=str(SCRIPT_PATH.parent),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env,
        )
        asyncio.create_task(_consume_process(_process))

    return {
        **_state,
        "logs": list(_logs),
    }
