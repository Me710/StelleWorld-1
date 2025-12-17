/**
 * Header StelleWorld - Interactions et responsive
 */

// ===================================
// Gestion du menu mobile
// ===================================
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const body = document.body;
    
    if (!mobileNav) return;
    
    // Toggle la classe active
    mobileNav.classList.toggle('active');
    
    // Créer ou supprimer l'overlay
    let overlay = document.getElementById('mobile-nav-overlay');
    
    if (mobileNav.classList.contains('active')) {
        // Créer l'overlay
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobile-nav-overlay';
            overlay.className = 'mobile-nav-overlay';
            overlay.onclick = toggleMobileMenu;
            body.appendChild(overlay);
        }
        
        // Activer l'overlay avec un petit délai pour l'animation
        setTimeout(() => overlay.classList.add('active'), 10);
        
        // Empêcher le scroll du body
        body.style.overflow = 'hidden';
    } else {
        // Désactiver l'overlay
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
        
        // Réactiver le scroll du body
        body.style.overflow = '';
    }
}

// ===================================
// Gestion de la bannière d'annonce
// ===================================
function closeAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    if (!banner) return;
    
    // Animation de fermeture
    banner.style.transition = 'all 0.3s ease';
    banner.style.height = '0';
    banner.style.opacity = '0';
    
    setTimeout(() => {
        banner.classList.add('hidden');
        banner.remove();
    }, 300);
    
    // Sauvegarder dans localStorage que l'utilisateur a fermé la bannière
    localStorage.setItem('announcement-closed', 'true');
}

// Charger la bannière active depuis l'API
async function loadActiveBanner() {
    // Vérifier si l'utilisateur a déjà fermé la bannière
    if (localStorage.getItem('announcement-closed') === 'true') {
        const banner = document.getElementById('announcement-banner');
        if (banner) banner.classList.add('hidden');
        return;
    }
    
    try {
        const response = await fetch('/api/banners/active');
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement de la bannière');
        }
        
        const banner = await response.json();
        
        if (banner && banner.is_active) {
            displayBanner(banner);
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la bannière:', error);
    }
}

// Afficher la bannière avec les données de l'API
function displayBanner(banner) {
    const bannerElement = document.getElementById('announcement-banner');
    if (!bannerElement) return;
    
    // Appliquer les couleurs personnalisées
    bannerElement.style.backgroundColor = banner.background_color || '#fce7f3';
    bannerElement.style.color = banner.text_color || '#831843';
    
    // Mettre à jour le contenu
    const content = bannerElement.querySelector('.announcement-content');
    if (content) {
        content.innerHTML = `
            <p class="announcement-text">${banner.message}</p>
            <button class="announcement-close" onclick="closeAnnouncement()">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    
    // Appliquer la couleur du texte au bouton de fermeture
    const closeBtn = bannerElement.querySelector('.announcement-close');
    if (closeBtn) {
        closeBtn.style.color = banner.text_color || '#831843';
    }
}

// ===================================
// Gestion du panier
// ===================================
function updateCartCount(count) {
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = count || 0;
        
        // Animation sur mise à jour
        cartBadge.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartBadge.style.transform = 'scale(1)';
        }, 200);
    }
}

// Charger le nombre d'articles du panier
function loadCartCount() {
    // Récupérer depuis localStorage ou l'API
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    updateCartCount(totalItems);
}

// ===================================
// Gestion de la recherche
// ===================================
let searchTimeout;

function initSearchAutocomplete() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    // Créer le conteneur d'autocomplétion
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'search-autocomplete';
    autocompleteContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e5e5;
        border-top: none;
        border-radius: 0 0 4px 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: none;
        max-height: 300px;
        overflow-y: auto;
        z-index: 100;
    `;
    
    const searchForm = searchInput.closest('.search-form');
    if (searchForm) {
        searchForm.style.position = 'relative';
        searchForm.appendChild(autocompleteContainer);
    }
    
    // Écouter les entrées de recherche
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // Délai avant la recherche
        searchTimeout = setTimeout(() => {
            searchProducts(query, autocompleteContainer);
        }, 300);
    });
    
    // Fermer l'autocomplétion au clic en dehors
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
}

