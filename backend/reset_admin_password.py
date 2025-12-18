"""
Script pour reinitialiser le mot de passe admin
"""

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

def reset_password():
    """Reinitialiser le mot de passe admin"""
    
    db = SessionLocal()
    
    try:
        admin = db.query(User).filter(User.email == "admin@stelleworld.com").first()
        
        if not admin:
            print("[ERREUR] Utilisateur admin non trouve!")
            return
        
        # Nouveau mot de passe
        new_password = "Admin@2024!"
        admin.hashed_password = get_password_hash(new_password)
        admin.is_admin = True
        admin.is_active = True
        
        db.commit()
        
        print("=" * 50)
        print("[OK] MOT DE PASSE REINITIALISE AVEC SUCCES!")
        print("=" * 50)
        print()
        print("Email:        admin@stelleworld.com")
        print("Mot de passe: Admin@2024!")
        print()
        print("=" * 50)
        
    except Exception as e:
        print(f"[ERREUR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
