"""
Endpoints pour la gestion du slider hero dynamique
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.hero_slider import HeroSlide, SiteSettings

router = APIRouter()


@router.get("/hero-slides")
async def get_hero_slides(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir tous les slides actifs du hero slider"""
    
    slides = (
        db.query(HeroSlide)
        .filter(HeroSlide.is_active == True)
        .order_by(HeroSlide.sort_order, HeroSlide.id)
        .all()
    )
    
    return {
        "slides": [
            {
                "id": slide.id,
                "title": slide.title,
                "subtitle": slide.subtitle,
                "image_url": slide.image_url,
                "cta_text": slide.cta_text,
                "cta_link": slide.cta_link,
                "sort_order": slide.sort_order
            }
            for slide in slides
        ]
    }


@router.get("/hero-slides/{slide_id}")
async def get_hero_slide(
    slide_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir un slide spécifique"""
    
    slide = db.query(HeroSlide).filter(HeroSlide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide non trouvé")
    
    return {
        "id": slide.id,
        "title": slide.title,
        "subtitle": slide.subtitle,
        "image_url": slide.image_url,
        "cta_text": slide.cta_text,
        "cta_link": slide.cta_link,
        "sort_order": slide.sort_order,
        "is_active": slide.is_active,
        "created_at": slide.created_at,
        "updated_at": slide.updated_at
    }


@router.post("/hero-slides", dependencies=[Depends(get_current_admin_user)])
async def create_hero_slide(
    title: str,
    image_url: str,
    subtitle: str = None,
    cta_text: str = None,
    cta_link: str = None,
    sort_order: int = 0,
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """Créer un nouveau slide hero (Admin)"""
    
    slide = HeroSlide(
        title=title,
        subtitle=subtitle,
        image_url=image_url,
        cta_text=cta_text,
        cta_link=cta_link,
        sort_order=sort_order,
        is_active=is_active
    )
    
    db.add(slide)
    db.commit()
    db.refresh(slide)
    
    return {
        "message": "Slide créé avec succès",
        "slide_id": slide.id
    }


@router.put("/hero-slides/{slide_id}", dependencies=[Depends(get_current_admin_user)])
async def update_hero_slide(
    slide_id: int,
    title: str = None,
    subtitle: str = None,
    image_url: str = None,
    cta_text: str = None,
    cta_link: str = None,
    sort_order: int = None,
    is_active: bool = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour un slide (Admin)"""
    
    slide = db.query(HeroSlide).filter(HeroSlide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide non trouvé")
    
    if title is not None:
        slide.title = title
    if subtitle is not None:
        slide.subtitle = subtitle
    if image_url is not None:
        slide.image_url = image_url
    if cta_text is not None:
        slide.cta_text = cta_text
    if cta_link is not None:
        slide.cta_link = cta_link
    if sort_order is not None:
        slide.sort_order = sort_order
    if is_active is not None:
        slide.is_active = is_active
    
    db.commit()
    
    return {"message": "Slide mis à jour avec succès"}


@router.delete("/hero-slides/{slide_id}", dependencies=[Depends(get_current_admin_user)])
async def delete_hero_slide(
    slide_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Supprimer un slide (Admin)"""
    
    slide = db.query(HeroSlide).filter(HeroSlide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide non trouvé")
    
    db.delete(slide)
    db.commit()
    
    return {"message": "Slide supprimé avec succès"}


# Site Settings endpoints

@router.get("/settings")
async def get_site_settings(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir tous les paramètres du site"""
    
    settings = db.query(SiteSettings).all()
    
    return {
        "settings": {
            setting.key: setting.value
            for setting in settings
        }
    }


@router.get("/settings/{key}")
async def get_site_setting(
    key: str,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir un paramètre spécifique"""
    
    setting = db.query(SiteSettings).filter(SiteSettings.key == key).first()
    if not setting:
        return {"key": key, "value": None}
    
    return {
        "key": setting.key,
        "value": setting.value,
        "description": setting.description
    }


@router.put("/settings/{key}", dependencies=[Depends(get_current_admin_user)])
async def update_site_setting(
    key: str,
    value: str,
    description: str = None,
    db: Session = Depends(get_db)
) -> Any:
    """Mettre à jour un paramètre du site (Admin)"""
    
    setting = db.query(SiteSettings).filter(SiteSettings.key == key).first()
    
    if setting:
        setting.value = value
        if description:
            setting.description = description
    else:
        setting = SiteSettings(
            key=key,
            value=value,
            description=description
        )
        db.add(setting)
    
    db.commit()
    
    return {"message": "Paramètre mis à jour avec succès"}
