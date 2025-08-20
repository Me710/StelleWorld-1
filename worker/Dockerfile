# Dockerfile pour le worker Celery (développement)
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier les requirements depuis le backend
COPY ../backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code du worker
COPY . .

# Commande de démarrage pour le développement
CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info", "--concurrency=2"]
