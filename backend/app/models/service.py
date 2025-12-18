"""
Modèle Service pour les rendez-vous extensibles et personnalisables
Respecte le principe Open/Closed de SOLID - ouvert à l'extension, fermé à la modification
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class ServiceCategory(Base):
    """Catégorie de services (Capillaire, Soins, etc.)"""
    
    __tablename__ = "service_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # Nom de l'icône (ex: 'scissors', 'spa')
    color = Column(String(20), nullable=True)  # Couleur hex (ex: '#EC4899')
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    services = relationship("Service", back_populates="category")
    
    def __repr__(self):
        return f"<ServiceCategory {self.name}>"


class Service(Base):
    """
    Modèle Service - Entièrement personnalisable via le back-office
    Peut être étendu pour de nouveaux types de services
    """
    
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Informations de base
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    
    # Catégorie
    category_id = Column(Integer, ForeignKey("service_categories.id"), nullable=True)
    category = relationship("ServiceCategory", back_populates="services")
    
    # Durée et capacité
    duration_minutes = Column(Integer, default=60)
    buffer_time_minutes = Column(Integer, default=15)  # Temps entre deux RDV
    max_participants = Column(Integer, default=1)  # Pour les services de groupe
    
    # Tarification
    price = Column(Float, nullable=False, default=0)
    compare_at_price = Column(Float, nullable=True)  # Prix barré
    deposit_amount = Column(Float, nullable=True)  # Acompte requis
    deposit_percentage = Column(Float, nullable=True)  # Ou % du prix
    
    # Options de paiement
    allow_online_payment = Column(Boolean, default=True)
    allow_pay_on_site = Column(Boolean, default=True)
    
    # Localisation
    location_type = Column(String(50), default="office")  # office, home, online, any
    default_location = Column(String(500), nullable=True)
    can_be_at_home = Column(Boolean, default=False)  # Service à domicile disponible
    home_service_fee = Column(Float, default=0)  # Frais supplémentaires à domicile
    
    # Disponibilité
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    requires_approval = Column(Boolean, default=False)  # RDV nécessite validation admin
    
    # Médias
    main_image_url = Column(String(255), nullable=True)
    gallery_images = Column(Text, nullable=True)  # JSON des URLs
    
    # Configuration avancée
    min_booking_notice_hours = Column(Integer, default=24)  # Délai minimum pour réserver
    max_booking_advance_days = Column(Integer, default=60)  # Réservation max X jours à l'avance
    cancellation_notice_hours = Column(Integer, default=24)  # Délai annulation
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    
    # Statistiques
    booking_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Champs personnalisés extensibles (JSON)
    custom_fields = Column(Text, nullable=True)  # {"field_name": "value", ...}
    
    @property
    def discount_percentage(self) -> float:
        """Calculer le pourcentage de remise"""
        if self.compare_at_price and self.compare_at_price > self.price:
            return ((self.compare_at_price - self.price) / self.compare_at_price) * 100
        return 0
    
    @property
    def required_deposit(self) -> float:
        """Calculer l'acompte requis"""
        if self.deposit_amount:
            return self.deposit_amount
        if self.deposit_percentage:
            return self.price * (self.deposit_percentage / 100)
        return 0
    
    def __repr__(self):
        return f"<Service {self.name}>"


class ServiceAvailability(Base):
    """
    Disponibilités par service - Permet de définir des horaires différents par service
    """
    
    __tablename__ = "service_availabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    # Jour de la semaine (0=Lundi, 6=Dimanche)
    day_of_week = Column(Integer, nullable=False)
    
    # Horaires
    start_time = Column(String(5), nullable=False)  # Format "HH:MM"
    end_time = Column(String(5), nullable=False)
    
    # Disponibilité
    is_active = Column(Boolean, default=True)
    
    # Relations
    service = relationship("Service")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ServiceAvailability {self.service_id} - {self.day_of_week}>"


class ServiceAddon(Base):
    """
    Options/Add-ons pour les services (ex: produits supplémentaires, extensions de temps)
    """
    
    __tablename__ = "service_addons"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0)
    duration_minutes = Column(Integer, default=0)  # Temps additionnel
    
    is_active = Column(Boolean, default=True)
    is_required = Column(Boolean, default=False)  # Add-on obligatoire
    
    # Relations
    service = relationship("Service")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ServiceAddon {self.name}>"
