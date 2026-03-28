from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from routers import metrics, logs, traces, services, incidents, simulations
from services.backend_targets import PROMETHEUS_CANDIDATES, LOKI_CANDIDATES, JAEGER_CANDIDATES

app = FastAPI(title="The Watcher API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(traces.router, prefix="/api/traces", tags=["traces"])
app.include_router(services.router, prefix="/api/services", tags=["services"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(simulations.router, prefix="/api/simulations", tags=["simulations"])


async def _check_dependency(candidates: list[str], path: str) -> dict:
    async with httpx.AsyncClient() as client:
        for base_url in candidates:
            try:
                resp = await client.get(f"{base_url}{path}", timeout=2.0)
                if resp.is_success:
                    return {"status": "ok", "url": base_url}
            except Exception:
                continue
    return {"status": "unreachable", "url": candidates[0] if candidates else None}


@app.get("/api/health")
async def health():
    prometheus = await _check_dependency(PROMETHEUS_CANDIDATES, "/-/healthy")
    loki = await _check_dependency(LOKI_CANDIDATES, "/ready")
    jaeger = await _check_dependency(JAEGER_CANDIDATES, "")

    return {
        "status": "ok",
        "dependencies": {
            "prometheus": prometheus,
            "loki": loki,
            "jaeger": jaeger,
        },
    }
