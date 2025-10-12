"""
Script d'initialisation de la base de données avec utilisateur admin par défaut
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
import logging

# Importer tous les modèles pour s'assurer qu'ils sont enregistrés
from app.models import user, product, order, subscription, appointment, chat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_default_admin(db: Session) -> "user.User":
    """Créer l'utilisateur administrateur par défaut"""
    
    # Vérifier si l'admin existe déjà
    existing_admin = db.query(user.User).filter(user.User.email == "admin@stelleworld.com").first()
    if existing_admin:
        logger.info("L'utilisateur administrateur existe déjà")
        return existing_admin
    
    # Créer l'admin par défaut
    admin_user = user.User(
        email="admin@stelleworld.com",
        first_name="Admin",
        last_name="StelleWorld",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_admin=True,
        is_verified=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    logger.info(f"Utilisateur administrateur créé : {admin_user.email}")
    return admin_user


def create_default_categories(db: Session) -> list:
    """Créer les catégories par défaut"""
    
    default_categories = [
        {
            "name": "Électronique",
            "description": "Smartphones, ordinateurs, accessoires high-tech",
            "slug": "electronique",
            "sort_order": 1
        },
        {
            "name": "Mode & Vêtements",
            "description": "Vêtements, chaussures, accessoires de mode",
            "slug": "mode-vetements",
            "sort_order": 2
        },
        {
            "name": "Maison & Jardin",
            "description": "Décoration, meubles, jardinage",
            "slug": "maison-jardin",
            "sort_order": 3
        },
        {
            "name": "Sport & Loisirs",
            "description": "Équipements sportifs, jeux, loisirs créatifs",
            "slug": "sport-loisirs",
            "sort_order": 4
        },
        {
            "name": "Services",
            "description": "Consultations, formations, services personnalisés",
            "slug": "services",
            "sort_order": 5
        }
    ]
    
    created_categories = []
    
    for cat_data in default_categories:
        # Vérifier si la catégorie existe déjà
        existing_cat = db.query(product.Category).filter(product.Category.slug == cat_data["slug"]).first()
        if existing_cat:
            logger.info(f"Catégorie '{cat_data['name']}' existe déjà")
            created_categories.append(existing_cat)
            continue
        
        category = product.Category(**cat_data)
        db.add(category)
        db.commit()
        db.refresh(category)
        
        created_categories.append(category)
        logger.info(f"Catégorie créée : {category.name}")
    
    return created_categories


def create_sample_products(db: Session, categories: list) -> list:
    """Créer quelques produits d'exemple"""
    
    if not categories:
        logger.warning("Aucune catégorie disponible pour créer des produits d'exemple")
        return []
    
    # Vérifier s'il y a déjà des produits
    existing_products_count = db.query(product.Product).count()
    if existing_products_count > 0:
        logger.info("Des produits existent déjà dans la base de données")
        return []
    
    sample_products = [
        {
            "name": "Smartphone Premium X1",
            "description": "Smartphone dernière génération avec écran OLED 6.7 pouces, appareil photo 108MP, 5G, 256GB de stockage.",
            "short_description": "Smartphone premium avec écran OLED et 5G",
            "slug": "smartphone-premium-x1",
            "price": 899.99,
            "compare_at_price": 999.99,
            "cost_price": 450.00,
            "stock_quantity": 25,
            "category_id": categories[0].id,  # Électronique
            "product_type": "physical",
            "is_active": True,
            "is_featured": True,
            "meta_title": "Smartphone Premium X1 - StelleWorld",
            "meta_description": "Découvrez le nouveau smartphone Premium X1 avec écran OLED, 5G et appareil photo professionnel."
        },
        {
            "name": "T-shirt Bio Coton",
            "description": "T-shirt en coton biologique 100%, coupe moderne, disponible en plusieurs coloris. Confort optimal et respect de l'environnement.",
            "short_description": "T-shirt en coton bio, coupe moderne",
            "slug": "tshirt-bio-coton",
            "price": 29.99,
            "compare_at_price": 39.99,
            "cost_price": 12.00,
            "stock_quantity": 150,
            "category_id": categories[1].id,  # Mode
            "product_type": "physical",
            "is_active": True,
            "is_featured": False,
            "meta_title": "T-shirt Bio Coton - Mode Durable",
            "meta_description": "T-shirt en coton biologique, confortable et éco-responsable."
        },
        {
            "name": "Consultation Marketing Digital",
            "description": "Consultation personnalisée d'1 heure avec un expert en marketing digital. Analyse de votre présence en ligne et recommandations stratégiques.",
            "short_description": "Consultation marketing digital avec expert",
            "slug": "consultation-marketing-digital",
            "price": 99.00,
            "cost_price": 30.00,
            "stock_quantity": 0,  # Service sans stock physique
            "track_inventory": False,
            "category_id": categories[4].id,  # Services
            "product_type": "service",
            "is_active": True,
            "is_featured": True,
            "meta_title": "Consultation Marketing Digital - Expert",
            "meta_description": "Boostez votre marketing digital avec nos experts. Consultation personnalisée et recommandations sur-mesure."
        },
        {
            "name": "Plante d'Intérieur Monstera",
            "description": "Magnifique Monstera Deliciosa, plante d'intérieur tendance. Pot en céramique inclus. Facile d'entretien et purifie l'air.",
            "short_description": "Plante Monstera avec pot en céramique",
            "slug": "plante-monstera",
            "price": 45.00,
            "cost_price": 18.00,
            "stock_quantity": 12,
            "category_id": categories[2].id,  # Maison & Jardin
            "product_type": "physical",
            "is_active": True,
            "is_featured": False,
            "meta_title": "Monstera Deliciosa - Plante d'Intérieur",
            "meta_description": "Belle plante Monstera pour décorer votre intérieur. Facile d'entretien et purifiante."
        }
    ]
    
    created_products = []
    
    for product_data in sample_products:
        prod = product.Product(**product_data)
        db.add(prod)
        db.commit()
        db.refresh(prod)
        
        created_products.append(prod)
        logger.info(f"Produit d'exemple créé : {prod.name}")
    
    return created_products


def create_test_user(db: Session) -> "user.User":
    """Créer un utilisateur de test"""
    
    # Vérifier si l'utilisateur de test existe déjà
    existing_user = db.query(user.User).filter(user.User.email == "user@stelleworld.com").first()
    if existing_user:
        logger.info("L'utilisateur de test existe déjà")
        return existing_user
    
    test_user = user.User(
        email="user@stelleworld.com",
        first_name="John",
        last_name="Doe",
        hashed_password=get_password_hash("user123"),
        is_active=True,
        is_admin=False,
        is_verified=True
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    logger.info(f"Utilisateur de test créé : {test_user.email}")
    return test_user


def init_database():
    """Initialiser la base de données avec les données par défaut"""
    
    logger.info("Début de l'initialisation de la base de données...")
    
    # Créer toutes les tables
    Base.metadata.create_all(bind=engine)
    logger.info("Tables de base de données créées")
    
    # Créer une session
    db = SessionLocal()
    
    try:
        # Créer l'utilisateur admin par défaut
        admin_user = create_default_admin(db)
        
        # Créer un utilisateur de test
        test_user = create_test_user(db)
        
        # Créer les catégories par défaut
        categories = create_default_categories(db)
        
        # Créer quelques produits d'exemple
        products = create_sample_products(db, categories)
        
        logger.info("🎉 Initialisation de la base de données terminée avec succès !")
        logger.info("=" * 60)
        logger.info("COMPTES CRÉÉS :")
        logger.info(f"📱 Admin : {admin_user.email} / admin123")
        logger.info(f"👤 User  : {test_user.email} / user123")
        logger.info("=" * 60)
        logger.info(f"📦 Catégories créées : {len(categories)}")
        logger.info(f"🛍️  Produits d'exemple : {len(products)}")
        logger.info("=" * 60)
        logger.info("🚀 Vous pouvez maintenant vous connecter à l'administration :")
        logger.info("   URL : http://localhost:8000/admin/login")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation : {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
