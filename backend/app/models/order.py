"""
Modèles pour les commandes et articles de commande
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class OrderStatus(str, Enum):
    """Statuts de commande"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, Enum):
    """Statuts de paiement"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Order(Base):
    """Modèle de commande"""
    
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Relation utilisateur
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="orders")
    
    # Statuts
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Montants
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0)
    shipping_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    
    # Informations de livraison
    shipping_first_name = Column(String(100), nullable=False)
    shipping_last_name = Column(String(100), nullable=False)
    shipping_email = Column(String(255), nullable=False)
    shipping_phone = Column(String(20), nullable=True)
    shipping_address_line1 = Column(String(255), nullable=False)
    shipping_address_line2 = Column(String(255), nullable=True)
    shipping_city = Column(String(100), nullable=False)
    shipping_postal_code = Column(String(10), nullable=False)
    shipping_country = Column(String(100), default="France")
    
    # Facturation (peut être différente de la livraison)
    billing_first_name = Column(String(100), nullable=True)
    billing_last_name = Column(String(100), nullable=True)
    billing_email = Column(String(255), nullable=True)
    billing_phone = Column(String(20), nullable=True)
    billing_address_line1 = Column(String(255), nullable=True)
    billing_address_line2 = Column(String(255), nullable=True)
    billing_city = Column(String(100), nullable=True)
    billing_postal_code = Column(String(10), nullable=True)
    billing_country = Column(String(100), nullable=True)
    
    # Paiement Stripe
    stripe_payment_intent_id = Column(String(255), nullable=True)
    stripe_charge_id = Column(String(255), nullable=True)
    
    # Notes et métadonnées
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Tracking
    tracking_number = Column(String(100), nullable=True)
    tracking_url = Column(String(500), nullable=True)
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Relations
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    @property
    def total_items(self) -> int:
        """Nombre total d'articles dans la commande"""
        return sum(item.quantity for item in self.items)
    
    def __repr__(self):
        return f"<Order {self.order_number}>"


class OrderItem(Base):
    """Article d'une commande"""
    
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relations
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    order = relationship("Order", back_populates="items")
    
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product = relationship("Product", back_populates="order_items")
    
    # Détails de l'article au moment de la commande
    product_name = Column(String(200), nullable=False)  # Nom au moment de l'achat
    product_description = Column(Text, nullable=True)
    product_image_url = Column(String(255), nullable=True)
    
    # Quantité et prix
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)  # Prix unitaire au moment de l'achat
    total_price = Column(Float, nullable=False)  # quantity * unit_price
    
    # Variante (si applicable)
    variant_info = Column(Text, nullable=True)  # JSON des détails de variante
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<OrderItem {self.product_name} x{self.quantity}>"
