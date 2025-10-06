from app.database import get_db
from authx import AuthX, AuthXConfig
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.users import UserLogicSchema, UserResponseSchema
from fastapi import APIRouter, HTTPException, Response, Depends

config = AuthXConfig()
config.JWT_SECRET_KEY = 'SECRET_KEY'
config.JWT_ACCESS_COOKIE_NAME = 'my_access_token'
config.JWT_TOKEN_LOCATION = ['cookies']
security = AuthX(config=config)

router = APIRouter(prefix='/Authorization', tags=['Authorization'])


@router.post('/login-cookie')
async def login(creds: UserLogicSchema, response: Response, db: AsyncSession = Depends(get_db)):
    if creds.username == 'test' and creds.password == 'test':
        token = security.create_access_token(uid='12345')
        response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token)
        return {'access_token': token}
    raise HTTPException(status_code=401, detail='Некорректные данные пользователя')

@router.get('/Protected', dependencies=[Depends(security.access_token_required)])
async def protected():
    return {'data': 'SECRET'}


@router.get('/')
async def root():
    return {'message': 'Start!'}

@router.post('/logout')
async def logout(response: Response):
    security.unset_access_cookie(response)
    return {'message': 'Успешный выход из системы'}
