"""
Endpoints pour la gestion des FAQ
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.faq import FAQ

router = APIRouter()


@router.get("/")
async def get_faqs(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir toutes les FAQ actives"""
    
    faqs = (
        db.query(FAQ)
        .filter(FAQ.is_active == True)
        .order_by(FAQ.sort_order, FAQ.id)
        .all()
    )
    
    return {
        "faqs": [
            {
                "id": faq.id,
                "question": faq.question,
                "answer": faq.answer,
                "sort_order": faq.sort_order
            }
            for faq in faqs
        ]
    }


@router.get("/all", dependencies=[Depends(get_current_admin_user)])
async def get_all_faqs(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir toutes les FAQ (admin) incluant les inactives"""
    
    faqs = (
        db.query(FAQ)
        .order_by(FAQ.sort_order, FAQ.id)
        .all()
    )
    
    return {
        "faqs": [
            {
                "id": faq.id,
                "question": faq.question,
                "answer": faq.answer,
                "sort_order": faq.sort_order,
                "is_active": faq.is_active,
                "created_at": faq.created_at,
                "updated_at": faq.updated_at
            }
            for faq in faqs
        ]
    }


@router.post("/", dependencies=[Depends(get_current_admin_user)])
async def create_faq(
    question: str,
    answer: str,
    sort_order: int = 0,
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """Créer une nouvelle FAQ (Admin)"""
    
    faq = FAQ(
        question=question,
        answer=answer,
        sort_order=sort_order,
        is_active=is_active
    )
    
    db.add(faq)
    db.commit()
    db.refresh(faq)
    
    return {
        "message": "FAQ créée avec succès",
        "faq_id": faq.id
    }


@router.put("/{faq_id}", dependencies=[Depends(get_current_admin_user)])
async def update_faq(
    faq_id: int,
    question: str = None,
    answer: str = None,
    sort_order: int = None,
    is_active: bool = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour une FAQ (Admin)"""
    
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ non trouvée")
    
    if question is not None:
        faq.question = question
    if answer is not None:
        faq.answer = answer
    if sort_order is not None:
        faq.sort_order = sort_order
    if is_active is not None:
        faq.is_active = is_active
    
    db.commit()
    
    return {"message": "FAQ mise à jour avec succès"}


@router.delete("/{faq_id}", dependencies=[Depends(get_current_admin_user)])
async def delete_faq(
    faq_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Supprimer une FAQ (Admin)"""
    
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ non trouvée")
    
    db.delete(faq)
    db.commit()
    
    return {"message": "FAQ supprimée avec succès"}

