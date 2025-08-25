# Makefile pour StelleWorld

.PHONY: help build dev prod stop clean logs test lint migrate shell

# Variables
COMPOSE_FILE = docker-compose.yml
COMPOSE_FILE_PROD = docker-compose.prod.yml

help: ## Afficher l'aide
	@echo "Commandes disponibles pour StelleWorld:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Construire les images Docker
	docker-compose -f $(COMPOSE_FILE) build

dev: ## Lancer l'environnement de développement
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "Application disponible sur http://localhost:8080"
	@echo "API disponible sur http://localhost:8000"
	@echo "Documentation API: http://localhost:8000/docs"

prod: ## Lancer l'environnement de production
	docker-compose -f $(COMPOSE_FILE_PROD) up -d
	@echo "Application lancée en mode production"

stop: ## Arrêter les services
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_FILE_PROD) down

clean: ## Nettoyer les conteneurs et volumes
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker system prune -f

logs: ## Afficher les logs
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Logs du backend uniquement
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-worker: ## Logs du worker uniquement
	docker-compose -f $(COMPOSE_FILE) logs -f worker

test: ## Lancer les tests
	docker-compose -f $(COMPOSE_FILE) exec backend pytest

lint: ## Vérifier le code
	docker-compose -f $(COMPOSE_FILE) exec backend black --check .
	docker-compose -f $(COMPOSE_FILE) exec backend isort --check-only .
	docker-compose -f $(COMPOSE_FILE) exec backend flake8

format: ## Formatter le code
	docker-compose -f $(COMPOSE_FILE) exec backend black .
	docker-compose -f $(COMPOSE_FILE) exec backend isort .

migrate: ## Appliquer les migrations de base de données
	docker-compose -f $(COMPOSE_FILE) exec backend alembic upgrade head

migrate-create: ## Créer une nouvelle migration
	@read -p "Nom de la migration: " name; \
	docker-compose -f $(COMPOSE_FILE) exec backend alembic revision --autogenerate -m "$$name"

shell: ## Ouvrir un shell dans le conteneur backend
	docker-compose -f $(COMPOSE_FILE) exec backend bash

shell-db: ## Ouvrir un shell PostgreSQL
	docker-compose -f $(COMPOSE_FILE) exec db psql -U stelleworld -d stelleworld

backup-db: ## Sauvegarder la base de données
	docker-compose -f $(COMPOSE_FILE) exec db pg_dump -U stelleworld stelleworld > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restaurer la base de données (usage: make restore-db FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore-db FILE=backup.sql"; exit 1; fi
	docker-compose -f $(COMPOSE_FILE) exec -T db psql -U stelleworld stelleworld < $(FILE)

setup: ## Installation initiale complète
	@echo "🚀 Installation de StelleWorld..."
	@echo "📋 Copie du fichier de configuration..."
	cp .env_example .env
	@echo "⚠️  IMPORTANT: Éditez le fichier .env avec vos configurations"
	@echo "🏗️  Construction des images..."
	make build
	@echo "🗄️  Initialisation de la base de données..."
	make dev
	sleep 10
	make migrate
	@echo "✅ Installation terminée!"
	@echo "🌐 Application: http://localhost:8080"
	@echo "📖 Documentation API: http://localhost:8000/docs"

status: ## Afficher le statut des services
	docker-compose -f $(COMPOSE_FILE) ps

restart: ## Redémarrer les services
	docker-compose -f $(COMPOSE_FILE) restart

update: ## Mettre à jour et redéployer
	git pull
	make build
	make migrate
	make restart

health: ## Vérifier la santé des services
	@echo "🔍 Vérification de l'état des services..."
	@curl -f http://localhost:8000/health 2>/dev/null && echo "✅ Backend OK" || echo "❌ Backend KO"
	@curl -f http://localhost:8080 2>/dev/null && echo "✅ Frontend OK" || echo "❌ Frontend KO"

monitor: ## Ouvrir le monitoring des ressources
	docker stats

worker-tasks: ## Afficher les tâches Celery
	docker-compose -f $(COMPOSE_FILE) exec worker celery -A celery_app inspect active

worker-stats: ## Statistiques du worker
	docker-compose -f $(COMPOSE_FILE) exec worker celery -A celery_app inspect stats

# Développement
dev-install: ## Installation des dépendances de développement
	pip install -r backend/requirements.txt
	npm install

dev-run: ## Lancer en mode développement sans Docker
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	cd frontend && python -m http.server 8080

dev-backend: ## Lancer uniquement le backend sans Docker
	cd backend && python run.py

# Production
prod-deploy: ## Déploiement en production
	@echo "🚀 Déploiement en production..."
	git pull
	docker-compose -f $(COMPOSE_FILE_PROD) build
	docker-compose -f $(COMPOSE_FILE_PROD) up -d
	docker-compose -f $(COMPOSE_FILE_PROD) exec backend alembic upgrade head
	@echo "✅ Déploiement terminé!"

# Maintenance
backup-full: ## Sauvegarde complète (DB + uploads)
	mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	make backup-db
	docker cp stelleworld_backend:/app/uploads backups/$(shell date +%Y%m%d_%H%M%S)/

ssl-renew: ## Renouveler les certificats SSL (Let's Encrypt)
	docker-compose -f $(COMPOSE_FILE_PROD) exec nginx certbot renew
	docker-compose -f $(COMPOSE_FILE_PROD) exec nginx nginx -s reload

# Utilitaires
create-admin: ## Créer un utilisateur administrateur
	@read -p "Email admin: " email; \
	read -s -p "Mot de passe: " password; \
	echo ""; \
	docker-compose -f $(COMPOSE_FILE) exec backend python -c "from app.core.database import SessionLocal; from app.models.user import User; from app.core.security import get_password_hash; db = SessionLocal(); admin = User(email='$$email', first_name='Admin', last_name='StelleWorld', hashed_password=get_password_hash('$$password'), is_admin=True, is_active=True); db.add(admin); db.commit(); print('Admin créé avec succès!')"

reset-db: ## Réinitialiser complètement la base de données
	@echo "⚠️  ATTENTION: Cette action va supprimer toutes les données!"
	@read -p "Tapez 'CONFIRM' pour continuer: " confirm; \
	if [ "$$confirm" = "CONFIRM" ]; then \
		docker-compose -f $(COMPOSE_FILE) down -v; \
		docker-compose -f $(COMPOSE_FILE) up -d db redis; \
		sleep 5; \
		make migrate; \
		echo "✅ Base de données réinitialisée"; \
	else \
		echo "❌ Opération annulée"; \
	fi
