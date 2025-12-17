# 🌟 StelleWorld - Boutique en Ligne Interactive

> **Version 2.0** - Refactorisation complète avec PostgreSQL Neon + Next.js 14

Plateforme e-commerce moderne avec intégration WhatsApp, gestion de stock en temps réel, et dashboard administrateur complet.

---

## ✨ Fonctionnalités

### Front-Office
- 🛍️ **Catalogue produits** avec filtres latéraux (catégories, prix, disponibilité)
- 🎨 **Hero slider** dynamique (5 slides personnalisables)
- 📱 **Double intégration WhatsApp**:
  - Mode 1: Panier → Message pré-rempli avec commande
  - Mode 2: Bouton floating contact direct
- 🛒 **Panier intelligent** avec persistance locale
- 📄 **Génération automatique** de commande + facture lors de la validation WhatsApp
- 📊 **Bannière promo** personnalisable
- 💳 **Devise CAD** (Dollar canadien)
- 📱 **Design responsive** mobile-first (zoom 140%)

### Back-Office (Admin)
- 📊 **Dashboard** avec statistiques en temps réel
- 📦 **Gestion produits** (CRUD complet - 45 produits)
- 🖼️ **Gestion hero slider** (5 slides)
- 📋 **Gestion commandes** WhatsApp avec export factures
- 👥 **Gestion fournisseurs**
- 🧾 **Gestion factures** (clients + fournisseurs)
- 📈 **Statistiques** ventes et stock

---

## 🔧 Stack Technique

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL Neon
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **State**: Zustand (panier persistant)
- **WhatsApp**: Intégration double mode (+15813081802)

---

## 🚀 Démarrage Rapide

### 1. Backend

```bash
cd backend

# Créer les tables PostgreSQL
python test_db_connection.py

# Charger les données (45 produits)
python load_all_fixtures.py

# Démarrer l'API
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

✅ Backend: http://localhost:8001
✅ API Docs: http://localhost:8001/api/docs

### 2. Frontend

```bash
cd frontend

# Installer dépendances
yarn install

# Démarrer Next.js
yarn dev
```

✅ Site: http://localhost:3000
✅ Admin: http://localhost:3000/admin

---

## ⚙️ Configuration

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
WHATSAPP_BUSINESS_NUMBER=+15813081802
SECRET_KEY=votre-secret-key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NEXT_PUBLIC_WHATSAPP_NUMBER=+15813081802
```

---

## 👤 Accès Admin

```
URL: http://localhost:3000/admin
Email: admin@stelleworld.com
Password: admin123
```

⚠️ **Changez le mot de passe en production !**

---

## 🗄️ Données de Démonstration

### Produits (45)
- **Mèches** (9): 89.99$ à 179.99$ CAD
- **Skin Care** (36): 12.99$ à 159.99$ CAD

### Catégories
1. **Mèches** - Qualité premium (Brésiliennes, Indiennes, Péruviennes)
2. **Skin Care** - Soins professionnels

### Hero Slides (5)
1. Collection mèches
2. Soins professionnels
3. Rendez-vous
4. Offres spéciales
5. Nouveautés

---

## 📱 WhatsApp - Workflow Automatisé

```
1. Client ajoute produits au panier
2. Clic "Commander via WhatsApp"
3. Backend crée:
   ✅ Commande (WA-20251217-XXXX)
   ✅ Facture (INV-20251217-XXX)
   ✅ Décrémente stock
4. Frontend:
   ✅ Ouvre WhatsApp (message pré-rempli)
   ✅ Télécharge facture HTML
   ✅ Vide panier
5. Commerçant reçoit:
   ✅ Message WhatsApp client
   ✅ Commande dans /admin/orders
   ✅ Facture exportable
```

---

## 🛠️ Scripts Utiles

```bash
# Backend - Créer admin user
cd backend
python -c "from app.core.security import get_password_hash; print(get_password_hash('nouveau_mdp'))"

# Backend - Reset database
python test_db_connection.py && python load_all_fixtures.py

# Frontend - Rebuild
cd frontend
rm -rf .next && yarn build

# Frontend - Clear cache
rm -rf .next/cache
```

---

## 📊 Statistiques Base de Données

```bash
# Vérifier nombre de produits
python -c "
from app.core.database import SessionLocal
from app.models.product import Product
db = SessionLocal()
print(f'Produits: {db.query(Product).count()}')
db.close()
"
```

---

## 🎯 Fonctionnalités Clés

✅ **45 produits** en base PostgreSQL Neon
✅ **Double WhatsApp**: Panier + Contact direct
✅ **Commande auto**: Création + Facture + Export
✅ **Stock en temps réel**: Décrémentation automatique
✅ **Admin complet**: Dashboard + CRUD + Stats
✅ **Filtres avancés**: Catégories + Prix + Disponibilité
✅ **Design moderne**: Images grandes + Boutons fixes
✅ **Bannière promo**: Personnalisable par admin
✅ **Devise CAD**: Dollar canadien partout
✅ **Zoom 140%**: Meilleure lisibilité

---

## 🏆 Architecture

- **PostgreSQL Neon**: 22 tables normalisées
- **FastAPI**: 16 endpoints REST
- **Next.js 14**: App Router + Server Components
- **TailwindCSS**: Design system cohérent
- **Zustand**: State management panier
- **Swiper**: Slider homepage

---

## 📞 Contact

**WhatsApp Business**: +1 581 308 1802

---

**Développé avec ❤️ pour StelleWorld - Votre destination beauté** 🌟
