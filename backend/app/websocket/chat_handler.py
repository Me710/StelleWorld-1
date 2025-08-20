"""
Gestionnaire WebSocket pour le chat temps réel
"""

import json
from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.chat import ChatConversation, ChatMessage, MessageType, ChatStatus
from app.models.user import User

router = APIRouter()

class ConnectionManager:
    """Gestionnaire des connexions WebSocket"""
    
    def __init__(self):
        # Connexions actives par conversation
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Connexions admin
        self.admin_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket, conversation_id: int = None, is_admin: bool = False):
        """Accepter une nouvelle connexion WebSocket"""
        await websocket.accept()
        
        if is_admin:
            self.admin_connections.append(websocket)
        elif conversation_id:
            if conversation_id not in self.active_connections:
                self.active_connections[conversation_id] = []
            self.active_connections[conversation_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, conversation_id: int = None, is_admin: bool = False):
        """Supprimer une connexion WebSocket"""
        if is_admin and websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
        elif conversation_id and conversation_id in self.active_connections:
            if websocket in self.active_connections[conversation_id]:
                self.active_connections[conversation_id].remove(websocket)
                # Nettoyer si plus de connexions
                if not self.active_connections[conversation_id]:
                    del self.active_connections[conversation_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Envoyer un message à une connexion spécifique"""
        try:
            await websocket.send_text(message)
        except:
            pass
    
    async def broadcast_to_conversation(self, message: str, conversation_id: int):
        """Diffuser un message à toutes les connexions d'une conversation"""
        if conversation_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[conversation_id]:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.append(connection)
            
            # Nettoyer les connexions fermées
            for connection in disconnected:
                self.active_connections[conversation_id].remove(connection)
    
    async def broadcast_to_admins(self, message: str):
        """Diffuser un message à tous les admins connectés"""
        disconnected = []
        for connection in self.admin_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Nettoyer les connexions fermées
        for connection in disconnected:
            self.admin_connections.remove(connection)

# Instance globale du gestionnaire
manager = ConnectionManager()

@router.websocket("/chat/{conversation_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Endpoint WebSocket pour les conversations de chat client"""
    
    # Vérifier que la conversation existe
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conversation:
        await websocket.close(code=4004, reason="Conversation non trouvée")
        return
    
    await manager.connect(websocket, conversation_id)
    
    try:
        while True:
            # Recevoir un message du client
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                content = message_data.get("content", "")
                message_type = message_data.get("type", "text")
                
                if not content.strip():
                    continue
                
                # Créer le message en base de données
                message = ChatMessage(
                    conversation_id=conversation_id,
                    user_id=conversation.user_id,
                    content=content,
                    message_type=MessageType.TEXT if message_type == "text" else MessageType.IMAGE,
                    is_from_admin=False
                )
                
                db.add(message)
                
                # Mettre à jour la conversation
                conversation.last_message_at = datetime.utcnow()
                conversation.status = ChatStatus.OPEN
                
                db.commit()
                db.refresh(message)
                
                # Préparer la réponse
                response_data = {
                    "type": "message",
                    "message": {
                        "id": message.id,
                        "content": message.content,
                        "message_type": message.message_type,
                        "sender_name": message.sender_name,
                        "is_from_admin": message.is_from_admin,
                        "created_at": message.created_at.isoformat(),
                        "conversation_id": conversation_id
                    }
                }
                
                # Diffuser le message dans la conversation
                await manager.broadcast_to_conversation(
                    json.dumps(response_data),
                    conversation_id
                )
                
                # Notifier les admins
                admin_notification = {
                    "type": "new_message",
                    "conversation_id": conversation_id,
                    "participant_name": conversation.participant_name,
                    "participant_email": conversation.participant_email,
                    "message_preview": content[:100] + "..." if len(content) > 100 else content,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await manager.broadcast_to_admins(json.dumps(admin_notification))
                
                # Envoyer notification Telegram (tâche asynchrone)
                from worker.tasks.notifications import send_new_chat_message_notification
                send_new_chat_message_notification.delay(conversation_id, content)
                
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Format de message invalide"}),
                    websocket
                )
            except Exception as e:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Erreur lors de l'envoi du message"}),
                    websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
    except Exception as e:
        manager.disconnect(websocket, conversation_id)


@router.websocket("/admin/chat")
async def websocket_admin_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    """Endpoint WebSocket pour les administrateurs"""
    
    await manager.connect(websocket, is_admin=True)
    
    try:
        while True:
            # Recevoir un message de l'admin
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                action = message_data.get("action")
                
                if action == "reply":
                    conversation_id = message_data.get("conversation_id")
                    content = message_data.get("content", "")
                    admin_name = message_data.get("admin_name", "Support")
                    
                    if not conversation_id or not content.strip():
                        continue
                    
                    # Vérifier que la conversation existe
                    conversation = db.query(ChatConversation).filter(
                        ChatConversation.id == conversation_id
                    ).first()
                    
                    if not conversation:
                        await manager.send_personal_message(
                            json.dumps({"type": "error", "message": "Conversation non trouvée"}),
                            websocket
                        )
                        continue
                    
                    # Créer la réponse admin
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
                    conversation.admin_assigned = admin_name
                    
                    db.commit()
                    db.refresh(message)
                    
                    # Préparer la réponse
                    response_data = {
                        "type": "message",
                        "message": {
                            "id": message.id,
                            "content": message.content,
                            "message_type": message.message_type,
                            "sender_name": message.sender_name,
                            "is_from_admin": message.is_from_admin,
                            "admin_name": message.admin_name,
                            "created_at": message.created_at.isoformat(),
                            "conversation_id": conversation_id
                        }
                    }
                    
                    # Diffuser la réponse à la conversation
                    await manager.broadcast_to_conversation(
                        json.dumps(response_data),
                        conversation_id
                    )
                    
                    # Confirmer à l'admin
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "reply_sent",
                            "conversation_id": conversation_id,
                            "message_id": message.id
                        }),
                        websocket
                    )
                
                elif action == "get_conversations":
                    # Envoyer la liste des conversations actives
                    active_conversations = (
                        db.query(ChatConversation)
                        .filter(ChatConversation.status == ChatStatus.OPEN)
                        .order_by(ChatConversation.last_message_at.desc())
                        .limit(50)
                        .all()
                    )
                    
                    conversations_data = {
                        "type": "conversations_list",
                        "conversations": [
                            {
                                "id": conv.id,
                                "participant_name": conv.participant_name,
                                "participant_email": conv.participant_email,
                                "subject": conv.subject,
                                "last_message_at": conv.last_message_at.isoformat() if conv.last_message_at else None,
                                "message_count": conv.message_count,
                                "admin_assigned": conv.admin_assigned,
                                "created_at": conv.created_at.isoformat()
                            }
                            for conv in active_conversations
                        ]
                    }
                    
                    await manager.send_personal_message(
                        json.dumps(conversations_data),
                        websocket
                    )
                
                elif action == "mark_read":
                    conversation_id = message_data.get("conversation_id")
                    
                    if conversation_id:
                        # Marquer tous les messages comme lus
                        unread_messages = (
                            db.query(ChatMessage)
                            .filter(
                                ChatMessage.conversation_id == conversation_id,
                                ChatMessage.is_read == False,
                                ChatMessage.is_from_admin == False
                            )
                            .all()
                        )
                        
                        for msg in unread_messages:
                            msg.is_read = True
                            msg.read_at = datetime.utcnow()
                        
                        db.commit()
                        
                        await manager.send_personal_message(
                            json.dumps({
                                "type": "marked_read",
                                "conversation_id": conversation_id,
                                "messages_marked": len(unread_messages)
                            }),
                            websocket
                        )
                
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Format de données invalide"}),
                    websocket
                )
            except Exception as e:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Erreur lors du traitement"}),
                    websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, is_admin=True)
    except Exception as e:
        manager.disconnect(websocket, is_admin=True)


@router.get("/chat/active-connections")
async def get_active_connections():
    """Obtenir le nombre de connexions actives (pour monitoring)"""
    total_client_connections = sum(len(connections) for connections in manager.active_connections.values())
    
    return {
        "client_connections": total_client_connections,
        "admin_connections": len(manager.admin_connections),
        "active_conversations": len(manager.active_connections),
        "conversation_details": {
            conv_id: len(connections) 
            for conv_id, connections in manager.active_connections.items()
        }
    }
