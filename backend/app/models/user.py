"""
Modèle utilisateur pour l'authentification et la gestion des comptes
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """Modèle utilisateur"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    whatsapp_number = Column(String(20), nullable=True)
    whatsapp_consent = Column(Boolean, default=False)
    
    # Authentification
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Adresse de livraison
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(10), nullable=True)
    country = Column(String(100), default="France")
    
    # Relations
    orders = relationship("Order", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    appointments = relationship("Appointment", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
    
    @property
    def full_name(self) -> str:
        """Nom complet de l'utilisateur"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User {self.email}>"
