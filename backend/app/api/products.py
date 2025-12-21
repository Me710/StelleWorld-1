"""
Endpoints pour la gestion des produits et du catalogue
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.product import Product, Category
from app.models.user import User

router = APIRouter()


@router.get("/categories")
async def get_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir la liste des catégories"""
    
    categories = (
        db.query(Category)
        .filter(Category.is_active == True)
        .order_by(Category.sort_order, Category.name)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "slug": cat.slug,
                "image_url": cat.image_url,
                "product_count": len(cat.products)
            }
            for cat in categories
        ]
    }


@router.get("/")
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured_only: bool = False,
    in_stock_only: bool = False,
    on_promo: bool = False,
    sort_by: str = Query("created_at", regex="^(created_at|name|price|sales_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir la liste des produits avec filtres"""
    
    query = db.query(Product).filter(Product.is_active == True)
    
    # Filtres
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
            Product.short_description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if featured_only:
        query = query.filter(Product.is_featured == True)
    
    if in_stock_only:
        query = query.filter(
            or_(
                Product.track_inventory == False,
                Product.stock_quantity > 0
            )
        )
    
    if on_promo:
        query = query.filter(Product.compare_at_price != None)
    
    # Tri
    if sort_order == "desc":
        query = query.order_by(getattr(Product, sort_by).desc())
    else:
        query = query.order_by(getattr(Product, sort_by))
    
    # Pagination
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "products": [
            {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "short_description": product.short_description,
                "slug": product.slug,
                "price": product.price,
                "compare_at_price": product.compare_at_price,
                "discount_percentage": product.discount_percentage,
                "main_image_url": product.main_image_url,
                "is_in_stock": product.is_in_stock,
                "stock_quantity": product.stock_quantity if product.track_inventory else None,
                "is_featured": product.is_featured,
                "category": {
                    "id": product.category.id,
                    "name": product.category.name,
                    "slug": product.category.slug
                } if product.category else None,
                "sales_count": product.sales_count,
                "view_count": product.view_count
            }
            for product in products
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": skip + limit < total
    }


@router.get("/featured")
async def get_featured_products(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les produits mis en avant"""
    
    products = (
        db.query(Product)
        .filter(and_(Product.is_active == True, Product.is_featured == True))
        .order_by(Product.sales_count.desc(), Product.created_at.desc())
        .limit(limit)
        .all()
    )
    
    return {
        "featured_products": [
            {
                "id": product.id,
                "name": product.name,
                "short_description": product.short_description,
                "slug": product.slug,
                "price": product.price,
                "compare_at_price": product.compare_at_price,
                "discount_percentage": product.discount_percentage,
                "main_image_url": product.main_image_url,
                "is_in_stock": product.is_in_stock,
                "sales_count": product.sales_count
            }
            for product in products
        ]
    }


@router.get("/best-sellers")
async def get_best_sellers(
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les meilleures ventes"""
    
    products = (
        db.query(Product)
        .filter(Product.is_active == True)
        .order_by(Product.sales_count.desc())
        .limit(limit)
        .all()
    )
    
    return {
        "best_sellers": [
            {
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "price": product.price,
                "main_image_url": product.main_image_url,
                "sales_count": product.sales_count,
                "is_in_stock": product.is_in_stock
            }
            for product in products
        ]
    }


@router.get("/{product_id}")
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les détails d'un produit"""
    
    product = (
        db.query(Product)
        .filter(and_(Product.id == product_id, Product.is_active == True))
        .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    # Incrémenter le compteur de vues
    product.view_count += 1
    db.commit()
    
    # Produits recommandés (souvent achetés ensemble)
    related_products = [
        {
            "id": related.id,
            "name": related.name,
            "slug": related.slug,
            "price": related.price,
            "main_image_url": related.main_image_url,
            "is_in_stock": related.is_in_stock
        }
        for related in product.related_products[:5]
        if related.is_active
    ]
    
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "short_description": product.short_description,
        "slug": product.slug,
        "price": product.price,
        "compare_at_price": product.compare_at_price,
        "discount_percentage": product.discount_percentage,
        "stock_quantity": product.stock_quantity if product.track_inventory else None,
        "track_inventory": product.track_inventory,
        "allow_backorder": product.allow_backorder,
        "is_in_stock": product.is_in_stock,
        "product_type": product.product_type,
        "is_subscription": product.is_subscription,
        "main_image_url": product.main_image_url,
        "gallery_images": product.gallery_images,
        "is_featured": product.is_featured,
        "category": {
            "id": product.category.id,
            "name": product.category.name,
            "slug": product.category.slug
        } if product.category else None,
        "sales_count": product.sales_count,
        "view_count": product.view_count,
        "related_products": related_products,
        "meta_title": product.meta_title,
        "meta_description": product.meta_description,
        "created_at": product.created_at
    }


@router.get("/slug/{slug}")
async def get_product_by_slug(
    slug: str,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir un produit par son slug"""
    
    product = (
        db.query(Product)
        .filter(and_(Product.slug == slug, Product.is_active == True))
        .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    return await get_product(product.id, db)


# Endpoints d'administration

@router.post("/", dependencies=[Depends(get_current_admin_user)])
async def create_product(
    name: str,
    description: str = None,
    short_description: str = None,
    price: float = 0,
    category_id: int = None,
    stock_quantity: int = 0,
    track_inventory: bool = True,
    is_featured: bool = False,
    main_image_url: str = None,
    gallery_images: str = None,
    compare_at_price: float = None,
    db: Session = Depends(get_db)
) -> Any:
    """Créer un nouveau produit (Admin)"""
    
    from slugify import slugify
    
    product = Product(
        name=name,
        description=description,
        short_description=short_description,
        slug=slugify(name),
        price=price,
        category_id=category_id,
        stock_quantity=stock_quantity,
        track_inventory=track_inventory,
        is_featured=is_featured,
        main_image_url=main_image_url,
        gallery_images=gallery_images,
        compare_at_price=compare_at_price
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return {"message": "Produit créé avec succès", "product_id": product.id}


@router.put("/{product_id}", dependencies=[Depends(get_current_admin_user)])
async def update_product(
    product_id: int,
    name: str = None,
    description: str = None,
    short_description: str = None,
    price: float = None,
    stock_quantity: int = None,
    is_active: bool = None,
    is_featured: bool = None,
    main_image_url: str = None,
    gallery_images: str = None,
    compare_at_price: float = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour un produit (Admin)"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    if name is not None:
        product.name = name
        from slugify import slugify
        product.slug = slugify(name)
    if description is not None:
        product.description = description
    if short_description is not None:
        product.short_description = short_description
    if price is not None:
        product.price = price
    if stock_quantity is not None:
        product.stock_quantity = stock_quantity
    if is_active is not None:
        product.is_active = is_active
    if is_featured is not None:
        product.is_featured = is_featured
    if main_image_url is not None:
        product.main_image_url = main_image_url
    if gallery_images is not None:
        product.gallery_images = gallery_images
    if compare_at_price is not None:
        product.compare_at_price = compare_at_price
    
    db.commit()
    
    return {"message": "Produit mis à jour avec succès"}
