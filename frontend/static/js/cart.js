// Gestion du panier pour StelleWorld

class ShoppingCart {
    constructor() {
        this.items = [];
        this.isLoading = false;
        this.loadFromStorage();
        this.updateUI();
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('stelleworld_cart');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (error) {
                console.error('Erreur chargement panier:', error);
                this.items = [];
            }
        }
    }
    
    saveToStorage() {
        localStorage.setItem('stelleworld_cart', JSON.stringify(this.items));
    }
    
    async addItem(productId, quantity = 1, options = {}) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Récupérer les détails du produit
            const response = await fetch(`/api/products/${productId}`);
            const product = await response.json();
            
            if (!product.id) {
                throw new Error('Produit non trouvé');
            }
            
            if (!product.is_in_stock) {
                showNotification('Produit en rupture de stock', 'warning');
                return false;
            }
            
            // Vérifier si le produit est déjà dans le panier
            const existingItemIndex = this.items.findIndex(
                item => item.product_id === productId && 
                JSON.stringify(item.options) === JSON.stringify(options)
            );
            
            if (existingItemIndex >= 0) {
                // Mettre à jour la quantité
                this.items[existingItemIndex].quantity += quantity;
            } else {
                // Ajouter un nouvel item
                this.items.push({
                    product_id: productId,
                    product_name: product.name,
                    product_price: product.price,
                    product_image: product.main_image_url,
                    product_slug: product.slug,
                    quantity: quantity,
                    options: options,
                    added_at: new Date().toISOString()
                });
            }
            
            this.saveToStorage();
            this.updateUI();
            
            showNotification(`${product.name} ajouté au panier`, 'success');
            this.trackEvent('add_to_cart', {
                product_id: productId,
                product_name: product.name,
                quantity: quantity,
                price: product.price
            });
            
            return true;
            
        } catch (error) {
            console.error('Erreur ajout au panier:', error);
            showNotification('Erreur lors de l\'ajout au panier', 'error');
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    removeItem(productId, options = {}) {
        const itemIndex = this.items.findIndex(
            item => item.product_id === productId && 
            JSON.stringify(item.options) === JSON.stringify(options)
        );
        
        if (itemIndex >= 0) {
            const removedItem = this.items[itemIndex];
            this.items.splice(itemIndex, 1);
            this.saveToStorage();
            this.updateUI();
            
            showNotification(`${removedItem.product_name} retiré du panier`, 'info');
            this.trackEvent('remove_from_cart', {
                product_id: productId,
                product_name: removedItem.product_name
            });
        }
    }
    
    updateQuantity(productId, quantity, options = {}) {
        const item = this.items.find(
            item => item.product_id === productId && 
            JSON.stringify(item.options) === JSON.stringify(options)
        );
        
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId, options);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                this.updateUI();
            }
        }
    }
    
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
        showNotification('Panier vidé', 'info');
    }
    
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.product_price * item.quantity);
        }, 0);
    }
    
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    updateUI() {
        this.updateCartBadge();
        this.updateCartDropdown();
        this.updateCartPage();
    }
    
    updateCartBadge() {
        const badge = document.getElementById('cart-count');
        if (badge) {
            const totalItems = this.getTotalItems();
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    updateCartDropdown() {
        const dropdown = document.getElementById('cart-dropdown');
        if (!dropdown) return;
        
        if (this.items.length === 0) {
            dropdown.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class="fas fa-shopping-cart text-3xl mb-2"></i>
                    <p>Votre panier est vide</p>
                </div>
            `;
            return;
        }
        
        const itemsHtml = this.items.map(item => `
            <div class="flex items-center p-3 border-b border-gray-200">
                <img src="${item.product_image || '/static/images/placeholder.jpg'}" 
                     alt="${item.product_name}" 
                     class="w-12 h-12 object-cover rounded">
                <div class="ml-3 flex-1">
                    <h4 class="text-sm font-medium text-gray-900 line-clamp-1">${item.product_name}</h4>
                    <p class="text-sm text-gray-600">${item.quantity} × ${formatPrice(item.product_price)}</p>
                </div>
                <button onclick="cart.removeItem(${item.product_id})" 
                        class="text-red-500 hover:text-red-700 ml-2">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        dropdown.innerHTML = `
            <div class="max-h-64 overflow-y-auto">
                ${itemsHtml}
            </div>
            <div class="p-4 border-t border-gray-200">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-semibold">Total:</span>
                    <span class="font-bold text-blue-600">${formatPrice(this.getTotal())}</span>
                </div>
                <div class="flex space-x-2">
                    <a href="/cart" class="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded text-center text-sm hover:bg-gray-300">
                        Voir le panier
                    </a>
                    <a href="/checkout" class="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-center text-sm hover:bg-blue-700">
                        Commander
                    </a>
                </div>
            </div>
        `;
    }
    
    updateCartPage() {
        const cartPage = document.getElementById('cart-page');
        if (!cartPage) return;
        
        if (this.items.length === 0) {
            cartPage.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
                    <p class="text-gray-600 mb-6">Découvrez nos produits et ajoutez-les à votre panier</p>
                    <a href="/products" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Continuer mes achats
                    </a>
                </div>
            `;
            return;
        }
        
        const itemsHtml = this.items.map(item => `
            <div class="flex items-center py-4 border-b border-gray-200" data-item-id="${item.product_id}">
                <img src="${item.product_image || '/static/images/placeholder.jpg'}" 
                     alt="${item.product_name}" 
                     class="w-20 h-20 object-cover rounded">
                <div class="ml-4 flex-1">
                    <h3 class="font-semibold text-gray-900">${item.product_name}</h3>
                    <p class="text-gray-600">${formatPrice(item.product_price)}</p>
                    ${Object.keys(item.options).length > 0 ? 
                        `<p class="text-sm text-gray-500">${Object.entries(item.options).map(([k,v]) => `${k}: ${v}`).join(', ')}</p>` 
                        : ''
                    }
                </div>
                <div class="flex items-center space-x-3">
                    <div class="flex items-center border border-gray-300 rounded">
                        <button onclick="cart.updateQuantity(${item.product_id}, ${item.quantity - 1})" 
                                class="px-3 py-1 hover:bg-gray-100">-</button>
                        <span class="px-3 py-1 border-l border-r border-gray-300">${item.quantity}</span>
                        <button onclick="cart.updateQuantity(${item.product_id}, ${item.quantity + 1})" 
                                class="px-3 py-1 hover:bg-gray-100">+</button>
                    </div>
                    <span class="font-semibold w-20 text-right">${formatPrice(item.product_price * item.quantity)}</span>
                    <button onclick="cart.removeItem(${item.product_id})" 
                            class="text-red-500 hover:text-red-700 p-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        cartPage.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Mon Panier (${this.getTotalItems()} article${this.getTotalItems() > 1 ? 's' : ''})</h2>
                
                <div class="space-y-4">
                    ${itemsHtml}
                </div>
                
                <div class="mt-8 pt-6 border-t border-gray-200">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-lg font-semibold">Sous-total:</span>
                        <span class="text-xl font-bold text-blue-600">${formatPrice(this.getTotal())}</span>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button onclick="cart.clear()" 
                                class="sm:order-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                            Vider le panier
                        </button>
                        <a href="/products" 
                           class="sm:order-2 border border-blue-600 text-blue-600 py-3 px-6 rounded-lg text-center hover:bg-blue-50 transition-colors">
                            Continuer mes achats
                        </a>
                        <a href="/checkout" 
                           class="sm:order-3 bg-blue-600 text-white py-3 px-6 rounded-lg text-center hover:bg-blue-700 transition-colors flex-1">
                            Procéder au paiement
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    async validateCart() {
        // Vérifier la disponibilité des produits avant le checkout
        const validationPromises = this.items.map(async (item) => {
            try {
                const response = await fetch(`/api/products/${item.product_id}`);
                const product = await response.json();
                
                return {
                    item: item,
                    available: product.is_in_stock,
                    current_price: product.price,
                    price_changed: product.price !== item.product_price
                };
            } catch (error) {
                return {
                    item: item,
                    available: false,
                    error: true
                };
            }
        });
        
        const validations = await Promise.all(validationPromises);
        const issues = validations.filter(v => !v.available || v.price_changed || v.error);
        
        if (issues.length > 0) {
            // Gérer les problèmes de validation
            const messages = issues.map(issue => {
                if (issue.error) {
                    return `${issue.item.product_name}: Erreur de vérification`;
                } else if (!issue.available) {
                    return `${issue.item.product_name}: Plus en stock`;
                } else if (issue.price_changed) {
                    return `${issue.item.product_name}: Prix modifié (${formatPrice(issue.current_price)})`;
                }
            });
            
            showNotification('Problèmes détectés:\n' + messages.join('\n'), 'warning', 8000);
            return false;
        }
        
        return true;
    }
    
    trackEvent(event, data) {
        // Analytics pour le panier
        if (window.StelleWorld && window.StelleWorld.trackEvent) {
            window.StelleWorld.trackEvent(event, data);
        }
    }
    
    // Méthodes pour la sauvegarde/restauration cross-device (si utilisateur connecté)
    async syncWithServer() {
        if (!currentUser) return;
        
        try {
            // Synchroniser avec le panier serveur si l'utilisateur est connecté
            const response = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ items: this.items })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.items) {
                    this.items = data.items;
                    this.saveToStorage();
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Erreur sync panier:', error);
        }
    }
}

// Instance globale du panier
const cart = new ShoppingCart();

// Fonctions globales pour l'utilisation dans les templates
function addToCart(productId, quantity = 1, options = {}) {
    return cart.addItem(productId, quantity, options);
}

function removeFromCart(productId, options = {}) {
    cart.removeItem(productId, options);
}

function updateCartQuantity(productId, quantity, options = {}) {
    cart.updateQuantity(productId, quantity, options);
}

function clearCart() {
    cart.clear();
}

function getCartTotal() {
    return cart.getTotal();
}

function getCartItems() {
    return cart.items;
}

// Synchroniser au chargement si utilisateur connecté
document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        cart.syncWithServer();
    }
});

// Export pour usage global
window.ShoppingCart = ShoppingCart;
window.cart = cart;
