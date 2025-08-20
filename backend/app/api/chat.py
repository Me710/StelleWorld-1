"""
Endpoints pour le système de chat temps réel
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.chat import ChatConversation, ChatMessage, MessageType, ChatStatus
from app.models.user import User

router = APIRouter()


@router.post("/conversations")
async def start_conversation(
    visitor_name: str = None,
    visitor_email: str = None,
    visitor_phone: str = None,
    subject: str = None,
    initial_message: str = None,
    session_id: str = None,
    current_user: User = Depends(get_current_user) if False else None,
    db: Session = Depends(get_db)
) -> Any:
    """Démarrer une nouvelle conversation de chat"""
    
    # Vérifier s'il y a déjà une conversation ouverte pour cette session
    existing_conversation = None
    if session_id:
        existing_conversation = (
            db.query(ChatConversation)
            .filter(
                ChatConversation.session_id == session_id,
                ChatConversation.status == ChatStatus.OPEN
            )
            .first()
        )
    
    if existing_conversation:
        return {
            "conversation_id": existing_conversation.id,
            "status": "existing",
            "message": "Conversation existante trouvée"
        }
    
    # Créer une nouvelle conversation
    conversation = ChatConversation(
        user_id=current_user.id if current_user else None,
        visitor_name=visitor_name if not current_user else None,
        visitor_email=visitor_email if not current_user else None,
        visitor_phone=visitor_phone if not current_user else None,
        session_id=session_id or f"session_{datetime.utcnow().timestamp()}",
        subject=subject
    )
    
    db.add(conversation)
    db.flush()  # Pour obtenir l'ID
    
    # Ajouter le message initial si fourni
    if initial_message:
        message = ChatMessage(
            conversation_id=conversation.id,
            user_id=current_user.id if current_user else None,
            content=initial_message,
            message_type=MessageType.TEXT
        )
        db.add(message)
        conversation.last_message_at = datetime.utcnow()
    
    db.commit()
    db.refresh(conversation)
    
    return {
        "conversation_id": conversation.id,
        "status": "created",
        "session_id": conversation.session_id,
        "message": "Conversation créée avec succès"
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user) if False else None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir une conversation et ses messages"""
    
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Vérifier les permissions
    if current_user and conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé à cette conversation"
        )
    
    # Marquer les messages comme lus
    unread_messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.is_read == False,
            ChatMessage.is_from_admin == True
        )
        .all()
    )
    
    for message in unread_messages:
        message.is_read = True
        message.read_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "id": conversation.id,
        "participant_name": conversation.participant_name,
        "participant_email": conversation.participant_email,
        "subject": conversation.subject,
        "status": conversation.status,
        "session_id": conversation.session_id,
        "created_at": conversation.created_at,
        "last_message_at": conversation.last_message_at,
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "message_type": msg.message_type,
                "is_from_admin": msg.is_from_admin,
                "sender_name": msg.sender_name,
                "attachment_url": msg.attachment_url,
                "attachment_name": msg.attachment_name,
                "created_at": msg.created_at,
                "is_read": msg.is_read
            }
            for msg in sorted(conversation.messages, key=lambda x: x.created_at)
        ]
    }


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    content: str,
    message_type: MessageType = MessageType.TEXT,
    attachment_url: str = None,
    attachment_name: str = None,
    current_user: User = Depends(get_current_user) if False else None,
    db: Session = Depends(get_db)
) -> Any:
    """Envoyer un message dans une conversation"""
    
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Vérifier les permissions
    if current_user and conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé à cette conversation"
        )
    
    if conversation.status == ChatStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette conversation est fermée"
        )
    
    # Créer le message
    message = ChatMessage(
        conversation_id=conversation_id,
        user_id=current_user.id if current_user else None,
        content=content,
        message_type=message_type,
        attachment_url=attachment_url,
        attachment_name=attachment_name
    )
    
    db.add(message)
    
    # Mettre à jour la conversation
    conversation.last_message_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    # TODO: Envoyer notification temps réel via WebSocket
    # TODO: Envoyer notification Telegram à l'admin
    
    return {
        "message_id": message.id,
        "content": message.content,
        "sender_name": message.sender_name,
        "created_at": message.created_at,
        "status": "sent"
    }


