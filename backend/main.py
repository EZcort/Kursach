from fastapi import FastAPI, HTTPException, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from authx import AuthX, AuthXConfig
from app.schemas.users import UserLogicSchema
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
import asyncio


load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')


app = FastAPI()
# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL вашего фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# engine = create_async_engine(DATABASE_URL)
# async def get1():
#     async with engine.connect() as connection:
#         res = await connection.execute(text('select 1,2,3 union select 4,5,6'))
#         print(f'{res.first()=}')
# asyncio.run(get1())


config = AuthXConfig()
config.JWT_SECRET_KEY = 'SECRET_KEY'
config.JWT_ACCESS_COOKIE_NAME = 'my_access_token'
config.JWT_TOKEN_LOCATION = ['cookies']
security = AuthX(config=config)


@app.post('/login')
async def login(creds: UserLogicSchema, response: Response):
    if creds.username == 'test' and creds.password == 'test':
        token = security.create_access_token(uid='12345')
        response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token)
        return {'access_token': token}
    raise HTTPException(status_code=401, detail='Некорректные данные пользователя')

@app.get('/protected', dependencies=[Depends(security.access_token_required)])
async def protected():
    return {'data': 'SECRET'}


@app.get('/')
async def root():
    return {'message': 'Start!'}
