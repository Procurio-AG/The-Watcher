import httpx
from typing import Any
from clients.config import PROMETHEUS_CANDIDATES


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


async def get_service_metrics_snapshot(service_name: str) -> dict:
    """Fetch a comprehensive metrics snapshot for a service."""
    results = {}

    queries = {
        "cpu": f'sum(rate(process_cpu_seconds_total{{job="{service_name}"}}[1m])) * 100',
        "latency_p95": (
            f'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket'
            f'{{job="{service_name}"}}[5m])) by (le))'
        ),
        "error_rate": (
            f'sum(rate(http_requests_total{{job="{service_name}",status=~"5.."}}[5m])) '
            f'/ sum(rate(http_requests_total{{job="{service_name}"}}[5m])) * 100'
        ),
        "rps": f'sum(rate(http_requests_total{{job="{service_name}"}}[1m]))',
    }

    for key, query in queries.items():
        try:
            results[key] = await instant_query(query)
        except Exception:
            results[key] = []

    return results
