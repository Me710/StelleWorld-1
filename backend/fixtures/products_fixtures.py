"""
Fixtures pour alimenter la base de données avec des produits de démonstration
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from slugify import slugify
import logging

# Import seulement après la création de toutes les tables
def get_models():
    from app.models.product import Product, Category
    return Product, Category

logger = logging.getLogger(__name__)

def create_categories(db: Session) -> dict:
    """Créer les catégories de base"""
    Product, Category = get_models()
    categories_data = [
        {
            "name": "Électronique",
            "description": "Smartphones, ordinateurs, accessoires high-tech",
            "slug": "electronique",
            "sort_order": 1,
            "is_active": True
        },
        {
            "name": "Vêtements",
            "description": "Mode femme, homme, enfant",
            "slug": "vetements", 
            "sort_order": 2,
            "is_active": True
        },
        {
            "name": "Livres",
            "description": "Romans, essais, bandes dessinées, manuels",
            "slug": "livres",
            "sort_order": 3,
            "is_active": True
        },
        {
            "name": "Maison & Jardin",
            "description": "Décoration, mobilier, jardinage",
            "slug": "maison-jardin",
            "sort_order": 4,
            "is_active": True
        },
        {
            "name": "Sports & Loisirs",
            "description": "Équipements sportifs, jeux, hobbies",
            "slug": "sports-loisirs",
            "sort_order": 5,
            "is_active": True
        }
    ]
    
    categories = {}
    for cat_data in categories_data:
        # Vérifier si la catégorie existe déjà
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
            db.commit()
            db.refresh(category)
            categories[cat_data["slug"]] = category
            logger.info(f"Catégorie créée: {category.name}")
        else:
            categories[cat_data["slug"]] = existing
            logger.info(f"Catégorie existante: {existing.name}")
    
    return categories

def create_products(db: Session, categories: dict):
    """Créer les produits de démonstration"""
    Product, Category = get_models()
    products_data = [
        # Électronique
        {
            "name": "iPhone 15 Pro Max 256GB",
            "short_description": "Le smartphone le plus avancé d'Apple avec puce A17 Pro",
            "description": "iPhone 15 Pro Max avec écran Super Retina XDR de 6,7 pouces, puce A17 Pro révolutionnaire, système de caméra Pro avec zoom 5x, et design en titane robuste mais léger.",
            "price": 1479.00,
            "compare_at_price": 1599.00,
            "stock_quantity": 25,
            "track_inventory": True,
            "is_featured": True,
            "is_active": True,
            "category": "electronique",
            "main_image_url": "/static/images/products/bestseller-1.jpg",
            "sales_count": 156,
            "view_count": 2340
        },
        {
            "name": "MacBook Air M3 13 pouces",
            "short_description": "Ordinateur portable ultra-fin avec puce M3",
            "description": "MacBook Air 13 pouces avec puce M3, écran Liquid Retina, jusqu'à 18h d'autonomie, design ultrafin et léger. Parfait pour le travail et les loisirs.",
            "price": 1299.00,
            "stock_quantity": 15,
            "track_inventory": True,
            "is_featured": True,
            "is_active": True,
            "category": "electronique",
            "main_image_url": "/static/images/products/bestseller-2.jpg",
            "sales_count": 89,
            "view_count": 1890
        },
        {
            "name": "Samsung Galaxy S24 Ultra",
            "short_description": "Smartphone Android premium avec S Pen intégré",
            "description": "Galaxy S24 Ultra avec écran Dynamic AMOLED 2X de 6,8 pouces, processeur Snapdragon 8 Gen 3, système quad caméra 200MP, et S Pen intégré pour une productivité maximale.",
            "price": 1199.00,
            "compare_at_price": 1299.00,
            "stock_quantity": 32,
            "track_inventory": True,
            "is_featured": True,
            "is_active": True,
            "category": "electronique",
            "main_image_url": "/static/images/products/bestseller-3.jpg",
            "sales_count": 134,
            "view_count": 2150
        },
        {
            "name": "Sony WH-1000XM5",
            "short_description": "Casque sans fil à réduction de bruit active",
            "description": "Casque wireless premium avec la meilleure réduction de bruit du marché, son haute résolution, 30h d'autonomie et confort exceptionnel pour les longs trajets.",
            "price": 399.00,
            "compare_at_price": 449.00,
            "stock_quantity": 45,
            "track_inventory": True,
            "is_featured": True,
            "is_active": True,
            "category": "electronique",
            "main_image_url": "/static/images/products/bestseller-4.jpg",
            "sales_count": 267,
            "view_count": 3240
        },
        {
            "name": "iPad Pro 12.9 M2",
            "short_description": "Tablette professionnelle avec puce M2",
            "description": "iPad Pro 12.9 pouces avec puce M2, écran Liquid Retina XDR, compatibilité Apple Pencil et Magic Keyboard. L'outil parfait pour les créatifs.",
            "price": 1179.00,
            "stock_quantity": 18,
            "track_inventory": True,
            "is_active": True,
            "category": "electronique",
            "sales_count": 73,
            "view_count": 1456
        },
        {
            "name": "Dell XPS 13 Plus",
            "short_description": "Ultrabook Windows haut de gamme",
            "description": "Dell XPS 13 Plus avec processeur Intel Core i7, 16GB RAM, SSD 512GB, écran OLED 13,4 pouces. Design moderne et performances exceptionnelles.",
            "price": 1599.00,
            "stock_quantity": 12,
            "track_inventory": True,
            "is_active": True,
            "category": "electronique",
            "sales_count": 45,
            "view_count": 987
        },
        
        # Vêtements
        {
            "name": "Nike Air Max 270",
            "short_description": "Sneakers lifestyle avec amorti Air Max",
            "description": "Baskets Nike Air Max 270 avec la plus grande unité Air Max jamais créée, offrant un confort exceptionnel et un style moderne pour tous les jours.",
            "price": 159.00,
            "compare_at_price": 179.00,
            "stock_quantity": 67,
            "track_inventory": True,
            "is_active": True,
            "category": "vetements",
            "sales_count": 203,
            "view_count": 2890
        },
        {
            "name": "Levi's 501 Original",
            "short_description": "Jean iconique coupe droite",
            "description": "Le jean Levi's 501 Original, coupe droite classique, en denim 100% coton. Un indémodable du vestiaire masculin depuis 1873.",
            "price": 89.00,
            "stock_quantity": 124,
            "track_inventory": True,
            "is_active": True,
            "category": "vetements",
            "sales_count": 156,
            "view_count": 1678
        },
        
        # Livres
        {
            "name": "Dune - Frank Herbert",
            "short_description": "Chef-d'œuvre de la science-fiction",
            "description": "Le roman culte de Frank Herbert qui a révolutionné la science-fiction. Une épopée spatiale dans un univers désertique où l'épice contrôle le destin des peuples.",
            "price": 12.90,
            "stock_quantity": 89,
            "track_inventory": True,
            "is_active": True,
            "category": "livres",
            "sales_count": 234,
            "view_count": 1456
        },
        {
            "name": "L'Étranger - Albert Camus",
            "short_description": "Roman emblématique de la littérature française",
            "description": "Roman philosophique d'Albert Camus publié en 1942. Une œuvre majeure de la littérature du XXe siècle qui explore l'absurdité de la condition humaine.",
            "price": 8.50,
            "stock_quantity": 156,
            "track_inventory": True,
            "is_active": True,
            "category": "livres",
            "sales_count": 187,
            "view_count": 1089
        },
        
        # Maison & Jardin
        {
            "name": "Philips Hue Kit de Démarrage",
            "short_description": "Éclairage connecté intelligent",
            "description": "Kit de démarrage Philips Hue avec 3 ampoules LED connectées et pont de connexion. Contrôlez votre éclairage depuis votre smartphone.",
            "price": 179.00,
            "compare_at_price": 199.00,
            "stock_quantity": 34,
            "track_inventory": True,
            "is_active": True,
            "category": "maison-jardin",
            "sales_count": 92,
            "view_count": 1345
        },
        {
            "name": "Dyson V15 Detect",
            "short_description": "Aspirateur sans fil haute performance",
            "description": "Aspirateur sans fil Dyson V15 Detect avec technologie de détection laser, écran LCD et jusqu'à 60 minutes d'autonomie. Le nettoyage nouvelle génération.",
            "price": 649.00,
            "compare_at_price": 699.00,
            "stock_quantity": 23,
            "track_inventory": True,
            "is_featured": True,
            "is_active": True,
            "category": "maison-jardin",
            "sales_count": 67,
            "view_count": 1678
        },
        
        # Sports & Loisirs
        {
            "name": "PlayStation 5",
            "short_description": "Console de jeu nouvelle génération",
            "description": "Console PlayStation 5 avec processeur AMD Zen 2, GPU RDNA 2, SSD ultra-rapide et manette DualSense avec retour haptique. L'avenir du gaming.",
            "price": 549.00,
            "stock_quantity": 8,
            "track_inventory": True,
            "is_featured": True,
            "is_active": True,
            "category": "sports-loisirs",
            "sales_count": 245,
            "view_count": 4567
        },
        {
            "name": "Nintendo Switch OLED",
            "short_description": "Console portable/salon avec écran OLED",
            "description": "Nintendo Switch modèle OLED avec écran 7 pouces vibrant, 64GB de stockage interne, station d'accueil améliorée et haut-parleurs optimisés.",
            "price": 349.00,
            "stock_quantity": 45,
            "track_inventory": True,
            "is_active": True,
            "category": "sports-loisirs",
            "sales_count": 189,
            "view_count": 2345
        },
        
        # Produits supplémentaires pour tester le scroll infini
        {
            "name": "Microsoft Surface Laptop 5",
            "short_description": "Ordinateur portable premium Windows 11",
            "description": "Surface Laptop 5 avec processeur Intel Core i7, écran tactile 13.5 pouces, design élégant et performance professionnelle.",
            "price": 1399.00,
            "stock_quantity": 28,
            "track_inventory": True,
            "is_active": True,
            "category": "electronique",
            "sales_count": 67,
            "view_count": 1234
        },
        {
            "name": "AirPods Pro 2ème génération",
            "short_description": "Écouteurs sans fil avec réduction de bruit active",
            "description": "AirPods Pro avec puce H2, réduction de bruit adaptative, audio spatial personnalisé et jusqu'à 6h d'écoute.",
            "price": 279.00,
            "compare_at_price": 299.00,
            "stock_quantity": 78,
            "track_inventory": True,
            "is_featured": True,
            "is_active": True,
            "category": "electronique",
            "sales_count": 234,
            "view_count": 3456
        },
        {
            "name": "Zara Manteau Long Femme",
            "short_description": "Manteau élégant en laine mélangée",
            "description": "Manteau long en laine mélangée, coupe moderne, doublure intérieure, parfait pour les saisons froides.",
            "price": 129.00,
            "compare_at_price": 159.00,
            "stock_quantity": 45,
            "track_inventory": True,
            "is_active": True,
            "category": "vetements",
            "sales_count": 89,
            "view_count": 1567
        },
        {
            "name": "Adidas Ultraboost 23",
            "short_description": "Chaussures de running haute performance",
            "description": "Ultraboost 23 avec technologie Boost, tige Primeknit+, semelle Continental pour une foulée exceptionnelle.",
            "price": 189.00,
            "stock_quantity": 67,
            "track_inventory": True,
            "is_active": True,
            "category": "vetements",
            "sales_count": 145,
            "view_count": 2890
        },
        {
            "name": "Le Seigneur des Anneaux - Coffret",
            "short_description": "Trilogie complète de J.R.R. Tolkien",
            "description": "Coffret collector de la trilogie du Seigneur des Anneaux, édition reliée avec illustrations et cartes.",
            "price": 45.90,
            "stock_quantity": 123,
            "track_inventory": True,
            "is_active": True,
            "category": "livres",
            "sales_count": 278,
            "view_count": 1890
        },
        {
            "name": "Nespresso Vertuo Next",
            "short_description": "Machine à café à capsules dernière génération",
            "description": "Machine Nespresso Vertuo Next avec extraction centrifuge, Wi-Fi intégré, design compact et élégant.",
            "price": 179.00,
            "compare_at_price": 199.00,
            "stock_quantity": 34,
            "track_inventory": True,
            "is_active": True,
            "category": "maison-jardin",
            "sales_count": 156,
            "view_count": 2345
        },
        {
            "name": "LEGO Creator Expert",
            "short_description": "Set de construction avancé 18+ ans",
            "description": "Set LEGO Creator Expert avec plus de 2000 pièces, instructions détaillées, parfait pour les adultes passionnés.",
            "price": 149.00,
            "stock_quantity": 23,
            "track_inventory": True,
            "is_active": True,
            "category": "sports-loisirs",
            "sales_count": 98,
            "view_count": 1456
        }
    ]
    
    for product_data in products_data:
        # Extraire la catégorie
        category_slug = product_data.pop("category")
        category = categories.get(category_slug)
        
        if not category:
            logger.warning(f"Catégorie {category_slug} non trouvée pour le produit {product_data['name']}")
            continue
        
        # Vérifier si le produit existe déjà
        slug = slugify(product_data["name"])
        existing = db.query(Product).filter(Product.slug == slug).first()
        
        if not existing:
            product = Product(
                **product_data,
                slug=slug,
                category_id=category.id
            )
            
            # Les propriétés calculées comme discount_percentage sont automatiques
            
            db.add(product)
            db.commit()
            db.refresh(product)
            logger.info(f"Produit créé: {product.name} - {product.price}€")
        else:
            logger.info(f"Produit existant: {existing.name}")

def load_fixtures():
    """Charger toutes les fixtures"""
    db = SessionLocal()
    try:
        logger.info("Début du chargement des fixtures...")
        
        # Créer les catégories
        categories = create_categories(db)
        logger.info(f"{len(categories)} catégories traitées")
        
        # Créer les produits
        create_products(db, categories)
        logger.info("Produits créés avec succès")
        
        logger.info("Fixtures chargées avec succès!")
        
    except Exception as e:
        logger.error(f"Erreur lors du chargement des fixtures: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # Configuration du logging
    logging.basicConfig(level=logging.INFO)
    load_fixtures()
