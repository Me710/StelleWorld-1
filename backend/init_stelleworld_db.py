#!/usr/bin/env python3
"""
Script d'initialisation de la base de données StelleWorld
À exécuter depuis le dossier backend/

Usage:
    python init_stelleworld_db.py
"""

import sys
import os

# Ajouter le dossier parent au PYTHONPATH pour les imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.init_db import init_database

if __name__ == "__main__":
    print("🚀 Initialisation de la base de données StelleWorld...")
    print("=" * 60)
    
    try:
        init_database()
        print("\n✅ Initialisation terminée avec succès !")
        print("\n🔗 Liens utiles :")
        print("   - Site web: http://localhost:8000")
        print("   - Admin login: http://localhost:8000/admin/login")
        print("   - API docs: http://localhost:8000/api/docs")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation : {e}")
        sys.exit(1)
