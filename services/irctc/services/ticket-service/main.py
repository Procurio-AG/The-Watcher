import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
import httpx

app = FastAPI(title="Ticket Service")
app.add_middleware(ChaosMiddleware)
logger = setup_logger("ticket-service")

class Ticket(BaseModel):
    id: str
    route_id: str
    schedule_id: str
    price: float
    available_seats: int

DB = {
    "1": Ticket(id="1", route_id="1", schedule_id="1", price=100.0, available_seats=50)
}

@app.get("/tickets", response_model=List[Ticket])
def search_tickets(start_station_id: str, end_station_id: str):
    logger.info(f"Searching tickets from {start_station_id} to {end_station_id}")
    return list(DB.values())

@app.post("/tickets/{ticket_id}/reserve")
def reserve_ticket(ticket_id: str):
    logger.info(f"Reserving ticket: {ticket_id}")
    ticket = DB.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.available_seats <= 0:
        raise HTTPException(status_code=400, detail="Not enough seats")
    
    ticket.available_seats -= 1
    return {"status": "success", "ticket": ticket}
