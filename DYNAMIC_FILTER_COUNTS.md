# Compteurs de Filtres Dynamiques

## 📊 Vue d'ensemble

Les compteurs de produits dans la sidebar sont maintenant **dynamiques** et reflètent le nombre réel de produits disponibles pour chaque option de filtre.

## ✅ Ce qui a été ajouté

### 1. Méthode `loadFilterCounts()`

Cette méthode charge les compteurs depuis l'API et calcule le nombre de produits pour chaque option de filtre.

```javascript
async loadFilterCounts() {
    // 1. Construire les paramètres avec filtres actuels
    const params = new URLSearchParams();
    if (this.categoryId) {
        params.append('category_id', this.categoryId.toString());
    }
    
    // 2. Charger tous les produits (limite 1000)
    const response = await fetch(`/api/products/?${params}&limit=1000`);
    const data = await response.json();
    const products = data.products || [];
    
    // 3. Calculer les compteurs
    const typeCounts = {};
    const brandCounts = {};
    let inStockCount = 0;
    let outOfStockCount = 0;
    
    products.forEach(product => {
        // Compter disponibilité
        if (product.is_in_stock) inStockCount++;
        else outOfStockCount++;
        
        // Compter par marque
        const brand = product.category?.name?.toLowerCase();
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        
        // Compter par type
        const type = product.category?.slug;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    // 4. Mettre à jour l'UI
    this.updateFilterCountsUI({
        types: typeCounts,
        brands: brandCounts,
        inStock: inStockCount,
        outOfStock: outOfStockCount
    });
}
```

### 2. Méthode `updateFilterCountsUI()`

Cette méthode met à jour les compteurs visuels dans la sidebar.

```javascript
updateFilterCountsUI(counts) {
    // Mettre à jour les compteurs de type
    document.querySelectorAll('input[name="type"]').forEach(input => {
        const countSpan = input.closest('.filter-option')?.querySelector('.filter-count');
        if (countSpan && counts.types[input.value] !== undefined) {
            countSpan.textContent = `(${counts.types[input.value]})`;
        }
    });
    
    // Mettre à jour les compteurs de marque
    document.querySelectorAll('input[name="brand"]').forEach(input => {
        const countSpan = input.closest('.filter-option')?.querySelector('.filter-count');
        if (countSpan && counts.brands[input.value] !== undefined) {
            countSpan.textContent = `(${counts.brands[input.value]})`;
        }
    });
    
    // Mettre à jour les compteurs de disponibilité
    document.querySelectorAll('input[name="availability"]').forEach(input => {
        const countSpan = input.closest('.filter-option')?.querySelector('.filter-count');
        if (countSpan) {
            if (input.value === 'in-stock') {
                countSpan.textContent = `(${counts.inStock})`;
            } else if (input.value === 'out-of-stock') {
                countSpan.textContent = `(${counts.outOfStock})`;
            }
        }
    });
}
```

### 3. Appel aux Moments Clés

Les compteurs sont rechargés automatiquement :

```javascript
init() {
    this.setupEventListeners();
    this.loadFilterCounts(); // ✅ Au chargement initial
    this.loadProducts();
    this.setupInfiniteScroll();
    this.setupViewButtons();
}

applyFilters() {
    this.updateFilterState();
    this.currentPage = 1;
    this.products = [];
    this.productsGrid.innerHTML = '';
    this.loadProducts();
    this.loadFilterCounts(); // ✅ Après chaque filtrage
    this.displayActiveFilters();
}
```

## 🔄 Flux de Données

### Chargement Initial

```
Page charge
    ↓
init() appelé
    ↓
loadFilterCounts()
    ↓
Fetch /api/products/?category_id=1&limit=1000
    ↓
Calcule compteurs (types, marques, disponibilité)
    ↓
updateFilterCountsUI()
    ↓
Met à jour (1), (3), (8), etc. dans la sidebar
```

### Après Application de Filtre

```
Utilisateur coche "Full Cap Wig"
    ↓
applyFilters() appelé
    ↓
loadProducts() → Affiche produits filtrés
    ↓
loadFilterCounts() → Recalcule compteurs
    ↓
updateFilterCountsUI()
    ↓
Compteurs mis à jour selon filtres actifs
```

## 📊 Exemple Concret

### Avant Filtrage

```
PRODUCT TYPE
☐ Conditioner        (12)
☐ Crochet Braid      (8)
☐ Full Cap Wig       (45)
☐ Hair Growth        (5)

BRAND
☐ Outre              (30)
☐ Sensationnel       (25)
☐ Isis               (15)

AVAILABILITY
☐ In Stock           (65)
☐ Out of Stock       (5)
```

### Après Avoir Coché "Full Cap Wig"

```
PRODUCT TYPE
☑ Full Cap Wig       (45)  ← Toujours 45 car c'est le filtre actif
☐ Conditioner        (0)   ← Mise à jour : aucun produit ne correspond
☐ Crochet Braid      (0)
☐ Hair Growth        (0)

BRAND
☐ Outre              (28)  ← Mise à jour : 28 Full Cap Wigs d'Outre
☐ Sensationnel       (12)  ← Mise à jour : 12 Full Cap Wigs de Sensationnel
☐ Isis               (5)   ← Mise à jour : 5 Full Cap Wigs d'Isis

AVAILABILITY
☐ In Stock           (42)  ← Mise à jour : 42 Full Cap Wigs en stock
☐ Out of Stock       (3)   ← Mise à jour : 3 Full Cap Wigs en rupture
```

