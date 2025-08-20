"""
Modèles pour les abonnements récurrents
"""

from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class SubscriptionStatus(str, Enum):
    """Statuts d'abonnement"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    UNPAID = "unpaid"
    PAUSED = "paused"


class BillingInterval(str, Enum):
    """Intervalles de facturation"""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class Subscription(Base):
    """Modèle d'abonnement récurrent"""
    
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relation utilisateur
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="subscriptions")
    
    # Identifiants Stripe
    stripe_subscription_id = Column(String(255), unique=True, nullable=False)
    stripe_customer_id = Column(String(255), nullable=False)
    stripe_price_id = Column(String(255), nullable=False)
    
    # Détails de l'abonnement
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Facturation
    billing_interval = Column(SQLEnum(BillingInterval), nullable=False)
    amount = Column(Float, nullable=False)  # Montant par période
    currency = Column(String(3), default="EUR")
    
    # Statut
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    
    # Dates importantes
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    trial_end = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    
    # Métadonnées
    metadata = Column(Text, nullable=True)  # JSON pour données supplémentaires
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    items = relationship("SubscriptionItem", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("SubscriptionInvoice", back_populates="subscription")
    
    @property
    def is_active(self) -> bool:
        """Vérifier si l'abonnement est actif"""
        return self.status == SubscriptionStatus.ACTIVE
    
    @property
    def days_until_renewal(self) -> int:
        """Nombre de jours avant le prochain renouvellement"""
        if self.current_period_end:
            delta = self.current_period_end - datetime.utcnow()
            return max(0, delta.days)
        return 0
    
    def __repr__(self):
        return f"<Subscription {self.name} - {self.user.email}>"


class SubscriptionItem(Base):
    """Article inclus dans un abonnement"""
    
    __tablename__ = "subscription_items"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relations
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    subscription = relationship("Subscription", back_populates="items")
    
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product = relationship("Product", back_populates="subscription_items")
    
    # Détails de l'article
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SubscriptionItem {self.product.name} x{self.quantity}>"


class SubscriptionInvoice(Base):
    """Factures d'abonnement"""
    
    __tablename__ = "subscription_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relations
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    subscription = relationship("Subscription", back_populates="invoices")
    
    # Identifiants Stripe
    stripe_invoice_id = Column(String(255), unique=True, nullable=False)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    
    # Détails de la facture
    invoice_number = Column(String(100), nullable=False)
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    
    # Statut
    status = Column(String(50), nullable=False)  # draft, open, paid, uncollectible, void
    
    # Dates
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SubscriptionInvoice {self.invoice_number}>"
