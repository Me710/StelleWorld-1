"""
Configuration de l'application Celery pour StelleWorld
"""

import os
from celery import Celery

# Configuration Celery
celery_app = Celery(
    "stelleworld_worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=[
        "tasks.analytics",
        "tasks.notifications",
        "tasks.stripe_webhooks"
    ]
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Paris",
    enable_utc=True,
    task_track_started=True,
    task_ignore_result=False,
    task_store_eager_result=True,
    result_expires=3600,  # 1 heure
)

# Configuration des tâches périodiques
celery_app.conf.beat_schedule = {
    # Calcul des best-sellers toutes les heures
    "update-best-sellers": {
        "task": "tasks.analytics.update_best_sellers",
        "schedule": 3600.0,  # Toutes les heures
    },
    
    # Calcul des produits souvent achetés ensemble quotidiennement
    "update-product-combinations": {
        "task": "tasks.analytics.update_product_combinations",
        "schedule": 86400.0,  # Tous les jours à minuit
    },
    
    # Nettoyage des sessions de chat expirées
    "cleanup-expired-chats": {
        "task": "tasks.notifications.cleanup_expired_chats",
        "schedule": 3600.0,  # Toutes les heures
    },
    
    # Rappels de rendez-vous
    "send-appointment-reminders": {
        "task": "tasks.notifications.send_appointment_reminders",
        "schedule": 1800.0,  # Toutes les 30 minutes
    },
}

if __name__ == "__main__":
    celery_app.start()
