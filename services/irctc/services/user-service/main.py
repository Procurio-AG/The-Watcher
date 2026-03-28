import sys
import os
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import uuid

app = FastAPI(title="User Service")
app.add_middleware(ChaosMiddleware)
Instrumentator().instrument(app).expose(app)
logger = setup_logger("user-service")

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "common", "user_config.json")

def load_users():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

class User(BaseModel):
    id: str = ""
    username: str
    password: str

@app.get("/users", response_model=List[User])
def get_users():
    logger.info("Fetching all users")
    return list(load_users().values())

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: str):
    db = load_users()
    user = db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/name/{username}", response_model=User)
def get_user_by_name(username: str):
    logger.info(f"Fetching user by name: {username}")
    for user in load_users().values():
        if user["username"] == username:
            return user
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/users", response_model=User)
def create_user(user: User):
    db = load_users()
    new_id = str(uuid.uuid4())
    user.id = new_id
    db[new_id] = user.model_dump()
    with open(CONFIG_PATH, "w") as f:
        json.dump(db, f, indent=2)
    logger.info(f"Created user {new_id}")
    return user
