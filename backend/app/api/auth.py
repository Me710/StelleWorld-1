"""
Endpoints d'authentification et gestion des utilisateurs
"""

from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.models.user import User

router = APIRouter()


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """Connexion utilisateur"""
    
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Compte utilisateur inactif"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin
        }
    }


@router.post("/register")
async def register(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone: str = None,
    whatsapp_number: str = None,
    whatsapp_consent: bool = False,
    db: Session = Depends(get_db)
) -> Any:
    """Inscription d'un nouvel utilisateur"""
    
    # Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cet email existe déjà"
        )
    
    # Créer le nouvel utilisateur
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        whatsapp_number=whatsapp_number,
        whatsapp_consent=whatsapp_consent,
        hashed_password=hashed_password,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Créer le token d'accès
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin
        },
        "message": "Compte créé avec succès"
    }


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Obtenir les informations de l'utilisateur connecté"""
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "whatsapp_number": current_user.whatsapp_number,
        "whatsapp_consent": current_user.whatsapp_consent,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at,
        "address_line1": current_user.address_line1,
        "address_line2": current_user.address_line2,
        "city": current_user.city,
        "postal_code": current_user.postal_code,
        "country": current_user.country
    }


@router.put("/me")
async def update_profile(
    first_name: str = None,
    last_name: str = None,
    phone: str = None,
    whatsapp_number: str = None,
    whatsapp_consent: bool = None,
    address_line1: str = None,
    address_line2: str = None,
    city: str = None,
    postal_code: str = None,
    country: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour le profil utilisateur"""
    
    if first_name is not None:
        current_user.first_name = first_name
    if last_name is not None:
        current_user.last_name = last_name
    if phone is not None:
        current_user.phone = phone
    if whatsapp_number is not None:
        current_user.whatsapp_number = whatsapp_number
    if whatsapp_consent is not None:
        current_user.whatsapp_consent = whatsapp_consent
    if address_line1 is not None:
        current_user.address_line1 = address_line1
    if address_line2 is not None:
        current_user.address_line2 = address_line2
    if city is not None:
        current_user.city = city
    if postal_code is not None:
        current_user.postal_code = postal_code
    if country is not None:
        current_user.country = country
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profil mis à jour avec succès"}


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Changer le mot de passe"""
    
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Mot de passe modifié avec succès"}
