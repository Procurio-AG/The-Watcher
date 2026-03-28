import httpx
from typing import Any
from services.backend_targets import PROMETHEUS_CANDIDATES

async def instant_query(query: str) -> Any:
    last_error = None
    async with httpx.AsyncClient() as client:
        for base_url in PROMETHEUS_CANDIDATES:
            try:
                resp = await client.get(
                    f"{base_url}/api/v1/query",
                    params={"query": query},
                    timeout=5.0,
                )
                resp.raise_for_status()
                return resp.json()["data"]["result"]
            except Exception as exc:
                last_error = exc
                continue
    raise last_error or RuntimeError("Prometheus query failed")


async def range_query(query: str, start: str, end: str, step: str = "15s") -> Any:
    last_error = None
    async with httpx.AsyncClient() as client:
        for base_url in PROMETHEUS_CANDIDATES:
            try:
                resp = await client.get(
                    f"{base_url}/api/v1/query_range",
                    params={"query": query, "start": start, "end": end, "step": step},
                    timeout=5.0,
                )
                resp.raise_for_status()
                return resp.json()["data"]["result"]
            except Exception as exc:
                last_error = exc
                continue
    raise last_error or RuntimeError("Prometheus range query failed")
