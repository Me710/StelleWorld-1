"""
Modèle pour les bannières d'annonce du site.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Banner(Base):
    """Bannière d'annonce affichée en haut du site."""
    
    __tablename__ = "banners"
    
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False, default="")
    is_active = Column(Boolean, default=True, nullable=False)
    background_color = Column(String, default="#fce7f3", nullable=False)  # Rose pâle par défaut
    text_color = Column(String, default="#831843", nullable=False)  # Rose foncé par défaut
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Banner(id={self.id}, active={self.is_active})>"

