from typing import TypedDict, Optional


class RCAState(TypedDict):
    # --- Input (from HTTP trigger) ---
    service_name: str
    anomaly_score: float
    timestamp: str
    cpu: float
    latency: float
    error_rate: float
    log_line: str
    trace_id: Optional[str]

    # --- Node 1: gather_telemetry ---
    prometheus_metrics: dict
    loki_logs: list[str]
    jaeger_traces: list[dict]

    # --- Node 2: analyze_signals ---
    signal_summary: str
    anomaly_indicators: list[str]
    severity: str

    # --- Node 3: scan_codebase ---
    relevant_files: list[dict]       # [{path, content, reason}]
    service_dependencies: list[str]

    # --- Node 4: generate_report ---
    report_markdown: str
    report_path: str
