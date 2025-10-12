"""
Endpoints d'administration - Backoffice StelleWorld
Accessible uniquement aux administrateurs
"""

from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, or_
import json
import os
import shutil
from pathlib import Path

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.user import User
from app.models.product import Product, Category, ProductVariant
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.subscription import Subscription
from app.models.appointment import Appointment
from app.models.chat import ChatMessage

router = APIRouter()


# ================================
# INITIALISATION DE LA BASE
# ================================

@router.post("/init-database")
async def init_database_endpoint(
    force_reset: bool = False,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Initialiser la base de données avec les données par défaut"""
    
    try:
        from app.core.init_db import (
            create_default_admin,
            create_default_categories,
            create_sample_products,
            create_test_user
        )
        
        # Si force_reset, on peut ajouter une logique de reset
        if force_reset:
            # Note: En production, cette fonctionnalité devrait être désactivée
            pass
        
        # Initialiser les données
        admin_user = create_default_admin(db)
        test_user = create_test_user(db)
        categories = create_default_categories(db)
        products = create_sample_products(db, categories)
        
        return {
            "message": "Base de données initialisée avec succès",
            "data": {
                "admin_created": admin_user.email,
                "test_user_created": test_user.email,
                "categories_count": len(categories),
                "products_count": len(products)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'initialisation : {str(e)}"
        )


# ================================
# DASHBOARD - VUE D'ENSEMBLE
# ================================

@router.get("/dashboard")
async def admin_dashboard(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Dashboard principal de l'administration"""
    
    # Période de référence (30 derniers jours)
    start_date = datetime.utcnow() - timedelta(days=30)
    
    # Statistiques générales
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).filter(Order.created_at >= start_date).scalar() or 0
    
    # Chiffre d'affaires
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        and_(
            Order.created_at >= start_date,
            Order.payment_status == PaymentStatus.PAID
        )
    ).scalar() or 0
    
    # Commandes récentes
    recent_orders = (
        db.query(Order)
        .join(User)
        .order_by(desc(Order.created_at))
        .limit(5)
        .all()
    )
    
    # Produits à stock faible
    low_stock_products = (
        db.query(Product)
        .filter(
            and_(
                Product.track_inventory == True,
                Product.stock_quantity <= 10,
                Product.is_active == True
            )
        )
        .limit(10)
        .all()
    )
    
    # Messages chat non lus
    unread_messages = db.query(func.count(ChatMessage.id)).filter(
        ChatMessage.is_read == False
    ).scalar() or 0
    
    return {
        "overview": {
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "unread_messages": unread_messages
        },
        "recent_orders": [
            {
                "id": order.id,
                "order_number": order.order_number,
                "customer_name": f"{order.user.first_name} {order.user.last_name}",
                "total_amount": float(order.total_amount),
                "status": order.status.value,
                "created_at": order.created_at.isoformat()
            }
            for order in recent_orders
        ],
        "low_stock_products": [
            {
                "id": product.id,
                "name": product.name,
                "stock_quantity": product.stock_quantity,
                "price": float(product.price)
            }
            for product in low_stock_products
        ]
    }


# ================================
# GESTION DES PRODUITS
# ================================

@router.get("/products")
async def admin_list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    category_id: int = Query(None),
    is_active: bool = Query(None),
    low_stock: bool = Query(False),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Liste des produits avec filtres pour l'admin"""
    
    query = db.query(Product)
    
    # Filtres
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%")
            )
        )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    if low_stock:
        query = query.filter(
            and_(
                Product.track_inventory == True,
                Product.stock_quantity <= 10
            )
        )
    
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [
            {
                "id": product.id,
                "name": product.name,
                "price": float(product.price),
                "stock_quantity": product.stock_quantity,
                "is_active": product.is_active,
                "sales_count": product.sales_count,
                "view_count": product.view_count,
                "category": product.category.name if product.category else None,
                "main_image_url": product.main_image_url
            }
            for product in products
        ]
    }


