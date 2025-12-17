"""
Endpoints pour la gestion des factures clients et fournisseurs
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.invoice import CustomerInvoice, InvoiceStatus
from app.models.supplier import SupplierInvoice

router = APIRouter()


# Customer Invoices

@router.get("/customers", dependencies=[Depends(get_current_admin_user)])
async def get_customer_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: InvoiceStatus = None,
    search: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir toutes les factures clients (Admin)"""
    
    query = db.query(CustomerInvoice).order_by(CustomerInvoice.invoice_date.desc())
    
    if status:
        query = query.filter(CustomerInvoice.status == status)
    
    if search:
        query = query.filter(CustomerInvoice.invoice_number.ilike(f"%{search}%"))
    
    total = query.count()
    invoices = query.offset(skip).limit(limit).all()
    
    return {
        "invoices": [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "order_id": invoice.order_id,
                "user_name": invoice.user.full_name if invoice.user else None,
                "user_email": invoice.user.email if invoice.user else None,
                "subtotal": invoice.subtotal,
                "tax_amount": invoice.tax_amount,
                "total_amount": invoice.total_amount,
                "status": invoice.status,
                "is_paid": invoice.is_paid,
                "payment_method": invoice.payment_method,
                "invoice_date": invoice.invoice_date,
                "due_date": invoice.due_date,
                "paid_at": invoice.paid_at
            }
            for invoice in invoices
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/customers/{invoice_id}", dependencies=[Depends(get_current_admin_user)])
async def get_customer_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les détails d'une facture client (Admin)"""
    
    invoice = db.query(CustomerInvoice).filter(CustomerInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "order_id": invoice.order_id,
        "order_number": invoice.order.order_number if invoice.order else None,
        "user": {
            "id": invoice.user.id,
            "name": invoice.user.full_name,
            "email": invoice.user.email
        } if invoice.user else None,
        "subtotal": invoice.subtotal,
        "tax_amount": invoice.tax_amount,
        "discount_amount": invoice.discount_amount,
        "total_amount": invoice.total_amount,
        "status": invoice.status,
        "is_paid": invoice.is_paid,
        "payment_method": invoice.payment_method,
        "invoice_date": invoice.invoice_date,
        "due_date": invoice.due_date,
        "paid_at": invoice.paid_at,
        "notes": invoice.notes,
        "created_at": invoice.created_at
    }


@router.post("/customers", dependencies=[Depends(get_current_admin_user)])
async def create_customer_invoice(
    order_id: int,
    user_id: int,
    subtotal: float,
    tax_amount: float = 0,
    discount_amount: float = 0,
    invoice_date: datetime = None,
    due_date: datetime = None,
    notes: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Créer une facture client (Admin)"""
    
    import uuid
    
    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    total_amount = subtotal + tax_amount - discount_amount
    
    invoice = CustomerInvoice(
        invoice_number=invoice_number,
        order_id=order_id,
        user_id=user_id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        invoice_date=invoice_date or datetime.utcnow(),
        due_date=due_date,
        notes=notes
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    return {
        "message": "Facture client créée avec succès",
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number
    }


@router.put("/customers/{invoice_id}/pay", dependencies=[Depends(get_current_admin_user)])
async def mark_customer_invoice_paid(
    invoice_id: int,
    payment_method: str = "whatsapp",
    db: Session = Depends(get_db)
) -> Any:
    """Marquer une facture client comme payée (Admin)"""
    
    invoice = db.query(CustomerInvoice).filter(CustomerInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    invoice.is_paid = True
    invoice.paid_at = datetime.utcnow()
    invoice.payment_method = payment_method
    invoice.status = InvoiceStatus.PAID
    
    db.commit()
    
    return {"message": "Facture marquée comme payée"}


# Supplier Invoices

@router.get("/suppliers", dependencies=[Depends(get_current_admin_user)])
async def get_supplier_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    supplier_id: int = None,
    is_paid: bool = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir toutes les factures fournisseurs (Admin)"""
    
    query = db.query(SupplierInvoice).order_by(SupplierInvoice.invoice_date.desc())
    
    if supplier_id:
        query = query.filter(SupplierInvoice.supplier_id == supplier_id)
    
    if is_paid is not None:
        query = query.filter(SupplierInvoice.is_paid == is_paid)
    
    total = query.count()
    invoices = query.offset(skip).limit(limit).all()
    
    return {
        "invoices": [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "supplier_name": invoice.supplier.name if invoice.supplier else None,
                "subtotal": invoice.subtotal,
                "tax_amount": invoice.tax_amount,
                "total_amount": invoice.total_amount,
                "is_paid": invoice.is_paid,
                "invoice_date": invoice.invoice_date,
                "due_date": invoice.due_date,
                "paid_at": invoice.paid_at
            }
            for invoice in invoices
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/suppliers", dependencies=[Depends(get_current_admin_user)])
async def create_supplier_invoice(
    supplier_id: int,
    invoice_number: str,
    subtotal: float,
    tax_amount: float = 0,
    invoice_date: datetime = None,
    due_date: datetime = None,
    notes: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Créer une facture fournisseur (Admin)"""
    
    total_amount = subtotal + tax_amount
    
    invoice = SupplierInvoice(
        invoice_number=invoice_number,
        supplier_id=supplier_id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        invoice_date=invoice_date or datetime.utcnow(),
        due_date=due_date,
        notes=notes
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    return {
        "message": "Facture fournisseur créée avec succès",
        "invoice_id": invoice.id
    }


@router.put("/suppliers/{invoice_id}/pay", dependencies=[Depends(get_current_admin_user)])
async def mark_supplier_invoice_paid(
    invoice_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Marquer une facture fournisseur comme payée (Admin)"""
    
    invoice = db.query(SupplierInvoice).filter(SupplierInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    invoice.is_paid = True
    invoice.paid_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Facture marquée comme payée"}


@router.get("/stats", dependencies=[Depends(get_current_admin_user)])
async def get_invoices_stats(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les statistiques des factures (Admin)"""
    
    from sqlalchemy import func
    
    # Stats factures clients
    total_customer_invoices = db.query(CustomerInvoice).count()
    customer_revenue = db.query(func.sum(CustomerInvoice.total_amount)).filter(
        CustomerInvoice.is_paid == True
    ).scalar() or 0
    pending_customer_invoices = db.query(CustomerInvoice).filter(
        CustomerInvoice.is_paid == False
    ).count()
    
    # Stats factures fournisseurs
    total_supplier_invoices = db.query(SupplierInvoice).count()
    supplier_expenses = db.query(func.sum(SupplierInvoice.total_amount)).filter(
        SupplierInvoice.is_paid == True
    ).scalar() or 0
    pending_supplier_invoices = db.query(SupplierInvoice).filter(
        SupplierInvoice.is_paid == False
    ).count()
    
    return {
        "customer_invoices": {
            "total": total_customer_invoices,
            "total_revenue": customer_revenue,
            "pending": pending_customer_invoices
        },
        "supplier_invoices": {
            "total": total_supplier_invoices,
            "total_expenses": supplier_expenses,
            "pending": pending_supplier_invoices
        },
        "net_profit": customer_revenue - supplier_expenses
    }
