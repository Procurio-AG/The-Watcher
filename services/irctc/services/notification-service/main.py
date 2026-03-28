import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from pydantic import BaseModel
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(title="Notification Service")
app.add_middleware(ChaosMiddleware)
Instrumentator().instrument(app).expose(app)
logger = setup_logger("notification-service")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

class NotificationReq(BaseModel):
    user_id: str
    message: str

@app.post("/notify")
def handle_notify(req: NotificationReq):
    logger.info(f"Sending notification to user {req.user_id}: {req.message}")
    return {"status": "sent"}
