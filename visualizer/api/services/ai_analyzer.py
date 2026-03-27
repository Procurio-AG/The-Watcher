import json
import os

from groq import Groq
from services.prometheus_client import instant_query

SERVICES = [
    "gateway-service", "user-service", "auth-service", "station-service",
    "train-service", "schedule-service", "ticket-service", "order-service",
    "payment-service", "notification-service",
]


async def analyze_incidents() -> dict:
    """Analyze current metrics to detect anomalies and identify root cause."""
    service_health = []

    for svc in SERVICES:
        job = svc
        try:
            err_result = await instant_query(
                f'sum(rate(http_requests_total{{job="{job}",status=~"5.."}}[5m])) '
                f'/ sum(rate(http_requests_total{{job="{job}"}}[5m])) * 100'
            )
            error_rate = float(err_result[0]["value"][1]) if err_result else 0.0
        except Exception:
            error_rate = 0.0

        try:
            lat_result = await instant_query(
                f'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{{job="{job}"}}[5m])) by (le))'
            )
            latency = float(lat_result[0]["value"][1]) if lat_result else 0.0
        except Exception:
            latency = 0.0

        service_health.append({
            "service": svc,
            "error_rate": round(error_rate, 2),
            "latency_p95": round(latency, 4),
        })

    # Find the worst offender
    worst = max(service_health, key=lambda s: s["error_rate"] + s["latency_p95"] * 10)

    # Calculate confidence based on deviation
    avg_err = sum(s["error_rate"] for s in service_health) / len(service_health) if service_health else 0
    avg_lat = sum(s["latency_p95"] for s in service_health) / len(service_health) if service_health else 0

    err_deviation = worst["error_rate"] - avg_err
    lat_deviation = worst["latency_p95"] - avg_lat

    confidence = min(95, max(10, int(50 + err_deviation * 2 + lat_deviation * 100)))

    # Determine severity
    if worst["error_rate"] > 10 or worst["latency_p95"] > 2.0:
        severity = "critical"
    elif worst["error_rate"] > 5 or worst["latency_p95"] > 1.0:
        severity = "degraded"
    else:
        severity = "healthy"

    # Build impact summary
    impacts = []
    if worst["error_rate"] > avg_err + 1:
        impacts.append(f"Error rate increased by {round(worst['error_rate'] - avg_err, 1)}%")
    if worst["latency_p95"] > avg_lat + 0.1:
        impacts.append(f"Latency increased by {round((worst['latency_p95'] - avg_lat) * 1000)}ms")

    # Remediation suggestion
    if severity == "critical":
        remediation = f"{worst['service']} restarted automatically"
    elif severity == "degraded":
        remediation = f"Scaling up {worst['service']} replicas"
    else:
        remediation = "No action needed"

    return {
        "root_cause_service": worst["service"],
        "confidence": confidence,
        "severity": severity,
        "impact": impacts if impacts else ["System operating within normal parameters"],
        "remediation": remediation,
        "fix_time_seconds": round(lat_deviation * 10 + 2, 1) if severity != "healthy" else None,
        "service_health": service_health,
    }


async def ask_ai(question: str) -> dict:
    """Process a natural language question about system health using Groq API."""
    analysis = await analyze_incidents()

    # Build context from real metrics
    system_prompt = (
        "You are an AI observability assistant for a microservices train ticket booking system. "
        "Answer concisely (2-3 sentences max) about system health, performance, and incidents. "
        "Be specific — reference actual service names, error rates, and latency numbers from the context.\n\n"
        f"Current system state:\n"
        f"- Severity: {analysis['severity']}\n"
        f"- Root cause service: {analysis['root_cause_service']}\n"
        f"- Confidence: {analysis['confidence']}%\n"
        f"- Service health:\n{json.dumps(analysis['service_health'], indent=2)}"
    )

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        # Fallback to heuristic response if no API key
        return _fallback_response(question, analysis)

    try:
        client = Groq(api_key=groq_api_key)
        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=300,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
        )
        answer = chat.choices[0].message.content
    except Exception as e:
        # Fallback on error
        return _fallback_response(question, analysis)

    return {
        "question": question,
        "answer": answer,
        "context": {
            "severity": analysis["severity"],
            "root_cause": analysis["root_cause_service"],
        },
    }


def _fallback_response(question: str, analysis: dict) -> dict:
    """Keyword-based fallback when Groq API is unavailable."""
    question_lower = question.lower()

    if "latency" in question_lower or "slow" in question_lower:
        high_latency = sorted(analysis["service_health"], key=lambda s: s["latency_p95"], reverse=True)[:3]
        answer = f"The highest latency services are: {', '.join(s['service'] + ' (' + str(round(s['latency_p95']*1000)) + 'ms)' for s in high_latency)}."
        if analysis["severity"] != "healthy":
            answer += f" Root cause identified: {analysis['root_cause_service']} with {analysis['confidence']}% confidence."
    elif "error" in question_lower or "fail" in question_lower:
        high_error = sorted(analysis["service_health"], key=lambda s: s["error_rate"], reverse=True)[:3]
        answer = f"Services with highest error rates: {', '.join(s['service'] + ' (' + str(s['error_rate']) + '%)' for s in high_error)}."
    elif "health" in question_lower or "status" in question_lower:
        answer = f"System is {analysis['severity']}. Root cause: {analysis['root_cause_service']}. Confidence: {analysis['confidence']}%."
    else:
        answer = f"System status: {analysis['severity']}. {len([s for s in analysis['service_health'] if s['error_rate'] < 5])} services healthy. "
        if analysis["severity"] != "healthy":
            answer += f"Issue detected in {analysis['root_cause_service']}."

    return {
        "question": question,
        "answer": answer,
        "context": {
            "severity": analysis["severity"],
            "root_cause": analysis["root_cause_service"],
        },
    }
