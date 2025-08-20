"""
Endpoints pour la gestion des rendez-vous
"""

from typing import Any, List
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.appointment import Appointment, AppointmentStatus, ServiceSlot, BlockedDate
from app.models.user import User

router = APIRouter()


@router.get("/available-slots")
async def get_available_slots(
    service_date: date,
    service_name: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les créneaux disponibles pour une date donnée"""
    
    # Obtenir le jour de la semaine (0=Lundi, 6=Dimanche)
    day_of_week = service_date.weekday()
    
    # Récupérer les créneaux configurés pour ce jour
    service_slots = (
        db.query(ServiceSlot)
        .filter(
            ServiceSlot.day_of_week == day_of_week,
            ServiceSlot.is_active == True
        )
        .all()
    )
    
    if service_name:
        service_slots = [
            slot for slot in service_slots 
            if slot.service_name is None or slot.service_name == service_name
        ]
    
    # Vérifier les dates bloquées
    blocked_dates = (
        db.query(BlockedDate)
        .filter(
            or_(
                and_(
                    BlockedDate.blocked_date <= datetime.combine(service_date, datetime.min.time()),
                    BlockedDate.end_date >= datetime.combine(service_date, datetime.max.time())
                ),
                and_(
                    func.date(BlockedDate.blocked_date) == service_date,
                    BlockedDate.end_date.is_(None)
                )
            )
        )
        .all()
    )
    
    available_slots = []
    
    for slot in service_slots:
        # Vérifier si le créneau est bloqué
        is_blocked = False
        for blocked in blocked_dates:
            if blocked.is_full_day:
                is_blocked = True
                break
            elif (blocked.start_time and blocked.end_time and
                  not (slot.end_time <= blocked.start_time or slot.start_time >= blocked.end_time)):
                is_blocked = True
                break
        
        if is_blocked:
            continue
        
        # Générer les créneaux pour ce slot
        start_hour, start_minute = map(int, slot.start_time.split(':'))
        end_hour, end_minute = map(int, slot.end_time.split(':'))
        
        current_time = datetime.combine(service_date, datetime.min.time().replace(
            hour=start_hour, minute=start_minute
        ))
        end_time = datetime.combine(service_date, datetime.min.time().replace(
            hour=end_hour, minute=end_minute
        ))
        
        while current_time < end_time:
            slot_end = current_time + timedelta(minutes=slot.slot_duration)
            
            if slot_end <= end_time:
                # Vérifier les RDV existants pour ce créneau
                existing_appointments = (
                    db.query(Appointment)
                    .filter(
                        Appointment.scheduled_date == current_time,
                        Appointment.status.in_([
                            AppointmentStatus.PENDING,
                            AppointmentStatus.CONFIRMED,
                            AppointmentStatus.IN_PROGRESS
                        ])
                    )
                    .count()
                )
                
                if existing_appointments < slot.max_appointments:
                    available_slots.append({
                        "datetime": current_time,
                        "time": current_time.strftime("%H:%M"),
                        "duration_minutes": slot.slot_duration,
                        "service_name": slot.service_name,
                        "available_spots": slot.max_appointments - existing_appointments
                    })
            
            current_time += timedelta(minutes=slot.slot_duration)
    
    return {
        "date": service_date,
        "available_slots": sorted(available_slots, key=lambda x: x["datetime"])
    }


@router.post("/")
async def create_appointment(
    service_name: str,
    scheduled_date: datetime,
    client_name: str,
    client_email: str,
    client_phone: str = None,
    client_notes: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Créer un nouveau rendez-vous"""
    
    # Vérifier que la date est dans le futur
    if scheduled_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date du rendez-vous doit être dans le futur"
        )
    
    # Vérifier la disponibilité du créneau
    existing_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.scheduled_date == scheduled_date,
            Appointment.status.in_([
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.IN_PROGRESS
            ])
        )
        .count()
    )
    
    # Récupérer la configuration du slot pour ce créneau
    day_of_week = scheduled_date.weekday()
    time_str = scheduled_date.strftime("%H:%M")
    
    service_slot = (
        db.query(ServiceSlot)
        .filter(
            ServiceSlot.day_of_week == day_of_week,
            ServiceSlot.start_time <= time_str,
            ServiceSlot.end_time > time_str,
            ServiceSlot.is_active == True
        )
        .first()
    )
    
    if not service_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Créneau non disponible"
        )
    
    if existing_appointments >= service_slot.max_appointments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Créneau complet"
        )
    
    # Créer le rendez-vous
    appointment = Appointment(
        user_id=current_user.id,
        service_name=service_name,
        scheduled_date=scheduled_date,
        duration_minutes=service_slot.slot_duration,
        client_name=client_name,
        client_email=client_email,
        client_phone=client_phone,
        client_notes=client_notes
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    return {
        "appointment_id": appointment.id,
        "service_name": appointment.service_name,
        "scheduled_date": appointment.scheduled_date,
        "status": appointment.status,
        "message": "Rendez-vous créé avec succès"
    }


@router.get("/")
async def get_user_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les rendez-vous de l'utilisateur connecté"""
    
    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.scheduled_date.desc())
        .all()
    )
    
    return {
        "appointments": [
            {
                "id": apt.id,
                "service_name": apt.service_name,
                "scheduled_date": apt.scheduled_date,
                "duration_minutes": apt.duration_minutes,
                "status": apt.status,
                "client_name": apt.client_name,
                "client_email": apt.client_email,
                "client_phone": apt.client_phone,
                "location": apt.location,
                "location_type": apt.location_type,
                "is_upcoming": apt.is_upcoming,
                "is_today": apt.is_today,
                "created_at": apt.created_at
            }
            for apt in appointments
        ]
    }


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les détails d'un rendez-vous"""
    
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
        .first()
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    
    return {
        "id": appointment.id,
        "service_name": appointment.service_name,
        "service_description": appointment.service_description,
        "appointment_type": appointment.appointment_type,
        "scheduled_date": appointment.scheduled_date,
        "end_time": appointment.end_time,
        "duration_minutes": appointment.duration_minutes,
        "status": appointment.status,
        "client_name": appointment.client_name,
        "client_email": appointment.client_email,
        "client_phone": appointment.client_phone,
        "client_notes": appointment.client_notes,
        "location": appointment.location,
        "location_type": appointment.location_type,
        "price": appointment.price,
        "is_paid": appointment.is_paid,
        "payment_method": appointment.payment_method,
        "is_upcoming": appointment.is_upcoming,
        "is_today": appointment.is_today,
        "created_at": appointment.created_at,
        "confirmed_at": appointment.confirmed_at,
        "completed_at": appointment.completed_at,
        "cancelled_at": appointment.cancelled_at
    }


