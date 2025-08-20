// Gestionnaire de chat temps réel pour StelleWorld

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.websocket = null;
        this.conversationId = null;
        this.sessionId = this.generateSessionId();
        this.isConnected = false;
        this.messageQueue = [];
        
        this.initializeWidget();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeWidget() {
        // Créer le widget s'il n'existe pas
        if (!document.getElementById('chat-widget')) {
            this.createWidget();
        }
        
        // Initialiser les événements
        this.bindEvents();
        
        console.log('Chat widget initialized');
    }
    
    createWidget() {
        // Le widget est déjà dans base.html
        // Cette méthode peut être utilisée pour la création dynamique si nécessaire
    }
    
    bindEvents() {
        // Enter pour envoyer un message
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        const widget = document.getElementById('chat-widget');
        if (widget) {
            widget.classList.remove('hidden');
            widget.classList.add('animate-fade-in');
            this.isOpen = true;
            
            // Démarrer la conversation si ce n'est pas déjà fait
            if (!this.conversationId) {
                this.startConversation();
            } else if (!this.isConnected) {
                this.connectWebSocket();
            }
            
            // Focus sur l'input
            setTimeout(() => {
                const input = document.getElementById('chat-input');
                if (input) input.focus();
            }, 100);
        }
    }
    
    close() {
        const widget = document.getElementById('chat-widget');
        if (widget) {
            widget.classList.add('hidden');
            widget.classList.remove('animate-fade-in');
            this.isOpen = false;
            
            // Fermer la WebSocket mais garder la conversation
            if (this.websocket) {
                this.websocket.close();
                this.isConnected = false;
            }
        }
    }
    
    async startConversation() {
        try {
            const userData = currentUser ? {
                visitor_name: currentUser.first_name + ' ' + currentUser.last_name,
                visitor_email: currentUser.email,
                visitor_phone: currentUser.phone
            } : {
                visitor_name: 'Visiteur',
                visitor_email: '',
                visitor_phone: ''
            };
            
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('access_token') && {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    })
                },
                body: JSON.stringify({
                    ...userData,
                    session_id: this.sessionId,
                    initial_message: 'Bonjour, j\'aimerais obtenir de l\'aide.'
                })
            });
            
            const data = await response.json();
            
            if (data.conversation_id) {
                this.conversationId = data.conversation_id;
                this.connectWebSocket();
                this.addSystemMessage('Conversation démarrée. Un agent vous répondra bientôt.');
            } else {
                this.addSystemMessage('Erreur lors du démarrage de la conversation.');
            }
            
        } catch (error) {
            console.error('Erreur démarrage conversation:', error);
            this.addSystemMessage('Erreur de connexion. Veuillez réessayer.');
        }
    }
    
    connectWebSocket() {
        if (!this.conversationId || this.isConnected) return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat/${this.conversationId}`;
        
        try {
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connecté');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                
                // Envoyer les messages en attente
                while (this.messageQueue.length > 0) {
                    const message = this.messageQueue.shift();
                    this.websocket.send(JSON.stringify(message));
                }
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Erreur parsing WebSocket message:', error);
                }
            };
            
            this.websocket.onclose = (event) => {
                console.log('WebSocket fermé:', event.code, event.reason);
                this.isConnected = false;
                this.updateConnectionStatus(false);
                
                // Reconnexion automatique si la fermeture n'est pas intentionnelle
                if (this.isOpen && event.code !== 1000) {
                    setTimeout(() => {
                        this.connectWebSocket();
                    }, 3000);
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('Erreur WebSocket:', error);
                this.updateConnectionStatus(false);
            };
            
        } catch (error) {
            console.error('Erreur création WebSocket:', error);
            this.addSystemMessage('Erreur de connexion temps réel.');
        }
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'message':
                this.addMessage(data.message);
                break;
            case 'error':
                this.addSystemMessage('Erreur: ' + data.message);
                break;
            case 'typing':
                this.showTypingIndicator(data.is_typing);
                break;
            default:
                console.log('Message WebSocket non géré:', data);
        }
    }
    
    sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        
        const content = input.value.trim();
        if (!content) return;
        
        const message = {
            content: content,
            type: 'text'
        };
        
        // Ajouter le message à l'interface immédiatement
        this.addMessage({
            content: content,
            sender_name: currentUser ? currentUser.first_name : 'Vous',
            is_from_admin: false,
            created_at: new Date().toISOString()
        });
        
        // Envoyer via WebSocket ou mettre en queue
        if (this.isConnected && this.websocket) {
            this.websocket.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
            this.addSystemMessage('Message en attente d\'envoi...');
        }
        
        // Vider l'input
        input.value = '';
    }
    
    addMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message p-2 rounded-lg mb-2 ${message.is_from_admin ? 'admin' : 'user'}`;
        
        const time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageElement.innerHTML = `
            <div class="text-xs opacity-75 mb-1">${message.sender_name} - ${time}</div>
            <div>${this.escapeHtml(message.content)}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    addSystemMessage(content) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system p-2 rounded-lg mb-2 text-center';
        messageElement.innerHTML = `<div class="text-sm">${this.escapeHtml(content)}</div>`;
        
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('chat-indicator');
        if (indicator) {
            if (connected) {
                indicator.classList.remove('hidden');
                indicator.classList.add('bg-green-500');
                indicator.classList.remove('bg-red-500');
            } else {
                indicator.classList.remove('hidden');
                indicator.classList.add('bg-red-500');
                indicator.classList.remove('bg-green-500');
            }
        }
    }
    
    showTypingIndicator(isTyping) {
        let indicator = document.getElementById('typing-indicator');
        
        if (isTyping) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'typing-indicator';
                indicator.className = 'chat-message admin p-2 rounded-lg mb-2';
                indicator.innerHTML = `
                    <div class="flex items-center space-x-1 text-gray-500">
                        <span>Agent en train d'écrire</span>
                        <div class="flex space-x-1">
                            <div class="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                            <div class="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                            <div class="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                        </div>
                    </div>
                `;
                
                const messagesContainer = document.getElementById('chat-messages');
                if (messagesContainer) {
                    messagesContainer.appendChild(indicator);
                    this.scrollToBottom();
                }
            }
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Méthodes publiques
    minimize() {
        this.close();
    }
    
    maximize() {
        this.open();
    }
    
    sendQuickMessage(message) {
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = message;
            this.sendMessage();
        }
    }
}

// Instance globale du chat
let chatWidget = null;

// Initialisation quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
    chatWidget = new ChatWidget();
});

// Fonctions globales pour l'utilisation dans les templates
function toggleChat() {
    if (chatWidget) {
        chatWidget.toggle();
    }
}

function sendChatMessage() {
    if (chatWidget) {
        chatWidget.sendMessage();
    }
}

function sendQuickChatMessage(message) {
    if (chatWidget) {
        chatWidget.sendQuickMessage(message);
    }
}

// Export pour usage global
window.ChatWidget = ChatWidget;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;
window.sendQuickChatMessage = sendQuickChatMessage;
