"""
Modèles pour le système de chat temps réel
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class MessageType(str, Enum):
    """Types de messages"""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class ChatStatus(str, Enum):
    """Statuts de conversation"""
    OPEN = "open"
    CLOSED = "closed"
    PENDING = "pending"


class ChatConversation(Base):
    """Conversation de chat"""
    
    __tablename__ = "chat_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relation utilisateur (optionnel pour les visiteurs anonymes)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User")
    
    # Informations visiteur (si pas connecté)
    visitor_name = Column(String(100), nullable=True)
    visitor_email = Column(String(255), nullable=True)
    visitor_phone = Column(String(20), nullable=True)
    
    # Session et identification
    session_id = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Statut de la conversation
    status = Column(SQLEnum(ChatStatus), default=ChatStatus.OPEN)
    
    # Sujet de la conversation
    subject = Column(String(200), nullable=True)
    
    # Métadonnées
    last_message_at = Column(DateTime, nullable=True)
    admin_assigned = Column(String(100), nullable=True)  # Admin assigné
    
    # Satisfaction client
    rating = Column(Integer, nullable=True)  # 1-5 étoiles
    feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    # Relations
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")
    
    @property
    def participant_name(self) -> str:
        """Nom du participant (utilisateur connecté ou visiteur)"""
        if self.user:
            return self.user.full_name
        return self.visitor_name or "Visiteur anonyme"
    
    @property
    def participant_email(self) -> str:
        """Email du participant"""
        if self.user:
            return self.user.email
        return self.visitor_email or ""
    
    @property
    def message_count(self) -> int:
        """Nombre de messages dans la conversation"""
        return len(self.messages)
    
    def __repr__(self):
        return f"<ChatConversation {self.id} - {self.participant_name}>"


class ChatMessage(Base):
    """Message dans une conversation"""
    
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relation conversation
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False)
    conversation = relationship("ChatConversation", back_populates="messages")
    
    # Expéditeur
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="chat_messages")
    
    # Si le message vient de l'admin ou du système
    is_from_admin = Column(Boolean, default=False)
    admin_name = Column(String(100), nullable=True)
    
    # Contenu du message
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)
    content = Column(Text, nullable=False)
    
    # Fichiers attachés
    attachment_url = Column(String(500), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    attachment_size = Column(Integer, nullable=True)
    
    # Statut de lecture
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    
    @property
    def sender_name(self) -> str:
        """Nom de l'expéditeur"""
        if self.is_from_admin:
            return self.admin_name or "Support"
        elif self.user:
            return self.user.full_name
        else:
            return self.conversation.participant_name
    
    def __repr__(self):
        return f"<ChatMessage {self.id} - {self.sender_name}>"


class ChatNotification(Base):
    """Notifications pour les nouveaux messages"""
    
    __tablename__ = "chat_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relations
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False)
    message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=False)
    
    conversation = relationship("ChatConversation")
    message = relationship("ChatMessage")
    
    # Type de notification
    notification_type = Column(String(50), default="new_message")  # new_message, conversation_started
    
    # Destinataire
    recipient_type = Column(String(20), nullable=False)  # admin, user
    recipient_id = Column(String(100), nullable=True)  # ID Telegram ou email
    
    # Statut
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ChatNotification {self.notification_type} - {self.recipient_type}>"
