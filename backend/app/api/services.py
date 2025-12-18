"""
Endpoints pour la gestion des services (rendez-vous extensibles)
Respecte le principe Open/Closed de SOLID
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from slugify import slugify
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.service import Service, ServiceCategory, ServiceAvailability, ServiceAddon

router = APIRouter()


# =====================
# PUBLIC ENDPOINTS
# =====================

@router.get("/categories")
async def get_service_categories(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les catégories de services actives"""
    
    categories = (
        db.query(ServiceCategory)
        .filter(ServiceCategory.is_active == True)
        .order_by(ServiceCategory.sort_order, ServiceCategory.name)
        .all()
    )
    
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "description": cat.description,
                "icon": cat.icon,
                "color": cat.color,
                "service_count": len([s for s in cat.services if s.is_active])
            }
            for cat in categories
        ]
    }


@router.get("/")
async def get_services(
    category_id: Optional[int] = None,
    featured_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir la liste des services actifs"""
    
    query = db.query(Service).filter(Service.is_active == True)
    
    if category_id:
        query = query.filter(Service.category_id == category_id)
    
    if featured_only:
        query = query.filter(Service.is_featured == True)
    
    total = query.count()
    services = query.order_by(Service.booking_count.desc()).offset(skip).limit(limit).all()
    
    return {
        "services": [
            {
                "id": service.id,
                "name": service.name,
                "slug": service.slug,
                "short_description": service.short_description,
                "duration_minutes": service.duration_minutes,
                "price": service.price,
                "compare_at_price": service.compare_at_price,
                "discount_percentage": service.discount_percentage,
                "main_image_url": service.main_image_url,
                "location_type": service.location_type,
                "can_be_at_home": service.can_be_at_home,
                "is_featured": service.is_featured,
                "category": {
                    "id": service.category.id,
                    "name": service.category.name,
                    "slug": service.category.slug
                } if service.category else None,
                "booking_count": service.booking_count
            }
            for service in services
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{service_id}")
async def get_service(
    service_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les détails d'un service"""
    
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.is_active == True
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    
    # Incrémenter le compteur de vues
    service.view_count += 1
    db.commit()
    
    # Récupérer les add-ons
    addons = (
        db.query(ServiceAddon)
        .filter(ServiceAddon.service_id == service_id, ServiceAddon.is_active == True)
        .all()
    )
    
    # Récupérer les disponibilités
    availabilities = (
        db.query(ServiceAvailability)
        .filter(ServiceAvailability.service_id == service_id, ServiceAvailability.is_active == True)
        .order_by(ServiceAvailability.day_of_week)
        .all()
    )
    
    return {
        "id": service.id,
        "name": service.name,
        "slug": service.slug,
        "description": service.description,
        "short_description": service.short_description,
        "duration_minutes": service.duration_minutes,
        "buffer_time_minutes": service.buffer_time_minutes,
        "max_participants": service.max_participants,
        "price": service.price,
        "compare_at_price": service.compare_at_price,
        "discount_percentage": service.discount_percentage,
        "deposit_amount": service.required_deposit,
        "main_image_url": service.main_image_url,
        "gallery_images": service.gallery_images,
        "location_type": service.location_type,
        "default_location": service.default_location,
        "can_be_at_home": service.can_be_at_home,
        "home_service_fee": service.home_service_fee,
        "min_booking_notice_hours": service.min_booking_notice_hours,
        "max_booking_advance_days": service.max_booking_advance_days,
        "cancellation_notice_hours": service.cancellation_notice_hours,
        "requires_approval": service.requires_approval,
        "is_featured": service.is_featured,
        "category": {
            "id": service.category.id,
            "name": service.category.name,
            "slug": service.category.slug
        } if service.category else None,
        "addons": [
            {
                "id": addon.id,
                "name": addon.name,
                "description": addon.description,
                "price": addon.price,
                "duration_minutes": addon.duration_minutes,
                "is_required": addon.is_required
            }
            for addon in addons
        ],
        "availabilities": [
            {
                "day_of_week": avail.day_of_week,
                "start_time": avail.start_time,
                "end_time": avail.end_time
            }
            for avail in availabilities
        ],
        "booking_count": service.booking_count,
        "view_count": service.view_count
    }


# =====================
# ADMIN ENDPOINTS
# =====================

@router.get("/admin/all", dependencies=[Depends(get_current_admin_user)])
async def get_all_services_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir tous les services (Admin)"""
    
    query = db.query(Service)
    
    if category_id:
        query = query.filter(Service.category_id == category_id)
    
    if is_active is not None:
        query = query.filter(Service.is_active == is_active)
    
    total = query.count()
    services = query.order_by(Service.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "services": [
            {
                "id": service.id,
                "name": service.name,
                "slug": service.slug,
                "duration_minutes": service.duration_minutes,
                "price": service.price,
                "is_active": service.is_active,
                "is_featured": service.is_featured,
                "category_name": service.category.name if service.category else None,
                "booking_count": service.booking_count,
                "created_at": service.created_at
            }
            for service in services
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/admin", dependencies=[Depends(get_current_admin_user)])
async def create_service(
    name: str,
    price: float,
    duration_minutes: int = 60,
    description: Optional[str] = None,
    short_description: Optional[str] = None,
    category_id: Optional[int] = None,
    location_type: str = "office",
    can_be_at_home: bool = False,
    home_service_fee: float = 0,
    is_featured: bool = False,
    main_image_url: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Créer un nouveau service (Admin)"""
    
    # Générer le slug
    base_slug = slugify(name)
    slug = base_slug
    counter = 1
    while db.query(Service).filter(Service.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    service = Service(
        name=name,
        slug=slug,
        description=description,
        short_description=short_description,
        category_id=category_id,
        duration_minutes=duration_minutes,
        price=price,
        location_type=location_type,
        can_be_at_home=can_be_at_home,
        home_service_fee=home_service_fee,
        is_featured=is_featured,
        main_image_url=main_image_url,
        is_active=True
    )
    
    db.add(service)
    db.commit()
    db.refresh(service)
    
    return {
        "message": "Service créé avec succès",
        "service_id": service.id,
        "slug": service.slug
    }


@router.put("/admin/{service_id}", dependencies=[Depends(get_current_admin_user)])
async def update_service(
    service_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    short_description: Optional[str] = None,
    category_id: Optional[int] = None,
    duration_minutes: Optional[int] = None,
    price: Optional[float] = None,
    compare_at_price: Optional[float] = None,
    location_type: Optional[str] = None,
    can_be_at_home: Optional[bool] = None,
    home_service_fee: Optional[float] = None,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    main_image_url: Optional[str] = None,
    min_booking_notice_hours: Optional[int] = None,
    max_booking_advance_days: Optional[int] = None,
    cancellation_notice_hours: Optional[int] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour un service (Admin)"""
    
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    
    if name is not None:
        service.name = name
        service.slug = slugify(name)
    if description is not None:
        service.description = description
    if short_description is not None:
        service.short_description = short_description
    if category_id is not None:
        service.category_id = category_id
    if duration_minutes is not None:
        service.duration_minutes = duration_minutes
    if price is not None:
        service.price = price
    if compare_at_price is not None:
        service.compare_at_price = compare_at_price
    if location_type is not None:
        service.location_type = location_type
    if can_be_at_home is not None:
        service.can_be_at_home = can_be_at_home
    if home_service_fee is not None:
        service.home_service_fee = home_service_fee
    if is_active is not None:
        service.is_active = is_active
    if is_featured is not None:
        service.is_featured = is_featured
    if main_image_url is not None:
        service.main_image_url = main_image_url
    if min_booking_notice_hours is not None:
        service.min_booking_notice_hours = min_booking_notice_hours
    if max_booking_advance_days is not None:
        service.max_booking_advance_days = max_booking_advance_days
    if cancellation_notice_hours is not None:
        service.cancellation_notice_hours = cancellation_notice_hours
    
    service.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Service mis à jour avec succès"}


@router.delete("/admin/{service_id}", dependencies=[Depends(get_current_admin_user)])
async def delete_service(
    service_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Supprimer un service (Admin) - Désactivation soft"""
    
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    
    service.is_active = False
    db.commit()
    
    return {"message": "Service désactivé avec succès"}


# =====================
# CATEGORIES ADMIN
# =====================

@router.get("/admin/categories/all", dependencies=[Depends(get_current_admin_user)])
async def get_all_categories_admin(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir toutes les catégories de services (Admin)"""
    
    categories = (
        db.query(ServiceCategory)
        .order_by(ServiceCategory.sort_order, ServiceCategory.name)
        .all()
    )
    
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "description": cat.description,
                "icon": cat.icon,
                "color": cat.color,
                "sort_order": cat.sort_order,
                "is_active": cat.is_active,
                "service_count": len(cat.services)
            }
            for cat in categories
        ]
    }


@router.post("/admin/categories", dependencies=[Depends(get_current_admin_user)])
async def create_service_category(
    name: str,
    description: Optional[str] = None,
    icon: Optional[str] = None,
    color: Optional[str] = None,
    sort_order: int = 0,
    db: Session = Depends(get_db)
) -> Any:
    """Créer une catégorie de services (Admin)"""
    
    category = ServiceCategory(
        name=name,
        slug=slugify(name),
        description=description,
        icon=icon,
        color=color,
        sort_order=sort_order,
        is_active=True
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {
        "message": "Catégorie créée avec succès",
        "category_id": category.id
    }


@router.put("/admin/categories/{category_id}", dependencies=[Depends(get_current_admin_user)])
async def update_service_category(
    category_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    icon: Optional[str] = None,
    color: Optional[str] = None,
    sort_order: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour une catégorie (Admin)"""
    
    category = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    
    if name is not None:
        category.name = name
        category.slug = slugify(name)
    if description is not None:
        category.description = description
    if icon is not None:
        category.icon = icon
    if color is not None:
        category.color = color
    if sort_order is not None:
        category.sort_order = sort_order
    if is_active is not None:
        category.is_active = is_active
    
    db.commit()
    
    return {"message": "Catégorie mise à jour avec succès"}


# =====================
# ADDONS ADMIN
# =====================

@router.get("/admin/{service_id}/addons", dependencies=[Depends(get_current_admin_user)])
async def get_service_addons(
    service_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les add-ons d'un service (Admin)"""
    
    addons = db.query(ServiceAddon).filter(ServiceAddon.service_id == service_id).all()
    
    return {
        "addons": [
            {
                "id": addon.id,
                "name": addon.name,
                "description": addon.description,
                "price": addon.price,
                "duration_minutes": addon.duration_minutes,
                "is_active": addon.is_active,
                "is_required": addon.is_required
            }
            for addon in addons
        ]
    }


@router.post("/admin/{service_id}/addons", dependencies=[Depends(get_current_admin_user)])
async def create_service_addon(
    service_id: int,
    name: str,
    price: float = 0,
    duration_minutes: int = 0,
    description: Optional[str] = None,
    is_required: bool = False,
    db: Session = Depends(get_db)
) -> Any:
    """Créer un add-on pour un service (Admin)"""
    
    addon = ServiceAddon(
        service_id=service_id,
        name=name,
        description=description,
        price=price,
        duration_minutes=duration_minutes,
        is_required=is_required,
        is_active=True
    )
    
    db.add(addon)
    db.commit()
    db.refresh(addon)
    
    return {
        "message": "Add-on créé avec succès",
        "addon_id": addon.id
    }
