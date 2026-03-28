import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(title="Payment Service")
app.add_middleware(ChaosMiddleware)
Instrumentator().instrument(app).expose(app)
logger = setup_logger("payment-service")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8000")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8000")

class PaymentRequest(BaseModel):
    order_id: str
    amount: float

@app.post("/payments")
async def process_payment(req: PaymentRequest):
    logger.info(f"Processing payment for order {req.order_id}")
    
    async with httpx.AsyncClient() as client:
        # Update order status
        res = await client.post(f"{ORDER_SERVICE_URL}/orders/{req.order_id}/pay")
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Order payment update failed")
            
        order = res.json()
        
        # Send Notification (fire and forget basically, or wait)
        try:
            await client.post(f"{NOTIFICATION_SERVICE_URL}/notify", json={
                "user_id": order["user_id"],
                "message": f"Payment successful for order {req.order_id}"
            })
        except Exception as e:
            logger.warning(f"Failed to send notification: {e}")
            
    return {"status": "success", "transaction_id": "mock-txn-123"}
