# 🌟 StelleWorld - Boutique en ligne interactive

## 📋 Vue d'ensemble

StelleWorld est une boutique en ligne moderne et interactive qui offre une expérience d'achat fluide inspirée des meilleures plateformes e-commerce. Le projet combine vente de produits, services sur rendez-vous, abonnements récurrents et interaction temps réel avec les clients.

## 🎯 Objectifs du projet

- **Expérience utilisateur moderne** : Navigation fluide et intuitive
- **Multi-formats de vente** : Produits, services, abonnements
- **Interaction temps réel** : Chat direct avec le commerçant
- **Analytics intelligentes** : Best-sellers et recommandations automatiques
- **Contact WhatsApp** : Collecte optionnelle pour fidélisation

## 🏗️ Architecture technique

### Stack technologique

- **Backend** : Python FastAPI
- **Base de données** : PostgreSQL avec SQLAlchemy + Alembic
- **Frontend** : HTML5, CSS3 (Tailwind), JavaScript + HTMX
- **Temps réel** : WebSocket (FastAPI)
- **Paiements** : Stripe (paiements et abonnements)
- **Notifications** : Bot Telegram
- **Tâches asynchrones** : Celery + Redis
- **Conteneurisation** : Docker + Docker Compose
- **Reverse Proxy** : Nginx

### Structure du projet

```
StelleWorld/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # Point d'entrée FastAPI
│   │   ├── core/              # Configuration et sécurité
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/            # Modèles SQLAlchemy
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   ├── subscription.py
│   │   │   ├── appointment.py
│   │   │   └── chat.py
│   │   ├── schemas/           # Schémas Pydantic
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   └── chat.py
│   │   ├── api/               # Endpoints API
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── orders.py
│   │   │   ├── subscriptions.py
│   │   │   ├── appointments.py
│   │   │   ├── chat.py
│   │   │   └── analytics.py
│   │   ├── services/          # Logique métier
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── product_service.py
│   │   │   ├── order_service.py
│   │   │   ├── stripe_service.py
│   │   │   ├── chat_service.py
│   │   │   └── notification_service.py
│   │   ├── utils/             # Utilitaires
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py
│   │   │   └── helpers.py
│   │   └── websocket/         # WebSocket pour chat
│   │       ├── __init__.py
│   │       └── chat_handler.py
│   ├── alembic/               # Migrations DB
│   ├── tests/                 # Tests unitaires
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Interface utilisateur
│   ├── static/
│   │   ├── css/
│   │   │   ├── main.css
│   │   │   └── components/
│   │   ├── js/
│   │   │   ├── main.js
│   │   │   ├── chat.js
│   │   │   ├── cart.js test
│   │   │   └── components/
│   │   └── images/
│   ├── templates/
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── products/
│   │   │   ├── catalog.html
│   │   │   └── detail.html
│   │   ├── cart/
│   │   │   ├── cart.html
│   │   │   └── checkout.html
│   │   ├── user/
│   │   │   ├── profile.html
│   │   │   └── subscriptions.html
│   │   ├── appointments/
│   │   │   └── booking.html
│   │   ├── chat/
│   │   │   └── chat.html
│   │   └── admin/
│   │       ├── dashboard.html
│   │       ├── products.html
│   │       └── orders.html
│   └── Dockerfile
├── worker/                     # Celery worker
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── analytics.py
│   │   ├── notifications.py
│   │   └── stripe_webhooks.py
│   ├── celery_app.py
│   └── Dockerfile
├── nginx/                      # Configuration Nginx
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml          # Orchestration des services
├── docker-compose.prod.yml     # Configuration production
├── .env.example               # Variables d'environnement
├── .gitignore
└── README.md
```

## 🎨 Fonctionnalités principales

### 🛍️ Catalogue & E-commerce
- **Catalogue produits** filtrable et recherchable
- **Pages produits** détaillées avec photos, descriptions, stock
- **Panier d'achat** persistant et optimisé
- **Paiements sécurisés** via Stripe
- **Gestion du stock** en temps réel

### 📅 Services & Rendez-vous
- **Réservation en ligne** via calendrier interactif
- **Gestion des créneaux** avec disponibilités temps réel
- **Confirmations automatiques** par email/notification
- **Statuts de RDV** (en attente, confirmé, annulé)

