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
    from .api import auth, products, orders, subscriptions, appointments, chat, analytics, admin, banner, hero, suppliers, invoices
    from .websocket.chat_handler import router as chat_router
except ImportError:
    # When running directly, use absolute imports
    from app.core.config import settings
    from app.core.database import engine, Base
    from app.api import auth, products, orders, subscriptions, appointments, chat, analytics, admin, banner, hero, suppliers, invoices
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

# Configuration CORS - Autoriser le frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier le domaine exact
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "service": "StelleWorld API"}

@app.get("/api/health")
async def api_health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "service": "StelleWorld API", "version": "2.0.0", "database": "PostgreSQL"}

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
app.include_router(hero.router, prefix="/api", tags=["Hero Slider"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])

# WebSocket pour chat temps réel
app.include_router(chat_router, prefix="/ws")

# Health check
@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "service": "StelleWorld API"}

@app.get("/api/health")
async def api_health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "service": "StelleWorld API", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",  # Fixed: use the correct module path
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
