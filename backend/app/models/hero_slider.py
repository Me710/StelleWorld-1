"""
Modèle pour le slider Hero dynamique administrable
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime

from app.core.database import Base


class HeroSlide(Base):
    """Slide du hero slider"""
    
    __tablename__ = "hero_slides"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    subtitle = Column(Text, nullable=True)
    
    # Image
    image_url = Column(String(500), nullable=False)
    
    # Lien CTA (optionnel)
    cta_text = Column(String(100), nullable=True)  # Texte du bouton
    cta_link = Column(String(500), nullable=True)  # Lien du bouton
    
    # Ordre d'affichage
    sort_order = Column(Integer, default=0)
    
    # Statut
    is_active = Column(Boolean, default=True)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<HeroSlide {self.title}>"


class SiteSettings(Base):
    """Paramètres globaux du site"""
    
    __tablename__ = "site_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SiteSettings {self.key}>"
