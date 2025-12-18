"""
Service Produits - Logique métier pour les produits
Principe Single Responsibility: Gère uniquement la logique des produits
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.services.base import BaseService, BaseRepository
from app.models.product import Product, Category


class ProductRepository(BaseRepository[Product]):
    """Repository spécialisé pour les produits"""
    
    def __init__(self, db: Session):
        super().__init__(db, Product)
    
    def get_by_slug(self, slug: str) -> Optional[Product]:
        return self.db.query(Product).filter(
            and_(Product.slug == slug, Product.is_active == True)
        ).first()
    
    def get_active(self, skip: int = 0, limit: int = 100) -> List[Product]:
        return self.db.query(Product).filter(
            Product.is_active == True
        ).offset(skip).limit(limit).all()
    
    def get_by_category(self, category_id: int) -> List[Product]:
        return self.db.query(Product).filter(
            and_(Product.category_id == category_id, Product.is_active == True)
        ).all()
    
    def get_featured(self, limit: int = 8) -> List[Product]:
        return self.db.query(Product).filter(
            and_(Product.is_active == True, Product.is_featured == True)
        ).order_by(Product.sales_count.desc()).limit(limit).all()
    
    def search(self, query: str) -> List[Product]:
        search_term = f"%{query}%"
        return self.db.query(Product).filter(
            and_(
                Product.is_active == True,
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )
        ).all()
    
    def get_low_stock(self, threshold: int = 10) -> List[Product]:
        return self.db.query(Product).filter(
            and_(
                Product.track_inventory == True,
                Product.stock_quantity <= threshold,
                Product.is_active == True
            )
        ).all()


class ProductService(BaseService):
    """
    Service métier pour les produits
    
    Responsabilités:
    - Logique de recherche et filtrage
    - Gestion du stock
    - Calcul des remises
    - Validation des données produit
    """
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.repository = ProductRepository(db)
    
    def get_product(self, product_id: int) -> Optional[Dict[str, Any]]:
        """Récupérer un produit avec ses détails"""
        product = self.repository.get_by_id(product_id)
        if not product or not product.is_active:
            return None
        
        # Incrémenter le compteur de vues
        product.view_count += 1
        self.db.commit()
        
        return self._serialize_product(product, full=True)
    
    def get_product_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Récupérer un produit par son slug"""
        product = self.repository.get_by_slug(slug)
        if not product:
            return None
        
        # Incrémenter le compteur de vues
        product.view_count += 1
        self.db.commit()
        
        return self._serialize_product(product, full=True)
    
    def get_products(
        self,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        featured_only: bool = False,
        in_stock_only: bool = False,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Récupérer les produits avec filtres"""
        
        query = self.db.query(Product).filter(Product.is_active == True)
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            ))
        
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
        
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        return {
            "products": [self._serialize_product(p) for p in products],
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total
        }
    
    def get_featured_products(self, limit: int = 8) -> List[Dict[str, Any]]:
        """Récupérer les produits en vedette"""
        products = self.repository.get_featured(limit)
        return [self._serialize_product(p) for p in products]
    
    def check_stock(self, product_id: int, quantity: int) -> Dict[str, Any]:
        """Vérifier la disponibilité du stock"""
        product = self.repository.get_by_id(product_id)
        if not product:
            return {"available": False, "reason": "Produit non trouvé"}
        
        if not product.is_active:
            return {"available": False, "reason": "Produit indisponible"}
        
        if not product.track_inventory:
            return {"available": True, "quantity_available": 999}
        
        if product.stock_quantity >= quantity:
            return {
                "available": True,
                "quantity_available": product.stock_quantity
            }
        
        if product.allow_backorder:
            return {
                "available": True,
                "backorder": True,
                "quantity_available": product.stock_quantity
            }
        
        return {
            "available": False,
            "reason": "Stock insuffisant",
            "quantity_available": product.stock_quantity
        }
    
    def update_stock(self, product_id: int, quantity_change: int) -> bool:
        """Mettre à jour le stock (positif = ajout, négatif = retrait)"""
        product = self.repository.get_by_id(product_id)
        if not product or not product.track_inventory:
            return False
        
        new_quantity = product.stock_quantity + quantity_change
        if new_quantity < 0 and not product.allow_backorder:
            return False
        
        product.stock_quantity = max(0, new_quantity)
        self.db.commit()
        
        self._log_action("STOCK_UPDATE", "Product", product_id)
        return True
    
    def increment_sales(self, product_id: int, quantity: int = 1) -> bool:
        """Incrémenter le compteur de ventes"""
        product = self.repository.get_by_id(product_id)
        if not product:
            return False
        
        product.sales_count += quantity
        self.db.commit()
        return True
    
    def calculate_discount(self, product: Product) -> float:
        """Calculer le pourcentage de remise"""
        if product.compare_at_price and product.compare_at_price > product.price:
            return ((product.compare_at_price - product.price) / product.compare_at_price) * 100
        return 0
    
    def validate(self, data: dict) -> bool:
        """Valider les données d'un produit"""
        required_fields = ["name", "price"]
        for field in required_fields:
            if field not in data:
                return False
        
        if data.get("price", 0) < 0:
            return False
        
        if data.get("stock_quantity", 0) < 0:
            return False
        
        return True
    
    def _serialize_product(self, product: Product, full: bool = False) -> Dict[str, Any]:
        """Sérialiser un produit en dictionnaire"""
        data = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "short_description": product.short_description,
            "price": product.price,
            "compare_at_price": product.compare_at_price,
            "discount_percentage": self.calculate_discount(product),
            "main_image_url": product.main_image_url,
            "is_in_stock": product.is_in_stock,
            "is_featured": product.is_featured,
            "category": {
                "id": product.category.id,
                "name": product.category.name,
                "slug": product.category.slug
            } if product.category else None,
            "sales_count": product.sales_count
        }
        
        if full:
            data.update({
                "description": product.description,
                "stock_quantity": product.stock_quantity if product.track_inventory else None,
                "track_inventory": product.track_inventory,
                "allow_backorder": product.allow_backorder,
                "product_type": product.product_type,
                "gallery_images": product.gallery_images,
                "view_count": product.view_count,
                "related_products": [
                    {
                        "id": r.id,
                        "name": r.name,
                        "slug": r.slug,
                        "price": r.price,
                        "main_image_url": r.main_image_url
                    }
                    for r in product.related_products[:5] if r.is_active
                ]
            })
        
        return data


# Factory function pour l'injection de dépendances
def get_product_service(db: Session) -> ProductService:
    """Factory pour créer une instance de ProductService"""
    return ProductService(db)
