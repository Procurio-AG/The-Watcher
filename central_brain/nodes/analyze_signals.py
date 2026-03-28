async def analyze_signals(state: dict) -> dict:
    """Node 2: Deterministic correlation of metrics, logs, and traces."""
    indicators = []
    severity = "warning"

    # --- Prometheus metrics analysis ---
    metrics = state["prometheus_metrics"]
    for metric_name, result_list in metrics.items():
        if result_list and len(result_list) > 0:
            try:
                val = float(result_list[0]["value"][1])
                if metric_name == "error_rate" and val > 5.0:
                    indicators.append(f"High error rate: {val:.1f}%")
                    if val > 10:
                        severity = "critical"
                    elif severity != "critical":
                        severity = "degraded"
                elif metric_name == "latency_p95" and val > 1.0:
                    indicators.append(f"High P95 latency: {val * 1000:.0f}ms")
                    if val > 2.0:
                        severity = "critical"
                    elif severity != "critical":
                        severity = "degraded"
                elif metric_name == "cpu" and val > 80:
                    indicators.append(f"High CPU usage: {val:.1f}%")
                elif metric_name == "rps":
                    indicators.append(f"Current RPS: {val:.1f}")
            except (IndexError, KeyError, ValueError):
                pass

    # --- Loki log pattern analysis ---
    error_logs = state["loki_logs"]
    if error_logs:
        indicators.append(f"{len(error_logs)} error log entries in recent window")
        error_types = set()
        for log in error_logs[:20]:
            log_lower = log.lower()
            if "timeout" in log_lower:
                error_types.add("timeout errors")
            if "connection refused" in log_lower:
                error_types.add("connection refused")
            if "500" in log:
                error_types.add("HTTP 500 responses")
            if "oom" in log_lower or "out of memory" in log_lower:
                error_types.add("out of memory")
            if "deadlock" in log_lower:
                error_types.add("deadlock detected")
        for et in error_types:
            indicators.append(f"Log pattern: {et}")

    # --- Jaeger trace analysis ---
    traces = state["jaeger_traces"]
    slow_spans = []
    error_spans = []
    for trace in (traces or [])[:5]:
        for span in trace.get("spans", []):
            duration_ms = span.get("duration", 0) / 1000
            op = span.get("operationName", "unknown")
            if duration_ms > 1000:
                slow_spans.append(f"{op} ({duration_ms:.0f}ms)")
            for tag in span.get("tags", []):
                if tag.get("key") == "error" and tag.get("value") is True:
                    error_spans.append(op)
    if slow_spans:
        indicators.append(f"Slow spans: {', '.join(slow_spans[:5])}")
    if error_spans:
        indicators.append(f"Error spans: {', '.join(set(error_spans)[:5])}")

    # --- Build summary ---
    if not indicators:
        summary = (
            f"No clear anomaly indicators found for {state['service_name']}. "
            f"Edge reported anomaly_score={state['anomaly_score']:.4f}."
        )
        severity = "warning"
    else:
        summary = (
            f"Service {state['service_name']} showing {len(indicators)} anomaly signals. "
            + "; ".join(indicators[:5])
        )

    return {
        "signal_summary": summary,
        "anomaly_indicators": indicators,
        "severity": severity,
    }
