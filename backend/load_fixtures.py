#!/usr/bin/env python3
"""
Script pour charger les fixtures dans la base de données
Usage: python load_fixtures.py
"""

import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Créer toutes les tables d'abord
from app.core.database import engine, Base
from app.models import user, product, order, subscription, appointment, chat

# Créer les tables
Base.metadata.create_all(bind=engine)

from fixtures.products_fixtures import load_fixtures

if __name__ == "__main__":
    print("🚀 Chargement des fixtures pour StelleWorld...")
    try:
        load_fixtures()
        print("✅ Fixtures chargées avec succès!")
    except Exception as e:
        print(f"❌ Erreur: {e}")
        sys.exit(1)
