"""
Endpoints pour la gestion des commandes et du panier
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.user import User

router = APIRouter()


@router.post("/whatsapp")
async def create_whatsapp_order(
    cart_items: List[dict],  # [{"id": 1, "name": "...", "price": 149.99, "quantity": 2}, ...]
    customer_info: dict = None,  # {"name": "...", "email": "...", "phone": "..."}
    db: Session = Depends(get_db)
) -> Any:
    """
    Créer une commande WhatsApp (sans authentification)
    + Génération automatique de facture client
    """
    
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le panier ne peut pas être vide"
        )
    
    # Créer ou récupérer l'utilisateur guest
    customer_email = customer_info.get("email", "guest@stelleworld.com") if customer_info else "guest@stelleworld.com"
    customer_name = customer_info.get("name", "Client WhatsApp") if customer_info else "Client WhatsApp"
    customer_phone = customer_info.get("phone", "") if customer_info else ""
    
    user = db.query(User).filter(User.email == customer_email).first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email=customer_email,
            first_name=customer_name.split()[0] if customer_name else "Client",
            last_name=customer_name.split()[-1] if len(customer_name.split()) > 1 else "WhatsApp",
            phone=customer_phone,
            hashed_password=get_password_hash("whatsapp_guest"),
            is_active=True,
            country="Canada"
        )
        db.add(user)
        db.flush()
    
    # Calculer les totaux
    subtotal = sum(item["price"] * item["quantity"] for item in cart_items)
    tax_amount = subtotal * 0.15  # TPS/TVQ Québec
    shipping_amount = 0 if subtotal >= 100 else 9.99
    total_amount = subtotal + tax_amount + shipping_amount
    
    # Générer numéro de commande
    order_number = f"WA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Créer la commande
    order = Order(
        order_number=order_number,
        user_id=user.id,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        subtotal=subtotal,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        total_amount=total_amount,
        shipping_first_name=user.first_name,
        shipping_last_name=user.last_name,
        shipping_email=user.email,
        shipping_phone=user.phone or customer_phone,
        shipping_address_line1="À définir via WhatsApp",
        shipping_city="Montréal",
        shipping_postal_code="H0H 0H0",
        shipping_country="Canada",
        billing_first_name=user.first_name,
        billing_last_name=user.last_name,
        billing_email=user.email,
        billing_address_line1="À définir via WhatsApp",
        billing_city="Montréal",
        billing_postal_code="H0H 0H0",
        billing_country="Canada",
        notes="Commande créée via WhatsApp"
    )
    
    db.add(order)
    db.flush()
    
    # Créer les articles
    for item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.get("id"),
            product_name=item["name"],
            product_description=item.get("short_description", ""),
            product_image_url=item.get("image", ""),
            quantity=item["quantity"],
            unit_price=item["price"],
            total_price=item["price"] * item["quantity"]
        )
        db.add(order_item)
        
        # Décrémenter le stock si produit existe
        product = db.query(Product).filter(Product.id == item.get("id")).first()
        if product and product.track_inventory:
            product.stock_quantity -= item["quantity"]
            if product.stock_quantity < 0:
                product.stock_quantity = 0
    
    db.commit()
    db.refresh(order)
    
    # Créer la facture client automatiquement
    from app.models.invoice import CustomerInvoice, InvoiceStatus
    
    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    invoice = CustomerInvoice(
        invoice_number=invoice_number,
        order_id=order.id,
        user_id=user.id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=0,
        total_amount=total_amount,
        status=InvoiceStatus.DRAFT,
        is_paid=False,
        payment_method="whatsapp",
        invoice_date=datetime.utcnow(),
        notes=f"Facture pour commande WhatsApp {order_number}"
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    return {
        "success": True,
        "order_id": order.id,
        "order_number": order.order_number,
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "total_amount": total_amount,
        "message": "Commande et facture créées avec succès"
    }



@router.post("/")
async def create_order(
    items: List[dict],  # [{"product_id": 1, "quantity": 2}, ...]
    shipping_address: dict,
    billing_address: dict = None,
    notes: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Créer une nouvelle commande"""
    
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le panier ne peut pas être vide"
        )
    
    # Vérifier la disponibilité des produits
    order_items = []
    subtotal = 0
    
    for item in items:
        product = db.query(Product).filter(
            Product.id == item["product_id"],
            Product.is_active == True
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produit {item['product_id']} non trouvé"
            )
        
        quantity = item["quantity"]
        
        if product.track_inventory and product.stock_quantity < quantity:
            if not product.allow_backorder:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuffisant pour {product.name}"
                )
        
        unit_price = product.price
        total_price = unit_price * quantity
        subtotal += total_price
        
        order_items.append({
            "product": product,
            "quantity": quantity,
            "unit_price": unit_price,
            "total_price": total_price
        })
    
    # Calculer les totaux
    tax_amount = subtotal * 0.20  # TVA 20%
    shipping_amount = 0 if subtotal >= 50 else 5.99  # Gratuit à partir de 50€
    total_amount = subtotal + tax_amount + shipping_amount
    
    # Générer un numéro de commande unique
    order_number = f"ST-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Utiliser l'adresse de facturation ou celle de livraison
    if not billing_address:
        billing_address = shipping_address
    
    # Créer la commande
    order = Order(
        order_number=order_number,
        user_id=current_user.id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        total_amount=total_amount,
        shipping_first_name=shipping_address["first_name"],
        shipping_last_name=shipping_address["last_name"],
        shipping_email=shipping_address["email"],
        shipping_phone=shipping_address.get("phone"),
        shipping_address_line1=shipping_address["address_line1"],
        shipping_address_line2=shipping_address.get("address_line2"),
        shipping_city=shipping_address["city"],
        shipping_postal_code=shipping_address["postal_code"],
        shipping_country=shipping_address.get("country", "France"),
        billing_first_name=billing_address["first_name"],
        billing_last_name=billing_address["last_name"],
        billing_email=billing_address["email"],
        billing_phone=billing_address.get("phone"),
        billing_address_line1=billing_address["address_line1"],
        billing_address_line2=billing_address.get("address_line2"),
        billing_city=billing_address["city"],
        billing_postal_code=billing_address["postal_code"],
        billing_country=billing_address.get("country", "France"),
        notes=notes
    )
    
    db.add(order)
    db.flush()  # Pour obtenir l'ID de la commande
    
    # Créer les articles de la commande
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            product_name=item_data["product"].name,
            product_description=item_data["product"].short_description,
            product_image_url=item_data["product"].main_image_url,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            total_price=item_data["total_price"]
        )
        db.add(order_item)
        
        # Décrémenter le stock si nécessaire
        if item_data["product"].track_inventory:
            item_data["product"].stock_quantity -= item_data["quantity"]
        
        # Incrémenter le compteur de ventes
        item_data["product"].sales_count += item_data["quantity"]
    
    db.commit()
    db.refresh(order)
    
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "total_amount": order.total_amount,
        "status": order.status,
        "message": "Commande créée avec succès"
    }


