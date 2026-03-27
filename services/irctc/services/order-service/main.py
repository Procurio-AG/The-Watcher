import sys
import os
import uuid
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import httpx
from common.logger import setup_logger
from common.chaos import ChaosMiddleware

app = FastAPI(title="Order Service")
app.add_middleware(ChaosMiddleware)
logger = setup_logger("order-service")

TICKET_SERVICE_URL = os.getenv("TICKET_SERVICE_URL", "http://ticket-service:8000")

class OrderRequest(BaseModel):
    ticket_id: str

class Order(BaseModel):
    id: str
    user_id: str
    ticket_id: str
    status: str
    created_at: str

DB = {}

@app.post("/orders", response_model=Order)
async def create_order(req: OrderRequest, x_user_id: str = Header(default="1")):
    logger.info(f"Creating order for user {x_user_id} and ticket {req.ticket_id}")
    async with httpx.AsyncClient() as client:
        # Reserve ticket
        res = await client.post(f"{TICKET_SERVICE_URL}/tickets/{req.ticket_id}/reserve")
        if res.status_code != 200:
            logger.error("Failed to reserve ticket")
            raise HTTPException(status_code=400, detail="Ticket reservation failed")
            
        order_id = str(uuid.uuid4())
        order = Order(
            id=order_id,
            user_id=x_user_id,
            ticket_id=req.ticket_id,
            status="PENDING",
            created_at=datetime.utcnow().isoformat() + "Z"
        )
        DB[order_id] = order
        return order

@app.get("/orders/{order_id}", response_model=Order)
def get_order(order_id: str):
    order = DB.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/orders/{order_id}/pay")
def pay_order(order_id: str):
    logger.info(f"Marking order {order_id} as PAID")
    order = DB.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "PAID"
    return order
