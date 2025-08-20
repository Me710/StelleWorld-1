"""
Endpoints pour les analytics et recommandations
"""

from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.user import User

router = APIRouter()


@router.get("/best-sellers")
async def get_best_sellers_analytics(
    period_days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les meilleures ventes sur une période donnée"""
    
    # Date de début de la période
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Requête pour obtenir les produits les plus vendus
    best_sellers = (
        db.query(
            Product.id,
            Product.name,
            Product.price,
            Product.main_image_url,
            func.sum(OrderItem.quantity).label('total_sold'),
            func.sum(OrderItem.total_price).label('total_revenue'),
            func.count(OrderItem.id).label('order_count')
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            and_(
                Order.created_at >= start_date,
                Order.payment_status == PaymentStatus.PAID
            )
        )
        .group_by(Product.id, Product.name, Product.price, Product.main_image_url)
        .order_by(desc('total_sold'))
        .limit(limit)
        .all()
    )
    
    return {
        "period_days": period_days,
        "best_sellers": [
            {
                "product_id": item.id,
                "product_name": item.name,
                "product_price": item.price,
                "product_image": item.main_image_url,
                "total_sold": int(item.total_sold),
                "total_revenue": float(item.total_revenue),
                "order_count": int(item.order_count)
            }
            for item in best_sellers
        ]
    }


@router.get("/frequently-bought-together")
async def get_frequently_bought_together(
    product_id: int = None,
    min_occurrences: int = Query(2, ge=1),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les produits souvent achetés ensemble"""
    
    if product_id:
        # Produits achetés avec un produit spécifique
        subquery = (
            db.query(OrderItem.order_id)
            .filter(OrderItem.product_id == product_id)
            .subquery()
        )
        
        combinations = (
            db.query(
                Product.id,
                Product.name,
                Product.price,
                Product.main_image_url,
                func.count().label('frequency')
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(subquery, OrderItem.order_id == subquery.c.order_id)
            .filter(Product.id != product_id)
            .group_by(Product.id, Product.name, Product.price, Product.main_image_url)
            .having(func.count() >= min_occurrences)
            .order_by(desc('frequency'))
            .limit(limit)
            .all()
        )
        
        return {
            "product_id": product_id,
            "recommendations": [
                {
                    "product_id": item.id,
                    "product_name": item.name,
                    "product_price": item.price,
                    "product_image": item.main_image_url,
                    "frequency": int(item.frequency)
                }
                for item in combinations
            ]
        }
    
    else:
        # Top des combinaisons générales
        combinations = (
            db.query(
                OrderItem.product_id.label('product1_id'),
                Product.name.label('product1_name'),
                func.count().label('frequency')
            )
            .join(Product, OrderItem.product_id == Product.id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.payment_status == PaymentStatus.PAID)
            .group_by(OrderItem.product_id, Product.name)
            .having(func.count() >= min_occurrences)
            .order_by(desc('frequency'))
            .limit(limit)
            .all()
        )
        
        return {
            "top_combinations": [
                {
                    "product_id": item.product1_id,
                    "product_name": item.product1_name,
                    "frequency": int(item.frequency)
                }
                for item in combinations
            ]
        }


@router.get("/sales-overview", dependencies=[Depends(get_current_admin_user)])
async def get_sales_overview(
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
) -> Any:
    """Vue d'ensemble des ventes pour l'admin"""
    
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Ventes totales
    total_sales = (
        db.query(func.sum(Order.total_amount))
        .filter(
            and_(
                Order.created_at >= start_date,
                Order.payment_status == PaymentStatus.PAID
            )
        )
        .scalar() or 0
    )
    
    # Nombre de commandes
    total_orders = (
        db.query(func.count(Order.id))
        .filter(
            and_(
                Order.created_at >= start_date,
                Order.payment_status == PaymentStatus.PAID
            )
        )
        .scalar() or 0
    )
    
    # Panier moyen
    average_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    # Nouveaux clients
    new_customers = (
        db.query(func.count(func.distinct(Order.user_id)))
        .filter(Order.created_at >= start_date)
        .scalar() or 0
    )
    
    # Ventes par jour (derniers 7 jours)
    daily_sales = []
    for i in range(7):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_sales = (
            db.query(func.sum(Order.total_amount))
            .filter(
                and_(
                    func.date(Order.created_at) == day,
                    Order.payment_status == PaymentStatus.PAID
                )
            )
            .scalar() or 0
        )
        daily_sales.append({
            "date": day.isoformat(),
            "sales": float(day_sales)
        })
    
    # Top catégories
    category_sales = (
        db.query(
            Product.category_id,
            func.sum(OrderItem.total_price).label('category_revenue')
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            and_(
                Order.created_at >= start_date,
                Order.payment_status == PaymentStatus.PAID,
                Product.category_id.isnot(None)
            )
        )
        .group_by(Product.category_id)
        .order_by(desc('category_revenue'))
        .limit(5)
        .all()
    )
    
    return {
        "period_days": period_days,
        "summary": {
            "total_sales": float(total_sales),
            "total_orders": int(total_orders),
            "average_order_value": float(average_order_value),
            "new_customers": int(new_customers)
        },
        "daily_sales": list(reversed(daily_sales)),  # Du plus ancien au plus récent
        "category_sales": [
            {
                "category_id": item.category_id,
                "revenue": float(item.category_revenue)
            }
            for item in category_sales
        ]
    }


@router.get("/customer-insights", dependencies=[Depends(get_current_admin_user)])
async def get_customer_insights(
    db: Session = Depends(get_db)
) -> Any:
    """Insights sur les clients"""
    
    # Clients les plus actifs
    top_customers = (
        db.query(
            User.id,
            User.email,
            User.first_name,
            User.last_name,
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('total_spent')
        )
        .join(Order, User.id == Order.user_id)
        .filter(Order.payment_status == PaymentStatus.PAID)
        .group_by(User.id, User.email, User.first_name, User.last_name)
        .order_by(desc('total_spent'))
        .limit(10)
        .all()
    )
    
    # Segmentation par montant dépensé
    customer_segments = (
        db.query(
            func.case(
                (func.sum(Order.total_amount) >= 500, 'VIP'),
                (func.sum(Order.total_amount) >= 200, 'Premium'),
                (func.sum(Order.total_amount) >= 50, 'Regular'),
                else_='New'
            ).label('segment'),
            func.count(func.distinct(User.id)).label('customer_count')
        )
        .join(Order, User.id == Order.user_id)
        .filter(Order.payment_status == PaymentStatus.PAID)
        .group_by('segment')
        .all()
    )
    
    # Rétention client (clients ayant commandé plus d'une fois)
    repeat_customers = (
        db.query(func.count(func.distinct(User.id)))
        .join(Order, User.id == Order.user_id)
        .filter(Order.payment_status == PaymentStatus.PAID)
        .having(func.count(Order.id) > 1)
        .scalar() or 0
    )
    
    total_customers = (
        db.query(func.count(func.distinct(User.id)))
        .join(Order, User.id == Order.user_id)
        .filter(Order.payment_status == PaymentStatus.PAID)
        .scalar() or 0
    )
    
    retention_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0
    
    return {
        "top_customers": [
            {
                "customer_id": customer.id,
                "email": customer.email,
                "name": f"{customer.first_name} {customer.last_name}",
                "order_count": int(customer.order_count),
                "total_spent": float(customer.total_spent)
            }
            for customer in top_customers
        ],
        "customer_segments": [
            {
                "segment": segment.segment,
                "customer_count": int(segment.customer_count)
            }
            for segment in customer_segments
        ],
        "retention_metrics": {
            "total_customers": int(total_customers),
            "repeat_customers": int(repeat_customers),
            "retention_rate": round(retention_rate, 2)
        }
    }


@router.get("/product-performance", dependencies=[Depends(get_current_admin_user)])
async def get_product_performance(
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
) -> Any:
    """Performance des produits"""
    
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Produits les plus consultés
    most_viewed = (
        db.query(Product.id, Product.name, Product.view_count, Product.sales_count)
        .filter(Product.is_active == True)
        .order_by(desc(Product.view_count))
        .limit(10)
        .all()
    )
    
    # Taux de conversion par produit (ventes / vues)
    conversion_rates = []
    for product in most_viewed:
        conversion_rate = (product.sales_count / product.view_count * 100) if product.view_count > 0 else 0
        conversion_rates.append({
            "product_id": product.id,
            "product_name": product.name,
            "view_count": product.view_count,
            "sales_count": product.sales_count,
            "conversion_rate": round(conversion_rate, 2)
        })
    
    # Produits les moins performants (beaucoup de vues, peu de ventes)
    underperforming = [
        product for product in conversion_rates
        if product["view_count"] > 50 and product["conversion_rate"] < 5
    ]
    
    return {
        "period_days": period_days,
        "most_viewed_products": conversion_rates,
        "underperforming_products": underperforming[:5]
    }