@router.get("/")
async def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les commandes de l'utilisateur connecté"""
    
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    
    return {
        "orders": [
            {
                "id": order.id,
                "order_number": order.order_number,
                "status": order.status,
                "payment_status": order.payment_status,
                "total_amount": order.total_amount,
                "total_items": order.total_items,
                "created_at": order.created_at,
                "confirmed_at": order.confirmed_at,
                "shipped_at": order.shipped_at,
                "tracking_number": order.tracking_number
            }
            for order in orders
        ]
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les détails d'une commande"""
    
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "payment_status": order.payment_status,
        "subtotal": order.subtotal,
        "tax_amount": order.tax_amount,
        "shipping_amount": order.shipping_amount,
        "total_amount": order.total_amount,
        "shipping_address": {
            "first_name": order.shipping_first_name,
            "last_name": order.shipping_last_name,
            "email": order.shipping_email,
            "phone": order.shipping_phone,
            "address_line1": order.shipping_address_line1,
            "address_line2": order.shipping_address_line2,
            "city": order.shipping_city,
            "postal_code": order.shipping_postal_code,
            "country": order.shipping_country
        },
        "items": [
            {
                "id": item.id,
                "product_name": item.product_name,
                "product_description": item.product_description,
                "product_image_url": item.product_image_url,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price
            }
            for item in order.items
        ],
        "notes": order.notes,
        "tracking_number": order.tracking_number,
        "tracking_url": order.tracking_url,
        "created_at": order.created_at,
        "confirmed_at": order.confirmed_at,
        "shipped_at": order.shipped_at,
        "delivered_at": order.delivered_at
    }


