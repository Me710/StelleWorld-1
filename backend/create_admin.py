"""
Script pour créer l'utilisateur administrateur par défaut
"""

from app.core.database import engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from sqlalchemy import text

def create_admin():
    """Créer l'utilisateur admin par défaut"""
    
    # Créer les tables si elles n'existent pas
    from app.core.database import Base
    from app.models import user, product, order, subscription, appointment, chat
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Vérifier si l'admin existe déjà
        admin = db.query(User).filter(User.email == "admin@stelleworld.com").first()
        
        if admin:
            print("[INFO] L'utilisateur admin existe deja!")
            print(f"   Email: {admin.email}")
            print(f"   Nom: {admin.full_name}")
            print(f"   Est admin: {admin.is_admin}")
            
            # S'assurer qu'il est bien admin
            if not admin.is_admin:
                admin.is_admin = True
                db.commit()
                print("   [OK] Droits admin actives!")
            return
        
        # Créer l'utilisateur admin
        admin_user = User(
            email="admin@stelleworld.com",
            first_name="Admin",
            last_name="StelleWorld",
            phone="+1 514 000 0000",
            hashed_password=get_password_hash("Admin@2024!"),
            is_active=True,
            is_admin=True,
            is_verified=True,
            country="Canada",
            city="Montreal"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("=" * 50)
        print("[OK] UTILISATEUR ADMIN CREE AVEC SUCCES!")
        print("=" * 50)
        print()
        print("Email:        admin@stelleworld.com")
        print("Mot de passe: Admin@2024!")
        print()
        print("IMPORTANT: Changez ce mot de passe apres la premiere connexion!")
        print("=" * 50)
        
    except Exception as e:
        print(f"[ERREUR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
