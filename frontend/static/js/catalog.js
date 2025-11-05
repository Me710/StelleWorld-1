// Gestionnaire du catalogue e-commerce
class ECommerceCatalog {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 8;
        this.totalItems = 0;
        this.isLoading = false;
        this.currentFilters = {
            search: '',
            categories: [],
            brands: [],
            priceMin: 0,
            priceMax: 1000,
            rating: null,
            availability: [],
            sort: 'relevance'
        };
        this.products = [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Détecter si on est sur une page de collection spécifique
        this.collectionSlug = this.getCollectionFromURL();
        this.categoryData = null;
        
        this.init();
    }
    
    getCollectionFromURL() {
        // Récupérer le slug depuis l'URL /collections/{slug}
        const path = window.location.pathname;
        const match = path.match(/^\/collections\/([^\/]+)/);
        return match ? match[1] : null;
    }
    
    async getCategoryIdBySlug(slug) {
        // Utiliser le cache si disponible
        if (this.categoryData && this.categoryData.slug === slug) {
            return this.categoryData.id;
        }
        
        try {
            const response = await fetch('/api/products/categories');
            if (response.ok) {
                const data = await response.json();
                const category = data.categories.find(cat => cat.slug === slug);
                if (category) {
                    this.categoryData = category;
                    // Mettre à jour le titre de la page
                    this.updatePageTitle(category.name);
                    return category.id;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la catégorie:', error);
        }
        return null;
    }
    
    updatePageTitle(categoryName) {
        // Mettre à jour le titre de la page avec le nom de la catégorie
        const titleElement = document.querySelector('h1');
        if (titleElement) {
            titleElement.textContent = categoryName.toUpperCase();
        }
        document.title = `${categoryName} - StelleWorld`;
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.updateCartCount();
        this.updateFavoritesCount();
        this.setupInfiniteScroll();
    }

    setupEventListeners() {
        // Tri
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.resetAndLoadProducts();
            });
        }

        // Vue grille/liste
        const gridView4 = document.getElementById('grid-view-4');
        const gridView3 = document.getElementById('grid-view-3');
        const gridView2 = document.getElementById('grid-view-2');
        const listView = document.getElementById('list-view');
        
        if (gridView4) {
            gridView4.addEventListener('click', () => {
                this.setViewMode('grid', 4);
            });
        }
        
        if (gridView3) {
            gridView3.addEventListener('click', () => {
                this.setViewMode('grid', 3);
            });
        }
        
        if (gridView2) {
            gridView2.addEventListener('click', () => {
                this.setViewMode('grid', 2);
            });
        }
        
