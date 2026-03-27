import asyncio
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

class ChaosMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        chaos_trigger = request.headers.get("x-chaos-trigger", "").lower()
        
        if chaos_trigger == "error":
            return JSONResponse(
                status_code=500,
                content={"detail": "Chaos engineering injected random HTTP 500 failure"}
            )
            
        if chaos_trigger == "latency":
            # Forcing a 10s wait for latency-based 15-second SLA detection paths
            await asyncio.sleep(10.0)
            
        response = await call_next(request)
        return response
