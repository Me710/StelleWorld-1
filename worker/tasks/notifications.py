"""
Tâches Celery pour les notifications et communications
"""

import asyncio
import os
from datetime import datetime, timedelta
from celery import current_task
from celery_app import celery_app
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://stelleworld:password@localhost:5432/stelleworld")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Configuration Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


@celery_app.task(bind=True)
def send_telegram_notification(self, message, chat_id=None):
    """Envoyer une notification Telegram"""
    try:
        if not TELEGRAM_BOT_TOKEN:
            return {"status": "error", "message": "Token Telegram non configuré"}
        
        import requests
        
        target_chat_id = chat_id or TELEGRAM_CHAT_ID
        if not target_chat_id:
            return {"status": "error", "message": "Chat ID Telegram non configuré"}
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        
        payload = {
            "chat_id": target_chat_id,
            "text": message,
            "parse_mode": "HTML"
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        return {
            "status": "success",
            "message": "Notification Telegram envoyée",
            "telegram_response": response.json()
        }
        
    except Exception as exc:
        self.retry(countdown=30, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def send_new_order_notification(self, order_id):
    """Envoyer une notification pour une nouvelle commande"""
    try:
        db = SessionLocal()
        
        from backend.app.models.order import Order
        
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"status": "error", "message": "Commande non trouvée"}
        
        message = f"""
🛒 <b>Nouvelle commande reçue!</b>

📋 <b>Commande:</b> {order.order_number}
👤 <b>Client:</b> {order.user.full_name}
📧 <b>Email:</b> {order.user.email}
💰 <b>Montant:</b> {order.total_amount}€
📦 <b>Articles:</b> {order.total_items}

🏠 <b>Adresse de livraison:</b>
{order.shipping_first_name} {order.shipping_last_name}
{order.shipping_address_line1}
{order.shipping_city} {order.shipping_postal_code}

⏰ <b>Date:</b> {order.created_at.strftime('%d/%m/%Y à %H:%M')}
        """
        
        db.close()
        
        # Envoyer la notification
        result = send_telegram_notification.delay(message)
        
        return {
            "status": "success",
            "message": f"Notification envoyée pour la commande {order.order_number}"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=2, exc=exc)


@celery_app.task(bind=True)
def send_new_chat_message_notification(self, conversation_id, message_content):
    """Envoyer une notification pour un nouveau message de chat"""
    try:
        db = SessionLocal()
        
        from backend.app.models.chat import ChatConversation
        
        conversation = db.query(ChatConversation).filter(
            ChatConversation.id == conversation_id
        ).first()
        
        if not conversation:
            return {"status": "error", "message": "Conversation non trouvée"}
        
        participant_name = conversation.participant_name
        participant_email = conversation.participant_email
        
        # Limiter la longueur du message affiché
        display_message = message_content[:100] + "..." if len(message_content) > 100 else message_content
        
        notification_message = f"""
💬 <b>Nouveau message de chat!</b>

👤 <b>De:</b> {participant_name}
📧 <b>Email:</b> {participant_email}
💌 <b>Message:</b> {display_message}

📱 <b>Conversation #{conversation_id}</b>
⏰ <b>Reçu:</b> {datetime.utcnow().strftime('%d/%m/%Y à %H:%M')}

Répondez rapidement pour maintenir une excellente expérience client! 🚀
        """
        
        db.close()
        
        # Envoyer la notification
        result = send_telegram_notification.delay(notification_message)
        
        return {
            "status": "success",
            "message": f"Notification chat envoyée pour la conversation {conversation_id}"
        }
        
    except Exception as exc:
        self.retry(countdown=30, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def send_appointment_reminders(self):
    """Envoyer des rappels de rendez-vous"""
    try:
        db = SessionLocal()
        
        from backend.app.models.appointment import Appointment, AppointmentStatus
        
        # Trouver les RDV dans les 24 heures qui n'ont pas encore eu de rappel
        tomorrow = datetime.utcnow() + timedelta(hours=24)
        upcoming_appointments = (
            db.query(Appointment)
            .filter(
                and_(
                    Appointment.scheduled_date <= tomorrow,
                    Appointment.scheduled_date > datetime.utcnow(),
                    Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
                    Appointment.reminder_sent == False
                )
            )
            .all()
        )
        
        sent_count = 0
        
        for appointment in upcoming_appointments:
            # Marquer comme rappel envoyé
            appointment.reminder_sent = True
            appointment.reminder_sent_at = datetime.utcnow()
            
            # Préparer le message de rappel
            reminder_message = f"""
⏰ <b>Rappel de rendez-vous</b>

👤 <b>Client:</b> {appointment.client_name}
📧 <b>Email:</b> {appointment.client_email}
📞 <b>Téléphone:</b> {appointment.client_phone or 'Non renseigné'}

🔧 <b>Service:</b> {appointment.service_name}
📅 <b>Date:</b> {appointment.scheduled_date.strftime('%d/%m/%Y à %H:%M')}
⏱️ <b>Durée:</b> {appointment.duration_minutes} minutes

📝 <b>Notes client:</b> {appointment.client_notes or 'Aucune note'}

📍 <b>Lieu:</b> {appointment.location or 'À définir'}
            """
            
            # Envoyer la notification
            send_telegram_notification.delay(reminder_message)
            sent_count += 1
        
        db.commit()
        db.close()
        
        return {
            "status": "success",
            "reminders_sent": sent_count,
            "message": f"{sent_count} rappels de RDV envoyés"
        }
        
    except Exception as exc:
        self.retry(countdown=300, max_retries=2, exc=exc)


@celery_app.task(bind=True)
def cleanup_expired_chats(self):
    """Nettoyer les conversations de chat expirées"""
    try:
        db = SessionLocal()
        
        from backend.app.models.chat import ChatConversation, ChatStatus
        
        # Fermer automatiquement les conversations inactives depuis 7 jours
        cutoff_date = datetime.utcnow() - timedelta(days=7)
        
        expired_conversations = (
            db.query(ChatConversation)
            .filter(
                and_(
                    ChatConversation.status == ChatStatus.OPEN,
                    ChatConversation.last_message_at < cutoff_date
                )
            )
            .all()
        )
        
        closed_count = 0
        for conversation in expired_conversations:
            conversation.status = ChatStatus.CLOSED
            conversation.closed_at = datetime.utcnow()
            closed_count += 1
        
        db.commit()
        db.close()
        
        return {
            "status": "success",
            "closed_conversations": closed_count,
            "message": f"{closed_count} conversations expirées fermées"
        }
        
    except Exception as exc:
        self.retry(countdown=600, max_retries=1, exc=exc)


@celery_app.task(bind=True)
def send_daily_summary(self):
    """Envoyer un résumé quotidien des activités"""
    try:
        db = SessionLocal()
        
        today = datetime.utcnow().date()
        
        from backend.app.models.order import Order, PaymentStatus
        from backend.app.models.appointment import Appointment
        from backend.app.models.chat import ChatConversation
        from sqlalchemy import func
        
        # Statistiques du jour
        today_orders = (
            db.query(func.count(Order.id))
            .filter(
                and_(
                    func.date(Order.created_at) == today,
                    Order.payment_status == PaymentStatus.PAID
                )
            )
            .scalar() or 0
        )
        
        today_revenue = (
            db.query(func.sum(Order.total_amount))
            .filter(
                and_(
                    func.date(Order.created_at) == today,
                    Order.payment_status == PaymentStatus.PAID
                )
            )
            .scalar() or 0
        )
        
        today_appointments = (
            db.query(func.count(Appointment.id))
            .filter(func.date(Appointment.scheduled_date) == today)
            .scalar() or 0
        )
        
        today_chats = (
            db.query(func.count(ChatConversation.id))
            .filter(func.date(ChatConversation.created_at) == today)
            .scalar() or 0
        )
        
        summary_message = f"""
📊 <b>Résumé quotidien - {today.strftime('%d/%m/%Y')}</b>

🛒 <b>Commandes:</b> {today_orders}
💰 <b>Chiffre d'affaires:</b> {today_revenue:.2f}€
📅 <b>Rendez-vous:</b> {today_appointments}
💬 <b>Nouvelles conversations:</b> {today_chats}

{self._get_performance_emoji(today_orders, today_revenue)} <b>Bonne journée!</b>
        """
        
        db.close()
        
        # Envoyer le résumé
        result = send_telegram_notification.delay(summary_message)
        
        return {
            "status": "success",
            "message": "Résumé quotidien envoyé"
        }
        
    except Exception as exc:
        self.retry(countdown=300, max_retries=1, exc=exc)

    def _get_performance_emoji(self, orders, revenue):
        """Obtenir un emoji basé sur la performance du jour"""
        if orders >= 10 and revenue >= 500:
            return "🎉"
        elif orders >= 5 and revenue >= 200:
            return "😊"
        elif orders >= 1:
            return "👍"
        else:
            return "📈"


@celery_app.task(bind=True)
def send_whatsapp_follow_up(self, user_id, message_type="welcome"):
    """Envoyer un message de suivi WhatsApp (si consenti)"""
    try:
        db = SessionLocal()
        
        from backend.app.models.user import User
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.whatsapp_consent or not user.whatsapp_number:
            return {"status": "skipped", "message": "Utilisateur non éligible pour WhatsApp"}
        
        messages = {
            "welcome": f"Bonjour {user.first_name} ! 👋 Merci de votre inscription sur StelleWorld. Nous sommes ravis de vous compter parmi nos clients !",
            "order_confirmed": f"Bonjour {user.first_name} ! Votre commande a été confirmée. Vous recevrez bientôt un email avec les détails de suivi.",
            "appointment_reminder": f"Bonjour {user.first_name} ! N'oubliez pas votre rendez-vous demain. Nous avons hâte de vous voir !"
        }
        
        message_text = messages.get(message_type, messages["welcome"])
        whatsapp_url = f"https://wa.me/{user.whatsapp_number.replace('+', '').replace(' ', '')}?text={message_text}"
        
        db.close()
        
        # Note: Dans un vrai projet, utiliser l'API WhatsApp Business
        return {
            "status": "success",
            "message": f"Lien WhatsApp généré pour {user.email}",
            "whatsapp_url": whatsapp_url
        }
        
    except Exception as exc:
        self.retry(countdown=120, max_retries=2, exc=exc)
