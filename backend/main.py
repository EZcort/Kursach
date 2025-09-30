from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import app.routers.Auth as Auth
# from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
# from sqlalchemy import text
# import asyncio


load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')


app = FastAPI()
routers = [Auth.router]
[app.include_router(router) for router in routers]
# Настройка CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # URL вашего фронтенда
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# engine = create_async_engine(DATABASE_URL)
# async def get1():
#     async with engine.connect() as connection:
#         res = await connection.execute(text('select 1,2,3 union select 4,5,6'))
#         print(f'{res.first()=}')
# asyncio.run(get1())