@router.get("/{order_id}/invoice/pdf")
async def download_invoice_pdf(
    order_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Télécharger la facture en PDF"""
    from fastapi.responses import Response
    from app.models.invoice import CustomerInvoice
    
    # Récupérer la commande et la facture
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    invoice = db.query(CustomerInvoice).filter(CustomerInvoice.order_id == order_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    # Générer le contenu de la facture (simple HTML pour l'instant)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Facture {invoice.invoice_number}</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 40px; }}
            .header {{ text-align: center; margin-bottom: 40px; }}
            .invoice-info {{ margin-bottom: 30px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
            th {{ background-color: #ec4899; color: white; }}
            .total {{ font-size: 1.2em; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>STELLEWORLD</h1>
            <h2>Facture {invoice.invoice_number}</h2>
        </div>
        
        <div class="invoice-info">
            <p><strong>Date:</strong> {invoice.invoice_date.strftime('%d/%m/%Y')}</p>
            <p><strong>Commande:</strong> {order.order_number}</p>
            <p><strong>Client:</strong> {order.user.full_name}</p>
            <p><strong>Email:</strong> {order.user.email}</p>
            {f'<p><strong>Téléphone:</strong> {order.shipping_phone}</p>' if order.shipping_phone else ''}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {''.join([f'''
                <tr>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit_price:.2f}$ CAD</td>
                    <td>{item.total_price:.2f}$ CAD</td>
                </tr>
                ''' for item in order.items])}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Sous-total:</strong></td>
                    <td>{order.subtotal:.2f}$ CAD</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Taxes (15%):</strong></td>
                    <td>{order.tax_amount:.2f}$ CAD</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Livraison:</strong></td>
                    <td>{order.shipping_amount:.2f}$ CAD</td>
                </tr>
                <tr class="total">
                    <td colspan="3" style="text-align: right;">TOTAL:</td>
                    <td>{order.total_amount:.2f}$ CAD</td>
                </tr>
            </tfoot>
        </table>
        
        <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>Merci pour votre commande !</p>
            <p>Pour toute question, contactez-nous au +15813081802</p>
        </div>
    </body>
    </html>
    """
    
    return Response(
        content=html_content,
        media_type="text/html",
        headers={
            "Content-Disposition": f'attachment; filename="facture_{invoice.invoice_number}.html"'
        }
    )


# Endpoints d'administration

@router.get("/admin/all", dependencies=[Depends(get_current_admin_user)])
async def get_all_orders(
    skip: int = 0,
    limit: int = 50,
    status: OrderStatus = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir toutes les commandes (Admin)"""
    
    query = db.query(Order).order_by(Order.created_at.desc())
    
    if status:
        query = query.filter(Order.status == status)
    
    total = query.count()
    orders = query.offset(skip).limit(limit).all()
    
    return {
        "orders": [
            {
                "id": order.id,
                "order_number": order.order_number,
                "user_email": order.user.email,
                "user_name": order.user.full_name,
                "status": order.status,
                "payment_status": order.payment_status,
                "total_amount": order.total_amount,
                "total_items": order.total_items,
                "created_at": order.created_at,
                "shipping_city": order.shipping_city
            }
            for order in orders
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/{order_id}/status", dependencies=[Depends(get_current_admin_user)])
async def update_order_status(
    order_id: int,
    status: OrderStatus,
    tracking_number: str = None,
    tracking_url: str = None,
    admin_notes: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour le statut d'une commande (Admin)"""
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    order.status = status
    
    if tracking_number:
        order.tracking_number = tracking_number
    if tracking_url:
        order.tracking_url = tracking_url
    if admin_notes:
        order.admin_notes = admin_notes
    
    # Mettre à jour les dates selon le statut
    now = datetime.utcnow()
    if status == OrderStatus.CONFIRMED and not order.confirmed_at:
        order.confirmed_at = now
    elif status == OrderStatus.SHIPPED and not order.shipped_at:
        order.shipped_at = now
    elif status == OrderStatus.DELIVERED and not order.delivered_at:
        order.delivered_at = now
    
    db.commit()
    
    return {"message": f"Statut de la commande mis à jour: {status}"}


@router.get("/admin/stats", dependencies=[Depends(get_current_admin_user)])
async def get_order_stats(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les statistiques des commandes (Admin)"""
    
    from sqlalchemy import func
    
    # Statistiques générales
    total_orders = db.query(Order).count()
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    
    pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
    confirmed_orders = db.query(Order).filter(Order.status == OrderStatus.CONFIRMED).count()
    
    # Commandes du jour
    today = datetime.utcnow().date()
    today_orders = db.query(Order).filter(
        func.date(Order.created_at) == today
    ).count()
    
    today_revenue = db.query(func.sum(Order.total_amount)).filter(
        func.date(Order.created_at) == today,
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "today_orders": today_orders,
        "today_revenue": today_revenue
    }
