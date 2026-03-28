import sys
import os
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from common.logger import setup_logger
from common.chaos import ChaosMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(title="Auth Service")
app.add_middleware(ChaosMiddleware)
Instrumentator().instrument(app).expose(app)
logger = setup_logger("auth-service")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

SECRET_KEY = "my_super_secret_key"
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "common", "user_config.json")

def load_users():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str

@app.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    logger.info(f"Attempting login for user: {req.username}")
    db = load_users()
    
    # 15s SLA optimization: Local validation without network hop
    user_data = None
    for u in db.values():
        if u["username"] == req.username:
            user_data = u
            break
            
    if not user_data or user_data["password"] != req.password:
        logger.warning(f"Invalid credentials for {req.username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    token_data = {
        "sub": user_data["id"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    logger.info("Login successful")
    return {"token": token}

@app.get("/verify")
def verify_token(token: str):
    logger.info("Verifying token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return {"valid": True, "user_id": payload["sub"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
