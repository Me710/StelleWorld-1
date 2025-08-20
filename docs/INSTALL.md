# Guide d'Installation - StelleWorld

## 🚀 Installation Rapide

### Prérequis

- Docker et Docker Compose
- Git
- Make (optionnel mais recommandé)

### Installation en une commande

```bash
git clone https://github.com/votre-username/StelleWorld.git
cd StelleWorld
make setup
```

Cette commande va :
1. Copier le fichier de configuration
2. Construire les images Docker
3. Initialiser la base de données
4. Lancer l'application

## 📋 Installation Détaillée

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/StelleWorld.git
cd StelleWorld
```

### 2. Configuration

Copiez le fichier de configuration exemple :

```bash
cp .env_example .env
```

Éditez `.env` avec vos paramètres :

```bash
# Obligatoire
SECRET_KEY=votre-clé-secrète-très-longue-et-sécurisée
STRIPE_PUBLIC_KEY=pk_test_votre_clé_publique_stripe
STRIPE_SECRET_KEY=sk_test_votre_clé_secrète_stripe

# Optionnel
TELEGRAM_BOT_TOKEN=votre_token_bot_telegram
TELEGRAM_CHAT_ID=votre_chat_id_telegram
```

### 3. Construction et lancement

```bash
# Construire les images
docker-compose build

# Lancer les services
docker-compose up -d

# Appliquer les migrations
docker-compose exec backend alembic upgrade head
```

### 4. Vérification

L'application est maintenant disponible :
- Frontend : http://localhost:8080
- API Backend : http://localhost:8000
- Documentation API : http://localhost:8000/docs

## 🔧 Configuration des Services Externes

### Stripe (Paiements)

1. Créez un compte sur [Stripe](https://stripe.com)
2. Récupérez vos clés API dans le dashboard
3. Configurez les webhooks :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.payment_succeeded`, etc.

### Telegram Bot (Notifications)

1. Créez un bot avec [@BotFather](https://t.me/botfather)
2. Récupérez le token du bot
3. Trouvez votre chat ID :
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

### Email (Optionnel)

Pour Gmail avec mot de passe d'application :

```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application
```

## 👨‍💻 Développement

### Installation locale (sans Docker)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Base de données locale
createdb stelleworld
export DATABASE_URL=postgresql://user:password@localhost/stelleworld
alembic upgrade head

# Lancer le backend
uvicorn app.main:app --reload

# Frontend (autre terminal)
cd frontend
python -m http.server 8080
```

### Commandes de développement

```bash
# Tests
make test

# Linting
make lint

# Formatage du code
make format

# Logs en temps réel
make logs

# Shell dans le conteneur
make shell

# Nouvelle migration
make migrate-create
```

## 🌐 Déploiement Production

### Variables d'environnement production

```env
DEBUG=false
SECRET_KEY=clé-super-sécurisée-64-caractères-minimum
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com
DATABASE_URL=postgresql://user:password@db-host:5432/stelleworld

# SSL
DOMAIN=votre-domaine.com
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Déploiement avec Docker

```bash
# Construction pour production
docker-compose -f docker-compose.prod.yml build

# Lancement
docker-compose -f docker-compose.prod.yml up -d

# Migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Ou avec Make
make prod-deploy
```

### Configuration Nginx avec SSL

1. Placez vos certificats SSL dans le dossier `ssl/`
2. Le fichier `nginx/nginx.conf` est configuré pour HTTPS
3. Pour Let's Encrypt, utilisez `make ssl-renew`

## 🗄️ Base de Données

### Migrations

```bash
# Créer une migration
make migrate-create

# Appliquer les migrations
make migrate

# Réinitialiser la DB (ATTENTION: supprime tout)
make reset-db
```

### Sauvegarde/Restauration

```bash
# Sauvegarde
make backup-db

# Restauration
make restore-db FILE=backup.sql

# Sauvegarde complète (DB + fichiers)
make backup-full
```

## 👤 Administration

### Créer un utilisateur admin

```bash
make create-admin
```

Ou manuellement :
```bash
docker-compose exec backend python -c "
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
admin = User(
    email='admin@stelleworld.com',
    first_name='Admin',
    last_name='StelleWorld',
    hashed_password=get_password_hash('votre-mot-de-passe'),
    is_admin=True,
    is_active=True
)
db.add(admin)
db.commit()
print('Admin créé!')
"
```

## 🔍 Dépannage

### Problèmes courants

**Port déjà utilisé :**
```bash
sudo lsof -i :8080
sudo kill -9 <PID>
```

**Base de données inaccessible :**
```bash
# Vérifier les logs
make logs-backend

# Redémarrer la DB
docker-compose restart db
```

**Worker Celery qui ne démarre pas :**
```bash
# Vérifier Redis
docker-compose logs redis

# Redémarrer le worker
docker-compose restart worker
```

### Logs et monitoring

```bash
# Tous les logs
make logs

# Logs spécifiques
make logs-backend
make logs-worker

# Statut des services
make status

# Health check
make health

# Monitoring des ressources
make monitor
```

## 📚 Ressources

- [Documentation FastAPI](https://fastapi.tiangolo.com/)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Telegram Bot API](https://core.telegram.org/bots/api)
- [Documentation Docker Compose](https://docs.docker.com/compose/)

## 🆘 Support

En cas de problème :
1. Consultez les logs : `make logs`
2. Vérifiez la configuration : `.env`
3. Redémarrez les services : `make restart`
4. Consultez la documentation API : http://localhost:8000/docs
