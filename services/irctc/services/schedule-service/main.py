import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
from datetime import datetime

app = FastAPI(title="Schedule Service")
app.add_middleware(ChaosMiddleware)
logger = setup_logger("schedule-service")

class Schedule(BaseModel):
    id: str
    route_id: str
    departure_time: str
    arrival_time: str

# Mock Database
DB = {
    "1": {
        "id": "1",
        "route_id": "1",
        "departure_time": "2026-03-28T08:00:00Z",
        "arrival_time": "2026-03-28T12:00:00Z"
    }
}

@app.get("/schedules/{route_id}", response_model=List[Schedule])
def get_schedules(route_id: str):
    logger.info(f"Fetching schedules for route: {route_id}")
    return [s for s in DB.values() if s["route_id"] == route_id]
