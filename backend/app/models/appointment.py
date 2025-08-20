"""
Modèles pour la gestion des rendez-vous et services
"""

from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class AppointmentStatus(str, Enum):
    """Statuts de rendez-vous"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class AppointmentType(str, Enum):
    """Types de rendez-vous"""
    CONSULTATION = "consultation"
    SERVICE = "service"
    MAINTENANCE = "maintenance"
    FOLLOW_UP = "follow_up"
    OTHER = "other"


class Appointment(Base):
    """Modèle de rendez-vous"""
    
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relation utilisateur
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="appointments")
    
    # Informations du service
    service_name = Column(String(200), nullable=False)
    service_description = Column(Text, nullable=True)
    appointment_type = Column(SQLEnum(AppointmentType), default=AppointmentType.SERVICE)
    
    # Planning
    scheduled_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    
    # Statut
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.PENDING)
    
    # Informations client
    client_name = Column(String(200), nullable=False)
    client_email = Column(String(255), nullable=False)
    client_phone = Column(String(20), nullable=True)
    
    # Tarification
    price = Column(Float, nullable=True)
    is_paid = Column(Boolean, default=False)
    payment_method = Column(String(50), nullable=True)
    
    # Notes
    client_notes = Column(Text, nullable=True)  # Notes du client
    admin_notes = Column(Text, nullable=True)   # Notes internes
    
    # Rappels
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime, nullable=True)
    
    # Localisation (si applicable)
    location = Column(String(500), nullable=True)
    location_type = Column(String(50), default="office")  # office, home, online
    
    # Métadonnées
    source = Column(String(50), default="website")  # website, phone, walk_in
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    @property
    def end_time(self) -> datetime:
        """Heure de fin calculée"""
        return self.scheduled_date + timedelta(minutes=self.duration_minutes)
    
    @property
    def is_upcoming(self) -> bool:
        """Vérifier si le RDV est à venir"""
        return self.scheduled_date > datetime.utcnow()
    
    @property
    def is_today(self) -> bool:
        """Vérifier si le RDV est aujourd'hui"""
        today = datetime.utcnow().date()
        return self.scheduled_date.date() == today
    
    def __repr__(self):
        return f"<Appointment {self.service_name} - {self.scheduled_date}>"


class ServiceSlot(Base):
    """Créneaux disponibles pour les services"""
    
    __tablename__ = "service_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Jour de la semaine (0=Lundi, 6=Dimanche)
    day_of_week = Column(Integer, nullable=False)
    
    # Heure de début et fin
    start_time = Column(String(5), nullable=False)  # Format "HH:MM"
    end_time = Column(String(5), nullable=False)    # Format "HH:MM"
    
    # Durée des créneaux en minutes
    slot_duration = Column(Integer, default=60)
    
    # Disponibilité
    is_active = Column(Boolean, default=True)
    max_appointments = Column(Integer, default=1)  # Nombre de RDV simultanés
    
    # Service associé (optionnel)
    service_name = Column(String(200), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ServiceSlot {self.day_of_week} {self.start_time}-{self.end_time}>"


class BlockedDate(Base):
    """Dates bloquées pour les rendez-vous"""
    
    __tablename__ = "blocked_dates"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Date ou période bloquée
    blocked_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # Pour bloquer une période
    
    # Raison du blocage
    reason = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Type de blocage
    is_full_day = Column(Boolean, default=True)
    start_time = Column(String(5), nullable=True)  # Si pas toute la journée
    end_time = Column(String(5), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), nullable=True)  # Admin qui a créé le blocage
    
    def __repr__(self):
        return f"<BlockedDate {self.blocked_date} - {self.reason}>"
