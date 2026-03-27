import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
import uuid

app = FastAPI(title="Station Service")
app.add_middleware(ChaosMiddleware)
logger = setup_logger("station-service")

class Station(BaseModel):
    id: str
    name: str

# Mock Database
DB = {
    "1": {"id": "1", "name": "Shang Hai"},
    "2": {"id": "2", "name": "Tai Yuan"}
}

@app.get("/stations", response_model=List[Station])
def get_stations():
    logger.info("Fetching all stations")
    return list(DB.values())

@app.get("/stations/id/{station_id}", response_model=Station)
def get_station_by_id(station_id: str):
    logger.info(f"Fetching station by id: {station_id}")
    station = DB.get(station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station

@app.get("/stations/name/{name}", response_model=Station)
def get_station_by_name(name: str):
    logger.info(f"Fetching station by name: {name}")
    for station in DB.values():
        if station["name"] == name:
            return station
    raise HTTPException(status_code=404, detail="Station not found")
