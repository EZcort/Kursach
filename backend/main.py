import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import app.routers.Auth as Auth

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

routers = [Auth.router]
[app.include_router(router) for router in routers]

@app.get("/")
async def root():
    return {"message": "API is running", "status": "success"}
