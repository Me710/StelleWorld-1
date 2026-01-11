"""
Endpoints pour l'upload de fichiers (images produits, etc.)
Utilise Cloudinary en production, stockage local en développement
"""

import os
import uuid
import shutil
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.security import get_current_admin_user
from app.models.user import User

router = APIRouter()

# Configuration du dossier d'upload local (fallback)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
PRODUCTS_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "products")

# Extensions autorisées
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# Créer les dossiers d'upload au démarrage
os.makedirs(PRODUCTS_UPLOAD_DIR, exist_ok=True)
print(f"📁 Dossier uploads créé/vérifié: {PRODUCTS_UPLOAD_DIR}")

# Configuration Cloudinary
cloudinary_configured = False
try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        cloudinary_configured = True
        print("✅ Cloudinary configuré avec succès")
    else:
        print("⚠️ Cloudinary non configuré - utilisation du stockage local")
except ImportError:
    print("⚠️ Module cloudinary non installé - utilisation du stockage local")


def ensure_upload_dirs():
    """Créer les dossiers d'upload s'ils n'existent pas"""
    os.makedirs(PRODUCTS_UPLOAD_DIR, exist_ok=True)


def validate_image(file: UploadFile) -> None:
    """Valider qu'un fichier est une image valide"""
    # Vérifier l'extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension non autorisée. Extensions acceptées: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Vérifier le type MIME
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier doit être une image"
        )


def generate_unique_filename(original_filename: str) -> str:
    """Générer un nom de fichier unique"""
    ext = os.path.splitext(original_filename)[1].lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"


async def upload_to_cloudinary(file: UploadFile) -> str:
    """Upload une image vers Cloudinary et retourne l'URL"""
    try:
        # Lire le contenu du fichier
        contents = await file.read()
        await file.seek(0)
        
        # Upload vers Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder="stelleworld/products",
            resource_type="image",
            transformation=[
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        return result["secure_url"]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'upload vers Cloudinary: {str(e)}"
        )


async def upload_locally(file: UploadFile) -> str:
    """Upload une image localement et retourne l'URL relative"""
    ensure_upload_dirs()
    
    unique_filename = generate_unique_filename(file.filename)
    file_path = os.path.join(PRODUCTS_UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'upload local: {str(e)}"
        )
    
    return f"/api/uploads/products/{unique_filename}"


@router.post("/images", dependencies=[Depends(get_current_admin_user)])
async def upload_images(
    files: List[UploadFile] = File(..., description="Images à uploader (1-5 fichiers)")
):
    """
    Upload une ou plusieurs images pour les produits.
    Utilise Cloudinary si configuré, sinon stockage local.
    Retourne les URLs des images uploadées.
    Maximum 5 images, 5MB par image.
    """
    
    # Validation du nombre de fichiers
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni")
    
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images autorisées")
    
    uploaded_urls = []
    storage_type = "cloudinary" if cloudinary_configured else "local"
    
    for file in files:
        # Validation de l'image
        validate_image(file)
        
        # Vérifier la taille
        file.file.seek(0, 2)  # Aller à la fin
        file_size = file.file.tell()
        file.file.seek(0)  # Revenir au début
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Le fichier {file.filename} dépasse la taille maximale de 5MB"
            )
        
        # Upload selon la configuration
        if cloudinary_configured:
            image_url = await upload_to_cloudinary(file)
        else:
            image_url = await upload_locally(file)
        
        uploaded_urls.append(image_url)
    
    return {
        "success": True,
        "urls": uploaded_urls,
        "count": len(uploaded_urls),
        "storage": storage_type,
        "message": f"{len(uploaded_urls)} image(s) uploadée(s) avec succès via {storage_type}"
    }


@router.get("/products/{filename}")
async def get_product_image(filename: str):
    """Servir une image de produit (stockage local uniquement)"""
    file_path = os.path.join(PRODUCTS_UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image non trouvée")
    
    # Déterminer le type MIME
    ext = os.path.splitext(filename)[1].lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache 1 an
    )


@router.delete("/images", dependencies=[Depends(get_current_admin_user)])
async def delete_image(url: str):
    """Supprimer une image uploadée (Cloudinary ou local)"""
    
    if cloudinary_configured and "cloudinary" in url:
        # Extraire le public_id de l'URL Cloudinary
        try:
            # URL format: https://res.cloudinary.com/{cloud}/image/upload/v123/stelleworld/products/filename.jpg
            parts = url.split("/")
            # Trouver l'index de 'upload' et prendre tout après le version
            upload_idx = parts.index("upload")
            public_id = "/".join(parts[upload_idx + 2:]).rsplit(".", 1)[0]
            
            cloudinary.uploader.destroy(public_id)
            return {"success": True, "message": "Image supprimée de Cloudinary"}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la suppression Cloudinary: {str(e)}"
            )
    else:
        # Suppression locale
        filename = url.split("/")[-1]
        file_path = os.path.join(PRODUCTS_UPLOAD_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Image non trouvée")
        
        try:
            os.remove(file_path)
            return {"success": True, "message": "Image supprimée localement"}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la suppression: {str(e)}"
            )


@router.get("/status")
async def get_upload_status():
    """Vérifier le statut du système d'upload"""
    return {
        "cloudinary_configured": cloudinary_configured,
        "storage_type": "cloudinary" if cloudinary_configured else "local",
        "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024),
        "allowed_extensions": list(ALLOWED_EXTENSIONS),
        "max_images_per_upload": 5
    }
