"""
Tests pour l'authentification administrateur
"""

import pytest
from fastapi import status
from app.core.init_db import create_default_admin


class TestAdminAuthentication:
    """Tests d'authentification administrateur"""
    
    def test_admin_login_success(self, client, admin_user):
        """Test de connexion admin réussie"""
        
        # Données de connexion
        login_data = {
            "username": admin_user.email,
            "password": "admin123"
        }
        
        # Tenter la connexion
        response = client.post("/api/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == admin_user.email
        assert data["user"]["is_admin"] is True
    
    def test_admin_login_wrong_password(self, client, admin_user):
        """Test de connexion admin avec mauvais mot de passe"""
        
        login_data = {
            "username": admin_user.email,
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Email ou mot de passe incorrect" in response.json()["detail"]
    
    def test_admin_login_nonexistent_user(self, client):
        """Test de connexion avec utilisateur inexistant"""
        
        login_data = {
            "username": "nonexistent@test.com",
            "password": "password123"
        }
        
        response = client.post("/api/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_regular_user_cannot_access_admin_api(self, client, user_headers):
        """Test qu'un utilisateur normal ne peut pas accéder aux API admin"""
        
        response = client.get("/api/admin/dashboard", headers=user_headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Privilèges administrateur requis" in response.json()["detail"]
    
    def test_admin_can_access_admin_api(self, client, admin_headers):
        """Test qu'un admin peut accéder aux API admin"""
        
        response = client.get("/api/admin/dashboard", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "overview" in data
        assert "recent_orders" in data
        assert "low_stock_products" in data
    
    def test_unauthenticated_access_to_admin_api(self, client):
        """Test d'accès non authentifié aux API admin"""
        
        response = client.get("/api/admin/dashboard")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_admin_get_current_user_info(self, client, admin_headers, admin_user):
        """Test récupération des infos utilisateur admin"""
        
        response = client.get("/api/auth/me", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["email"] == admin_user.email
        assert data["is_admin"] is True
        assert data["first_name"] == admin_user.first_name
    
    def test_inactive_admin_cannot_login(self, client, db_session):
        """Test qu'un admin inactif ne peut pas se connecter"""
        
        # Créer un admin inactif
        from app.models.user import User
        from app.core.security import get_password_hash
        
        inactive_admin = User(
            email="inactive@test.com",
            first_name="Inactive",
            last_name="Admin",
            hashed_password=get_password_hash("admin123"),
            is_active=False,  # Inactif
            is_admin=True,
            is_verified=True
        )
        
        db_session.add(inactive_admin)
        db_session.commit()
        
        # Tenter la connexion
        login_data = {
            "username": inactive_admin.email,
            "password": "admin123"
        }
        
        response = client.post("/api/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "inactif" in response.json()["detail"].lower()


class TestAdminDatabaseInit:
    """Tests d'initialisation de la base de données"""
    
    def test_create_default_admin(self, db_session):
        """Test de création de l'admin par défaut"""
        
        # Créer l'admin par défaut
        admin = create_default_admin(db_session)
        
        assert admin is not None
        assert admin.email == "admin@stelleworld.com"
        assert admin.is_admin is True
        assert admin.is_active is True
        assert admin.is_verified is True
        
        # Vérifier qu'on ne peut pas créer un doublon
        admin2 = create_default_admin(db_session)
        assert admin2.id == admin.id  # Même utilisateur
    
    def test_init_database_endpoint_requires_admin(self, client, user_headers):
        """Test que l'endpoint d'init DB nécessite les privilèges admin"""
        
        response = client.post("/api/admin/init-database", headers=user_headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_init_database_endpoint_success(self, client, admin_headers):
        """Test de l'endpoint d'initialisation de la DB"""
        
        response = client.post("/api/admin/init-database", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["message"] == "Base de données initialisée avec succès"
        assert "admin_created" in data["data"]
        assert "categories_count" in data["data"]
        assert "products_count" in data["data"]


class TestAdminProductManagement:
    """Tests de gestion des produits par l'admin"""
    
    def test_admin_can_list_products(self, client, admin_headers, test_product):
        """Test que l'admin peut lister les produits"""
        
        response = client.get("/api/admin/products", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert len(data["products"]) >= 1
    
    def test_admin_can_create_product(self, client, admin_headers, test_category, sample_product_data):
        """Test que l'admin peut créer un produit"""
        
        # Préparer les données avec une catégorie valide
        product_data = sample_product_data.copy()
        product_data["category_id"] = test_category.id
        
        # Convertir en FormData pour simuler un formulaire
        form_data = {}
        for key, value in product_data.items():
            form_data[key] = str(value)
        
        response = client.post("/api/admin/products", data=form_data, headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "message" in data
        assert "Produit créé avec succès" in data["message"]
    
    def test_admin_can_update_product(self, client, admin_headers, test_product):
        """Test que l'admin peut modifier un produit"""
        
        update_data = {
            "name": "Produit Modifié",
            "price": "199.99"
        }
        
        response = client.put(f"/api/admin/products/{test_product.id}", data=update_data, headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "message" in data
        assert "mis à jour" in data["message"]
    
    def test_admin_can_delete_product(self, client, admin_headers, test_product):
        """Test que l'admin peut supprimer un produit"""
        
        response = client.delete(f"/api/admin/products/{test_product.id}", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "message" in data
        assert "supprimé" in data["message"]
    
    def test_regular_user_cannot_manage_products(self, client, user_headers, test_product):
        """Test qu'un utilisateur normal ne peut pas gérer les produits"""
        
        # Test création
        response = client.post("/api/admin/products", data={"name": "Test"}, headers=user_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Test modification
        response = client.put(f"/api/admin/products/{test_product.id}", data={"name": "Test"}, headers=user_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Test suppression
        response = client.delete(f"/api/admin/products/{test_product.id}", headers=user_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN
