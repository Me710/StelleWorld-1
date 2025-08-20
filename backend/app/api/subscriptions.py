"""
Endpoints pour la gestion des abonnements
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_user_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les abonnements de l'utilisateur connecté"""
    
    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .all()
    )
    
    return {
        "subscriptions": [
            {
                "id": sub.id,
                "name": sub.name,
                "description": sub.description,
                "status": sub.status,
                "billing_interval": sub.billing_interval,
                "amount": sub.amount,
                "currency": sub.currency,
                "current_period_start": sub.current_period_start,
                "current_period_end": sub.current_period_end,
                "days_until_renewal": sub.days_until_renewal,
                "is_active": sub.is_active,
                "created_at": sub.created_at,
                "cancelled_at": sub.cancelled_at
            }
            for sub in subscriptions
        ]
    }


@router.get("/{subscription_id}")
async def get_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les détails d'un abonnement"""
    
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id
        )
        .first()
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
    
    return {
        "id": subscription.id,
        "stripe_subscription_id": subscription.stripe_subscription_id,
        "name": subscription.name,
        "description": subscription.description,
        "status": subscription.status,
        "billing_interval": subscription.billing_interval,
        "amount": subscription.amount,
        "currency": subscription.currency,
        "current_period_start": subscription.current_period_start,
        "current_period_end": subscription.current_period_end,
        "trial_end": subscription.trial_end,
        "days_until_renewal": subscription.days_until_renewal,
        "is_active": subscription.is_active,
        "items": [
            {
                "id": item.id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price
            }
            for item in subscription.items
        ],
        "invoices": [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "status": invoice.status,
                "amount_due": invoice.amount_due,
                "amount_paid": invoice.amount_paid,
                "period_start": invoice.period_start,
                "period_end": invoice.period_end,
                "due_date": invoice.due_date,
                "paid_at": invoice.paid_at
            }
            for invoice in subscription.invoices[-5:]  # 5 dernières factures
        ],
        "created_at": subscription.created_at,
        "cancelled_at": subscription.cancelled_at,
        "ended_at": subscription.ended_at
    }


@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Annuler un abonnement"""
    
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id
        )
        .first()
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
    
    if subscription.status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les abonnements actifs peuvent être annulés"
        )
    
    # TODO: Intégrer avec Stripe pour annuler l'abonnement
    # stripe.Subscription.cancel(subscription.stripe_subscription_id)
    
    from datetime import datetime
    subscription.status = SubscriptionStatus.CANCELLED
    subscription.cancelled_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Abonnement annulé avec succès"}


@router.post("/{subscription_id}/pause")
async def pause_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mettre en pause un abonnement"""
    
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id
        )
        .first()
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
    
    if subscription.status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les abonnements actifs peuvent être mis en pause"
        )
    
    # TODO: Intégrer avec Stripe pour mettre en pause l'abonnement
    
    subscription.status = SubscriptionStatus.PAUSED
    db.commit()
    
    return {"message": "Abonnement mis en pause avec succès"}


@router.post("/{subscription_id}/resume")
async def resume_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Reprendre un abonnement en pause"""
    
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id
        )
        .first()
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
    
    if subscription.status != SubscriptionStatus.PAUSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les abonnements en pause peuvent être repris"
        )
    
    # TODO: Intégrer avec Stripe pour reprendre l'abonnement
    
    subscription.status = SubscriptionStatus.ACTIVE
    db.commit()
    
    return {"message": "Abonnement repris avec succès"}


# Endpoints d'administration

@router.get("/admin/all", dependencies=[Depends(get_current_admin_user)])
async def get_all_subscriptions(
    skip: int = 0,
    limit: int = 50,
    status: SubscriptionStatus = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir tous les abonnements (Admin)"""
    
    query = db.query(Subscription).order_by(Subscription.created_at.desc())
    
    if status:
        query = query.filter(Subscription.status == status)
    
    total = query.count()
    subscriptions = query.offset(skip).limit(limit).all()
    
    return {
        "subscriptions": [
            {
                "id": sub.id,
                "user_email": sub.user.email,
                "user_name": sub.user.full_name,
                "name": sub.name,
                "status": sub.status,
                "billing_interval": sub.billing_interval,
                "amount": sub.amount,
                "current_period_end": sub.current_period_end,
                "created_at": sub.created_at
            }
            for sub in subscriptions
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/admin/stats", dependencies=[Depends(get_current_admin_user)])
async def get_subscription_stats(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les statistiques des abonnements (Admin)"""
    
    from sqlalchemy import func
    
    total_subscriptions = db.query(Subscription).count()
    active_subscriptions = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    ).count()
    
    # Revenus récurrents mensuels (MRR)
    monthly_revenue = db.query(func.sum(Subscription.amount)).filter(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.billing_interval == "monthly"
    ).scalar() or 0
    
    # Taux de rétention (approximatif)
    cancelled_subscriptions = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.CANCELLED
    ).count()
    
    retention_rate = (
        (active_subscriptions / (active_subscriptions + cancelled_subscriptions)) * 100
        if (active_subscriptions + cancelled_subscriptions) > 0 else 0
    )
    
    return {
        "total_subscriptions": total_subscriptions,
        "active_subscriptions": active_subscriptions,
        "cancelled_subscriptions": cancelled_subscriptions,
        "monthly_recurring_revenue": monthly_revenue,
        "retention_rate": round(retention_rate, 2)
    }
