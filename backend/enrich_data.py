"""
Script d'enrichissement des données fictives pour StelleWorld
Ajoute plus de produits, fournisseurs, commandes et factures
"""

import sys
sys.path.insert(0, '/app/backend')

from app.core.database import SessionLocal
from app.models.product import Category, Product
from app.models.supplier import Supplier, SupplierInvoice
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from datetime import datetime, timedelta
from slugify import slugify
import random

def add_more_products():
    """Ajouter plus de produits pour un catalogue complet"""
    
    db = SessionLocal()
    
    try:
        print("🛍️  Ajout de produits supplémentaires...")
        
        # Récupérer les catégories
        meches_cat = db.query(Category).filter(Category.slug == "meches").first()
        skincare_cat = db.query(Category).filter(Category.slug == "skin-care").first()
        
        additional_products = [
            # Mèches supplémentaires
            {
                "name": "Mèches Malaisiennes Soyeuses - Silky",
                "category_id": meches_cat.id,
                "description": "Texture ultra douce et soyeuse, idéale pour un look naturel et élégant. 100% cheveux humains vierges.",
                "short_description": "Ultra douces et soyeuses",
                "price": 169.99,
                "compare_at_price": 219.99,
                "stock_quantity": 6,
                "main_image_url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop",
                "sales_count": 45
            },
            {
                "name": "Mèches Kinky Curly - Texture Afro",
                "category_id": meches_cat.id,
                "description": "Texture afro naturelle, parfaite pour un look volumeux. Peut être lissée ou coiffée selon vos envies.",
                "short_description": "Texture afro volumineuse",
                "price": 139.99,
                "stock_quantity": 10,
                "main_image_url": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop",
                "sales_count": 67
            },
            {
                "name": "Mèches Bob Cut - Straight Short",
                "category_id": meches_cat.id,
                "description": "Coupe carré courte, parfaite pour un style moderne et chic. Pré-coupée et prête à poser.",
                "short_description": "Carré court tendance",
                "price": 119.99,
                "compare_at_price": 149.99,
                "stock_quantity": 15,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop",
                "sales_count": 89
            },
            {
                "name": "Mèches Ombré Blonde - Dégradé",
                "category_id": meches_cat.id,
                "description": "Magnifique dégradé blond naturel, racines foncées vers pointes claires. Effet professionnel garanti.",
                "short_description": "Dégradé blond naturel",
                "price": 179.99,
                "stock_quantity": 5,
                "main_image_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
                "sales_count": 34
            },
            {
                "name": "Mèches Closure 4x4 - Lace Frontale",
                "category_id": meches_cat.id,
                "description": "Closure lace 4x4 pouces pour finition naturelle. S'adapte à toutes les textures de mèches.",
                "short_description": "Closure lace naturelle",
                "price": 89.99,
                "stock_quantity": 20,
                "main_image_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
                "sales_count": 56
            },
            
            # Skin Care supplémentaires
            {
                "name": "Nettoyant Exfoliant Doux - Grains Fins",
                "category_id": skincare_cat.id,
                "description": "Exfoliation douce quotidienne qui élimine les cellules mortes sans agresser. Grains de jojoba naturels.",
                "short_description": "Exfoliation douce et naturelle",
                "price": 29.99,
                "stock_quantity": 35,
                "main_image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
                "sales_count": 78
            },
            {
                "name": "Crème Contour des Yeux - Anti-Cernes",
                "category_id": skincare_cat.id,
                "description": "Formule concentrée pour réduire cernes et poches. Effet liftant immédiat avec caféine et peptides.",
                "short_description": "Réduit cernes et poches",
                "price": 54.99,
                "compare_at_price": 69.99,
                "stock_quantity": 22,
                "main_image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop",
                "sales_count": 43
            },
            {
                "name": "Sérum Acide Hyaluronique Pur",
                "category_id": skincare_cat.id,
                "description": "Concentration maximale d'acide hyaluronique pour une hydratation intense. Pénètre instantanément.",
                "short_description": "Hydratation maximale",
                "price": 39.99,
                "stock_quantity": 40,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
                "sales_count": 92
            },
            {
                "name": "Crème de Nuit Réparatrice",
                "category_id": skincare_cat.id,
                "description": "Répare la peau pendant le sommeil. Formule riche en rétinol et peptides pour une peau éclatante au réveil.",
                "short_description": "Réparation nocturne intensive",
                "price": 64.99,
                "stock_quantity": 18,
                "main_image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
                "sales_count": 51
            },
            {
                "name": "Tonique Équilibrant - Eau de Rose",
                "category_id": skincare_cat.id,
                "description": "Tonifie et équilibre le pH de la peau. Eau de rose pure bio, apaisante et rafraîchissante.",
                "short_description": "Tonifie et équilibre",
                "price": 27.99,
                "stock_quantity": 45,
                "main_image_url": "https://images.unsplash.com/photo-1556229010-aa31473a8e58?w=400&h=400&fit=crop",
                "sales_count": 61
            },
            {
                "name": "Masque de Nuit Hydratant Intense",
                "category_id": skincare_cat.id,
                "description": "Masque sleeping ultra concentré. Laisse la peau douce, hydratée et éclatante au réveil.",
                "short_description": "Masque de nuit concentré",
                "price": 49.99,
                "compare_at_price": 64.99,
                "stock_quantity": 28,
                "main_image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
                "sales_count": 38
            },
            {
                "name": "Crème Solaire SPF 50+ - Protection UV",
                "category_id": skincare_cat.id,
                "description": "Protection solaire haute performance. Texture légère, non grasse, résistante à l'eau.",
                "short_description": "Protection UV maximale",
                "price": 34.99,
                "stock_quantity": 50,
                "main_image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop",
                "sales_count": 72
            },
            {
                "name": "Eau Micellaire Démaquillante",
                "category_id": skincare_cat.id,
                "description": "Démaquille et nettoie en un seul geste. Formule sans rinçage pour tous types de peaux.",
                "short_description": "Démaquille en douceur",
                "price": 19.99,
                "stock_quantity": 60,
                "main_image_url": "https://images.unsplash.com/photo-1556229010-aa31473a8e58?w=400&h=400&fit=crop",
                "sales_count": 105
            },
            {
                "name": "Baume à Lèvres Réparateur",
                "category_id": skincare_cat.id,
                "description": "Répare et protège les lèvres abîmées. Formule au beurre de karité et vitamine E.",
                "short_description": "Répare et nourrit les lèvres",
                "price": 12.99,
                "stock_quantity": 80,
                "main_image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
                "sales_count": 120
            },
            {
                "name": "Kit Complet Routine Beauté",
                "category_id": skincare_cat.id,
                "description": "Kit complet avec nettoyant, tonique, sérum et crème. Routine beauté complète pour 2 mois.",
                "short_description": "Routine complète 2 mois",
                "price": 159.99,
                "compare_at_price": 249.99,
                "stock_quantity": 12,
                "is_featured": True,
                "main_image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
                "sales_count": 28
            },
        ]
        
        for product_data in additional_products:
            product_data["slug"] = slugify(product_data["name"])
            
            existing = db.query(Product).filter(Product.slug == product_data["slug"]).first()
            if not existing:
                product = Product(**product_data)
                db.add(product)
                print(f"  ✅ Produit ajouté: {product_data['name']}")
            else:
                print(f"  ⏭️  Produit existant: {product_data['name']}")
        
        db.commit()
        print(f"\n✅ Total produits en base: {db.query(Product).count()}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()


def add_suppliers():
    """Ajouter des fournisseurs fictifs"""
    
    db = SessionLocal()
    
    try:
        print("\n📦 Ajout de fournisseurs...")
        
        suppliers_data = [
            {
                "name": "Beauty Supply Co.",
                "company_name": "Beauty Supply International Inc.",
                "email": "contact@beautysupply.com",
                "phone": "+1-555-0101",
                "whatsapp": "+15550101",
                "city": "Toronto",
                "country": "Canada",
                "notes": "Fournisseur principal mèches premium"
            },
            {
                "name": "Skin Care Wholesale",
                "company_name": "Skin Care Wholesale Ltd.",
                "email": "orders@skincarewholesale.ca",
                "phone": "+1-555-0202",
                "whatsapp": "+15550202",
                "city": "Montréal",
                "country": "Canada",
                "notes": "Produits de soins professionnels"
            },
            {
                "name": "Natural Beauty Import",
                "company_name": "Natural Beauty Import Corp.",
                "email": "info@naturalbeauty.com",
                "phone": "+1-555-0303",
                "city": "Vancouver",
                "country": "Canada",
                "notes": "Produits bio et naturels"
            },
        ]
        
        for supplier_data in suppliers_data:
            existing = db.query(Supplier).filter(Supplier.name == supplier_data["name"]).first()
            if not existing:
                supplier = Supplier(**supplier_data)
                db.add(supplier)
                db.flush()
                print(f"  ✅ Fournisseur créé: {supplier_data['name']}")
                
                # Ajouter quelques factures fournisseur
                for i in range(2):
                    invoice_date = datetime.now() - timedelta(days=random.randint(10, 90))
                    invoice = SupplierInvoice(
                        invoice_number=f"SUP-{invoice_date.strftime('%Y%m')}-{random.randint(1000, 9999)}",
                        supplier_id=supplier.id,
                        subtotal=random.uniform(500, 3000),
                        tax_amount=0,
                        total_amount=0,
                        invoice_date=invoice_date,
                        is_paid=random.choice([True, False])
                    )
                    invoice.total_amount = invoice.subtotal + invoice.tax_amount
                    if invoice.is_paid:
                        invoice.paid_at = invoice_date + timedelta(days=random.randint(1, 15))
                    db.add(invoice)
            else:
                print(f"  ⏭️  Fournisseur existant: {supplier_data['name']}")
        
        db.commit()
        print(f"✅ Total fournisseurs: {db.query(Supplier).count()}")
        print(f"✅ Total factures fournisseurs: {db.query(SupplierInvoice).count()}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()


def add_demo_orders():
    """Ajouter des commandes de démonstration"""
    
    db = SessionLocal()
    
    try:
        print("\n📋 Ajout de commandes de démonstration...")
        
        # Récupérer l'admin user
        admin = db.query(User).filter(User.email == "admin@stelleworld.com").first()
        if not admin:
            print("❌ Admin user non trouvé")
            return
        
        # Créer quelques clients fictifs
        clients = []
        clients_data = [
            {"email": "marie.dupont@example.com", "first_name": "Marie", "last_name": "Dupont", "phone": "+15145551234"},
            {"email": "sophie.martin@example.com", "first_name": "Sophie", "last_name": "Martin", "phone": "+15145555678"},
            {"email": "julie.bernard@example.com", "first_name": "Julie", "last_name": "Bernard", "phone": "+15145559012"},
        ]
        
        for client_data in clients_data:
            existing = db.query(User).filter(User.email == client_data["email"]).first()
            if not existing:
                from app.core.security import get_password_hash
                client = User(
                    email=client_data["email"],
                    first_name=client_data["first_name"],
                    last_name=client_data["last_name"],
                    phone=client_data["phone"],
                    hashed_password=get_password_hash("password123"),
                    is_active=True,
                    country="Canada",
                    city="Montréal"
                )
                db.add(client)
                db.flush()
                clients.append(client)
            else:
                clients.append(existing)
        
        # Créer des commandes
        products = db.query(Product).filter(Product.is_active == True).all()
        
        for i, client in enumerate(clients):
            # Créer 1-3 commandes par client
            for j in range(random.randint(1, 3)):
                order_date = datetime.now() - timedelta(days=random.randint(1, 60))
                
                # Sélectionner 1-4 produits aléatoires
                selected_products = random.sample(products, random.randint(1, 4))
                
                subtotal = 0
                order_items_data = []
                
                for product in selected_products:
                    quantity = random.randint(1, 3)
                    unit_price = product.price
                    total_price = unit_price * quantity
                    subtotal += total_price
                    
                    order_items_data.append({
                        "product": product,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "total_price": total_price
                    })
                
                tax_amount = subtotal * 0.15  # TPS/TVQ Québec
                shipping_amount = 0 if subtotal >= 100 else 9.99
                total_amount = subtotal + tax_amount + shipping_amount
                
                order_number = f"ST-{order_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                
                statuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
                status = random.choice(statuses)
                
                order = Order(
                    order_number=order_number,
                    user_id=client.id,
                    status=status,
                    payment_status=PaymentStatus.PAID if status in [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] else PaymentStatus.PENDING,
                    subtotal=subtotal,
                    tax_amount=tax_amount,
                    shipping_amount=shipping_amount,
                    total_amount=total_amount,
                    shipping_first_name=client.first_name,
                    shipping_last_name=client.last_name,
                    shipping_email=client.email,
                    shipping_phone=client.phone,
                    shipping_address_line1="123 rue Sainte-Catherine",
                    shipping_city="Montréal",
                    shipping_postal_code="H2X 1L5",
                    shipping_country="Canada",
                    billing_first_name=client.first_name,
                    billing_last_name=client.last_name,
                    billing_email=client.email,
                    billing_address_line1="123 rue Sainte-Catherine",
                    billing_city="Montréal",
                    billing_postal_code="H2X 1L5",
                    billing_country="Canada",
                    created_at=order_date
                )
                
                if status == OrderStatus.CONFIRMED:
                    order.confirmed_at = order_date + timedelta(hours=2)
                elif status == OrderStatus.SHIPPED:
                    order.confirmed_at = order_date + timedelta(hours=2)
                    order.shipped_at = order_date + timedelta(days=1)
                elif status == OrderStatus.DELIVERED:
                    order.confirmed_at = order_date + timedelta(hours=2)
                    order.shipped_at = order_date + timedelta(days=1)
                    order.delivered_at = order_date + timedelta(days=4)
                
                db.add(order)
                db.flush()
                
                # Ajouter les items
                for item_data in order_items_data:
                    order_item = OrderItem(
                        order_id=order.id,
                        product_id=item_data["product"].id,
                        product_name=item_data["product"].name,
                        product_description=item_data["product"].short_description,
                        product_image_url=item_data["product"].main_image_url,
                        quantity=item_data["quantity"],
                        unit_price=item_data["unit_price"],
                        total_price=item_data["total_price"]
                    )
                    db.add(order_item)
        
        db.commit()
        print(f"✅ Total commandes créées: {db.query(Order).count()}")
        print(f"✅ Total clients: {db.query(User).filter(User.is_admin == False).count()}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Enrichissement des données fictives...\n")
    add_more_products()
    add_suppliers()
    add_demo_orders()
    print("\n✨ Enrichissement terminé avec succès!")
