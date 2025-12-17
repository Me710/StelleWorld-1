"""
Script de seed data pour la base de données PostgreSQL
Créé les catégories (Mèches, Skin Care) et des produits de démonstration
"""

import sys
sys.path.insert(0, '/app/backend')

from app.core.database import SessionLocal, engine
from app.models.product import Category, Product
from app.models.hero_slider import HeroSlide, SiteSettings
from app.models.user import User
from app.core.security import get_password_hash
from slugify import slugify

def seed_data():
    """Insérer les données de démonstration"""
    
    db = SessionLocal()
    
    try:
        print("🌱 Début du seeding de la base de données...")
        
        # 1. Créer les catégories
        print("\n📂 Création des catégories...")
        
        categories_data = [
            {
                "name": "Mèches",
                "slug": "meches",
                "description": "M\u00e8ches de qualité premium pour tous les styles - Brésiliennes, Indiennes, Péruviennes",
                "image_url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop",
                "sort_order": 1
            },
            {
                "name": "Skin Care",
                "slug": "skin-care",
                "description": "Produits de soins professionnels pour une peau éclatante et saine",
                "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop",
                "sort_order": 2
            }
        ]
        
        categories = {}
        for cat_data in categories_data:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                category = Category(**cat_data)
                db.add(category)
                db.flush()
                categories[cat_data["slug"]] = category
                print(f"  ✅ Catégorie créée: {cat_data['name']}")
            else:
                categories[cat_data["slug"]] = existing
                print(f"  ⏭️  Catégorie existante: {cat_data['name']}")
        
        db.commit()
        
        # 2. Créer des produits
        print("\n🛍️  Création des produits...")
        
        products_data = [
            # Mèches
            {
                "name": "Mèches Brésiliennes Premium - Straight",
                "category_slug": "meches",
                "description": "Mèches 100% naturelles, texture lisse et soyeuse. Qualité premium pour un résultat professionnel qui dure. Peut être colorée, bouclée et stylée.",
                "short_description": "Mèches brésiliennes lisses, qualité premium",
                "price": 149.99,
                "compare_at_price": 199.99,
                "stock_quantity": 15,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop"
            },
            {
                "name": "Mèches Indiennes Ondulantes - Wave",
                "category_slug": "meches",
                "description": "Ondulations naturelles et durables. Texture douce et légère, facile à coiffer. Idéale pour un look glamour au quotidien.",
                "short_description": "Ondulations naturelles et élégantes",
                "price": 129.99,
                "compare_at_price": 169.99,
                "stock_quantity": 12,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop"
            },
            {
                "name": "Mèches Péruviennes Bouclées - Curly",
                "category_slug": "meches",
                "description": "Boucles définies et volumineuses. Texture luxueuse qui conserve sa forme naturellement. Parfait pour un style afro élégant.",
                "short_description": "Boucles volumineuses et définies",
                "price": 159.99,
                "stock_quantity": 8,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop"
            },
            {
                "name": "Mèches Deep Wave - Vagues Profondes",
                "category_slug": "meches",
                "description": "Vagues profondes et texturées pour un look naturel et sophistiqué. Densité exceptionnelle.",
                "short_description": "Vagues profondes et texturées",
                "price": 139.99,
                "stock_quantity": 10,
                "main_image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop"
            },
            # Skin Care
            {
                "name": "Sérum Vitamine C - Éclat Intense",
                "category_slug": "skin-care",
                "description": "Sérum puissant à la vitamine C pour illuminer le teint et réduire les taches pigmentaires. Formule antioxydante qui protège contre les radicaux libres.",
                "short_description": "Illumine le teint et réduit les taches",
                "price": 45.99,
                "stock_quantity": 30,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop"
            },
            {
                "name": "Crème Hydratante Luxe - Acide Hyaluronique",
                "category_slug": "skin-care",
                "description": "Hydratation intense 24h avec acide hyaluronique. Pénètre en profondeur pour une peau repulpée et éclatante. Convient à tous les types de peau.",
                "short_description": "Hydratation profonde et durable",
                "price": 59.99,
                "stock_quantity": 25,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop"
            },
            {
                "name": "Masque Purifiant au Charbon",
                "category_slug": "skin-care",
                "description": "Élimine les impuretés et resserre les pores. Formule détoxifiante au charbon actif pour une peau nette et matifiée.",
                "short_description": "Détoxifie et purifie en profondeur",
                "price": 34.99,
                "stock_quantity": 40,
                "main_image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop"
            },
            {
                "name": "Huile de Visage Régénérante - Bio",
                "category_slug": "skin-care",
                "description": "Mélange d'huiles précieuses bio pour nourrir et régénérer la peau. Anti-âge naturel, convient aux peaux sèches et matures.",
                "short_description": "Nourrit et régénère naturellement",
                "price": 49.99,
                "stock_quantity": 20,
                "main_image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop"
            },
            {
                "name": "Gel Nettoyant Doux - Tous types de peau",
                "category_slug": "skin-care",
                "description": "Nettoie en douceur sans dessécher. Formule sans savon qui respecte le pH naturel de la peau.",
                "short_description": "Nettoie en douceur, pH équilibré",
                "price": 24.99,
                "stock_quantity": 50,
                "main_image_url": "https://images.unsplash.com/photo-1556229010-aa31473a8e58?w=400&h=400&fit=crop"
            },
        ]
        
        for product_data in products_data:
            category_slug = product_data.pop("category_slug")
            product_data["slug"] = slugify(product_data["name"])
            product_data["category_id"] = categories[category_slug].id
            
            existing = db.query(Product).filter(Product.slug == product_data["slug"]).first()
            if not existing:
                product = Product(**product_data)
                db.add(product)
                print(f"  ✅ Produit créé: {product_data['name']}")
            else:
                print(f"  ⏭️  Produit existant: {product_data['name']}")
        
        db.commit()
        
        # 3. Créer les slides Hero
        print("\n🖼️  Création des slides hero...")
        
        slides_data = [
            {
                "title": "Découvrez notre collection de mèches",
                "subtitle": "Qualité premium pour sublimer votre beauté",
                "image_url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1920&h=800&fit=crop",
                "cta_text": "Découvrir",
                "cta_link": "/categories/meches",
                "sort_order": 1
            },
            {
                "title": "Soins de la peau professionnels",
                "subtitle": "Des produits sélectionnés pour votre peau",
                "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1920&h=800&fit=crop",
                "cta_text": "Voir nos soins",
                "cta_link": "/categories/skin-care",
                "sort_order": 2
            },
            {
                "title": "Réservez votre rendez-vous",
                "subtitle": "Service personnalisé par nos experts",
                "image_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=800&fit=crop",
                "cta_text": "Prendre RDV",
                "cta_link": "/categories/rendez-vous",
                "sort_order": 3
            },
            {
                "title": "Offres spéciales du mois",
                "subtitle": "Jusqu'à -30% sur une sélection de produits",
                "image_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1920&h=800&fit=crop",
                "cta_text": "Voir les promos",
                "cta_link": "/products?filter=promo",
                "sort_order": 4
            },
            {
                "title": "Nouveautés 2024",
                "subtitle": "Découvrez les dernières tendances beauté",
                "image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1920&h=800&fit=crop",
                "cta_text": "Nouveautés",
                "cta_link": "/products?filter=new",
                "sort_order": 5
            }
        ]
        
        for slide_data in slides_data:
            existing = db.query(HeroSlide).filter(HeroSlide.title == slide_data["title"]).first()
            if not existing:
                slide = HeroSlide(**slide_data)
                db.add(slide)
                print(f"  ✅ Slide créé: {slide_data['title']}")
            else:
                print(f"  ⏭️  Slide existant: {slide_data['title']}")
        
        db.commit()
        
        # 4. Créer un utilisateur admin
        print("\n👤 Création de l'utilisateur admin...")
        
        admin_email = "admin@stelleworld.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if not existing_admin:
            admin_user = User(
                email=admin_email,
                first_name="Admin",
                last_name="StelleWorld",
                hashed_password=get_password_hash("admin123"),  # À changer en production !
                is_admin=True,
                is_active=True,
                is_verified=True,
                country="Canada"
            )
            db.add(admin_user)
            db.commit()
            print(f"  ✅ Admin créé: {admin_email} / Mot de passe: admin123")
        else:
            print(f"  ⏭️  Admin existant: {admin_email}")
        
        # 5. Settings du site
        print("\n⚙️  Configuration des paramètres du site...")
        
        settings_data = [
            {
                "key": "whatsapp_number",
                "value": "+15813081802",
                "description": "Numéro WhatsApp Business"
            },
            {
                "key": "site_name",
                "value": "StelleWorld",
                "description": "Nom du site"
            },
            {
                "key": "youtube_video_url",
                "value": "https://www.youtube.com/embed/9bZkp7q19f0",
                "description": "URL de la vidéo YouTube (section hero)"
            }
        ]
        
        for setting_data in settings_data:
            existing = db.query(SiteSettings).filter(SiteSettings.key == setting_data["key"]).first()
            if not existing:
                setting = SiteSettings(**setting_data)
                db.add(setting)
                print(f"  ✅ Paramètre créé: {setting_data['key']}")
            else:
                print(f"  ⏭️  Paramètre existant: {setting_data['key']}")
        
        db.commit()
        
        print("\n✨ Seeding terminé avec succès !")
        print("\n📊 Résumé:")
        print(f"  - Catégories: {db.query(Category).count()}")
        print(f"  - Produits: {db.query(Product).count()}")
        print(f"  - Slides Hero: {db.query(HeroSlide).count()}")
        print(f"  - Utilisateurs: {db.query(User).count()}")
        print(f"  - Paramètres: {db.query(SiteSettings).count()}")
        
    except Exception as e:
        print(f"\n❌ Erreur lors du seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
