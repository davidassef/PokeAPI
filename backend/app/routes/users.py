"""
Rotas da API para usuários.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.schemas import User, UserCreate, UserUpdate, UserWithFavorites
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Cria novo usuário."""
    # Verifica se email já existe
    if UserService.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )

    # Verifica se username já existe
    if UserService.get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username já cadastrado"
        )

    return UserService.create_user(db, user)


@router.get("/", response_model=List[User])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista usuários com paginação."""
    return UserService.get_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserWithFavorites)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Busca usuário por ID."""
    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return user


@router.put("/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Atualiza usuário."""
    user = UserService.update_user(db, user_id, user_update)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Deleta usuário."""
    if not UserService.delete_user(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
