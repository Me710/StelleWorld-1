/**
 * Collection Filters - Gestion des filtres et sidebar pour StelleWorld
 * Inspiré de bswbeautyca.com
 */

class CollectionFilters {
    constructor() {
        this.sidebar = document.getElementById('filter-sidebar');
        this.filterToggle = document.getElementById('filter-toggle');
        this.sidebarClose = document.getElementById('sidebar-close');
        this.resetFiltersBtn = document.getElementById('reset-filters');
        this.productsGrid = document.getElementById('products-grid');
        this.productsCount = document.getElementById('products-count-text');
        this.sortSelect = document.getElementById('sort-select');
        
        // État des filtres
        this.activeFilters = {
            types: [],
            brands: [],
            priceMin: 0,
            priceMax: 1000,
            availability: [],
            sort: 'best-selling'
        };
        
        // État du chargement
        this.isLoading = false;
        this.currentPage = 1;
        this.hasMore = true;
        this.products = [];
        
        // Catégorie courante
        this.categorySlug = window.collectionSlug || null;
        this.categoryId = window.categoryId || null;
        this.categoryName = window.categoryName || 'Collection';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadFilterCounts(); // Charger les compteurs de filtres
        this.loadProducts();
        this.setupInfiniteScroll();
        this.setupViewButtons();
    }
    
