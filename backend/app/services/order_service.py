"""
Service Commandes - Logique métier pour les commandes
Principe Single Responsibility: Gère uniquement la logique des commandes
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.services.base import BaseService, IPriceCalculator
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.user import User


class CanadianPriceCalculator(IPriceCalculator):
    """
    Calculateur de prix pour le Canada (Québec)
    
    Principe: Open/Closed
    Peut être étendu pour d'autres régions sans modifier le code existant.
    """
    
    # Taux de taxes au Québec
    TPS_RATE = 0.05  # Taxe sur les produits et services
    TVQ_RATE = 0.09975  # Taxe de vente du Québec
    TOTAL_TAX_RATE = TPS_RATE + TVQ_RATE  # ~14.975%
    
    # Seuil pour livraison gratuite
    FREE_SHIPPING_THRESHOLD = 100.00
    STANDARD_SHIPPING_FEE = 9.99
    
    def calculate_total(self, items: List[dict]) -> float:
        """Calculer le sous-total des items"""
        return sum(
            item.get("price", 0) * item.get("quantity", 1)
            for item in items
        )
    
    def calculate_tax(self, subtotal: float) -> float:
        """Calculer les taxes (TPS + TVQ)"""
        return round(subtotal * self.TOTAL_TAX_RATE, 2)
    
    def calculate_shipping(self, subtotal: float) -> float:
        """Calculer les frais de livraison"""
        if subtotal >= self.FREE_SHIPPING_THRESHOLD:
            return 0.0
        return self.STANDARD_SHIPPING_FEE
    
    def apply_discount(self, total: float, discount_code: str) -> float:
        """Appliquer une remise (à implémenter avec système de codes promo)"""
        # TODO: Implémenter la logique des codes promo
        return total


class OrderService(BaseService):
    """
    Service métier pour les commandes
    
    Responsabilités:
    - Création et gestion des commandes
    - Calcul des totaux (délégué au PriceCalculator)
    - Gestion des statuts
    - Validation des commandes
    """
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.price_calculator = CanadianPriceCalculator()
    
    def create_order(
        self,
        user: User,
        cart_items: List[dict],
        shipping_address: dict,
        billing_address: Optional[dict] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Créer une nouvelle commande"""
        
        # Valider les items du panier
        validated_items = self._validate_cart_items(cart_items)
        if not validated_items["valid"]:
            return {"success": False, "error": validated_items["error"]}
        
        # Calculer les montants
        subtotal = self.price_calculator.calculate_total(cart_items)
        tax_amount = self.price_calculator.calculate_tax(subtotal)
        shipping_amount = self.price_calculator.calculate_shipping(subtotal)
        total_amount = subtotal + tax_amount + shipping_amount
        
        # Générer le numéro de commande
        order_number = self._generate_order_number()
        
        # Adresse de facturation par défaut
        if not billing_address:
            billing_address = shipping_address
        
        # Créer la commande
        order = Order(
            order_number=order_number,
            user_id=user.id,
            subtotal=subtotal,
            tax_amount=tax_amount,
            shipping_amount=shipping_amount,
            total_amount=total_amount,
            status=OrderStatus.PENDING,
            payment_status=PaymentStatus.PENDING,
            shipping_first_name=shipping_address.get("first_name"),
            shipping_last_name=shipping_address.get("last_name"),
            shipping_email=shipping_address.get("email"),
            shipping_phone=shipping_address.get("phone"),
            shipping_address_line1=shipping_address.get("address_line1"),
            shipping_address_line2=shipping_address.get("address_line2"),
            shipping_city=shipping_address.get("city"),
            shipping_postal_code=shipping_address.get("postal_code"),
            shipping_country=shipping_address.get("country", "Canada"),
            billing_first_name=billing_address.get("first_name"),
            billing_last_name=billing_address.get("last_name"),
            billing_email=billing_address.get("email"),
            billing_address_line1=billing_address.get("address_line1"),
            billing_city=billing_address.get("city"),
            billing_postal_code=billing_address.get("postal_code"),
            billing_country=billing_address.get("country", "Canada"),
            notes=notes
        )
        
        self.db.add(order)
        self.db.flush()
        
        # Créer les items de commande
        for item in cart_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item.get("id"),
                product_name=item.get("name"),
                product_description=item.get("short_description", ""),
                product_image_url=item.get("image", ""),
                quantity=item.get("quantity", 1),
                unit_price=item.get("price"),
                total_price=item.get("price") * item.get("quantity", 1)
            )
            self.db.add(order_item)
            
            # Mettre à jour le stock
            self._update_product_stock(item.get("id"), item.get("quantity", 1))
        
        self.db.commit()
        self.db.refresh(order)
        
        self._log_action("CREATE", "Order", order.id)
        
        return {
            "success": True,
            "order_id": order.id,
            "order_number": order.order_number,
            "total_amount": total_amount
        }
    
    def create_whatsapp_order(
        self,
        cart_items: List[dict],
        customer_info: Optional[dict] = None
    ) -> Dict[str, Any]:
        """Créer une commande WhatsApp (sans authentification complète)"""
        
        # Récupérer ou créer l'utilisateur guest
        customer_email = customer_info.get("email", "guest@stelleworld.com") if customer_info else "guest@stelleworld.com"
        customer_name = customer_info.get("name", "Client WhatsApp") if customer_info else "Client WhatsApp"
        
        user = self.db.query(User).filter(User.email == customer_email).first()
        if not user:
            from app.core.security import get_password_hash
            user = User(
                email=customer_email,
                first_name=customer_name.split()[0] if customer_name else "Client",
                last_name=customer_name.split()[-1] if len(customer_name.split()) > 1 else "WhatsApp",
                hashed_password=get_password_hash("whatsapp_guest"),
                is_active=True,
                country="Canada"
            )
            self.db.add(user)
            self.db.flush()
        
        # Créer la commande avec adresse par défaut
        shipping_address = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": customer_info.get("phone", "") if customer_info else "",
            "address_line1": "À définir via WhatsApp",
            "city": "Montréal",
            "postal_code": "H0H 0H0",
            "country": "Canada"
        }
        
        result = self.create_order(
            user=user,
            cart_items=cart_items,
            shipping_address=shipping_address,
            notes="Commande créée via WhatsApp"
        )
        
        return result
    
    def update_status(
        self,
        order_id: int,
        new_status: OrderStatus,
        tracking_number: Optional[str] = None,
        admin_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Mettre à jour le statut d'une commande"""
        
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"success": False, "error": "Commande non trouvée"}
        
        old_status = order.status
        order.status = new_status
        
        # Mettre à jour les dates
        now = datetime.utcnow()
        if new_status == OrderStatus.CONFIRMED and not order.confirmed_at:
            order.confirmed_at = now
        elif new_status == OrderStatus.SHIPPED and not order.shipped_at:
            order.shipped_at = now
        elif new_status == OrderStatus.DELIVERED and not order.delivered_at:
            order.delivered_at = now
        
        if tracking_number:
            order.tracking_number = tracking_number
        if admin_notes:
            order.admin_notes = admin_notes
        
        self.db.commit()
        
        self._log_action("STATUS_UPDATE", "Order", order_id)
        
        return {
            "success": True,
            "order_id": order_id,
            "old_status": old_status.value,
            "new_status": new_status.value
        }
    
    def get_order_stats(self) -> Dict[str, Any]:
        """Récupérer les statistiques des commandes"""
        
        total_orders = self.db.query(Order).count()
        
        total_revenue = self.db.query(func.sum(Order.total_amount)).filter(
            Order.payment_status == PaymentStatus.PAID
        ).scalar() or 0
        
        pending_orders = self.db.query(Order).filter(
            Order.status == OrderStatus.PENDING
        ).count()
        
        today = datetime.utcnow().date()
        today_orders = self.db.query(Order).filter(
            func.date(Order.created_at) == today
        ).count()
        
        return {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "pending_orders": pending_orders,
            "today_orders": today_orders
        }
    
    def validate(self, data: dict) -> bool:
        """Valider les données d'une commande"""
        required_fields = ["cart_items", "shipping_address"]
        for field in required_fields:
            if field not in data:
                return False
        
        if not data.get("cart_items"):
            return False
        
        return True
    
    def _validate_cart_items(self, cart_items: List[dict]) -> Dict[str, Any]:
        """Valider les items du panier"""
        if not cart_items:
            return {"valid": False, "error": "Panier vide"}
        
        for item in cart_items:
            product_id = item.get("id")
            quantity = item.get("quantity", 1)
            
            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                return {"valid": False, "error": f"Produit {product_id} non trouvé"}
            
            if not product.is_active:
                return {"valid": False, "error": f"Produit {product.name} indisponible"}
            
            if product.track_inventory and product.stock_quantity < quantity:
                if not product.allow_backorder:
                    return {"valid": False, "error": f"Stock insuffisant pour {product.name}"}
        
        return {"valid": True}
    
    def _update_product_stock(self, product_id: int, quantity: int):
        """Mettre à jour le stock d'un produit"""
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if product and product.track_inventory:
            product.stock_quantity = max(0, product.stock_quantity - quantity)
            product.sales_count += quantity
    
    def _generate_order_number(self, prefix: str = "ST") -> str:
        """Générer un numéro de commande unique"""
        date_part = datetime.now().strftime('%Y%m%d')
        unique_part = str(uuid.uuid4())[:8].upper()
        return f"{prefix}-{date_part}-{unique_part}"


# Factory function pour l'injection de dépendances
def get_order_service(db: Session) -> OrderService:
    """Factory pour créer une instance de OrderService"""
    return OrderService(db)