@router.post("/products")
async def admin_create_product(
    name: str = Form(...),
    description: str = Form(None),
    short_description: str = Form(None),
    price: float = Form(...),
    compare_at_price: float = Form(None),
    cost_price: float = Form(None),
    stock_quantity: int = Form(0),
    track_inventory: bool = Form(True),
    allow_backorder: bool = Form(False),
    product_type: str = Form("physical"),
    is_subscription: bool = Form(False),
    category_id: int = Form(None),
    is_active: bool = Form(True),
    is_featured: bool = Form(False),
    meta_title: str = Form(None),
    meta_description: str = Form(None),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Créer un nouveau produit"""
    
    # Générer le slug
    slug = name.lower().replace(" ", "-").replace("'", "")
    
    # Vérifier l'unicité du slug
    existing = db.query(Product).filter(Product.slug == slug).first()
    if existing:
        slug = f"{slug}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    product = Product(
        name=name,
        description=description,
        short_description=short_description,
        slug=slug,
        price=price,
        compare_at_price=compare_at_price,
        cost_price=cost_price,
        stock_quantity=stock_quantity,
        track_inventory=track_inventory,
        allow_backorder=allow_backorder,
        product_type=product_type,
        is_subscription=is_subscription,
        category_id=category_id,
        is_active=is_active,
        is_featured=is_featured,
        meta_title=meta_title,
        meta_description=meta_description
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return {
        "message": "Produit créé avec succès",
        "product": {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "price": float(product.price)
        }
    }


@router.put("/products/{product_id}")
async def admin_update_product(
    product_id: int,
    name: str = Form(None),
    description: str = Form(None),
    short_description: str = Form(None),
    price: float = Form(None),
    compare_at_price: float = Form(None),
    cost_price: float = Form(None),
    stock_quantity: int = Form(None),
    track_inventory: bool = Form(None),
    allow_backorder: bool = Form(None),
    product_type: str = Form(None),
    is_subscription: bool = Form(None),
    category_id: int = Form(None),
    is_active: bool = Form(None),
    is_featured: bool = Form(None),
    meta_title: str = Form(None),
    meta_description: str = Form(None),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour un produit"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    # Mettre à jour les champs modifiés
    if name is not None:
        product.name = name
        # Regénérer le slug si le nom change
        new_slug = name.lower().replace(" ", "-").replace("'", "")
        if new_slug != product.slug:
            existing = db.query(Product).filter(
                and_(Product.slug == new_slug, Product.id != product_id)
            ).first()
            if not existing:
                product.slug = new_slug
    
    if description is not None:
        product.description = description
    if short_description is not None:
        product.short_description = short_description
    if price is not None:
        product.price = price
    if compare_at_price is not None:
        product.compare_at_price = compare_at_price
    if cost_price is not None:
        product.cost_price = cost_price
    if stock_quantity is not None:
        product.stock_quantity = stock_quantity
    if track_inventory is not None:
        product.track_inventory = track_inventory
    if allow_backorder is not None:
        product.allow_backorder = allow_backorder
    if product_type is not None:
        product.product_type = product_type
    if is_subscription is not None:
        product.is_subscription = is_subscription
    if category_id is not None:
        product.category_id = category_id
    if is_active is not None:
        product.is_active = is_active
    if is_featured is not None:
        product.is_featured = is_featured
    if meta_title is not None:
        product.meta_title = meta_title
    if meta_description is not None:
        product.meta_description = meta_description
    
    product.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Produit mis à jour avec succès"}


@router.delete("/products/{product_id}")
async def admin_delete_product(
    product_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Supprimer un produit"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    # Vérifier s'il y a des commandes associées
    order_items = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
    if order_items:
        raise HTTPException(
            status_code=400, 
            detail="Impossible de supprimer un produit avec des commandes associées"
        )
    
    db.delete(product)
    db.commit()
    
    return {"message": "Produit supprimé avec succès"}


# ================================
# GESTION DES COMMANDES
# ================================

@router.get("/orders")
async def admin_list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: OrderStatus = Query(None),
    payment_status: PaymentStatus = Query(None),
    search: str = Query(None),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Liste des commandes avec filtres"""
    
    query = db.query(Order).join(User)
    
    # Filtres
    if status:
        query = query.filter(Order.status == status)
    
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    
    if search:
        query = query.filter(
            or_(
                Order.order_number.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "orders": [
            {
                "id": order.id,
                "order_number": order.order_number,
                "customer": {
                    "id": order.user.id,
                    "name": f"{order.user.first_name} {order.user.last_name}",
                    "email": order.user.email
                },
                "total_amount": float(order.total_amount),
                "status": order.status.value,
                "payment_status": order.payment_status.value,
                "created_at": order.created_at.isoformat(),
                "items_count": len(order.items)
            }
            for order in orders
        ]
    }


@router.get("/orders/{order_id}")
async def admin_get_order(
    order_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Détails d'une commande"""
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer": {
            "id": order.user.id,
            "name": f"{order.user.first_name} {order.user.last_name}",
            "email": order.user.email,
            "phone": order.user.phone
        },
        "status": order.status.value,
        "payment_status": order.payment_status.value,
        "amounts": {
            "subtotal": float(order.subtotal),
            "tax_amount": float(order.tax_amount),
            "shipping_amount": float(order.shipping_amount),
            "discount_amount": float(order.discount_amount),
            "total_amount": float(order.total_amount)
        },
        "shipping_address": {
            "first_name": order.shipping_first_name,
            "last_name": order.shipping_last_name,
            "email": order.shipping_email,
            "phone": order.shipping_phone,
            "address_line1": order.shipping_address_line1,
            "address_line2": order.shipping_address_line2,
            "city": order.shipping_city,
            "postal_code": order.shipping_postal_code,
            "country": order.shipping_country
        },
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price),
                "product_image_url": item.product_image_url
            }
            for item in order.items
        ],
        "tracking": {
            "tracking_number": order.tracking_number,
            "tracking_url": order.tracking_url
        },
        "notes": order.notes,
        "admin_notes": order.admin_notes,
        "dates": {
            "created_at": order.created_at.isoformat(),
            "confirmed_at": order.confirmed_at.isoformat() if order.confirmed_at else None,
            "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
            "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None
        }
    }