        if (listView) {
            listView.addEventListener('click', () => {
                this.setViewMode('list');
            });
        }
    }

    resetFilters() {
        // Réinitialiser les filtres
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.value = 'relevance';
        }

        this.currentFilters = {
            search: '',
            categories: [],
            brands: [],
            priceMin: 0,
            priceMax: 1000,
            rating: null,
            availability: [],
            sort: 'relevance'
        };

        this.resetAndLoadProducts();
    }

    resetAndLoadProducts() {
        this.currentPage = 1;
        this.products = [];
        document.getElementById('products-grid').innerHTML = '';
        this.loadProducts();
    }

    async loadProducts() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            // Simuler une API call
            const response = await this.fetchProducts();
            
            if (this.currentPage === 1) {
                this.products = response.products;
                this.totalItems = response.total;
            } else {
                this.products = [...this.products, ...response.products];
            }

            this.renderProducts(response.products);
            this.updateResultsCount();
            this.currentPage++;
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
            this.showError('Erreur lors du chargement des produits');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async fetchProducts() {
        // Appel à l'API réelle
        try {
            const params = new URLSearchParams({
                skip: ((this.currentPage - 1) * this.itemsPerPage).toString(),
                limit: this.itemsPerPage.toString()
            });

            // Si on est sur une page de collection spécifique, filtrer par slug
            if (this.collectionSlug) {
                // Récupérer l'ID de la catégorie depuis l'API
                const categoryId = await this.getCategoryIdBySlug(this.collectionSlug);
                if (categoryId) {
                    params.append('category_id', categoryId.toString());
                }
            }

            // Ajouter les filtres
            if (this.currentFilters.search) {
                params.append('search', this.currentFilters.search);
            }
            if (this.currentFilters.priceMin > 0) {
                params.append('min_price', this.currentFilters.priceMin.toString());
            }
            if (this.currentFilters.priceMax < 1000) {
                params.append('max_price', this.currentFilters.priceMax.toString());
            }
            if (this.currentFilters.categories.length > 0) {
                // Mapping des noms de catégories vers les IDs
                const categoryMap = {
                    'wigs': 1,
                    'extensions': 2,
                    'ponytail': 3,
                    'closure': 4,
                    'clip-in': 5,
                    'bun': 6
                };
                
                const categoryId = categoryMap[this.currentFilters.categories[0]];
                if (categoryId) {
                    params.append('category_id', categoryId.toString());
                }
            }

            // Tri
            const sortMapping = {
                'price-asc': { sort_by: 'price', sort_order: 'asc' },
                'price-desc': { sort_by: 'price', sort_order: 'desc' },
                'rating': { sort_by: 'sales_count', sort_order: 'desc' },
                'newest': { sort_by: 'created_at', sort_order: 'desc' },
                'popularity': { sort_by: 'sales_count', sort_order: 'desc' },
                'relevance': { sort_by: 'created_at', sort_order: 'desc' }
            };

            const sortConfig = sortMapping[this.currentFilters.sort] || sortMapping['relevance'];
            params.append('sort_by', sortConfig.sort_by);
            params.append('sort_order', sortConfig.sort_order);

            const response = await fetch(`/api/products/?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            return {
                products: data.products.map(this.transformProduct),
                total: data.total,
                page: this.currentPage,
                hasMore: data.has_more
            };
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
            // Fallback vers les données mockées en cas d'erreur
            return this.generateFallbackData();
        }
    }

    transformProduct(apiProduct) {
        // Transformer les données de l'API vers le format attendu par l'interface
        return {
            id: apiProduct.id,
            name: apiProduct.name,
            category: apiProduct.category?.name || 'Non catégorisé',
            brand: apiProduct.category?.name || 'StelleWorld', // Utiliser la catégorie comme marque temporairement
            price: parseFloat(apiProduct.price),
            rating: Math.floor(Math.random() * 5) + 1, // TODO: Ajouter un système de rating à l'API
            reviewCount: apiProduct.sales_count || Math.floor(Math.random() * 500) + 10,
            image: apiProduct.main_image_url || '/static/images/products/default-product.svg',
            inStock: apiProduct.is_in_stock,
            isNew: false, // TODO: Calculer si le produit est nouveau
            isBestseller: apiProduct.is_featured || false,
            description: apiProduct.short_description || apiProduct.description || 'Description non disponible'
        };
    }

    generateFallbackData() {
        // Données de fallback en cas d'erreur API
        const fallbackProducts = [
            {
                id: 1, name: 'iPhone 15 Pro', category: 'Electronics', brand: 'Apple',
                price: 1199, rating: 5, reviewCount: 324, inStock: true, isNew: true,
                image: '/static/images/products/bestseller-1.jpg',
                description: 'Le dernier iPhone avec des fonctionnalités révolutionnaires.'
            },
            {
                id: 2, name: 'MacBook Pro M3', category: 'Electronics', brand: 'Apple', 
                price: 2299, rating: 5, reviewCount: 156, inStock: true, isBestseller: true,
                image: '/static/images/products/bestseller-2.jpg',
                description: 'Ordinateur portable professionnel avec puce M3.'
            },
            {
                id: 3, name: 'Samsung Galaxy S24', category: 'Electronics', brand: 'Samsung',
                price: 899, rating: 4, reviewCount: 289, inStock: true, isNew: true,
                image: '/static/images/products/bestseller-3.jpg',
                description: 'Smartphone Android haut de gamme avec IA intégrée.'
            },
            {
                id: 4, name: 'Sony WH-1000XM5', category: 'Electronics', brand: 'Sony',
                price: 399, rating: 5, reviewCount: 445, inStock: true,
                image: '/static/images/products/bestseller-4.jpg',
                description: 'Casque à réduction de bruit leader du marché.'
            }
        ];

        return {
            products: fallbackProducts,
            total: fallbackProducts.length,
            page: 1,
            hasMore: false
        };
    }

    filterProducts(products) {
        return products.filter(product => {
            // Recherche
            if (this.currentFilters.search && 
                !product.name.toLowerCase().includes(this.currentFilters.search.toLowerCase())) {
                return false;
            }

            // Catégories
            if (this.currentFilters.categories.length > 0 && 
                !this.currentFilters.categories.includes(product.category)) {
                return false;
            }

            // Marques
            if (this.currentFilters.brands.length > 0 && 
                !this.currentFilters.brands.includes(product.brand.toLowerCase())) {
                return false;
            }

            // Prix
            if (product.price < this.currentFilters.priceMin || 
                product.price > this.currentFilters.priceMax) {
                return false;
            }

            // Évaluation
            if (this.currentFilters.rating && product.rating < this.currentFilters.rating) {
                return false;
            }

            // Disponibilité
            if (this.currentFilters.availability.length > 0) {
                const inStockFilter = this.currentFilters.availability.includes('in-stock');
                const outOfStockFilter = this.currentFilters.availability.includes('out-of-stock');
                
                if (inStockFilter && !product.inStock) return false;
                if (outOfStockFilter && product.inStock) return false;
            }

            return true;
        });
    }

    sortProducts(products) {
        switch (this.currentFilters.sort) {
            case 'price-asc':
                return products.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return products.sort((a, b) => b.price - a.price);
            case 'rating':
                return products.sort((a, b) => b.rating - a.rating);
            case 'newest':
                return products.sort((a, b) => b.id - a.id);
            case 'popularity':
                return products.sort((a, b) => b.reviewCount - a.reviewCount);
            default:
                return products;
        }
    }

    renderProducts(products) {
        const container = document.getElementById('products-grid');
        
        products.forEach(product => {
            const productCard = this.createProductCard(product);
            container.appendChild(productCard);
        });

        // Animer l'apparition des nouvelles cartes
        requestAnimationFrame(() => {
            const newCards = container.querySelectorAll('.product-card:not(.visible)');
            newCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 100);
            });
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card product-card-hover bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden';
        
        const isFavorite = this.favorites.includes(product.id);
        const inCart = this.cart.some(item => item.id === product.id);

        card.innerHTML = `
            <div class="relative">
                ${product.isNew ? '<div class="product-badge">Nouveau</div>' : ''}
                ${product.isBestseller ? '<div class="product-badge" style="background: linear-gradient(135deg, #10b981, #059669);">Best-seller</div>' : ''}
                
                <img src="${product.image}" alt="${product.name}" 
                     class="w-full h-48 object-cover"
                     onerror="this.src='/static/images/products/default-product.svg'">
                
                <button class="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition-colors favorite-btn ${isFavorite ? 'text-red-500' : ''}"
                        data-product-id="${product.id}">
                    <i class="fa${isFavorite ? 's' : 'r'} fa-heart"></i>
                </button>
            </div>
            
            <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="font-medium text-gray-900 line-clamp-2 flex-1 mr-2">
                        <a href="/products/${product.id}" class="hover:text-blue-600 transition-colors">
                            ${product.name}
                        </a>
                    </h3>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${product.brand}</span>
                </div>
                
                <p class="text-sm text-gray-600 line-clamp-2 mb-3">${product.description}</p>
                
                <div class="flex items-center mb-3">
                    <div class="star-rating">
                        ${this.generateStarRating(product.rating)}
                    </div>
                    <span class="ml-2 text-sm text-gray-500">(${product.reviewCount})</span>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex flex-col">
                        <span class="text-xl font-bold text-gray-900">${product.price}€</span>
                        <span class="text-xs ${product.inStock ? 'text-green-600' : 'text-red-600'}">
                            ${product.inStock ? 'En stock' : 'Rupture de stock'}
                        </span>
                    </div>
                    
                    <button class="add-to-cart-btn px-4 py-2 ${product.inStock ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg transition-colors text-sm font-medium"
                            data-product-id="${product.id}"
                            ${!product.inStock ? 'disabled' : ''}>
                        ${inCart ? 'Dans le panier' : 'Ajouter'}
                    </button>
                </div>
            </div>
        `;

        // Event listeners pour la carte
        const favoriteBtn = card.querySelector('.favorite-btn');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');

        favoriteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFavorite(product.id, favoriteBtn);
        });

        if (product.inStock) {
            addToCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addToCart(product, addToCartBtn);
            });
        }

        return card;
    }

    generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star star filled"></i>';
            } else {
                stars += '<i class="far fa-star star"></i>';
            }
        }
        return stars;
    }

    toggleFavorite(productId, button) {
        const icon = button.querySelector('i');
        
        if (this.favorites.includes(productId)) {
            this.favorites = this.favorites.filter(id => id !== productId);
            icon.className = 'far fa-heart';
            button.classList.remove('text-red-500');
        } else {
            this.favorites.push(productId);
            icon.className = 'fas fa-heart';
            button.classList.add('text-red-500');
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateFavoritesCount();
        this.showNotification('Favoris mis à jour', 'success');
    }

    addToCart(product, button) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
        
        button.textContent = 'Dans le panier';
        button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        button.classList.add('bg-green-600');
        
        this.showNotification('Produit ajouté au panier', 'success');
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').textContent = count;
    }

    updateFavoritesCount() {
        document.getElementById('favorites-count').textContent = this.favorites.length;
    }

    updateResultsCount() {
        const count = document.getElementById('results-count');
        if (count) {
            const start = (this.currentPage - 2) * this.itemsPerPage + 1;
            const end = Math.min(start + this.itemsPerPage - 1, this.totalItems);
            count.textContent = `Affichage de ${start}-${end} sur ${this.totalItems} résultats`;
        }
    }

    setViewMode(mode, columns = 4) {
        const grid = document.getElementById('products-grid');
        const allViewBtns = document.querySelectorAll('[id^="grid-view"], [id="list-view"]');
        
        // Retirer les classes actives de tous les boutons
        allViewBtns.forEach(btn => {
            btn.classList.remove('bg-blue-100', 'text-blue-600', 'border-blue-300');
        });
        
        if (mode === 'grid') {
            let gridClass = 'grid gap-6';
            if (columns === 4) {
                gridClass += ' grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
            } else if (columns === 3) {
                gridClass += ' grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
            } else if (columns === 2) {
                gridClass += ' grid-cols-1 sm:grid-cols-2';
            }
            grid.className = gridClass;
            
            // Activer le bouton correspondant
            const activeBtn = document.getElementById(`grid-view-${columns}`);
            if (activeBtn) {
                activeBtn.classList.add('bg-blue-100', 'text-blue-600', 'border-blue-300');
            }
        } else {
            grid.className = 'space-y-4';
            const listBtn = document.getElementById('list-view');
            if (listBtn) {
                listBtn.classList.add('bg-blue-100', 'text-blue-600', 'border-blue-300');
            }
        }
    }

    setupInfiniteScroll() {
        const trigger = document.getElementById('infinite-scroll-trigger');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadProducts();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px'
        });
        
        observer.observe(trigger);
    }

    showLoading(show) {
        const indicator = document.getElementById('loading-indicator');
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate-slide-in`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-70 hover:opacity-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.getElementById('flash-messages').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialiser le catalogue au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.catalog = new ECommerceCatalog();
});
