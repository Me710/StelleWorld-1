"""
Middleware pour la protection des routes d'administration
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import verify_token, get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


class AdminMiddleware:
    """Middleware pour protéger les routes d'administration"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        path = request.url.path
        
        # Vérifier si c'est une route d'administration
        if self.is_admin_route(path):
            # Permettre l'accès à la page de login
            if path == "/admin/login":
                await self.app(scope, receive, send)
                return
            
            # Vérifier l'authentification pour les autres routes admin
            auth_result = await self.check_admin_auth(request)
            
            if not auth_result["authenticated"]:
                # Rediriger vers la page de login si pas authentifié
                if self.is_html_route(path):
                    response = RedirectResponse(url="/admin/login", status_code=302)
                    await response(scope, receive, send)
                    return
                else:
                    # Pour les API, retourner 401
                    response = HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentification administrateur requise"
                    )
                    await response(scope, receive, send)
                    return
            
            elif not auth_result["is_admin"]:
                # Utilisateur connecté mais pas admin
                if self.is_html_route(path):
                    response = RedirectResponse(url="/", status_code=302)
                    await response(scope, receive, send)
                    return
                else:
                    response = HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Privilèges administrateur requis"
                    )
                    await response(scope, receive, send)
                    return
        
        # Continuer le traitement normal
        await self.app(scope, receive, send)
    
    def is_admin_route(self, path: str) -> bool:
        """Vérifier si la route est une route d'administration"""
        admin_prefixes = [
            "/admin",
            "/api/admin"
        ]
        
        return any(path.startswith(prefix) for prefix in admin_prefixes)
    
    def is_html_route(self, path: str) -> bool:
        """Vérifier si c'est une route HTML (pas API)"""
        return not path.startswith("/api/")
    
    async def check_admin_auth(self, request: Request) -> dict:
        """Vérifier l'authentification administrateur"""
        
        try:
            # Essayer de récupérer le token depuis l'en-tête Authorization
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return {"authenticated": False, "is_admin": False}
            
            token = auth_header.split(" ")[1]
            
            # Vérifier le token
            payload = verify_token(token)
            email = payload.get("sub")
            
            if not email:
                return {"authenticated": False, "is_admin": False}
            
            # Vérifier l'utilisateur en base
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
                
                if not user or not user.is_active:
                    return {"authenticated": False, "is_admin": False}
                
                return {
                    "authenticated": True,
                    "is_admin": user.is_admin,
                    "user": user
                }
            finally:
                db.close()
                
        except Exception as e:
            logger.warning(f"Erreur lors de la vérification d'authentification : {e}")
            return {"authenticated": False, "is_admin": False}


def add_admin_middleware(app):
    """Ajouter le middleware d'administration à l'application"""
    app.add_middleware(AdminMiddleware)
    logger.info("Middleware d'administration ajouté")
