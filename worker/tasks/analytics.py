"""
Tâches Celery pour les analytics et recommandations
"""

from celery import current_task
from celery_app import celery_app
from sqlalchemy import create_engine, func, and_
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime, timedelta

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://stelleworld:password@localhost:5432/stelleworld")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import des modèles (à adapter selon la structure)
import sys
sys.path.append('/app')


@celery_app.task(bind=True)
def update_best_sellers(self):
    """Mettre à jour le classement des best-sellers"""
    try:
        db = SessionLocal()
        
        # Importer les modèles nécessaires
        from backend.app.models.product import Product
        from backend.app.models.order import Order, OrderItem, PaymentStatus
        
        # Calculer les ventes des 30 derniers jours
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Requête pour obtenir les ventes par produit
        sales_data = (
            db.query(
                OrderItem.product_id,
                func.sum(OrderItem.quantity).label('total_sold')
            )
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                and_(
                    Order.created_at >= thirty_days_ago,
                    Order.payment_status == PaymentStatus.PAID
                )
            )
            .group_by(OrderItem.product_id)
            .all()
        )
        
        # Mettre à jour les compteurs de ventes
        updated_count = 0
        for sale in sales_data:
            product = db.query(Product).filter(Product.id == sale.product_id).first()
            if product:
                product.sales_count = int(sale.total_sold)
                updated_count += 1
        
        db.commit()
        db.close()
        
        return {
            "status": "success",
            "updated_products": updated_count,
            "message": f"Best-sellers mis à jour: {updated_count} produits"
        }
        
    except Exception as exc:
        self.retry(countdown=60, max_retries=3, exc=exc)


@celery_app.task(bind=True)
def update_product_combinations(self):
    """Mettre à jour les produits souvent achetés ensemble"""
    try:
        db = SessionLocal()
        
        from backend.app.models.product import Product, product_combinations
        from backend.app.models.order import Order, OrderItem, PaymentStatus
        
        # Nettoyer les anciennes associations
        db.execute(product_combinations.delete())
        
        # Trouver les produits achetés ensemble (minimum 3 occurrences)
        min_occurrences = 3
        
        # Requête complexe pour trouver les paires de produits
        combinations_query = """
        SELECT 
            oi1.product_id as product1_id,
            oi2.product_id as product2_id,
            COUNT(*) as frequency
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id
        JOIN orders o ON oi1.order_id = o.id
        WHERE oi1.product_id < oi2.product_id
        AND o.payment_status = 'paid'
        AND o.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY oi1.product_id, oi2.product_id
        HAVING COUNT(*) >= %s
        ORDER BY frequency DESC
        LIMIT 1000
        """
        
        result = db.execute(combinations_query, (min_occurrences,))
        combinations = result.fetchall()
        
        # Insérer les nouvelles associations
        inserted_count = 0
        for combo in combinations:
            # Association bidirectionnelle
            db.execute(
                product_combinations.insert().values(
                    product_id=combo.product1_id,
                    related_product_id=combo.product2_id
                )
            )
            db.execute(
                product_combinations.insert().values(
                    product_id=combo.product2_id,
                    related_product_id=combo.product1_id
                )
            )
            inserted_count += 2
        
        db.commit()
        db.close()
        
        return {
            "status": "success",
            "combinations_found": len(combinations),
            "associations_created": inserted_count,
            "message": f"Combinaisons de produits mises à jour: {len(combinations)} paires trouvées"
        }
        
    except Exception as exc:
        self.retry(countdown=300, max_retries=2, exc=exc)


@celery_app.task(bind=True)
def generate_analytics_report(self, period_days=30):
    """Générer un rapport d'analytics pour l'admin"""
    try:
        db = SessionLocal()
        
        from backend.app.models.order import Order, OrderItem, PaymentStatus
        from backend.app.models.product import Product
        from backend.app.models.user import User
        
        start_date = datetime.utcnow() - timedelta(days=period_days)
        
        # Calculer les métriques principales
        total_revenue = (
            db.query(func.sum(Order.total_amount))
            .filter(
                and_(
                    Order.created_at >= start_date,
                    Order.payment_status == PaymentStatus.PAID
                )
            )
            .scalar() or 0
        )
        
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
        
        new_customers = (
            db.query(func.count(func.distinct(Order.user_id)))
            .filter(Order.created_at >= start_date)
            .scalar() or 0
        )
        
        # Top 5 des produits
        top_products = (
            db.query(
                Product.name,
                func.sum(OrderItem.quantity).label('sold'),
                func.sum(OrderItem.total_price).label('revenue')
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                and_(
                    Order.created_at >= start_date,
                    Order.payment_status == PaymentStatus.PAID
                )
            )
            .group_by(Product.id, Product.name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(5)
            .all()
        )
        
        db.close()
        
        report = {
            "period_days": period_days,
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_revenue": float(total_revenue),
                "total_orders": int(total_orders),
                "average_order_value": float(total_revenue / total_orders) if total_orders > 0 else 0,
                "new_customers": int(new_customers)
            },
            "top_products": [
                {
                    "name": product.name,
                    "quantity_sold": int(product.sold),
                    "revenue": float(product.revenue)
                }
                for product in top_products
            ]
        }
        
        # TODO: Sauvegarder le rapport ou l'envoyer par email
        
        return {
            "status": "success",
            "report": report,
            "message": f"Rapport analytics généré pour {period_days} jours"
        }
        
    except Exception as exc:
        self.retry(countdown=120, max_retries=2, exc=exc)


@celery_app.task
def calculate_customer_segments():
    """Calculer les segments de clients basés sur leurs achats"""
    try:
        db = SessionLocal()
        
        from backend.app.models.user import User
        from backend.app.models.order import Order, PaymentStatus
        
        # Requête pour segmenter les clients
        customers = (
            db.query(
                User.id,
                User.email,
                func.count(Order.id).label('order_count'),
                func.sum(Order.total_amount).label('total_spent'),
                func.max(Order.created_at).label('last_order_date')
            )
            .join(Order, User.id == Order.user_id)
            .filter(Order.payment_status == PaymentStatus.PAID)
            .group_by(User.id, User.email)
            .all()
        )
        
        # Segmentation des clients
        segments = {
            "VIP": [],      # > 500€
            "Premium": [],  # 200-500€
            "Regular": [],  # 50-200€
            "New": []       # < 50€
        }
        
        for customer in customers:
            total_spent = float(customer.total_spent or 0)
            
            if total_spent >= 500:
                segments["VIP"].append(customer.id)
            elif total_spent >= 200:
                segments["Premium"].append(customer.id)
            elif total_spent >= 50:
                segments["Regular"].append(customer.id)
            else:
                segments["New"].append(customer.id)
        
        db.close()
        
        return {
            "status": "success",
            "segments": {
                segment: len(customers) for segment, customers in segments.items()
            },
            "total_customers": len(customers),
            "message": "Segmentation des clients calculée"
        }
        
    except Exception as exc:
        current_task.retry(countdown=180, max_retries=2, exc=exc)