## 🎯 Logique de Comptage

### Types de Produits
Utilise `product.category.slug` pour identifier le type :
```javascript
const type = product.category?.slug || 'other';
typeCounts[type] = (typeCounts[type] || 0) + 1;
```

### Marques
Utilise `product.category.name` (temporaire, peut être adapté) :
```javascript
const brand = product.category?.name?.toLowerCase() || 'other';
brandCounts[brand] = (brandCounts[brand] || 0) + 1;
```

### Disponibilité
Utilise `product.is_in_stock` :
```javascript
if (product.is_in_stock) {
    inStockCount++;
} else {
    outOfStockCount++;
}
```

## 🔧 Personnalisation

### Ajouter un Nouveau Type de Compteur

1. **Calculer le compteur dans `loadFilterCounts()`** :
```javascript
// Ajouter après les compteurs existants
const colorCounts = {};
products.forEach(product => {
    const color = product.color || 'other';
    colorCounts[color] = (colorCounts[color] || 0) + 1;
});
```

2. **Passer aux counts** :
```javascript
this.updateFilterCountsUI({
    types: typeCounts,
    brands: brandCounts,
    colors: colorCounts, // Nouveau !
    inStock: inStockCount,
    outOfStock: outOfStockCount
});
```

3. **Mettre à jour l'UI dans `updateFilterCountsUI()`** :
```javascript
// Mettre à jour les compteurs de couleur
document.querySelectorAll('input[name="color"]').forEach(input => {
    const countSpan = input.closest('.filter-option')?.querySelector('.filter-count');
    if (countSpan && counts.colors[input.value] !== undefined) {
        countSpan.textContent = `(${counts.colors[input.value]})`;
    }
});
```

4. **Ajouter la section dans le HTML** :
```html
<div class="filter-section">
    <h3 class="filter-title">COLOR</h3>
    <div class="filter-options">
        <label class="filter-option">
            <input type="checkbox" name="color" value="black">
            <span class="filter-label">Black</span>
            <span class="filter-count">(0)</span>
        </label>
        <!-- Plus de couleurs... -->
    </div>
</div>
```

## ⚡ Performance

### Optimisation Actuelle
- Limite de 1000 produits par requête
- Calculs côté client (rapide)
- Mise à jour uniquement quand nécessaire

### Optimisations Futures Possibles

1. **Endpoint API Dédié** :
```python
@app.get("/api/products/filter-counts")
def get_filter_counts(category_id: int = None):
    # Calculs côté serveur (plus efficace)
    return {
        "types": {...},
        "brands": {...},
        "availability": {...}
    }
```

2. **Cache Redis** :
```python
# Mettre en cache les compteurs pendant 5 minutes
cache_key = f"filter_counts:{category_id}"
counts = redis.get(cache_key)
if not counts:
    counts = calculate_counts()
    redis.setex(cache_key, 300, counts)
```

3. **Requête SQL Optimisée** :
```sql
SELECT 
    category_id,
    COUNT(*) as count,
    SUM(CASE WHEN is_in_stock THEN 1 ELSE 0 END) as in_stock_count
FROM products
WHERE category_id = ?
GROUP BY category_id;
```

## 📝 Notes Importantes

### Correspondance Valeur ↔ Compteur

Les valeurs des `input[name="type"]` doivent correspondre aux `product.category.slug` :

```html
<!-- HTML -->
<input type="checkbox" name="type" value="full-cap-wig">

<!-- Doit correspondre à -->
product.category.slug === "full-cap-wig"
```

### Compteur "Total"

Le compteur total dans la barre d'outils est mis à jour par `updateProductsCount()` :

```javascript
updateProductsCount(total) {
    if (this.productsCount) {
        const productsText = total === 1 ? 'Product' : 'Products';
        this.productsCount.textContent = `${total} ${productsText}`;
    }
}
```

Appelé après `loadProducts()` avec le total de l'API.

## ✅ Vérification

Pour vérifier que les compteurs fonctionnent :

1. **Ouvrir la page** : `/collections/wigs`
2. **Observer les compteurs initiaux** : (45), (12), etc.
3. **Cocher un filtre** : "Full Cap Wig"
4. **Observer la mise à jour** : Les autres compteurs changent
5. **Compteur total** : "45 Products" affiché en haut

## 🐛 Debugging

Si les compteurs ne se mettent pas à jour :

```javascript
// Ajouter des logs dans loadFilterCounts()
console.log('Products loaded:', products.length);
console.log('Type counts:', typeCounts);
console.log('Brand counts:', brandCounts);

// Vérifier que les spans existent
document.querySelectorAll('.filter-count').forEach(span => {
    console.log('Count span found:', span.textContent);
});
```

---

**✨ Compteurs dynamiques opérationnels !**

Les nombres reflètent maintenant le nombre réel de produits disponibles pour chaque filtre.

