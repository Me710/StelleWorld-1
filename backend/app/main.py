"""
StelleWorld - Boutique en ligne interactive
Point d'entrée principal de l'API FastAPI
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

# Handle both direct execution and package import
try:
    from .core.config import settings
    from .core.database import engine, Base
    from .api import auth, products, orders, subscriptions, appointments, chat, analytics, admin, banner
    from .websocket.chat_handler import router as chat_router
except ImportError:
    # When running directly, use absolute imports
    from app.core.config import settings
    from app.core.database import engine, Base
    from app.api import auth, products, orders, subscriptions, appointments, chat, analytics, admin, banner
    from app.websocket.chat_handler import router as chat_router

# Création des tables
Base.metadata.create_all(bind=engine)

# Initialisation de l'application FastAPI
app = FastAPI(
    title="StelleWorld API",
    description="API pour boutique en ligne interactive avec chat temps réel",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montage des fichiers statiques
app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")

# Configuration des templates
templates = Jinja2Templates(directory="../frontend/templates")

# Routes API
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(banner.router, tags=["Banners"])

# WebSocket pour chat temps réel
app.include_router(chat_router, prefix="/ws")

# Routes Frontend
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Page d'accueil"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/products", response_class=HTMLResponse)
async def products_page(request: Request):
    """Page catalogue produits"""
    return templates.TemplateResponse("products/catalog.html", {"request": request})

@app.get("/products/catalog", response_class=HTMLResponse)
async def catalog_page(request: Request):
    """Page catalogue e-commerce"""
    return templates.TemplateResponse("products/catalog.html", {"request": request})

@app.get("/products/demo", response_class=HTMLResponse)
async def demo_page(request: Request):
    """Page de démonstration de l'interface e-commerce"""
    return templates.TemplateResponse("products/demo.html", {"request": request})

@app.get("/cart", response_class=HTMLResponse)
async def cart_page(request: Request):
    """Page panier"""
    return templates.TemplateResponse("cart/cart.html", {"request": request})

@app.get("/checkout", response_class=HTMLResponse)
async def checkout_page(request: Request):
    """Page de commande"""
    return templates.TemplateResponse("cart/checkout.html", {"request": request})

@app.get("/appointments", response_class=HTMLResponse)
async def appointments_page(request: Request):
    """Page de réservation"""
    return templates.TemplateResponse("appointments/booking.html", {"request": request})

@app.get("/subscriptions", response_class=HTMLResponse)
async def subscriptions_page(request: Request):
    """Page des abonnements"""
    return templates.TemplateResponse("subscriptions/subscription.html", {"request": request})

@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    """Page profil utilisateur"""
    return templates.TemplateResponse("user/profile.html", {"request": request})

@app.get("/admin/login", response_class=HTMLResponse)
async def admin_login_page(request: Request):
    """Page de connexion administrateur"""
    return templates.TemplateResponse("admin/login.html", {"request": request})

@app.get("/admin/access-denied", response_class=HTMLResponse)
async def admin_access_denied(request: Request):
    """Page d'accès refusé pour l'administration"""
    return templates.TemplateResponse("admin/access-denied.html", {"request": request})

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    """Dashboard administrateur"""
    return templates.TemplateResponse("admin/dashboard.html", {"request": request})

@app.get("/admin/products", response_class=HTMLResponse)
async def admin_products(request: Request):
    """Page de gestion des produits"""
    return templates.TemplateResponse("admin/products.html", {"request": request})

@app.get("/admin/products/create", response_class=HTMLResponse)
async def admin_create_product(request: Request):
    """Page de création de produit"""
    return templates.TemplateResponse("admin/product-form.html", {"request": request})

@app.get("/admin/products/{product_id}/edit", response_class=HTMLResponse)
async def admin_edit_product(request: Request):
    """Page de modification de produit"""
    return templates.TemplateResponse("admin/product-form.html", {"request": request})

@app.get("/admin/orders", response_class=HTMLResponse)
async def admin_orders(request: Request):
    """Page de gestion des commandes"""
    return templates.TemplateResponse("admin/orders.html", {"request": request})

@app.get("/admin/customers", response_class=HTMLResponse)
async def admin_customers(request: Request):
    """Page de gestion des clients"""
    return templates.TemplateResponse("admin/customers.html", {"request": request})

@app.get("/admin/inventory", response_class=HTMLResponse)
async def admin_inventory(request: Request):
    """Page de gestion de l'inventaire"""
    return templates.TemplateResponse("admin/inventory.html", {"request": request})

@app.get("/admin/categories", response_class=HTMLResponse)
async def admin_categories(request: Request):
    """Page de gestion des catégories"""
    return templates.TemplateResponse("admin/categories.html", {"request": request})

@app.get("/admin/stats/sales", response_class=HTMLResponse)
async def admin_sales_stats(request: Request):
    """Page des statistiques de ventes"""
    return templates.TemplateResponse("admin/stats/sales.html", {"request": request})

@app.get("/admin/banner", response_class=HTMLResponse)
async def admin_banner(request: Request):
    """Page de gestion de la bannière d'annonce"""
    return templates.TemplateResponse("admin/banner.html", {"request": request})

# Routes Collections (inspiré de bswbeautyca.com)
@app.get("/collections", response_class=HTMLResponse)
async def collections_page(request: Request):
    """Page principale des collections - affiche toutes les catégories"""
    return templates.TemplateResponse("collections.html", {"request": request})

@app.get("/collections/{collection_slug}", response_class=HTMLResponse)
async def collection_page(request: Request, collection_slug: str):
    """Page de collection dynamique - affiche les produits d'une catégorie"""
    from app.core.database import get_db
    from app.models.product import Category
    
    # Slugs désactivés (retirés du menu)
    disabled_slugs = ['hair', 'beauty', 'tools', 'wigs']
    
    # Bloquer l'accès aux collections désactivées
    if collection_slug in disabled_slugs:
        raise HTTPException(status_code=404, detail="Cette collection n'est plus disponible")
    
    # Récupérer la session de base de données
    db = next(get_db())
    
    try:
        # Récupérer la catégorie par slug
        category = db.query(Category).filter(
            Category.slug == collection_slug,
            Category.is_active == True
        ).first()
        
        if category:
            # Catégorie trouvée - utiliser les vraies données
            return templates.TemplateResponse("products/collection.html", {
                "request": request,
                "category_id": category.id,
                "category_slug": category.slug,
                "category_name": category.name,
                "category_description": category.description or f"Découvrez notre sélection de {category.name.lower()}"
            })
        else:
            # Catégorie non trouvée - utiliser le slug comme fallback
            # Cela permet aux liens de fonctionner même si la catégorie n'est pas encore en DB
            category_name = collection_slug.replace('-', ' ').title()
            return templates.TemplateResponse("products/collection.html", {
                "request": request,
                "category_id": None,
                "category_slug": collection_slug,
                "category_name": category_name,
                "category_description": f"Découvrez notre sélection de {category_name.lower()}"
            })
    finally:
        db.close()

@app.get("/contact", response_class=HTMLResponse)
async def contact_page(request: Request):
    """Page de contact"""
    return templates.TemplateResponse("contact.html", {"request": request})

# Health check
@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "service": "StelleWorld API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",  # Fixed: use the correct module path
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