// Rechercher des produits
async function searchProducts(query, container) {
    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
        
        if (!response.ok) {
            throw new Error('Erreur lors de la recherche');
        }
        
        const products = await response.json();
        
        displaySearchResults(products, container, query);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
    }
}

// Afficher les résultats de recherche
function displaySearchResults(products, container, query) {
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="padding: 15px; text-align: center; color: #6b6b6b;">
                Aucun résultat trouvé pour "${query}"
            </div>
        `;
        container.style.display = 'block';
        return;
    }
    
    const resultsHTML = products.map(product => `
        <a href="/products/${product.id}" style="
            display: flex;
            align-items: center;
            padding: 10px 15px;
            text-decoration: none;
            color: #000;
            border-bottom: 1px solid #f5f5f5;
            transition: background-color 0.2s ease;
        " onmouseover="this.style.backgroundColor='#fce7f3'" 
           onmouseout="this.style.backgroundColor='white'">
            <img src="${product.image_url || '/static/images/products/default-product.svg'}" 
                 alt="${product.name}"
                 style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 12px;">
            <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">${product.name}</div>
                <div style="font-size: 13px; color: #831843; font-weight: 600;">${product.price} €</div>
            </div>
        </a>
    `).join('');
    
    container.innerHTML = resultsHTML + `
        <a href="/products/search?q=${encodeURIComponent(query)}" style="
            display: block;
            padding: 12px 15px;
            text-align: center;
            color: #831843;
            font-weight: 600;
            font-size: 13px;
            text-decoration: none;
            background-color: #fce7f3;
        " onmouseover="this.style.backgroundColor='#fbcfe8'" 
           onmouseout="this.style.backgroundColor='#fce7f3'">
            Voir tous les résultats
        </a>
    `;
    
    container.style.display = 'block';
}

// ===================================
// Gestion du scroll - Header sticky
// ===================================
let lastScrollTop = 0;
const headerWrapper = document.querySelector('.header-wrapper');

function handleHeaderScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scroll vers le bas - cacher le header
        if (headerWrapper) {
            headerWrapper.style.transform = 'translateY(-100%)';
        }
    } else {
        // Scroll vers le haut - afficher le header
        if (headerWrapper) {
            headerWrapper.style.transform = 'translateY(0)';
        }
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

// Throttle pour améliorer les performances
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return func(...args);
    };
}

// ===================================
// Initialisation au chargement
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Charger la bannière active
    loadActiveBanner();
    
    // Charger le nombre d'articles du panier
    loadCartCount();
    
    // Initialiser l'autocomplétion de recherche
    initSearchAutocomplete();
    
    // Ajouter la transition au header pour le scroll
    if (headerWrapper) {
        headerWrapper.style.transition = 'transform 0.3s ease';
    }
    
    // Écouter le scroll avec throttle
    window.addEventListener('scroll', throttle(handleHeaderScroll, 100));
    
    // Fermer le menu mobile au redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            const mobileNav = document.getElementById('mobile-nav');
            const overlay = document.getElementById('mobile-nav-overlay');
            
            if (mobileNav && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            if (overlay) {
                overlay.remove();
            }
        }
    });
    
    // Empêcher la soumission du formulaire de recherche si vide
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            const input = searchForm.querySelector('.search-input');
            if (!input || !input.value.trim()) {
                e.preventDefault();
            }
        });
    }
});

// ===================================
// Export des fonctions pour usage global
// ===================================
window.toggleMobileMenu = toggleMobileMenu;
window.closeAnnouncement = closeAnnouncement;
window.updateCartCount = updateCartCount;
window.loadCartCount = loadCartCount;

