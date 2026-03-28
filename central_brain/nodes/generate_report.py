import os
from datetime import datetime, timezone
from langchain_google_genai import ChatGoogleGenerativeAI
from clients.config import GEMINI_API_KEY, REPORTS_DIR

SYSTEM_PROMPT = """You are an expert Site Reliability Engineer performing Root Cause Analysis.
Given telemetry and code context for a failing microservice, generate a detailed RCA report in Markdown.

Your report MUST have these exact sections:
1. **Executive Summary** - 2-3 sentence overview of the incident
2. **Affected Service** - service name, its role, and its dependencies
3. **Telemetry Evidence** - specific metrics, log lines, and trace data that indicate the problem
4. **Code Analysis** - reference specific code sections (with line numbers) that are relevant to the failure
5. **Root Cause** - clear explanation of what caused the anomaly
6. **Proposed Fix** - concrete code changes or configuration changes to resolve the issue, with code snippets
7. **Prevention** - recommendations to prevent recurrence

Be specific. Reference actual metric values, log lines, span names, and code from the context provided.
Do not hallucinate code that is not in the provided context."""


def _build_prompt(state: dict) -> str:
    """Assemble all context into a structured prompt for the LLM."""
    indicators_list = "\n".join(f"- {ind}" for ind in state["anomaly_indicators"]) or "- None detected"

    logs_section = "\n".join(
        f"  {log[:300]}" for log in state["loki_logs"][:20]
    ) or "  No logs available"

    traces_section = ""
    for trace in (state["jaeger_traces"] or [])[:3]:
        for span in trace.get("spans", [])[:5]:
            op = span.get("operationName", "?")
            dur = span.get("duration", 0) / 1000
            tags = {t["key"]: t["value"] for t in span.get("tags", [])[:10]}
            error_flag = " [ERROR]" if tags.get("error") else ""
            traces_section += f"  - {op}: {dur:.1f}ms{error_flag}\n"
    traces_section = traces_section or "  No trace data available"

    metrics_section = ""
    for key, val in state["prometheus_metrics"].items():
        if val and len(val) > 0:
            try:
                v = val[0]["value"][1]
                metrics_section += f"  - {key}: {v}\n"
            except (IndexError, KeyError):
                pass
    metrics_section = metrics_section or "  No metrics available"

    code_section = ""
    for f in state["relevant_files"]:
        lines = f["content"].split("\n")
        numbered = "\n".join(f"{i+1:4d} | {line}" for i, line in enumerate(lines))
        code_section += f"\n#### {f['path']} ({f['reason']})\n```python\n{numbered}\n```\n"

    dependencies = ", ".join(state["service_dependencies"]) or "None identified"

    return f"""## Incident Context

**Service**: {state["service_name"]}
**Anomaly Score**: {state["anomaly_score"]}
**Timestamp**: {state["timestamp"]}
**Severity**: {state["severity"]}
**Initial Trigger CPU**: {state["cpu"]}% | **Latency**: {state["latency"]}s | **Error Rate**: {state["error_rate"]}%

### Signal Summary
{state["signal_summary"]}

### Anomaly Indicators
{indicators_list}

### Recent Error Logs
{logs_section}

### Trace Analysis
{traces_section}

### Prometheus Metrics
{metrics_section}

### Relevant Source Code
{code_section}

### Service Dependencies
{dependencies}

Generate the RCA report now."""


async def generate_report(state: dict) -> dict:
    """Node 4: Use Gemini to synthesize all context into a markdown RCA report."""
    prompt = _build_prompt(state)

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        google_api_key=GEMINI_API_KEY,
        temperature=0.3,
        max_output_tokens=4096,
    )

    response = await llm.ainvoke([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ])
    report_markdown = response.content

    # Save to disk
    os.makedirs(REPORTS_DIR, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"rca_{state['service_name']}_{ts}.md"
    report_path = os.path.join(REPORTS_DIR, filename)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_markdown)

    return {
        "report_markdown": report_markdown,
        "report_path": report_path,
    }