@router.put("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: int,
    status: OrderStatus,
    tracking_number: str = None,
    tracking_url: str = None,
    admin_notes: str = None,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour le statut d'une commande"""
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    old_status = order.status
    order.status = status
    
    # Mettre à jour les dates selon le nouveau statut
    if status == OrderStatus.CONFIRMED and not order.confirmed_at:
        order.confirmed_at = datetime.utcnow()
    elif status == OrderStatus.SHIPPED and not order.shipped_at:
        order.shipped_at = datetime.utcnow()
    elif status == OrderStatus.DELIVERED and not order.delivered_at:
        order.delivered_at = datetime.utcnow()
    
    # Mettre à jour les informations de tracking
    if tracking_number:
        order.tracking_number = tracking_number
    if tracking_url:
        order.tracking_url = tracking_url
    if admin_notes:
        order.admin_notes = admin_notes
    
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": f"Statut mis à jour de {old_status.value} vers {status.value}",
        "order_id": order_id,
        "new_status": status.value
    }


# ================================
# GESTION DES UTILISATEURS
# ================================

@router.get("/users")
async def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    is_active: bool = Query(None),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Liste des utilisateurs"""
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%")
            )
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    total = query.count()
    users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_admin": user.is_admin,
                "created_at": user.created_at.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "orders_count": len(user.orders)
            }
            for user in users
        ]
    }


@router.put("/users/{user_id}/status")
async def admin_update_user_status(
    user_id: int,
    is_active: bool,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Activer/désactiver un utilisateur"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Impossible de modifier son propre statut")
    
    user.is_active = is_active
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": f"Utilisateur {'activé' if is_active else 'désactivé'}",
        "user_id": user_id
    }


# ================================
# UPLOAD DE MÉDIAS
# ================================

@router.post("/upload/product-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """Upload d'image de produit"""
    
    # Vérifier le type de fichier
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    # Vérifier la taille
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux")
    
    # Créer le dossier d'upload s'il n'existe pas
    upload_dir = Path(settings.UPLOAD_DIR) / "products"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Générer un nom unique pour le fichier
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_extension = file.filename.split(".")[-1].lower()
    filename = f"{timestamp}_{file.filename}"
    file_path = upload_dir / filename
    
    # Sauvegarder le fichier
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # URL relative du fichier
    file_url = f"/static/uploads/products/{filename}"
    
    return {
        "message": "Image uploadée avec succès",
        "filename": filename,
        "url": file_url,
        "size": file.size
    }