    setupEventListeners() {
        // Toggle sidebar
        if (this.filterToggle) {
            this.filterToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (this.sidebarClose) {
            this.sidebarClose.addEventListener('click', () => this.closeSidebar());
        }
        
        // Réinitialiser les filtres
        if (this.resetFiltersBtn) {
            this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }
        
        // Tri - applique automatiquement
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.activeFilters.sort = e.target.value;
                this.applyFilters();
            });
        }
        
        // Écouter les changements de checkboxes - applique automatiquement
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateFilterState();
                this.applyFilters(); // Application automatique
            });
        });
        
        // Écouter les changements de prix - applique automatiquement
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');
        const priceRange = document.getElementById('price-range');
        
        if (priceMin) {
            priceMin.addEventListener('change', () => {
                this.activeFilters.priceMin = parseInt(priceMin.value) || 0;
                this.applyFilters(); // Application automatique
            });
        }
        
        if (priceMax) {
            priceMax.addEventListener('change', () => {
                this.activeFilters.priceMax = parseInt(priceMax.value) || 1000;
                this.applyFilters(); // Application automatique
            });
        }
        
        if (priceRange) {
            priceRange.addEventListener('input', (e) => {
                this.activeFilters.priceMax = parseInt(e.target.value);
                if (priceMax) priceMax.value = e.target.value;
            });
            priceRange.addEventListener('change', () => {
                this.applyFilters(); // Application automatique après avoir fini de glisser
            });
        }
        
        // Escape key pour fermer la sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebar && this.sidebar.classList.contains('open')) {
                this.closeSidebar();
            }
        });
        
        // Boutons "Show More"
        document.querySelectorAll('.filter-show-more').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterSection = e.target.closest('.filter-section');
                const options = filterSection.querySelector('.filter-options');
                options.classList.toggle('expanded');
                
                const icon = btn.querySelector('i');
                const text = btn.querySelector('span');
                
                if (options.classList.contains('expanded')) {
                    icon.className = 'fas fa-minus';
                    text.textContent = 'Show Less';
                } else {
                    icon.className = 'fas fa-plus';
                    text.textContent = 'Show More';
                }
            });
        });
    }
    
    toggleSidebar() {
        if (this.sidebar) {
            const isOpen = this.sidebar.classList.contains('open');
            if (isOpen) {
                this.closeSidebar();
            } else {
                this.openSidebar();
            }
        }
    }
    
    openSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.add('open');
        }
    }
    
    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
        }
    }
    
    updateFilterState() {
        // Récupérer tous les filtres actifs
        this.activeFilters.types = [];
        this.activeFilters.brands = [];
        this.activeFilters.availability = [];
        
        document.querySelectorAll('input[name="type"]:checked').forEach(input => {
            this.activeFilters.types.push(input.value);
        });
        
        document.querySelectorAll('input[name="brand"]:checked').forEach(input => {
            this.activeFilters.brands.push(input.value);
        });
        
        document.querySelectorAll('input[name="availability"]:checked').forEach(input => {
            this.activeFilters.availability.push(input.value);
        });
    }
    
    applyFilters() {
        this.updateFilterState();
        this.currentPage = 1;
        this.products = [];
        this.productsGrid.innerHTML = '';
        this.loadProducts();
        this.loadFilterCounts(); // Mettre à jour les compteurs après filtrage
        // Ne pas fermer la sidebar automatiquement
        this.displayActiveFilters();
    }
    
    resetFilters() {
        // Réinitialiser tous les filtres
        this.activeFilters = {
            types: [],
            brands: [],
            priceMin: 0,
            priceMax: 1000,
            availability: [],
            sort: 'best-selling'
        };
        
        // Décocher toutes les checkboxes
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Réinitialiser les prix
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');
        const priceRange = document.getElementById('price-range');
        
        if (priceMin) priceMin.value = 0;
        if (priceMax) priceMax.value = 1000;
        if (priceRange) priceRange.value = 1000;
        
        // Réinitialiser le tri
        if (this.sortSelect) {
            this.sortSelect.value = 'best-selling';
        }
        
        this.applyFilters();
    }
    
    displayActiveFilters() {
        const activeFiltersContainer = document.getElementById('active-filters');
        const activeFiltersList = document.getElementById('active-filters-list');
        
        if (!activeFiltersContainer || !activeFiltersList) return;
        
        // Compter le nombre de filtres actifs
        const hasActiveFilters = 
            this.activeFilters.types.length > 0 ||
            this.activeFilters.brands.length > 0 ||
            this.activeFilters.availability.length > 0 ||
            this.activeFilters.priceMin > 0 ||
            this.activeFilters.priceMax < 1000;
        
        if (!hasActiveFilters) {
            activeFiltersContainer.style.display = 'none';
            return;
        }
        
        activeFiltersContainer.style.display = 'block';
        activeFiltersList.innerHTML = '';
        
        // Ajouter les badges pour chaque filtre actif
        this.activeFilters.types.forEach(type => {
            activeFiltersList.appendChild(this.createFilterBadge('Type', type, 'type'));
        });
        
        this.activeFilters.brands.forEach(brand => {
            activeFiltersList.appendChild(this.createFilterBadge('Brand', brand, 'brand'));
        });
        
        this.activeFilters.availability.forEach(avail => {
            const label = avail === 'in-stock' ? 'In Stock' : 'Out of Stock';
            activeFiltersList.appendChild(this.createFilterBadge('Availability', label, 'availability'));
        });
        
        if (this.activeFilters.priceMin > 0 || this.activeFilters.priceMax < 1000) {
            const priceLabel = `${this.activeFilters.priceMin}€ - ${this.activeFilters.priceMax}€`;
            activeFiltersList.appendChild(this.createFilterBadge('Price', priceLabel, 'price'));
        }
        
        // Bouton pour tout effacer
        const clearAllBtn = document.getElementById('clear-all-filters');
        if (clearAllBtn) {
            clearAllBtn.onclick = () => this.resetFilters();
        }
    }
    
    createFilterBadge(category, value, type) {
        const badge = document.createElement('div');
        badge.className = 'filter-badge';
        badge.innerHTML = `
            <span>${category}: ${value}</span>
            <button onclick="collectionFilters.removeFilter('${type}', '${value}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        return badge;
    }
    
    removeFilter(type, value) {
        // Retirer un filtre spécifique
        if (type === 'type') {
            this.activeFilters.types = this.activeFilters.types.filter(t => t !== value);
            const checkbox = document.querySelector(`input[name="type"][value="${value}"]`);
            if (checkbox) checkbox.checked = false;
        } else if (type === 'brand') {
            this.activeFilters.brands = this.activeFilters.brands.filter(b => b !== value);
            const checkbox = document.querySelector(`input[name="brand"][value="${value}"]`);
            if (checkbox) checkbox.checked = false;
        } else if (type === 'availability') {
            this.activeFilters.availability = this.activeFilters.availability.filter(a => {
                const label = a === 'in-stock' ? 'In Stock' : 'Out of Stock';
                return label !== value;
            });
            document.querySelectorAll('input[name="availability"]').forEach(checkbox => {
                const label = checkbox.value === 'in-stock' ? 'In Stock' : 'Out of Stock';
                if (label === value) checkbox.checked = false;
            });
        } else if (type === 'price') {
            this.activeFilters.priceMin = 0;
            this.activeFilters.priceMax = 1000;
            const priceMin = document.getElementById('price-min');
            const priceMax = document.getElementById('price-max');
            if (priceMin) priceMin.value = 0;
            if (priceMax) priceMax.value = 1000;
        }
        
        this.applyFilters();
    }
    
    async loadFilterCounts() {
        try {
            // Construire les paramètres de requête avec les filtres actuels
            const params = new URLSearchParams();
            
            // Ajouter la catégorie si disponible
            if (this.categoryId) {
                params.append('category_id', this.categoryId.toString());
            }
            
            // Ajouter les filtres actifs (pour calculer les compteurs selon le contexte)
            if (this.activeFilters.priceMin > 0) {
                params.append('min_price', this.activeFilters.priceMin.toString());
            }
            if (this.activeFilters.priceMax < 1000) {
                params.append('max_price', this.activeFilters.priceMax.toString());
            }
            
            // Récupérer tous les produits pour calculer les compteurs
            // Note : Pour une vraie API, vous devriez avoir un endpoint dédié /api/products/filter-counts
            const response = await fetch(`/api/products/?${params.toString()}&limit=1000`);
            
            if (!response.ok) {
                console.warn('Erreur lors du chargement des compteurs de filtres');
                return;
            }
            
            const data = await response.json();
            const products = data.products || [];
            
            // Calculer les compteurs par type de produit
            const typeCounts = {};
            const brandCounts = {};
            let inStockCount = 0;
            let outOfStockCount = 0;
            
            products.forEach(product => {
                // Compter par disponibilité
                if (product.is_in_stock) {
                    inStockCount++;
                } else {
                    outOfStockCount++;
                }
                
                // Compter par marque (utiliser la catégorie comme marque pour l'instant)
                const brand = product.category?.name?.toLowerCase() || 'other';
                brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                
                // Pour les types, on pourrait utiliser les tags ou une autre propriété
                // Pour l'instant, on utilise aussi la catégorie
                const type = product.category?.slug || 'other';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            
            // Mettre à jour les compteurs dans l'interface
            this.updateFilterCountsUI({
                types: typeCounts,
                brands: brandCounts,
                inStock: inStockCount,
                outOfStock: outOfStockCount
            });
            
        } catch (error) {
            console.error('Erreur lors du chargement des compteurs:', error);
        }
    }
    
    updateFilterCountsUI(counts) {
        // Mettre à jour les compteurs de type
        document.querySelectorAll('input[name="type"]').forEach(input => {
            const value = input.value;
            const countSpan = input.closest('.filter-option')?.querySelector('.filter-count');
            if (countSpan && counts.types[value] !== undefined) {
                countSpan.textContent = `(${counts.types[value]})`;
            }
        });
        
        // Mettre à jour les compteurs de marque
        document.querySelectorAll('input[name="brand"]').forEach(input => {
            const value = input.value;
            const countSpan = input.closest('.filter-option')?.querySelector('.filter-count');
            if (countSpan && counts.brands[value] !== undefined) {
                countSpan.textContent = `(${counts.brands[value]})`;
            }
        });
        
        // Mettre à jour les compteurs de disponibilité
        document.querySelectorAll('input[name="availability"]').forEach(input => {
            const value = input.value;
            const countSpan = input.closest('.filter-option')?.querySelector('.filter-count');
            if (countSpan) {
                if (value === 'in-stock') {
                    countSpan.textContent = `(${counts.inStock})`;
                } else if (value === 'out-of-stock') {
                    countSpan.textContent = `(${counts.outOfStock})`;
                }
            }
        });
    }
    
    async loadProducts() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            const params = new URLSearchParams({
                skip: ((this.currentPage - 1) * 12).toString(),
                limit: '12'
            });
            
            // Ajouter la catégorie si disponible
            if (this.categoryId) {
                params.append('category_id', this.categoryId.toString());
            }
            
            // Ajouter les filtres actifs
            if (this.activeFilters.types.length > 0) {
                // Pour l'instant, on ne peut pas filtrer par sous-type via l'API
                // On filtrera côté client après avoir reçu les produits
            }
            
            if (this.activeFilters.priceMin > 0) {
                params.append('min_price', this.activeFilters.priceMin.toString());
            }
            
            if (this.activeFilters.priceMax < 1000) {
                params.append('max_price', this.activeFilters.priceMax.toString());
            }
            
            // Mapping du tri
            const sortMapping = {
                'best-selling': { sort_by: 'sales_count', sort_order: 'desc' },
                'price-asc': { sort_by: 'price', sort_order: 'asc' },
                'price-desc': { sort_by: 'price', sort_order: 'desc' },
                'newest': { sort_by: 'created_at', sort_order: 'desc' },
                'rating': { sort_by: 'sales_count', sort_order: 'desc' },
                'alphabetical': { sort_by: 'name', sort_order: 'asc' }
            };
            
            const sortConfig = sortMapping[this.activeFilters.sort] || sortMapping['best-selling'];
            params.append('sort_by', sortConfig.sort_by);
            params.append('sort_order', sortConfig.sort_order);
            
            const response = await fetch(`/api/products/?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (this.currentPage === 1) {
                this.products = data.products || [];
            } else {
                this.products = [...this.products, ...(data.products || [])];
            }
            
            this.hasMore = data.has_more || false;
            
            // Appliquer les filtres côté client si nécessaire
            const filteredProducts = this.applyClientSideFilters(data.products || []);
            
            this.renderProducts(filteredProducts);
            this.updateProductsCount(data.total || 0);
            
            // Afficher l'état vide si aucun produit
            if (this.currentPage === 1 && filteredProducts.length === 0) {
                this.showEmptyState();
            } else {
                this.hideEmptyState();
            }
            
            this.currentPage++;
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
            this.showError('Erreur lors du chargement des produits');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    applyClientSideFilters(products) {
        // Filtrer côté client pour les filtres non supportés par l'API
        return products.filter(product => {
            // Filtre de disponibilité
            if (this.activeFilters.availability.length > 0) {
                const inStock = this.activeFilters.availability.includes('in-stock');
                const outOfStock = this.activeFilters.availability.includes('out-of-stock');
                
                if (inStock && !product.is_in_stock) return false;
                if (outOfStock && product.is_in_stock) return false;
            }
            
            return true;
        });
    }
    
    renderProducts(products) {
        products.forEach(product => {
            const card = this.createProductCard(product);
            this.productsGrid.appendChild(card);
        });
        
        // Animer l'apparition
        requestAnimationFrame(() => {
            const newCards = this.productsGrid.querySelectorAll('.product-card:not(.visible)');
            newCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 50);
            });
        });
    }
    
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const imageUrl = product.main_image_url || '/static/images/products/default-product.svg';
        const productUrl = `/products/${product.id}`;
        const isNew = this.isProductNew(product.created_at);
        
        card.innerHTML = `
            <div class="product-image-wrapper">
                ${isNew ? '<div class="product-badge">NEW</div>' : ''}
                <a href="${productUrl}">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image"
                         onerror="this.src='/static/images/products/default-product.svg'">
                </a>
            </div>
            <div class="product-info">
                <div class="product-brand">${product.category?.name || 'StelleWorld'}</div>
                <h3 class="product-name">
                    <a href="${productUrl}" style="color: inherit; text-decoration: none;">
                        ${product.name}
                    </a>
                </h3>
                <div class="product-price">${parseFloat(product.price).toFixed(2)} €</div>
                <div class="product-actions">
                    <button class="btn-add-to-cart" onclick="collectionFilters.addToCart(${product.id})"
                            ${!product.is_in_stock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        ${product.is_in_stock ? 'Ajouter au panier' : 'Rupture de stock'}
                    </button>
                    <button class="btn-quick-view" onclick="collectionFilters.quickView(${product.id})" title="Aperçu rapide">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    isProductNew(createdAt) {
        if (!createdAt) return false;
        const productDate = new Date(createdAt);
        const now = new Date();
        const daysDiff = (now - productDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Nouveau si moins de 30 jours
    }
    
    updateProductsCount(total) {
        if (this.productsCount) {
            const productsText = total === 1 ? 'Product' : 'Products';
            this.productsCount.textContent = `${total} ${productsText}`;
        }
    }
    
    setupInfiniteScroll() {
        const trigger = document.getElementById('infinite-scroll-trigger');
        if (!trigger) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading && this.hasMore) {
                    this.loadProducts();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px'
        });
        
        observer.observe(trigger);
    }
    
    setupViewButtons() {
        const viewButtons = {
            'grid-view-2': 'grid-2',
            'grid-view-3': 'grid-3',
            'grid-view-4': 'grid-4'
        };
        
        Object.entries(viewButtons).forEach(([btnId, gridClass]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    // Retirer la classe active de tous les boutons
                    Object.keys(viewButtons).forEach(id => {
                        document.getElementById(id)?.classList.remove('active');
                    });
                    
                    // Ajouter la classe active au bouton cliqué
                    btn.classList.add('active');
                    
                    // Changer la grille
                    this.productsGrid.className = `products-grid ${gridClass}`;
                });
            }
        });
    }
    
    addToCart(productId) {
        // Logique d'ajout au panier (à implémenter selon votre système)
        console.log('Ajouter au panier:', productId);
        this.showNotification('Produit ajouté au panier', 'success');
        
        // Mettre à jour le compteur du panier dans le header
        if (window.loadCartCount) {
            window.loadCartCount();
        }
    }
    
    quickView(productId) {
        // Logique d'aperçu rapide (à implémenter)
        console.log('Aperçu rapide:', productId);
        window.location.href = `/products/${productId}`;
    }
    
    showLoading(show) {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            if (show) {
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
            }
        }
    }
    
    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
    }
    
    hideEmptyState() {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('flash-messages');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate-slide-in`;
        
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        
        notification.innerHTML = `
            <div class="${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white opacity-70 hover:opacity-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.collectionFilters = new CollectionFilters();
});

