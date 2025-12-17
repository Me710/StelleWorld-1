"""
Modèles pour les factures clients
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class InvoiceStatus(str, Enum):
    """Statuts de facture"""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class CustomerInvoice(Base):
    """Facture client"""
    
    __tablename__ = "customer_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    
    # Relation commande
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    order = relationship("Order")
    
    # Relation utilisateur
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")
    
    # Montants
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    
    # Statut
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    
    # Paiement
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)  # whatsapp, cash, card
    
    # Dates
    invoice_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<CustomerInvoice {self.invoice_number}>"
