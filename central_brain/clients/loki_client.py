import httpx
from typing import Any
from clients.config import LOKI_CANDIDATES


async def query_logs(query: str, limit: int = 50, start: str = "", end: str = "") -> Any:
    params: dict[str, Any] = {"query": query, "limit": limit}
    if start:
        params["start"] = start
    if end:
        params["end"] = end

    last_error = None
    async with httpx.AsyncClient() as client:
        for base_url in LOKI_CANDIDATES:
            try:
                resp = await client.get(
                    f"{base_url}/loki/api/v1/query_range",
                    params=params,
                    timeout=5.0,
                )
                resp.raise_for_status()
                return resp.json()["data"]["result"]
            except Exception as exc:
                last_error = exc
                continue
    raise last_error or RuntimeError("Loki query failed")
