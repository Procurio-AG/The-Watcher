import sys
import os
import httpx

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, Response
from common.logger import setup_logger
from common.chaos import ChaosMiddleware

app = FastAPI(title="Gateway Service")
app.add_middleware(ChaosMiddleware)
logger = setup_logger("gateway-service")

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

@app.api_route("/{service_prefix}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
@app.api_route("/{service_prefix}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(service_prefix: str, request: Request, path: str = ""):
    if service_prefix not in SERVICE_MAPPING:
        return Response(status_code=404, content="Endpoint not mapped to any upstream service")
        
    upstream_url = f"http://{SERVICE_MAPPING[service_prefix]}:8000/{service_prefix}"
    if path:
        upstream_url += f"/{path}"
        
    logger.info(f"Proxying request to {upstream_url}")
    
    async with httpx.AsyncClient() as client:
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