@router.put("/products/{product_id}/image")
async def update_product_image(
    product_id: int,
    image_url: str,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour l'image principale d'un produit"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    product.main_image_url = image_url
    product.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Image du produit mise à jour"}


# ================================
# STATISTIQUES AVANCÉES
# ================================

@router.get("/stats/revenue")
async def admin_revenue_stats(
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Statistiques de chiffre d'affaires"""
    
    # Définir la période
    periods = {
        "week": 7,
        "month": 30,
        "quarter": 90,
        "year": 365
    }
    
    days = periods[period]
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Évolution du CA par jour
    daily_revenue = []
    for i in range(days):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        day_revenue = db.query(func.sum(Order.total_amount)).filter(
            and_(
                func.date(Order.created_at) == day,
                Order.payment_status == PaymentStatus.PAID
            )
        ).scalar() or 0
        
        daily_revenue.append({
            "date": day.isoformat(),
            "revenue": float(day_revenue)
        })
    
    # CA total et comparaison avec période précédente
    total_revenue = sum(day["revenue"] for day in daily_revenue)
    
    # Période précédente pour comparaison
    prev_start = start_date - timedelta(days=days)
    prev_revenue = db.query(func.sum(Order.total_amount)).filter(
        and_(
            Order.created_at >= prev_start,
            Order.created_at < start_date,
            Order.payment_status == PaymentStatus.PAID
        )
    ).scalar() or 0
    
    growth_rate = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    
    return {
        "period": period,
        "total_revenue": float(total_revenue),
        "previous_period_revenue": float(prev_revenue),
        "growth_rate": round(growth_rate, 2),
        "daily_data": list(reversed(daily_revenue))  # Du plus ancien au plus récent
    }


@router.get("/stats/inventory")
async def admin_inventory_stats(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Statistiques d'inventaire"""
    
    # Stock total
    total_stock_value = db.query(
        func.sum(Product.stock_quantity * Product.cost_price)
    ).filter(
        and_(
            Product.track_inventory == True,
            Product.cost_price.isnot(None)
        )
    ).scalar() or 0
    
    # Produits par niveau de stock
    out_of_stock = db.query(func.count(Product.id)).filter(
        and_(
            Product.track_inventory == True,
            Product.stock_quantity == 0
        )
    ).scalar() or 0
    
    low_stock = db.query(func.count(Product.id)).filter(
        and_(
            Product.track_inventory == True,
            Product.stock_quantity > 0,
            Product.stock_quantity <= 10
        )
    ).scalar() or 0
    
    normal_stock = db.query(func.count(Product.id)).filter(
        and_(
            Product.track_inventory == True,
            Product.stock_quantity > 10
        )
    ).scalar() or 0
    
    # Produits les plus vendus ce mois
    start_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    
    top_selling = db.query(
        Product.id,
        Product.name,
        func.sum(OrderItem.quantity).label("sold_quantity")
    ).join(
        OrderItem, Product.id == OrderItem.product_id
    ).join(
        Order, OrderItem.order_id == Order.id
    ).filter(
        and_(
            Order.created_at >= start_month,
            Order.payment_status == PaymentStatus.PAID
        )
    ).group_by(
        Product.id, Product.name
    ).order_by(
        desc("sold_quantity")
    ).limit(10).all()
    
    return {
        "stock_summary": {
            "total_stock_value": float(total_stock_value),
            "out_of_stock": out_of_stock,
            "low_stock": low_stock,
            "normal_stock": normal_stock
        },
        "top_selling_this_month": [
            {
                "product_id": item.id,
                "product_name": item.name,
                "sold_quantity": int(item.sold_quantity)
            }
            for item in top_selling
        ]
    }


# ================================
# GESTION DES CATÉGORIES
# ================================

@router.get("/categories")
async def admin_list_categories(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Liste des catégories"""
    
    categories = db.query(Category).order_by(Category.sort_order).all()
    
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "slug": cat.slug,
                "is_active": cat.is_active,
                "sort_order": cat.sort_order,
                "products_count": len(cat.products)
            }
            for cat in categories
        ]
    }


@router.post("/categories")
async def admin_create_category(
    name: str,
    description: str = None,
    is_active: bool = True,
    sort_order: int = 0,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Créer une catégorie"""
    
    slug = name.lower().replace(" ", "-").replace("'", "")
    
    # Vérifier l'unicité
    existing = db.query(Category).filter(Category.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une catégorie avec ce nom existe déjà")
    
    category = Category(
        name=name,
        description=description,
        slug=slug,
        is_active=is_active,
        sort_order=sort_order
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {
        "message": "Catégorie créée avec succès",
        "category": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug
        }
    }
