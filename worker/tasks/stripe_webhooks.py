"""
Tâches Celery pour gérer les webhooks Stripe
"""

import os
import json
from datetime import datetime
from celery import current_task
from celery_app import celery_app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://stelleworld:password@localhost:5432/stelleworld")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Configuration Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")


@celery_app.task(bind=True)
def process_payment_succeeded(self, payment_intent_data):
    """Traiter un paiement réussi"""
    try:
        db = SessionLocal()
        
        from backend.app.models.order import Order, PaymentStatus, OrderStatus
        
        payment_intent_id = payment_intent_data.get("id")
        
        # Trouver la commande correspondante
        order = db.query(Order).filter(
            Order.stripe_payment_intent_id == payment_intent_id
        ).first()
        
        if order:
            # Mettre à jour le statut de paiement
            order.payment_status = PaymentStatus.PAID
            order.status = OrderStatus.CONFIRMED
            order.confirmed_at = datetime.utcnow()
            
            db.commit()
            
            # Envoyer notification de nouvelle commande
            from worker.tasks.notifications import send_new_order_notification
            send_new_order_notification.delay(order.id)
            
            return {
                "status": "success",
                "order_id": order.id,
                "order_number": order.order_number,
                "message": "Paiement traité avec succès"
            }
        
        db.close()
        
        return {
            "status": "warning",
            "message": f"Aucune commande trouvée pour le payment_intent {payment_intent_id}"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def process_payment_failed(self, payment_intent_data):
    """Traiter un échec de paiement"""
    try:
        db = SessionLocal()
        
        from backend.app.models.order import Order, PaymentStatus
        
        payment_intent_id = payment_intent_data.get("id")
        
        # Trouver la commande correspondante
        order = db.query(Order).filter(
            Order.stripe_payment_intent_id == payment_intent_id
        ).first()
        
        if order:
            # Mettre à jour le statut de paiement
            order.payment_status = PaymentStatus.FAILED
            
            # Remettre en stock les produits
            for item in order.items:
                if item.product and item.product.track_inventory:
                    item.product.stock_quantity += item.quantity
                    item.product.sales_count -= item.quantity
            
            db.commit()
            
            # Notifier l'échec (optionnel)
            from worker.tasks.notifications import send_telegram_notification
            send_telegram_notification.delay(
                f"❌ Échec de paiement pour la commande {order.order_number} ({order.user.email})"
            )
            
            return {
                "status": "success",
                "order_id": order.id,
                "message": "Échec de paiement traité"
            }
        
        db.close()
        
        return {
            "status": "warning",
            "message": f"Aucune commande trouvée pour le payment_intent {payment_intent_id}"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def process_subscription_created(self, subscription_data):
    """Traiter la création d'un abonnement"""
    try:
        db = SessionLocal()
        
        from backend.app.models.subscription import Subscription, SubscriptionStatus, BillingInterval
        from backend.app.models.user import User
        
        stripe_subscription_id = subscription_data.get("id")
        stripe_customer_id = subscription_data.get("customer")
        
        # Trouver l'utilisateur par customer_id (nécessite une table de mapping)
        # Pour la démo, on cherche par email dans les métadonnées
        customer_email = subscription_data.get("metadata", {}).get("customer_email")
        
        if customer_email:
            user = db.query(User).filter(User.email == customer_email).first()
            
            if user:
                subscription = Subscription(
                    user_id=user.id,
                    stripe_subscription_id=stripe_subscription_id,
                    stripe_customer_id=stripe_customer_id,
                    stripe_price_id=subscription_data.get("items", {}).get("data", [{}])[0].get("price", {}).get("id"),
                    name=subscription_data.get("metadata", {}).get("subscription_name", "Abonnement StelleWorld"),
                    billing_interval=BillingInterval.MONTHLY,  # À adapter selon les données Stripe
                    amount=subscription_data.get("items", {}).get("data", [{}])[0].get("price", {}).get("unit_amount", 0) / 100,
                    currency=subscription_data.get("currency", "eur").upper(),
                    status=SubscriptionStatus.ACTIVE,
                    current_period_start=datetime.fromtimestamp(subscription_data.get("current_period_start")),
                    current_period_end=datetime.fromtimestamp(subscription_data.get("current_period_end")),
                )
                
                db.add(subscription)
                db.commit()
                
                # Notifier la création d'abonnement
                from worker.tasks.notifications import send_telegram_notification
                send_telegram_notification.delay(
                    f"🔄 Nouvel abonnement créé pour {user.email} - {subscription.amount}€/{subscription.billing_interval}"
                )
                
                return {
                    "status": "success",
                    "subscription_id": subscription.id,
                    "user_email": user.email,
                    "message": "Abonnement créé avec succès"
                }
        
        db.close()
        
        return {
            "status": "warning",
            "message": f"Impossible de créer l'abonnement - utilisateur non trouvé"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def process_subscription_updated(self, subscription_data):
    """Traiter la mise à jour d'un abonnement"""
    try:
        db = SessionLocal()
        
        from backend.app.models.subscription import Subscription, SubscriptionStatus
        
        stripe_subscription_id = subscription_data.get("id")
        
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            # Mettre à jour le statut
            stripe_status = subscription_data.get("status")
            if stripe_status == "active":
                subscription.status = SubscriptionStatus.ACTIVE
            elif stripe_status == "canceled":
                subscription.status = SubscriptionStatus.CANCELLED
                subscription.ended_at = datetime.fromtimestamp(subscription_data.get("ended_at", 0))
            elif stripe_status == "past_due":
                subscription.status = SubscriptionStatus.PAST_DUE
            elif stripe_status == "unpaid":
                subscription.status = SubscriptionStatus.UNPAID
            
            # Mettre à jour les dates de période
            subscription.current_period_start = datetime.fromtimestamp(subscription_data.get("current_period_start"))
            subscription.current_period_end = datetime.fromtimestamp(subscription_data.get("current_period_end"))
            
            db.commit()
            
            return {
                "status": "success",
                "subscription_id": subscription.id,
                "new_status": subscription.status,
                "message": "Abonnement mis à jour"
            }
        
        db.close()
        
        return {
            "status": "warning",
            "message": f"Abonnement {stripe_subscription_id} non trouvé"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def process_invoice_payment_succeeded(self, invoice_data):
    """Traiter le paiement réussi d'une facture d'abonnement"""
    try:
        db = SessionLocal()
        
        from backend.app.models.subscription import Subscription, SubscriptionInvoice
        
        stripe_subscription_id = invoice_data.get("subscription")
        stripe_invoice_id = invoice_data.get("id")
        
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            # Créer ou mettre à jour la facture
            invoice = db.query(SubscriptionInvoice).filter(
                SubscriptionInvoice.stripe_invoice_id == stripe_invoice_id
            ).first()
            
            if not invoice:
                invoice = SubscriptionInvoice(
                    subscription_id=subscription.id,
                    stripe_invoice_id=stripe_invoice_id,
                    stripe_payment_intent_id=invoice_data.get("payment_intent"),
                    invoice_number=invoice_data.get("number"),
                    amount_due=invoice_data.get("amount_due", 0) / 100,
                    amount_paid=invoice_data.get("amount_paid", 0) / 100,
                    tax_amount=invoice_data.get("tax", 0) / 100,
                    status="paid",
                    period_start=datetime.fromtimestamp(invoice_data.get("period_start")),
                    period_end=datetime.fromtimestamp(invoice_data.get("period_end")),
                    paid_at=datetime.fromtimestamp(invoice_data.get("status_transitions", {}).get("paid_at", 0))
                )
                db.add(invoice)
            else:
                invoice.status = "paid"
                invoice.amount_paid = invoice_data.get("amount_paid", 0) / 100
                invoice.paid_at = datetime.fromtimestamp(invoice_data.get("status_transitions", {}).get("paid_at", 0))
            
            db.commit()
            
            return {
                "status": "success",
                "invoice_id": invoice.id,
                "subscription_id": subscription.id,
                "message": "Facture d'abonnement traitée"
            }
        
        db.close()
        
        return {
            "status": "warning",
            "message": f"Abonnement non trouvé pour la facture {stripe_invoice_id}"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def process_invoice_payment_failed(self, invoice_data):
    """Traiter l'échec de paiement d'une facture d'abonnement"""
    try:
        db = SessionLocal()
        
        from backend.app.models.subscription import Subscription, SubscriptionStatus
        
        stripe_subscription_id = invoice_data.get("subscription")
        
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            # Marquer l'abonnement comme en retard de paiement
            subscription.status = SubscriptionStatus.PAST_DUE
            db.commit()
            
            # Notifier l'échec de paiement
            from worker.tasks.notifications import send_telegram_notification
            send_telegram_notification.delay(
                f"⚠️ Échec de paiement d'abonnement - {subscription.user.email} - {subscription.name}"
            )
            
            return {
                "status": "success",
                "subscription_id": subscription.id,
                "message": "Échec de paiement d'abonnement traité"
            }
        
        db.close()
        
        return {
            "status": "warning",
            "message": f"Abonnement non trouvé pour la facture échouée"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=3, exc=exc)
