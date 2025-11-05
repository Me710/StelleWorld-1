"""
Routes API pour la gestion des bannières d'annonce.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate, BannerResponse

router = APIRouter(prefix="/api/banners", tags=["banners"])


@router.get("/active", response_model=BannerResponse, summary="Récupérer la bannière active")
def get_active_banner(db: Session = Depends(get_db)):
    """
    Récupère la bannière actuellement active pour l'afficher sur le site.
    """
    banner = db.query(Banner).filter(Banner.is_active == True).first()
    
    if not banner:
        # Créer une bannière par défaut si aucune n'existe
        banner = Banner(
            message="💌 Bienvenue sur StelleWorld ! Découvrez nos nouveaux produits.",
            is_active=True,
            background_color="#fce7f3",
            text_color="#831843"
        )
        db.add(banner)
        db.commit()
        db.refresh(banner)
    
    return banner


@router.get("/", response_model=List[BannerResponse], summary="Lister toutes les bannières")
def list_banners(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Liste toutes les bannières (admin).
    """
    banners = db.query(Banner).offset(skip).limit(limit).all()
    return banners


@router.get("/{banner_id}", response_model=BannerResponse, summary="Récupérer une bannière")
def get_banner(banner_id: int, db: Session = Depends(get_db)):
    """
    Récupère une bannière spécifique par son ID.
    """
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bannière non trouvée"
        )
    
    return banner


@router.post("/", response_model=BannerResponse, status_code=status.HTTP_201_CREATED, summary="Créer une bannière")
def create_banner(banner_data: BannerCreate, db: Session = Depends(get_db)):
    """
    Crée une nouvelle bannière.
    Si is_active est True, désactive toutes les autres bannières.
    """
    # Si on active cette bannière, désactiver les autres
    if banner_data.is_active:
        db.query(Banner).update({"is_active": False})
    
    banner = Banner(**banner_data.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    
    return banner


@router.patch("/{banner_id}", response_model=BannerResponse, summary="Mettre à jour une bannière")
def update_banner(
    banner_id: int,
    banner_data: BannerUpdate,
    db: Session = Depends(get_db)
):
    """
    Met à jour une bannière existante.
    Si is_active est True, désactive toutes les autres bannières.
    """
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bannière non trouvée"
        )
    
    # Si on active cette bannière, désactiver les autres
    if banner_data.is_active is True:
        db.query(Banner).filter(Banner.id != banner_id).update({"is_active": False})
    
    # Mettre à jour les champs fournis
    update_data = banner_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(banner, field, value)
    
    db.commit()
    db.refresh(banner)
    
    return banner


@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer une bannière")
def delete_banner(banner_id: int, db: Session = Depends(get_db)):
    """
    Supprime une bannière.
    """
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bannière non trouvée"
        )
    
    db.delete(banner)
    db.commit()
    
    return None

