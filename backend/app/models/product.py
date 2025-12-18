"""
Modèles pour les produits et services
Implémentation du pattern Open/Closed (SOLID) avec héritage de table unique (Single Table Inheritance)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from abc import abstractmethod

from app.core.database import Base

# Table d'association pour les produits souvent achetés ensemble
product_combinations = Table(
    'product_combinations',
    Base.metadata,
    Column('product_id', Integer, ForeignKey('products.id'), primary_key=True),
    Column('related_product_id', Integer, ForeignKey('products.id'), primary_key=True)
)


class Category(Base):
    """
    Catégorie de produits - Classe de base extensible
    
    Utilise le pattern Single Table Inheritance de SQLAlchemy
    pour permettre l'extension avec des catégories spécialisées.
    
    Principe Open/Closed (SOLID):
    - Ouvert à l'extension: Nouvelles catégories peuvent hériter de cette classe
    - Fermé à la modification: Le code existant n'a pas besoin d'être modifié
    
    Pour créer une nouvelle catégorie spécialisée:
    
    class HairCategory(Category):
        __mapper_args__ = {"polymorphic_identity": "hair"}
        
        @property
        def category_specific_attribute(self):
            return self.custom_data.get("hair_type")
    """
    
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    slug = Column(String(100), unique=True, index=True)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Discriminateur pour le polymorphisme
    type = Column(String(50), default="base")
    
    # Données personnalisées (JSON) pour l'extensibilité
    custom_data = Column(Text, nullable=True)  # JSON: {"key": "value", ...}
    
    # Configuration visuelle
    icon = Column(String(50), nullable=True)  # Nom de l'icône
    color = Column(String(20), nullable=True)  # Couleur hex
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    products = relationship("Product", back_populates="category")
    
    # Configuration du polymorphisme
    __mapper_args__ = {
        "polymorphic_on": type,
        "polymorphic_identity": "base"
    }
    
    def get_display_name(self) -> str:
        """Nom d'affichage - peut être surchargé par les sous-classes"""
        return self.name
    
    def get_custom_value(self, key: str, default=None):
        """Récupérer une valeur des données personnalisées"""
        if self.custom_data:
            import json
            try:
                data = json.loads(self.custom_data)
                return data.get(key, default)
            except:
                return default
        return default
    
    def set_custom_value(self, key: str, value):
        """Définir une valeur dans les données personnalisées"""
        import json
        data = {}
        if self.custom_data:
            try:
                data = json.loads(self.custom_data)
            except:
                pass
        data[key] = value
        self.custom_data = json.dumps(data)


# === Catégories Spécialisées (Exemples d'extension) ===

class HairCategory(Category):
    """
    Catégorie spécialisée pour les produits capillaires (mèches, extensions)
    Hérite de Category - Démonstration du principe Open/Closed
    """
    
    __mapper_args__ = {
        "polymorphic_identity": "hair"
    }
    
    @property
    def hair_types(self) -> list:
        """Types de cheveux disponibles dans cette catégorie"""
        return self.get_custom_value("hair_types", [])
    
    @property
    def lengths_available(self) -> list:
        """Longueurs disponibles"""
        return self.get_custom_value("lengths", [])
    
    @property
    def textures_available(self) -> list:
        """Textures disponibles (lisse, ondulé, bouclé, etc.)"""
        return self.get_custom_value("textures", [])


class SkinCareCategory(Category):
    """
    Catégorie spécialisée pour les produits de soin de la peau
    """
    
    __mapper_args__ = {
        "polymorphic_identity": "skincare"
    }
    
    @property
    def skin_types(self) -> list:
        """Types de peau ciblés"""
        return self.get_custom_value("skin_types", [])
    
    @property
    def concerns(self) -> list:
        """Préoccupations ciblées (acné, rides, hydratation, etc.)"""
        return self.get_custom_value("concerns", [])
    
    @property
    def ingredients(self) -> list:
        """Ingrédients clés mis en avant"""
        return self.get_custom_value("key_ingredients", [])


class Product(Base):
    """Modèle produit/service"""
    
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    slug = Column(String(200), unique=True, index=True)
    
    # Prix et stock
    price = Column(Float, nullable=False)
    compare_at_price = Column(Float, nullable=True)  # Prix barré
    cost_price = Column(Float, nullable=True)  # Prix d'achat
    
    # Gestion du stock
    stock_quantity = Column(Integer, default=0)
    track_inventory = Column(Boolean, default=True)
    allow_backorder = Column(Boolean, default=False)
    
    # Type de produit
    product_type = Column(String(50), default="physical")  # physical, digital, service
    is_subscription = Column(Boolean, default=False)
    
    # SEO et visibilité
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Statistiques
    view_count = Column(Integer, default=0)
    sales_count = Column(Integer, default=0)
    
    # Médias
    main_image_url = Column(String(255), nullable=True)
    gallery_images = Column(Text, nullable=True)  # JSON des URLs d'images
    
    # Relations
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = relationship("Category", back_populates="products")
    
    # Produits souvent achetés ensemble
    related_products = relationship(
        "Product",
        secondary=product_combinations,
        primaryjoin=id == product_combinations.c.product_id,
        secondaryjoin=id == product_combinations.c.related_product_id,
        back_populates="related_by"
    )
    related_by = relationship(
        "Product",
        secondary=product_combinations,
        primaryjoin=id == product_combinations.c.related_product_id,
        secondaryjoin=id == product_combinations.c.product_id,
        back_populates="related_products"
    )
    
    order_items = relationship("OrderItem", back_populates="product")
    subscription_items = relationship("SubscriptionItem", back_populates="product")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def is_in_stock(self) -> bool:
        """Vérifier si le produit est en stock"""
        if not self.track_inventory:
            return True
        return self.stock_quantity > 0 or self.allow_backorder
    
    @property
    def discount_percentage(self) -> float:
        """Calculer le pourcentage de remise"""
        if self.compare_at_price and self.compare_at_price > self.price:
            return ((self.compare_at_price - self.price) / self.compare_at_price) * 100
        return 0
    
    def __repr__(self):
        return f"<Product {self.name}>"


class ProductVariant(Base):
    """Variantes de produit (taille, couleur, etc.)"""
    
    __tablename__ = "product_variants"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Attributs de variante
    name = Column(String(100), nullable=False)  # ex: "Rouge - XL"
    sku = Column(String(100), unique=True, nullable=True)
    
    # Prix spécifique (optionnel)
    price_adjustment = Column(Float, default=0)  # +/- par rapport au prix de base
    
    # Stock spécifique
    stock_quantity = Column(Integer, default=0)
    
    # Attributs
    color = Column(String(50), nullable=True)
    size = Column(String(50), nullable=True)
    material = Column(String(100), nullable=True)
    weight = Column(Float, nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    # Relations
    product = relationship("Product")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
