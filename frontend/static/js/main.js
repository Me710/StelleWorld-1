// JavaScript principal pour StelleWorld

// Variables globales
let currentUser = null;
let cartItems = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Charger les données utilisateur
    loadUserData();
    
    // Charger le panier
    loadCart();
    
    // Initialiser les notifications
    initializeNotifications();
    
    // Configurer HTMX
    configureHTMX();
    
    console.log('StelleWorld app initialized');
}

// Gestion des utilisateurs
function loadUserData() {
    const token = localStorage.getItem('access_token');
    if (token) {
        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.email) {
                currentUser = data;
                updateUIForUser(data);
            } else {
                localStorage.removeItem('access_token');
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données utilisateur:', error);
            localStorage.removeItem('access_token');
        });
    }
}

function updateUIForUser(user) {
    // Mettre à jour l'interface pour l'utilisateur connecté
    const userMenus = document.querySelectorAll('[data-user-menu]');
    userMenus.forEach(menu => {
        menu.style.display = 'block';
    });
    
    const guestMenus = document.querySelectorAll('[data-guest-menu]');
    guestMenus.forEach(menu => {
        menu.style.display = 'none';
    });
    
    // Afficher le nom de l'utilisateur
    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(element => {
        element.textContent = user.first_name || user.email;
    });
}

// Gestion du panier
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        updateCartUI();
    }
}

function addToCart(productId, quantity = 1) {
    // Vérifier si le produit est déjà dans le panier
    const existingItem = cartItems.find(item => item.product_id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        // Récupérer les détails du produit
        fetch(`/api/products/${productId}`)
            .then(response => response.json())
            .then(product => {
                cartItems.push({
                    product_id: productId,
                    product_name: product.name,
                    product_price: product.price,
                    product_image: product.main_image_url,
                    quantity: quantity
                });
                saveCart();
                updateCartUI();
                showNotification('Produit ajouté au panier', 'success');
            })
            .catch(error => {
                console.error('Erreur lors de l\'ajout au panier:', error);
                showNotification('Erreur lors de l\'ajout au panier', 'error');
            });
        return;
    }
    
    saveCart();
    updateCartUI();
    showNotification('Quantité mise à jour dans le panier', 'success');
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.product_id !== productId);
    saveCart();
    updateCartUI();
    showNotification('Produit retiré du panier', 'info');
}

function updateCartQuantity(productId, quantity) {
    const item = cartItems.find(item => item.product_id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}

function updateCartUI() {
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'flex' : 'none';
    }
}

function clearCart() {
    cartItems = [];
    saveCart();
    updateCartUI();
}

// Gestion des notifications
function initializeNotifications() {
    // Créer le conteneur s'il n'existe pas
    if (!document.getElementById('flash-messages')) {
        const container = document.createElement('div');
        container.id = 'flash-messages';
        container.className = 'fixed top-20 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('flash-messages');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type} animate-fade-in`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${icon} mr-2"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-70 hover:opacity-100">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove après la durée spécifiée
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Menu mobile
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Configuration HTMX
function configureHTMX() {
    // Ajouter le token d'authentification aux requêtes HTMX
    document.addEventListener('htmx:configRequest', function(evt) {
        const token = localStorage.getItem('access_token');
        if (token) {
            evt.detail.headers['Authorization'] = `Bearer ${token}`;
        }
    });
    
    // Gérer les erreurs HTMX
    document.addEventListener('htmx:responseError', function(evt) {
        console.error('Erreur HTMX:', evt.detail);
        showNotification('Erreur lors de la requête', 'error');
    });
    
    // Gérer les réponses de succès
    document.addEventListener('htmx:afterRequest', function(evt) {
        if (evt.detail.xhr.status >= 200 && evt.detail.xhr.status < 300) {
            // Optionnel: traitement des réponses de succès
        }
    });
}

// Utilitaires de formatage
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
}

// Gestion des formulaires
function submitForm(formElement, successCallback, errorCallback) {
    const formData = new FormData(formElement);
    const token = localStorage.getItem('access_token');
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Convertir FormData en objet JSON
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    fetch(formElement.action, {
        method: formElement.method || 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            if (errorCallback) {
                errorCallback(data);
            } else {
                showNotification(data.error, 'error');
            }
        } else {
            if (successCallback) {
                successCallback(data);
            } else {
                showNotification(data.message || 'Opération réussie', 'success');
            }
        }
    })
    .catch(error => {
        console.error('Erreur formulaire:', error);
        if (errorCallback) {
            errorCallback(error);
        } else {
            showNotification('Erreur lors de l\'envoi du formulaire', 'error');
        }
    });
}

// Gestion des modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

// Fermer les modales en cliquant à l'extérieur
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-backdrop')) {
        const modal = event.target;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
});

// Gestion des favoris (si implémenté)
function toggleFavorite(productId) {
    if (!currentUser) {
        showNotification('Connectez-vous pour ajouter aux favoris', 'warning');
        return;
    }
    
    // Implementation des favoris
    console.log('Toggle favorite for product:', productId);
}

// Recherche
function performSearch(query) {
    if (query.trim() === '') {
        return;
    }
    
    window.location.href = `/products?search=${encodeURIComponent(query)}`;
}

// Gestion des touches clavier
document.addEventListener('keydown', function(event) {
    // Echap pour fermer les modales
    if (event.key === 'Escape') {
        const visibleModals = document.querySelectorAll('.modal:not(.hidden)');
        visibleModals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
        document.body.style.overflow = 'auto';
    }
    
    // Ctrl+K pour la recherche
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// Analytics simples
function trackEvent(eventName, properties = {}) {
    // Implementation basique du tracking
    console.log('Track event:', eventName, properties);
    
    // Ici vous pourriez intégrer Google Analytics, Mixpanel, etc.
}

// Validation côté client
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return re.test(phone);
}

// Debounce pour les recherches
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export des fonctions principales pour usage global
window.StelleWorld = {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    showNotification,
    toggleMobileMenu,
    openModal,
    closeModal,
    toggleFavorite,
    performSearch,
    formatPrice,
    formatDate,
    trackEvent,
    validateEmail,
    validatePhone
};
