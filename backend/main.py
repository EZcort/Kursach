import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import create_tables
from app.seed import create_test_data
import app.routers.Auth as Auth

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    print("Creating database tables...")
    await create_tables()
    print("✅ Tables created successfully!")
    
    print("Creating test data...")
    await create_test_data()
    print("✅ Startup completed!")
    
    yield
    print("🛑 Shutting down...")

app = FastAPI(lifespan=lifespan)

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
