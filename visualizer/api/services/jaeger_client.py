import httpx
from typing import Any
from services.backend_targets import JAEGER_CANDIDATES

async def get_services() -> list[str]:
    last_error = None
    async with httpx.AsyncClient() as client:
        for base_url in JAEGER_CANDIDATES:
            try:
                resp = await client.get(f"{base_url}/api/services", timeout=5.0)
                resp.raise_for_status()
                return resp.json()["data"]
            except Exception as exc:
                last_error = exc
                continue
    raise last_error or RuntimeError("Jaeger services query failed")


async def get_traces(service: str, limit: int = 20, lookback: str = "1h") -> Any:
    last_error = None
    async with httpx.AsyncClient() as client:
        for base_url in JAEGER_CANDIDATES:
            try:
                resp = await client.get(
                    f"{base_url}/api/traces",
                    params={"service": service, "limit": limit, "lookback": lookback},
                    timeout=5.0,
                )
                resp.raise_for_status()
                return resp.json()["data"]
            except Exception as exc:
                last_error = exc
                continue
    raise last_error or RuntimeError("Jaeger traces query failed")


async def get_trace(trace_id: str) -> Any:
    last_error = None
    async with httpx.AsyncClient() as client:
        for base_url in JAEGER_CANDIDATES:
            try:
                resp = await client.get(f"{base_url}/api/traces/{trace_id}", timeout=5.0)
                resp.raise_for_status()
                return resp.json()["data"]
            except Exception as exc:
                last_error = exc
                continue
    raise last_error or RuntimeError("Jaeger trace query failed")
