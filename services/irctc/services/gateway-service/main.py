import sys
import os
import httpx

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, Response
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(title="Gateway Service")
app.add_middleware(ChaosMiddleware)
Instrumentator().instrument(app).expose(app)
logger = setup_logger("gateway-service")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

SERVICE_MAPPING = {
    "login": "auth-service",
    "verify": "auth-service",
    "users": "user-service",
    "stations": "station-service",
    "routes": "train-service",
    "schedules": "schedule-service",
    "tickets": "ticket-service",
    "orders": "order-service",
    "payments": "payment-service",
    "notify": "notification-service"
}

def get_service_base_url(service_name: str) -> str:
    """Resolve service base URL from env var or default to Docker/K8s hostname."""
    env_key = service_name.upper().replace("-", "_") + "_URL"
    return os.environ.get(env_key, f"http://{service_name}:8000")

@app.api_route("/{service_prefix}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@app.api_route("/{service_prefix}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(service_prefix: str, request: Request, path: str = ""):
    if service_prefix not in SERVICE_MAPPING:
        return Response(status_code=404, content="Endpoint not mapped to any upstream service")

    service_name = SERVICE_MAPPING[service_prefix]
    base_url = get_service_base_url(service_name)
    upstream_url = f"{base_url}/{service_prefix}"
    if path:
        upstream_url += f"/{path}"
    if request.url.query:
        upstream_url += f"?{request.url.query}"
        
    logger.info(f"Proxying request to {upstream_url}")
    
    async with httpx.AsyncClient(timeout=3.0) as client:
        # Avoid passing fastAPI server headers that might cause issues with proxy 
        headers = dict(request.headers)
        headers.pop("host", None)
        
        req = client.build_request(
            request.method,
            upstream_url,
            headers=headers,
            content=await request.body()
        )
        try:
            res = await client.send(req)
            return Response(content=res.content, status_code=res.status_code, headers=dict(res.headers))
        except httpx.RequestError as e:
            logger.error(f"Proxy error: {e}")
            return Response(status_code=502, content="Bad Gateway")
