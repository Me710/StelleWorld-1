-- Script d'initialisation de la base de données StelleWorld
-- Ce script est exécuté automatiquement au premier lancement de PostgreSQL

-- Création de la base de données si elle n'existe pas
-- (Docker crée automatiquement la DB depuis POSTGRES_DB)

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Index pour la recherche full-text (sera utilisé pour les produits)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Fonction pour nettoyer le texte pour la recherche
CREATE OR REPLACE FUNCTION clean_text(text) RETURNS text AS $$
BEGIN
    RETURN lower(unaccent($1));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Commentaires sur la base de données
COMMENT ON DATABASE stelleworld IS 'Base de données StelleWorld - Boutique en ligne interactive';

-- Permissions (l'utilisateur stelleworld est déjà créé par Docker)
GRANT ALL PRIVILEGES ON DATABASE stelleworld TO stelleworld;

-- Préparer pour les futures tables
-- (Les tables seront créées par Alembic lors des migrations)
