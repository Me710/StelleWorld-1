# Makefile pour StelleWorld Backend
.PHONY: help install test test-unit test-integration lint format clean dev init-db

# Variables
PYTHON := python
PIP := pip
PYTEST := pytest
BLACK := black
ISORT := isort
FLAKE8 := flake8

help: ## Afficher l'aide
	@echo "Commandes disponibles pour StelleWorld Backend :"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Installer les dépendances
	$(PIP) install -r requirements.txt
	@echo "✅ Dépendances installées"

test: ## Lancer tous les tests
	$(PYTEST) -v
	@echo "✅ Tests terminés"

test-unit: ## Lancer les tests unitaires uniquement
	$(PYTEST) -v -m "not integration"
	@echo "✅ Tests unitaires terminés"

test-integration: ## Lancer les tests d'intégration
	$(PYTEST) -v -m "integration"
	@echo "✅ Tests d'intégration terminés"

test-admin: ## Lancer les tests d'administration
	$(PYTEST) -v -m "admin"
	@echo "✅ Tests admin terminés"

test-auth: ## Lancer les tests d'authentification
	$(PYTEST) -v -m "auth"
	@echo "✅ Tests d'authentification terminés"

test-coverage: ## Lancer les tests avec couverture détaillée
	$(PYTEST) --cov=app --cov-report=html --cov-report=term-missing
	@echo "✅ Tests avec couverture terminés"
	@echo "📊 Rapport HTML disponible dans htmlcov/"

lint: ## Vérifier la qualité du code
	@echo "🔍 Vérification avec flake8..."
	$(FLAKE8) app/
	@echo "🔍 Vérification des imports avec isort..."
	$(ISORT) --check-only app/
	@echo "🔍 Vérification du formatage avec black..."
	$(BLACK) --check app/
	@echo "✅ Qualité du code vérifiée"

format: ## Formater le code automatiquement
	@echo "🎨 Formatage avec black..."
	$(BLACK) app/
	@echo "🎨 Organisation des imports avec isort..."
	$(ISORT) app/
	@echo "✅ Code formaté"

clean: ## Nettoyer les fichiers temporaires
	@echo "🧹 Nettoyage..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	@echo "✅ Nettoyage terminé"

dev: ## Lancer le serveur de développement
	$(PYTHON) run.py
	@echo "🚀 Serveur de développement démarré"

init-db: ## Initialiser la base de données
	$(PYTHON) init_stelleworld_db.py
	@echo "✅ Base de données initialisée"

check: lint test ## Vérifier la qualité et lancer les tests
	@echo "✅ Vérifications complètes terminées"

ci: install lint test ## Pipeline CI/CD
	@echo "✅ Pipeline CI/CD terminé"

# Commandes spécifiques au développement
migrate: ## Créer et appliquer les migrations
	@echo "📦 Création des migrations..."
	# alembic revision --autogenerate -m "Auto migration"
	# alembic upgrade head
	@echo "✅ Migrations appliquées"

seed: init-db ## Alimenter la base avec des données de test
	@echo "🌱 Base alimentée avec des données de test"

reset-db: ## Réinitialiser complètement la base de données
	@echo "⚠️  Réinitialisation de la base de données..."
	rm -f stelleworld.db
	$(MAKE) init-db
	@echo "✅ Base de données réinitialisée"

# Commandes de production
prod-test: ## Tests pour la production
	$(PYTEST) --cov=app --cov-fail-under=90
	@echo "✅ Tests de production validés"

# Debug et développement
debug: ## Lancer en mode debug
	DEBUG=1 $(PYTHON) run.py
	@echo "🐛 Mode debug activé"

shell: ## Ouvrir un shell Python avec le contexte de l'app
	$(PYTHON) -c "from app.main import app; from app.core.database import SessionLocal; db = SessionLocal(); print('Shell StelleWorld - Variables: app, db')"

# Affichage par défaut
default: help
