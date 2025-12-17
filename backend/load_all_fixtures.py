"""
Chargement COMPLET des fixtures dans PostgreSQL
Ce script charge TOUT : catégories, produits, slides, fournisseurs, commandes
"""

import sys
sys.path.insert(0, '/app/backend')

from app.core.database import SessionLocal
from app.models.product import Category, Product
from app.models.hero_slider import HeroSlide, SiteSettings
from app.models.supplier import Supplier
from app.models.user import User
from app.core.security import get_password_hash
from slugify import slugify

def load_everything():
    db = SessionLocal()
    
    try:
        print("🚀 Chargement COMPLET des fixtures PostgreSQL...\n")
        
        # Catégories
        print("1️⃣ Catégories...")
        categories_data = [
            {"name": "Mèches", "slug": "meches", "description": "Mèches de qualité premium", "image_url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600", "sort_order": 1},
            {"name": "Skin Care", "slug": "skin-care", "description": "Produits de soins professionnels", "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600", "sort_order": 2}
        ]
        
        cats = {}
        for cat_data in categories_data:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()
                cats[cat_data["slug"]] = cat
                print(f"   ✅ {cat_data['name']}")
            else:
                cats[cat_data["slug"]] = existing
                print(f"   ⏭️  {cat_data['name']} (existe)")
        
        db.commit()
        
        # Produits  
        print("\n2️⃣ Produits (24)...")
        products_data = [
            # Mèches (9 produits)
            {"name": "Mèches Brésiliennes Premium", "cat": "meches", "price": 149.99, "compare_at_price": 199.99, "stock": 15, "featured": True, "sales": 45},
            {"name": "Mèches Indiennes Ondulantes", "cat": "meches", "price": 129.99, "compare_at_price": 169.99, "stock": 12, "featured": True, "sales": 67},
            {"name": "Mèches Péruviennes Bouclées", "cat": "meches", "price": 159.99, "stock": 8, "featured": True, "sales": 32},
            {"name": "Mèches Deep Wave", "cat": "meches", "price": 139.99, "stock": 10, "sales": 28},
            {"name": "Mèches Malaisiennes Soyeuses", "cat": "meches", "price": 169.99, "compare_at_price": 219.99, "stock": 6, "sales": 45},
            {"name": "Mèches Kinky Curly", "cat": "meches", "price": 139.99, "stock": 10, "sales": 67},
            {"name": "Mèches Bob Cut", "cat": "meches", "price": 119.99, "compare_at_price": 149.99, "stock": 15, "featured": True, "sales": 89},
            {"name": "Mèches Ombré Blonde", "cat": "meches", "price": 179.99, "stock": 5, "sales": 34},
            {"name": "Closure Lace 4x4", "cat": "meches", "price": 89.99, "stock": 20, "sales": 56},
            # Skin Care (15 produits)
            {"name": "Sérum Vitamine C", "cat": "skin-care", "price": 45.99, "stock": 30, "featured": True, "sales": 92},
            {"name": "Crème Hydratante Luxe", "cat": "skin-care", "price": 59.99, "stock": 25, "featured": True, "sales": 76},
            {"name": "Masque Purifiant Charbon", "cat": "skin-care", "price": 34.99, "stock": 40, "sales": 65},
            {"name": "Huile Visage Régénérante Bio", "cat": "skin-care", "price": 49.99, "stock": 20, "sales": 43},
            {"name": "Gel Nettoyant Doux", "cat": "skin-care", "price": 24.99, "stock": 50, "sales": 88},
            {"name": "Nettoyant Exfoliant Doux", "cat": "skin-care", "price": 29.99, "stock": 35, "sales": 78},
            {"name": "Crème Contour Yeux", "cat": "skin-care", "price": 54.99, "compare_at_price": 69.99, "stock": 22, "sales": 43},
            {"name": "Sérum Acide Hyaluronique", "cat": "skin-care", "price": 39.99, "stock": 40, "featured": True, "sales": 92},
            {"name": "Crème de Nuit Réparatrice", "cat": "skin-care", "price": 64.99, "stock": 18, "sales": 51},
            {"name": "Tonique Eau de Rose", "cat": "skin-care", "price": 27.99, "stock": 45, "sales": 61},
            {"name": "Masque de Nuit Hydratant", "cat": "skin-care", "price": 49.99, "compare_at_price": 64.99, "stock": 28, "sales": 38},
            {"name": "Crème Solaire SPF 50+", "cat": "skin-care", "price": 34.99, "stock": 50, "sales": 72},
            {"name": "Eau Micellaire Démaquillante", "cat": "skin-care", "price": 19.99, "stock": 60, "sales": 105},
            {"name": "Baume à Lèvres Réparateur", "cat": "skin-care", "price": 12.99, "stock": 80, "sales": 120},
            {"name": "Kit Routine Beauté Complète", "cat": "skin-care", "price": 159.99, "compare_at_price": 249.99, "stock": 12, "featured": True, "sales": 28},
        ]
        
        for p in products_data:
            slug = slugify(p["name"])
            existing = db.query(Product).filter(Product.slug == slug).first()
            if not existing:
                prod = Product(
                    name=p["name"],
                    slug=slug,
                    category_id=cats[p["cat"]].id,
                    price=p["price"],
                    compare_at_price=p.get("compare_at_price"),
                    stock_quantity=p["stock"],
                    is_featured=p.get("featured", False),
                    sales_count=p.get("sales", 0),
                    short_description=f"{p['name']} - Qualité premium",
                    main_image_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
                )
                db.add(prod)
                print(f"   ✅ {p['name']}")
            else:
                print(f"   ⏭️  {p['name']} (existe)")
        
        db.commit()
        
        # Hero Slides
        print("\n3️⃣ Hero Slides (5)...")
        slides_data = [
            {"title": "Découvrez notre collection de mèches", "subtitle": "Qualité premium", "url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1920", "cta": "Découvrir", "link": "/categories/meches", "order": 1},
            {"title": "Soins professionnels", "subtitle": "Pour votre peau", "url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1920", "cta": "Voir", "link": "/categories/skin-care", "order": 2},
            {"title": "Réservez votre rendez-vous", "subtitle": "Experts à votre service", "url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920", "cta": "RDV", "link": "/categories/rendez-vous", "order": 3},
            {"title": "Offres du mois", "subtitle": "-30% sur sélection", "url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1920", "cta": "Promos", "link": "/products", "order": 4},
            {"title": "Nouveautés 2024", "subtitle": "Tendances beauté", "url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1920", "cta": "Nouveau", "link": "/products", "order": 5},
        ]
        
        for s in slides_data:
            existing = db.query(HeroSlide).filter(HeroSlide.title == s["title"]).first()
            if not existing:
                slide = HeroSlide(title=s["title"], subtitle=s["subtitle"], image_url=s["url"], cta_text=s["cta"], cta_link=s["link"], sort_order=s["order"])
                db.add(slide)
                print(f"   ✅ {s['title']}")
            else:
                print(f"   ⏭️  {s['title']} (existe)")
        
        db.commit()
        
        # Admin user
        print("\n4️⃣ Utilisateur Admin...")
        admin = db.query(User).filter(User.email == "admin@stelleworld.com").first()
        if not admin:
            admin = User(
                email="admin@stelleworld.com",
                first_name="Admin",
                last_name="StelleWorld",
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
                is_active=True,
                is_verified=True,
                country="Canada"
            )
            db.add(admin)
            db.commit()
            print("   ✅ Admin créé (admin@stelleworld.com / admin123)")
        else:
            print("   ⏭️  Admin existe")
        
        # Settings
        print("\n5️⃣ Paramètres...")
        settings = [
            {"key": "promo_banner", "value": '{"message":"🎉 PROMOTION : -30% sur une sélection de produits avec le code PROMO30","backgroundColor":"#ec4899","textColor":"#ffffff"}'},
        ]
        
        for s in settings:
            existing = db.query(SiteSettings).filter(SiteSettings.key == s["key"]).first()
            if not existing:
                setting = SiteSettings(key=s["key"], value=s["value"])
                db.add(setting)
                print(f"   ✅ {s['key']}")
            else:
                existing.value = s["value"]
                print(f"   ⏭️  {s['key']} (màj)")
        
        db.commit()
        
        print("\n✨ RÉSUMÉ FINAL:")
        print(f"   📂 Catégories: {db.query(Category).count()}")
        print(f"   🛍️  Produits: {db.query(Product).count()}")
        print(f"   🖼️  Slides: {db.query(HeroSlide).count()}")
        print(f"   👤 Users: {db.query(User).count()}")
        
        print("\n✅ FIXTURES CHARGÉES AVEC SUCCÈS!")
        
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_everything()
