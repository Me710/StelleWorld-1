"""
Fixtures communes pour les tests StelleWorld
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.models.user import User
from app.models.product import Category, Product
from app.core.security import get_password_hash, create_access_token


# Base de données de test en mémoire
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Session de base de données de test"""
    
    # Créer les tables
    Base.metadata.create_all(bind=engine)
    
    # Créer une session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # Supprimer les tables après le test
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Client de test FastAPI"""
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    """Utilisateur administrateur de test"""
    
    user = User(
        email="admin@test.com",
        first_name="Admin",
        last_name="Test",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_admin=True,
        is_verified=True
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user


@pytest.fixture
def regular_user(db_session):
    """Utilisateur normal de test"""
    
    user = User(
        email="user@test.com",
        first_name="User",
        last_name="Test",
        hashed_password=get_password_hash("user123"),
        is_active=True,
        is_admin=False,
        is_verified=True
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user


@pytest.fixture
def admin_token(admin_user):
    """Token d'authentification administrateur"""
    
    return create_access_token(data={"sub": admin_user.email})


@pytest.fixture
def user_token(regular_user):
    """Token d'authentification utilisateur normal"""
    
    return create_access_token(data={"sub": regular_user.email})


@pytest.fixture
def admin_headers(admin_token):
    """Headers d'authentification admin"""
    
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def user_headers(user_token):
    """Headers d'authentification utilisateur"""
    
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def test_category(db_session):
    """Catégorie de test"""
    
    category = Category(
        name="Test Category",
        description="Catégorie pour les tests",
        slug="test-category",
        is_active=True
    )
    
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    
    return category


@pytest.fixture
def test_product(db_session, test_category):
    """Produit de test"""
    
    product = Product(
        name="Produit Test",
        description="Produit pour les tests",
        slug="produit-test",
        price=99.99,
        stock_quantity=10,
        category_id=test_category.id,
        is_active=True
    )
    
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    return product


@pytest.fixture
def sample_product_data():
    """Données pour créer un produit"""
    
    return {
        "name": "Nouveau Produit",
        "description": "Description du nouveau produit",
        "price": 49.99,
        "stock_quantity": 5,
        "is_active": True
    }
