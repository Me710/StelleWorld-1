"""
Service Notifications - Gestion des notifications multi-canaux
Principe Single Responsibility: Gère uniquement l'envoi de notifications
"""

from typing import Optional, Dict, Any
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session

from app.services.base import INotificationSender


class EmailNotificationSender(INotificationSender):
    """
    Envoyeur de notifications par email
    
    Principe: Open/Closed
    Peut être étendu pour différents providers (SendGrid, Mailgun, etc.)
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
    
    def send(self, recipient: str, message: str, subject: str = "Notification StelleWorld") -> bool:
        """Envoyer un email"""
        # TODO: Implémenter avec un vrai service email
        print(f"[EMAIL] To: {recipient}, Subject: {subject}")
        print(f"[EMAIL] Message: {message}")
        return True


class WhatsAppNotificationSender(INotificationSender):
    """
    Envoyeur de notifications WhatsApp
    """
    
    def __init__(self, phone_number: str):
        self.phone_number = phone_number
    
    def send(self, recipient: str, message: str) -> bool:
        """Envoyer un message WhatsApp"""
        # TODO: Implémenter avec l'API WhatsApp Business
        print(f"[WHATSAPP] To: {recipient}")
        print(f"[WHATSAPP] Message: {message}")
        return True
    
    def generate_link(self, message: str) -> str:
        """Générer un lien wa.me"""
        import urllib.parse
        encoded_message = urllib.parse.quote(message)
        return f"https://wa.me/{self.phone_number}?text={encoded_message}"


class TelegramNotificationSender(INotificationSender):
    """
    Envoyeur de notifications Telegram (pour les alertes admin)
    """
    
    def __init__(self, bot_token: str, chat_id: str):
        self.bot_token = bot_token
        self.chat_id = chat_id
    
    def send(self, recipient: str, message: str) -> bool:
        """Envoyer un message Telegram"""
        # TODO: Implémenter avec l'API Telegram Bot
        print(f"[TELEGRAM] To: {self.chat_id}")
        print(f"[TELEGRAM] Message: {message}")
        return True


class NotificationService:
    """
    Service de notifications multi-canaux
    
    Responsabilités:
    - Orchestrer l'envoi de notifications
    - Choisir le bon canal selon le contexte
    - Formater les messages
    
    Principe: Dependency Injection
    Les senders sont injectés, permettant de changer l'implémentation.
    """
    
    def __init__(
        self,
        email_sender: Optional[EmailNotificationSender] = None,
        whatsapp_sender: Optional[WhatsAppNotificationSender] = None,
        telegram_sender: Optional[TelegramNotificationSender] = None
    ):
        self.email_sender = email_sender or EmailNotificationSender()
        self.whatsapp_sender = whatsapp_sender
        self.telegram_sender = telegram_sender
    
    def notify_order_created(self, order_data: Dict[str, Any]) -> bool:
        """Notifier qu'une commande a été créée"""
        
        # Notification email au client
        if order_data.get("customer_email"):
            message = self._format_order_confirmation(order_data)
            self.email_sender.send(
                recipient=order_data["customer_email"],
                message=message,
                subject=f"Confirmation de commande {order_data.get('order_number')}"
            )
        
        # Notification Telegram à l'admin
        if self.telegram_sender:
            admin_message = self._format_admin_order_notification(order_data)
            self.telegram_sender.send("admin", admin_message)
        
        return True
    
    def notify_order_shipped(self, order_data: Dict[str, Any]) -> bool:
        """Notifier qu'une commande a été expédiée"""
        
        if order_data.get("customer_email"):
            message = self._format_shipping_notification(order_data)
            self.email_sender.send(
                recipient=order_data["customer_email"],
                message=message,
                subject=f"Votre commande {order_data.get('order_number')} a été expédiée"
            )
        
        return True
    
    def notify_appointment_reminder(self, appointment_data: Dict[str, Any]) -> bool:
        """Envoyer un rappel de rendez-vous"""
        
        message = self._format_appointment_reminder(appointment_data)
        
        # Email
        if appointment_data.get("client_email"):
            self.email_sender.send(
                recipient=appointment_data["client_email"],
                message=message,
                subject="Rappel de votre rendez-vous StelleWorld"
            )
        
        # WhatsApp si disponible
        if self.whatsapp_sender and appointment_data.get("client_phone"):
            self.whatsapp_sender.send(
                recipient=appointment_data["client_phone"],
                message=message
            )
        
        return True
    
    def notify_low_stock(self, product_data: Dict[str, Any]) -> bool:
        """Notifier d'un stock faible"""
        
        if self.telegram_sender:
            message = f"⚠️ Stock faible: {product_data.get('name')}\n"
            message += f"Quantité restante: {product_data.get('stock_quantity')}"
            self.telegram_sender.send("admin", message)
        
        return True
    
    def _format_order_confirmation(self, order_data: Dict[str, Any]) -> str:
        """Formater le message de confirmation de commande"""
        return f"""
Bonjour,

Merci pour votre commande chez StelleWorld !

Numéro de commande: {order_data.get('order_number')}
Total: {order_data.get('total_amount', 0):.2f} $ CAD

Nous vous tiendrons informé de l'expédition.

Cordialement,
L'équipe StelleWorld
"""
    
    def _format_admin_order_notification(self, order_data: Dict[str, Any]) -> str:
        """Formater la notification admin pour nouvelle commande"""
        return f"""
🛒 Nouvelle commande !

Numéro: {order_data.get('order_number')}
Client: {order_data.get('customer_name', 'N/A')}
Total: {order_data.get('total_amount', 0):.2f} $ CAD
Articles: {order_data.get('items_count', 0)}
"""
    
    def _format_shipping_notification(self, order_data: Dict[str, Any]) -> str:
        """Formater la notification d'expédition"""
        tracking = order_data.get('tracking_number', '')
        tracking_info = f"\nNuméro de suivi: {tracking}" if tracking else ""
        
        return f"""
Bonjour,

Votre commande {order_data.get('order_number')} a été expédiée !{tracking_info}

Livraison estimée: 2-5 jours ouvrables

Cordialement,
L'équipe StelleWorld
"""
    
    def _format_appointment_reminder(self, appointment_data: Dict[str, Any]) -> str:
        """Formater le rappel de rendez-vous"""
        return f"""
Rappel de votre rendez-vous StelleWorld

Service: {appointment_data.get('service_name')}
Date: {appointment_data.get('scheduled_date')}
Lieu: {appointment_data.get('location', 'À confirmer')}

À bientôt !
L'équipe StelleWorld
"""


# Factory function pour l'injection de dépendances
def get_notification_service() -> NotificationService:
    """Factory pour créer une instance de NotificationService"""
    from app.core.config import settings
    
    # Créer les senders avec les configurations
    whatsapp_sender = WhatsAppNotificationSender(
        phone_number=getattr(settings, 'WHATSAPP_NUMBER', '')
    ) if hasattr(settings, 'WHATSAPP_NUMBER') else None
    
    telegram_sender = TelegramNotificationSender(
        bot_token=getattr(settings, 'TELEGRAM_BOT_TOKEN', ''),
        chat_id=getattr(settings, 'TELEGRAM_CHAT_ID', '')
    ) if hasattr(settings, 'TELEGRAM_BOT_TOKEN') else None
    
    return NotificationService(
        whatsapp_sender=whatsapp_sender,
        telegram_sender=telegram_sender
    )
