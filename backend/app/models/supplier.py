"""
Modèles pour les fournisseurs
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Supplier(Base):
    """Modèle fournisseur"""
    
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    company_name = Column(String(200), nullable=True)
    
    # Contact
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Adresse
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="Canada")
    
    # Informations fiscales
    tax_id = Column(String(50), nullable=True)  # Numéro de TVA/TPS
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Statut
    is_active = Column(Boolean, default=True)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    invoices = relationship("SupplierInvoice", back_populates="supplier", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Supplier {self.name}>"


class SupplierInvoice(Base):
    """Facture fournisseur"""
    
    __tablename__ = "supplier_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    
    # Relation fournisseur
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    supplier = relationship("Supplier", back_populates="invoices")
    
    # Montants
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    
    # Statut de paiement
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)
    
    # Dates
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SupplierInvoice {self.invoice_number}>"