### 💳 Abonnements & Récurrence
- **Formules d'abonnement** (hebdomadaire, mensuel, annuel)
- **Gestion des renouvellements** automatiques
- **Interface client** pour gérer ses abonnements
- **Webhooks Stripe** pour synchronisation

### 💬 Chat & Support
- **Chat temps réel** type Alibaba
- **Notifications instantanées** sur mobile du commerçant
- **Historique des conversations** sauvegardé
- **Interface admin** pour gérer les discussions

### 📊 Analytics & Recommandations
- **Best Sellers** mis à jour automatiquement
- **Produits souvent achetés ensemble**
- **Tableaux de bord** pour l'admin
- **Rapports de vente** et statistiques

### 📱 Contact WhatsApp
- **Collecte optionnelle** avec consentement RGPD
- **Liens directs** vers WhatsApp Business
- **Messages pré-remplis** pour faciliter le contact

## 🚀 Installation et déploiement

### Prérequis
- Docker et Docker Compose
- Python 3.9+
- Node.js 16+ (pour le build frontend)
- Compte Stripe (clés API)
- Bot Telegram (token)

### Installation locale

1. **Cloner le projet**
```bash
git clone https://github.com/Me710/StelleWorld.git
cd StelleWorld
```

2. **Configuration des variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos clés API
```

3. **Lancement avec Docker**
```bash
docker-compose up -d
```

4. **Migrations de base de données**
```bash
docker-compose exec backend alembic upgrade head
```

5. **Accès à l'application**
- Frontend : http://localhost:8080
- API : http://localhost:8000
- Admin : http://localhost:8080/admin

### Déploiement production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Variables d'environnement principales

```env
# Base de données
DATABASE_URL=postgresql://user:password@db:5432/stelleworld

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Redis
REDIS_URL=redis://redis:6379/0

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📱 Parcours utilisateur

### 🛒 Achat produit
1. **Navigation** → Catalogue et recherche
2. **Sélection** → Page produit avec détails
3. **Panier** → Ajout et modification quantités
4. **Checkout** → Informations client et paiement
5. **Confirmation** → Email et suivi commande

### 📅 Réservation service
1. **Services** → Liste des services disponibles
2. **Calendrier** → Sélection date et créneau
3. **Informations** → Coordonnées client
4. **Confirmation** → RDV confirmé avec rappels

### 💳 Abonnement
1. **Formules** → Choix de l'abonnement
2. **Paiement** → Configuration récurrente Stripe
3. **Activation** → Accès immédiat aux services
4. **Gestion** → Interface client pour modifications

### 💬 Support chat
1. **Démarrage** → Clic sur bouton chat
2. **Conversation** → Messages temps réel
3. **Notification** → Alert commerçant via Telegram
4. **Historique** → Sauvegarde automatique

## 🔐 Sécurité & RGPD

- **HTTPS** obligatoire en production
- **JWT tokens** pour l'authentification
- **Hashage bcrypt** pour les mots de passe
- **Validation** stricte des inputs (Pydantic)
- **Consentement explicite** pour WhatsApp
- **Droit à l'oubli** et export des données

## 🧪 Tests

```bash
# Tests backend
docker-compose exec backend pytest

# Tests frontend
npm test

# Tests d'intégration
pytest tests/integration/
```

## 📖 API Documentation

L'API est documentée automatiquement via FastAPI :
- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

## 🎯 Roadmap

### Phase 1 (MVP - 3 semaines)
- ✅ Architecture de base
- ✅ Catalogue produits
- ✅ Paiements Stripe
- ✅ Chat temps réel
- ✅ Back-office simple

### Phase 2 (Amélioration)
- 📱 Application mobile (React Native)
- 🔍 Recherche avancée (Elasticsearch)
- 📧 Email marketing
- 🎨 Thèmes personnalisables
- 📊 Analytics avancées

### Phase 3 (Scale)
- 🌍 Multi-langues
- 💰 Multi-devises
- 🚚 Gestion livraisons
- 👥 Programme fidélité
- 🤖 IA recommandations

## 📞 Support

Pour toute question ou assistance :
- 📧 Email : support@stelleworld.com
- 💬 Chat : Directement sur le site
- 📚 Documentation : [Wiki du projet]
- 🐛 Issues : [GitHub Issues]

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ pour offrir la meilleure expérience e-commerce**