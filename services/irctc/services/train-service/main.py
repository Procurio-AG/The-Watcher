import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from common.logger import setup_logger
from common.chaos import ChaosMiddleware

app = FastAPI(title="Train Service")
app.add_middleware(ChaosMiddleware)
logger = setup_logger("train-service")

class TrainRoute(BaseModel):
    id: str
    name: str # e.g. "G1234"
    start_station_id: str
    end_station_id: str
    stations: List[str] # List of station IDs in order

# Mock Database
DB = {
    "1": {
        "id": "1",
        "name": "G1234",
        "start_station_id": "1",
        "end_station_id": "2",
        "stations": ["1", "2"]
    }
}

@app.get("/routes", response_model=List[TrainRoute])
def get_routes():
    logger.info("Fetching all routes")
    return list(DB.values())

@app.get("/routes/{route_id}", response_model=TrainRoute)
def get_route(route_id: str):
    logger.info(f"Fetching route {route_id}")
    route = DB.get(route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route