@router.put("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Annuler un rendez-vous"""
    
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
        .first()
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    
    if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce rendez-vous ne peut pas être annulé"
        )
    
    # Vérifier que l'annulation se fait au moins 24h avant
    if appointment.scheduled_date - datetime.utcnow() < timedelta(hours=24):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les annulations doivent se faire au moins 24h à l'avance"
        )
    
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Rendez-vous annulé avec succès"}


# Endpoints d'administration

@router.get("/admin/all", dependencies=[Depends(get_current_admin_user)])
async def get_all_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: AppointmentStatus = None,
    date_from: date = None,
    date_to: date = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir tous les rendez-vous (Admin)"""
    
    query = db.query(Appointment).order_by(Appointment.scheduled_date.desc())
    
    if status:
        query = query.filter(Appointment.status == status)
    
    if date_from:
        query = query.filter(func.date(Appointment.scheduled_date) >= date_from)
    
    if date_to:
        query = query.filter(func.date(Appointment.scheduled_date) <= date_to)
    
    total = query.count()
    appointments = query.offset(skip).limit(limit).all()
    
    return {
        "appointments": [
            {
                "id": apt.id,
                "service_name": apt.service_name,
                "scheduled_date": apt.scheduled_date,
                "duration_minutes": apt.duration_minutes,
                "status": apt.status,
                "client_name": apt.client_name,
                "client_email": apt.client_email,
                "client_phone": apt.client_phone,
                "user_email": apt.user.email if apt.user else None,
                "is_today": apt.is_today,
                "created_at": apt.created_at
            }
            for apt in appointments
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/{appointment_id}/status", dependencies=[Depends(get_current_admin_user)])
async def update_appointment_status(
    appointment_id: int,
    status: AppointmentStatus,
    admin_notes: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour le statut d'un rendez-vous (Admin)"""
    
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    
    appointment.status = status
    
    if admin_notes:
        appointment.admin_notes = admin_notes
    
    # Mettre à jour les dates selon le statut
    now = datetime.utcnow()
    if status == AppointmentStatus.CONFIRMED and not appointment.confirmed_at:
        appointment.confirmed_at = now
    elif status == AppointmentStatus.COMPLETED and not appointment.completed_at:
        appointment.completed_at = now
    elif status == AppointmentStatus.CANCELLED and not appointment.cancelled_at:
        appointment.cancelled_at = now
    
    db.commit()
    
    return {"message": f"Statut du rendez-vous mis à jour: {status}"}


@router.get("/admin/stats", dependencies=[Depends(get_current_admin_user)])
async def get_appointment_stats(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les statistiques des rendez-vous (Admin)"""
    
    # Statistiques générales
    total_appointments = db.query(Appointment).count()
    pending_appointments = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.PENDING
    ).count()
    confirmed_appointments = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.CONFIRMED
    ).count()
    
    # Rendez-vous du jour
    today = datetime.utcnow().date()
    today_appointments = db.query(Appointment).filter(
        func.date(Appointment.scheduled_date) == today
    ).count()
    
    # Taux de no-show
    no_shows = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.NO_SHOW
    ).count()
    
    completed_appointments = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.COMPLETED
    ).count()
    
    no_show_rate = (
        (no_shows / (no_shows + completed_appointments)) * 100
        if (no_shows + completed_appointments) > 0 else 0
    )
    
    return {
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "confirmed_appointments": confirmed_appointments,
        "today_appointments": today_appointments,
        "no_show_rate": round(no_show_rate, 2)
    }
