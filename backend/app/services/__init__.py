"""
Couche Services Métier - StelleWorld
====================================

Architecture respectant les principes SOLID:

- Single Responsibility Principle (SRP):
  Chaque service a une seule responsabilité clairement définie.
  
- Open/Closed Principle (OCP):
  Les services sont ouverts à l'extension mais fermés à la modification.
  Utilisation de classes abstraites et d'interfaces.
  
- Liskov Substitution Principle (LSP):
  Les sous-classes peuvent remplacer leurs classes parentes.
  
- Interface Segregation Principle (ISP):
  Des interfaces spécifiques plutôt qu'une interface générale.
  
- Dependency Inversion Principle (DIP):
  Dépendance sur les abstractions, pas les implémentations concrètes.
  Utilisation de l'injection de dépendances de FastAPI.

Usage:
    from app.services import ProductService, OrderService
    
    # Dans un endpoint FastAPI
    @router.get("/products")
    def get_products(
        product_service: ProductService = Depends(get_product_service)
    ):
        return product_service.get_all()
"""

from app.services.product_service import ProductService
from app.services.order_service import OrderService
from app.services.notification_service import NotificationService

__all__ = [
    "ProductService",
    "OrderService",
    "NotificationService"
]
