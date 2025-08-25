"""
Configuration d'environnement Alembic pour StelleWorld
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Configuration Alembic
config = context.config

# Interpréter le fichier de configuration pour les logs Python
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importer tous les modèles pour qu'Alembic les détecte
from app.core.database import Base
from app.models.user import User
from app.models.product import Category, Product, ProductVariant
from app.models.order import Order, OrderItem
from app.models.subscription import Subscription, SubscriptionItem, SubscriptionInvoice
from app.models.appointment import Appointment, ServiceSlot, BlockedDate
from app.models.chat import ChatConversation, ChatMessage, ChatNotification

# Métadonnées cibles pour l'auto-génération
target_metadata = Base.metadata

# Autres valeurs de configuration depuis le fichier .ini
# peuvent être acquises ici:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_url():
    """Obtenir l'URL de base de données depuis les variables d'environnement"""
    return os.getenv("DATABASE_URL", "sqlite:///./stelleworld.db")


def run_migrations_offline() -> None:
    """Exécuter les migrations en mode 'offline'.
    
    Cela configure le contexte avec juste une URL
    et non un Engine, bien qu'un Engine soit aussi acceptable
    ici. En sautant la création d'Engine, nous n'avons même pas besoin
    d'un DBAPI disponible.
    
    Les appels à context.execute() émettent ici la chaîne SQL donnée
    au fichier de script.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Exécuter les migrations en mode 'online'.
    
    Dans ce scénario, nous devons créer un Engine
    et associer une connexion avec le contexte.
    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
