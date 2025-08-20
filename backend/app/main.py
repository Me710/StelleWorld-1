"""
StelleWorld - Boutique en ligne interactive
Point d'entrée principal de l'API FastAPI
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, products, orders, subscriptions, appointments, chat, analytics
from app.websocket.chat_handler import chat_router

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

@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    """Page profil utilisateur"""
    return templates.TemplateResponse("user/profile.html", {"request": request})

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    """Dashboard administrateur"""
    return templates.TemplateResponse("admin/dashboard.html", {"request": request})

# Health check
@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "service": "StelleWorld API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
