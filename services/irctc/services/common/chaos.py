import time
import math
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
            # BLOCKING sleep — this locks the uvicorn worker thread,
            # causing all subsequent requests to queue up and genuinely
            # spiking P95 latency across the service.
            time.sleep(10.0)
            
        if chaos_trigger == "cpu":
            # CPU burn — tight math loop for ~2 seconds.
            # Each request consumes 100% of one CPU core for its duration,
            # and with 150 concurrent VUs this will overwhelm the process.
            end = time.monotonic() + 2.0
            x = 0.0
            while time.monotonic() < end:
                for _ in range(10000):
                    x += math.sin(x) * math.cos(x)
            
        response = await call_next(request)
        return response
