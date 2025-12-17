"""
Endpoints pour la gestion des fournisseurs
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.supplier import Supplier, SupplierInvoice

router = APIRouter()


@router.get("/", dependencies=[Depends(get_current_admin_user)])
async def get_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: bool = None,
    search: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir la liste des fournisseurs (Admin)"""
    
    query = db.query(Supplier)
    
    if is_active is not None:
        query = query.filter(Supplier.is_active == is_active)
    
    if search:
        query = query.filter(
            Supplier.name.ilike(f"%{search}%") |
            Supplier.company_name.ilike(f"%{search}%")
        )
    
    query = query.order_by(Supplier.name)
    total = query.count()
    suppliers = query.offset(skip).limit(limit).all()
    
    return {
        "suppliers": [
            {
                "id": supplier.id,
                "name": supplier.name,
                "company_name": supplier.company_name,
                "email": supplier.email,
                "phone": supplier.phone,
                "whatsapp": supplier.whatsapp,
                "city": supplier.city,
                "country": supplier.country,
                "is_active": supplier.is_active,
                "invoice_count": len(supplier.invoices)
            }
            for supplier in suppliers
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{supplier_id}", dependencies=[Depends(get_current_admin_user)])
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les détails d'un fournisseur (Admin)"""
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    
    return {
        "id": supplier.id,
        "name": supplier.name,
        "company_name": supplier.company_name,
        "email": supplier.email,
        "phone": supplier.phone,
        "whatsapp": supplier.whatsapp,
        "website": supplier.website,
        "address_line1": supplier.address_line1,
        "address_line2": supplier.address_line2,
        "city": supplier.city,
        "postal_code": supplier.postal_code,
        "country": supplier.country,
        "tax_id": supplier.tax_id,
        "notes": supplier.notes,
        "is_active": supplier.is_active,
        "created_at": supplier.created_at,
        "updated_at": supplier.updated_at
    }


@router.post("/", dependencies=[Depends(get_current_admin_user)])
async def create_supplier(
    name: str,
    company_name: str = None,
    email: str = None,
    phone: str = None,
    whatsapp: str = None,
    website: str = None,
    address_line1: str = None,
    address_line2: str = None,
    city: str = None,
    postal_code: str = None,
    country: str = "Canada",
    tax_id: str = None,
    notes: str = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """Créer un nouveau fournisseur (Admin)"""
    
    supplier = Supplier(
        name=name,
        company_name=company_name,
        email=email,
        phone=phone,
        whatsapp=whatsapp,
        website=website,
        address_line1=address_line1,
        address_line2=address_line2,
        city=city,
        postal_code=postal_code,
        country=country,
        tax_id=tax_id,
        notes=notes,
        is_active=is_active
    )
    
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    
    return {
        "message": "Fournisseur créé avec succès",
        "supplier_id": supplier.id
    }


@router.put("/{supplier_id}", dependencies=[Depends(get_current_admin_user)])
async def update_supplier(
    supplier_id: int,
    name: str = None,
    company_name: str = None,
    email: str = None,
    phone: str = None,
    is_active: bool = None,
    notes: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour un fournisseur (Admin)"""
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    
    if name is not None:
        supplier.name = name
    if company_name is not None:
        supplier.company_name = company_name
    if email is not None:
        supplier.email = email
    if phone is not None:
        supplier.phone = phone
    if is_active is not None:
        supplier.is_active = is_active
    if notes is not None:
        supplier.notes = notes
    
    db.commit()
    
    return {"message": "Fournisseur mis à jour avec succès"}


@router.delete("/{supplier_id}", dependencies=[Depends(get_current_admin_user)])
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Supprimer un fournisseur (Admin)"""
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    
    db.delete(supplier)
    db.commit()
    
    return {"message": "Fournisseur supprimé avec succès"}


# Supplier Invoices

@router.get("/{supplier_id}/invoices", dependencies=[Depends(get_current_admin_user)])
async def get_supplier_invoices(
    supplier_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les factures d'un fournisseur (Admin)"""
    
    invoices = (
        db.query(SupplierInvoice)
        .filter(SupplierInvoice.supplier_id == supplier_id)
        .order_by(SupplierInvoice.invoice_date.desc())
        .all()
    )
    
    return {
        "invoices": [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "subtotal": invoice.subtotal,
                "tax_amount": invoice.tax_amount,
                "total_amount": invoice.total_amount,
                "is_paid": invoice.is_paid,
                "paid_at": invoice.paid_at,
                "invoice_date": invoice.invoice_date,
                "due_date": invoice.due_date
            }
            for invoice in invoices
        ]
    }
