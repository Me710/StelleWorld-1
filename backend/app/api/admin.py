"""
Endpoints d'administration pour la gestion du back-office
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from slugify import slugify

from app.core.database import get_db
from app.models.product import Product, Category

router = APIRouter()


# ========== CATEGORIES ADMIN ==========

@router.get("/categories")
async def get_all_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    include_inactive: bool = False,
    db: Session = Depends(get_db)
) -> Any:
    """Liste toutes les catégories pour l'admin"""
    
    query = db.query(Category)
    
    if not include_inactive:
        query = query.filter(Category.is_active == True)
    
    categories = (
        query
        .order_by(Category.sort_order, Category.name)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    total = query.count()
    
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "slug": cat.slug,
                "image_url": cat.image_url,
                "is_active": cat.is_active,
                "sort_order": cat.sort_order,
                "product_count": len([p for p in cat.products if p.is_active]),
                "created_at": cat.created_at,
                "updated_at": cat.updated_at
            }
            for cat in categories
        ],
        "total": total
    }


@router.post("/categories")
async def create_category(
    name: str,
    description: Optional[str] = None,
    image_url: Optional[str] = None,
    sort_order: int = 0,
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """Créer une nouvelle catégorie"""
    
    # Vérifier que le nom n'existe pas déjà
    existing = db.query(Category).filter(Category.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une catégorie avec ce nom existe déjà")
    
    # Créer le slug
    slug = slugify(name)
    
    # Vérifier l'unicité du slug
    slug_exists = db.query(Category).filter(Category.slug == slug).first()
    if slug_exists:
        slug = f"{slug}-{db.query(Category).count() + 1}"
    
    category = Category(
        name=name,
        description=description,
        slug=slug,
        image_url=image_url,
        sort_order=sort_order,
        is_active=is_active
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


@router.put("/categories/{category_id}")
async def update_category(
    category_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    image_url: Optional[str] = None,
    sort_order: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour une catégorie"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    
    if name is not None:
        # Vérifier que le nom n'existe pas déjà (sauf pour cette catégorie)
        existing = db.query(Category).filter(
            Category.name == name,
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Une catégorie avec ce nom existe déjà")
        
        category.name = name
        category.slug = slugify(name)
    
    if description is not None:
        category.description = description if description else None
    
    if image_url is not None:
        category.image_url = image_url if image_url else None
    
    if sort_order is not None:
        category.sort_order = sort_order
    
    if is_active is not None:
        category.is_active = is_active
    
    db.commit()
    
    return {"message": "Catégorie mise à jour avec succès"}


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Supprimer (désactiver) une catégorie"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    
    # Vérifier si la catégorie a des produits actifs
    active_products = [p for p in category.products if p.is_active]
    if active_products:
        raise HTTPException(
            status_code=400, 
            detail=f"Impossible de supprimer: {len(active_products)} produits actifs dans cette catégorie"
        )
    
    # Soft delete - désactiver au lieu de supprimer
    category.is_active = False
    db.commit()
    
    return {"message": "Catégorie supprimée avec succès"}


# ========== PRODUCTS ADMIN (complémentaires) ==========

@router.get("/products")
async def get_all_products_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    include_inactive: bool = True,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Liste tous les produits pour l'admin (incluant les inactifs)"""
    
    query = db.query(Product)
    
    if not include_inactive:
        query = query.filter(Product.is_active == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    
    total = query.count()
    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "short_description": p.short_description,
                "price": p.price,
                "compare_at_price": p.compare_at_price,
                "stock_quantity": p.stock_quantity,
                "main_image_url": p.main_image_url,
                "is_active": p.is_active,
                "is_featured": p.is_featured,
                "category": {
                    "id": p.category.id,
                    "name": p.category.name,
                    "slug": p.category.slug
                } if p.category else None,
                "sales_count": p.sales_count,
                "view_count": p.view_count,
                "created_at": p.created_at
            }
            for p in products
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/products/{product_id}/toggle-active")
async def toggle_product_active(
    product_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Activer/désactiver un produit"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    product.is_active = not product.is_active
    db.commit()
    
    return {
        "message": f"Produit {'activé' if product.is_active else 'désactivé'}",
        "is_active": product.is_active
    }


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    permanent: bool = False,
    db: Session = Depends(get_db)
) -> Any:
    """Supprimer un produit (soft delete par défaut)"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    if permanent:
        db.delete(product)
    else:
        product.is_active = False
    
    db.commit()
    
    return {"message": "Produit supprimé avec succès"}
