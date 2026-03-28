from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from graph import build_rca_graph

app = FastAPI(title="Watcher Central Brain", version="1.0.0")
rca_graph = build_rca_graph()


class AnomalyTrigger(BaseModel):
    service_name: str
    anomaly_score: float
    timestamp: str
    cpu: float = 0.0
    latency: float = 0.0
    error_rate: float = 0.0
    log_line: str = ""
    trace_id: Optional[str] = None


class RCAResponse(BaseModel):
    service_name: str
    severity: str
    report_markdown: str
    report_path: str
    anomaly_indicators: list[str]


@app.post("/analyze", response_model=RCAResponse)
async def trigger_rca(trigger: AnomalyTrigger):
    initial_state = {
        "service_name": trigger.service_name,
        "anomaly_score": trigger.anomaly_score,
        "timestamp": trigger.timestamp,
        "cpu": trigger.cpu,
        "latency": trigger.latency,
        "error_rate": trigger.error_rate,
        "log_line": trigger.log_line,
        "trace_id": trigger.trace_id,
        # Initialize empty fields for downstream nodes
        "prometheus_metrics": {},
        "loki_logs": [],
        "jaeger_traces": [],
        "signal_summary": "",
        "anomaly_indicators": [],
        "severity": "unknown",
        "relevant_files": [],
        "service_dependencies": [],
        "report_markdown": "",
        "report_path": "",
    }

    result = await rca_graph.ainvoke(initial_state)

    return RCAResponse(
        service_name=result["service_name"],
        severity=result["severity"],
        report_markdown=result["report_markdown"],
        report_path=result["report_path"],
        anomaly_indicators=result["anomaly_indicators"],
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "central-brain"}
