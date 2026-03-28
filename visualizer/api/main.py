from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import metrics, logs, traces, services, incidents, simulations

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


@app.get("/api/health")
def health():
    return {"status": "ok"}
