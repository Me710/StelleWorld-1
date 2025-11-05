"""
Schémas Pydantic pour les bannières d'annonce.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class BannerBase(BaseModel):
    """Schéma de base pour une bannière."""
    message: str = Field(..., description="Message de la bannière")
    is_active: bool = Field(default=True, description="Si la bannière est active")
    background_color: str = Field(default="#fce7f3", description="Couleur de fond (hex)")
    text_color: str = Field(default="#831843", description="Couleur du texte (hex)")


class BannerCreate(BannerBase):
    """Schéma pour créer une bannière."""
    pass


class BannerUpdate(BaseModel):
    """Schéma pour mettre à jour une bannière."""
    message: Optional[str] = None
    is_active: Optional[bool] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None


class BannerResponse(BannerBase):
    """Schéma de réponse pour une bannière."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

