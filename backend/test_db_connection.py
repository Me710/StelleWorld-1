"""
Test de connexion à PostgreSQL Neon et création des tables
"""

import sys
sys.path.insert(0, '/app/backend')

from app.core.database import engine, Base
from app.core.config import settings
from sqlalchemy import inspect, text

# Import tous les modèles pour que les tables soient créées
from app.models import (
    User, Product, Category, ProductVariant,
    Order, OrderItem,
    Supplier, SupplierInvoice,
    CustomerInvoice,
    HeroSlide, SiteSettings,
    Subscription, SubscriptionItem, SubscriptionInvoice,
    Appointment, Chat, Banner
)

def test_connection():
    """Tester la connexion à PostgreSQL"""
    print("🔍 Test de connexion à PostgreSQL Neon...")
    print(f"📍 URL: {settings.DATABASE_URL[:50]}...")
    
    try:
        # Tester la connexion
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Connexion réussie!")
            print(f"📊 Version PostgreSQL: {version[:50]}...")
        
        # Créer toutes les tables
        print("\n🏗️  Création des tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables créées avec succès!")
        
        # Lister les tables créées
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n📋 Tables créées ({len(tables)}):")
        for table in sorted(tables):
            print(f"  - {table}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
