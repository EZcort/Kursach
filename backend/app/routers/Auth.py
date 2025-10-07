from app.database import get_db
from authx import AuthX, AuthXConfig
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.users import UserCreateSchema, UserResponseSchema, UserLoginSchema
from app.repositories.user_repo import UserRepository
from app.models.users import Users
from fastapi import APIRouter, HTTPException, Response, Depends, status

config = AuthXConfig()
config.JWT_SECRET_KEY = 'SECRET_KEY'  # В продакшене используйте надежный секретный ключ
config.JWT_ACCESS_COOKIE_NAME = 'my_access_token'
config.JWT_TOKEN_LOCATION = ['cookies']
security = AuthX(config=config)
router = APIRouter(prefix='/Authorization', tags=['Authorization'])


@router.post('/login-cookie')
async def login(
    creds: UserLoginSchema,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Аутентификация пользователя по email и паролю"""
    
    user = await UserRepository.verify_user_credentials(
        session=db, 
        email=creds.email, 
        password=creds.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Некорректный email или пароль'
        )
    
    # Создаем токен с данными пользователя
    token_data = {'email': user.email, 'role': user.role}
    token = security.create_access_token(uid=user.id, data=token_data)
    security.set_access_cookie(response, token)
    
    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': UserResponseSchema.model_validate(user)
    }


@router.get('/me', response_model=UserResponseSchema)
async def get_current_user(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(security.access_token_required)
):
    """Получить информацию о текущем пользователе"""
    
    user = await UserRepository.get_user_by_id(db, int(user_id))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Пользователь не найден'
        )
    
    return user


@router.get('/Protected', dependencies=[Depends(security.access_token_required)])
async def protected():
    """Защищенный endpoint"""
    return {'data': 'SECRET'}


@router.post('/logout')
async def logout(response: Response):
    """Выход из системы"""
    security.unset_access_cookie(response)
    return {'message': 'Успешный выход из системы'}


@router.post('/register')
async def register(
    user_data: UserCreateSchema,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация нового пользователя"""

    # Проверяем, существует ли пользователь с таким email
    existing_user = await UserRepository.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Пользователь с таким email уже существует'
        )
    
    # Создаем нового пользователя
    new_user = await UserRepository.create_user(db, {
        'email': user_data.email,
        'password': user_data.password,
        'full_name': user_data.full_name,
        'role': user_data.role
    })
    
    return {
        'message': 'Пользователь успешно создан',
        'user': UserResponseSchema.model_validate(new_user)
    }
