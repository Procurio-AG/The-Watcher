from clients.prometheus_client import get_service_metrics_snapshot
from clients.loki_client import query_logs
from clients.jaeger_client import get_traces


async def gather_telemetry(state: dict) -> dict:
    """Node 1: Fetch enriched telemetry from Prometheus, Loki, and Jaeger."""
    service = state["service_name"]

    # Prometheus: comprehensive metrics snapshot
    try:
        prometheus_metrics = await get_service_metrics_snapshot(service)
    except Exception:
        prometheus_metrics = {"cpu": [], "latency_p95": [], "error_rate": [], "rps": []}

    # Loki: recent error logs for this service
    try:
        loki_results = await query_logs(
            f'{{service_name="{service}"}} |= "error" or "ERROR" or "Exception"',
            limit=50,
        )
        loki_logs = []
        for stream in (loki_results or []):
            for ts, line in stream.get("values", []):
                loki_logs.append(line)
    except Exception:
        loki_logs = [state.get("log_line", "")] if state.get("log_line") else []

    # Jaeger: recent traces for this service
    try:
        jaeger_traces = await get_traces(service, limit=20, lookback="1h")
    except Exception:
        jaeger_traces = []

    return {
        "prometheus_metrics": prometheus_metrics,
        "loki_logs": loki_logs,
        "jaeger_traces": jaeger_traces or [],
    }