@router.get("/conversations")
async def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les conversations de l'utilisateur connecté"""
    
    conversations = (
        db.query(ChatConversation)
        .filter(ChatConversation.user_id == current_user.id)
        .order_by(ChatConversation.last_message_at.desc())
        .all()
    )
    
    return {
        "conversations": [
            {
                "id": conv.id,
                "subject": conv.subject,
                "status": conv.status,
                "last_message_at": conv.last_message_at,
                "message_count": conv.message_count,
                "created_at": conv.created_at
            }
            for conv in conversations
        ]
    }


@router.put("/conversations/{conversation_id}/close")
async def close_conversation(
    conversation_id: int,
    rating: int = None,
    feedback: str = None,
    current_user: User = Depends(get_current_user) if False else None,
    db: Session = Depends(get_db)
) -> Any:
    """Fermer une conversation"""
    
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Vérifier les permissions
    if current_user and conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé à cette conversation"
        )
    
    conversation.status = ChatStatus.CLOSED
    conversation.closed_at = datetime.utcnow()
    
    if rating:
        conversation.rating = rating
    if feedback:
        conversation.feedback = feedback
    
    db.commit()
    
    return {"message": "Conversation fermée avec succès"}


# Endpoints d'administration

@router.get("/admin/conversations", dependencies=[Depends(get_current_admin_user)])
async def get_all_conversations(
    skip: int = 0,
    limit: int = 50,
    status: ChatStatus = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir toutes les conversations (Admin)"""
    
    query = db.query(ChatConversation).order_by(ChatConversation.last_message_at.desc())
    
    if status:
        query = query.filter(ChatConversation.status == status)
    
    total = query.count()
    conversations = query.offset(skip).limit(limit).all()
    
    return {
        "conversations": [
            {
                "id": conv.id,
                "participant_name": conv.participant_name,
                "participant_email": conv.participant_email,
                "subject": conv.subject,
                "status": conv.status,
                "last_message_at": conv.last_message_at,
                "message_count": conv.message_count,
                "rating": conv.rating,
                "admin_assigned": conv.admin_assigned,
                "created_at": conv.created_at
            }
            for conv in conversations
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/admin/conversations/{conversation_id}/reply", dependencies=[Depends(get_current_admin_user)])
async def admin_reply(
    conversation_id: int,
    content: str,
    admin_name: str = "Support",
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """Répondre à une conversation en tant qu'admin"""
    
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Assigner l'admin à la conversation s'il ne l'est pas déjà
    if not conversation.admin_assigned:
        conversation.admin_assigned = admin_name
    
    # Créer le message admin
    message = ChatMessage(
        conversation_id=conversation_id,
        content=content,
        message_type=MessageType.TEXT,
        is_from_admin=True,
        admin_name=admin_name
    )
    
    db.add(message)
    
    # Mettre à jour la conversation
    conversation.last_message_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return {
        "message_id": message.id,
        "content": message.content,
        "sender_name": message.sender_name,
        "created_at": message.created_at,
        "status": "sent"
    }


@router.get("/admin/stats", dependencies=[Depends(get_current_admin_user)])
async def get_chat_stats(
    db: Session = Depends(get_db)
) -> Any:
    """Obtenir les statistiques du chat (Admin)"""
    
    total_conversations = db.query(ChatConversation).count()
    open_conversations = db.query(ChatConversation).filter(
        ChatConversation.status == ChatStatus.OPEN
    ).count()
    
    # Conversations du jour
    today = datetime.utcnow().date()
    from sqlalchemy import func
    today_conversations = db.query(ChatConversation).filter(
        func.date(ChatConversation.created_at) == today
    ).count()
    
    # Satisfaction moyenne
    avg_rating = db.query(func.avg(ChatConversation.rating)).filter(
        ChatConversation.rating.isnot(None)
    ).scalar() or 0
    
    return {
        "total_conversations": total_conversations,
        "open_conversations": open_conversations,
        "today_conversations": today_conversations,
        "average_rating": round(float(avg_rating), 2) if avg_rating else 0
    }
