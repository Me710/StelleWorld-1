# Guide de la Page Collection - StelleWorld

## 📋 Vue d'ensemble

Ce guide explique la nouvelle page collection inspirée de **bswbeautyca.com**, avec un système de filtres dynamique et une interface moderne.

## 🎨 Fonctionnalités Principales

### 1. **Header Non-Sticky**
Le header fait partie du flux normal de la page et disparaît naturellement lors du scroll (comme demandé).

### 2. **Page Collection Dynamique**
Accédez à une collection via : `https://stelleworld.com/collections/{categorie}`

Exemple : 
- `https://stelleworld.com/collections/wigs`
- `https://stelleworld.com/collections/all-new-arrivals`

### 3. **Barre d'Outils de Filtrage**
- **Bouton Filter** : Ouvre la sidebar de filtres
- **Compteur de produits** : Affiche le nombre total (ex: "36 Products")
- **Boutons de vue** : 2, 3 ou 4 colonnes (desktop uniquement)
- **Sort by** : Tri par Best Selling, Price, Newest, etc.

### 4. **Sidebar de Filtres**
Sidebar dynamique qui s'ouvre depuis la gauche avec une animation fluide (0.3s).

**Sections de filtres disponibles :**
- **PRODUCT TYPE** : Checkboxes pour types de produits
- **BRAND** : Marques disponibles
- **PRICE** : Range slider avec min/max
- **AVAILABILITY** : En stock / Rupture de stock

**Actions :**
- **Apply Filters** : Applique les filtres sélectionnés
- **Clear All** : Réinitialise tous les filtres

## 📁 Structure des Fichiers

```
StelleWorld-1/
├── frontend/
│   ├── templates/
│   │   └── products/
│   │       └── collection.html          # Template principal de la page collection
│   ├── static/
│   │   ├── css/
│   │   │   ├── header.css              # Header (position: relative, non-sticky)
│   │   │   └── collection.css          # Styles de la page collection
│   │   └── js/
│   │       ├── header.js               # Logique du header
│   │       └── collection-filters.js   # Gestion des filtres et sidebar
└── backend/
    └── app/
        └── main.py                      # Route pour /collections/{slug}
```

## 🚀 Utilisation

### Backend - Route de Collection

La route récupère automatiquement les informations de la catégorie depuis la base de données :

```python
@app.get("/collections/{collection_slug}", response_class=HTMLResponse)
async def collection_page(request: Request, collection_slug: str):
    # Récupère la catégorie par slug
    # Passe les données au template
    return templates.TemplateResponse("products/collection.html", {
        "request": request,
        "category_id": category.id,
        "category_slug": category.slug,
        "category_name": category.name,
        "category_description": category.description
    })
```

### Frontend - Initialisation JavaScript

Le JavaScript se charge automatiquement au chargement de la page :

```javascript
// Variables globales définies dans le template
window.collectionSlug = "wigs";
window.categoryId = 1;
window.categoryName = "Wigs";

// Classe CollectionFilters gère tout
class CollectionFilters {
    constructor() {
        this.categorySlug = window.collectionSlug;
        this.categoryId = window.categoryId;
        // ...
    }
}
```

## 🎯 Comportements Clés

### 1. **Ouverture/Fermeture de la Sidebar**

**Desktop :**
- Sidebar visible en permanence à gauche (position sticky)
- Largeur : 280px

**Mobile/Tablette :**
- Sidebar cachée par défaut
- S'ouvre depuis la gauche avec overlay sombre
- Bouton de fermeture visible (X)

### 2. **Filtrage Dynamique**

```javascript
// Les filtres sont appliqués en temps réel
activeFilters = {
    types: ['full-cap-wig', 'lace-front'],
    brands: ['outre', 'sensationnel'],
    priceMin: 0,
    priceMax: 500,
    availability: ['in-stock'],
    sort: 'price-asc'
}
```

### 3. **Chargement des Produits**

- **Infinite Scroll** : Charge automatiquement plus de produits en scrollant
- **API Call** : `/api/products/?category_id={id}&skip={offset}&limit=12`
- **Filtres** : Appliqués côté serveur et côté client

### 4. **Badges de Filtres Actifs**

Les filtres actifs apparaissent en haut de la grille de produits :

```html
<div class="filter-badge">
    Type: Full Cap Wig
    <button onclick="removeFilter('type', 'full-cap-wig')">×</button>
</div>
```

## 🎨 Personnalisation

### Couleurs (dans collection.css)

```css
:root {
    --color-rose-powder: #fce7f3;    /* Fond rose poudré */
    --color-rose-dark: #831843;       /* Rose foncé (marque) */
    --color-black: #000000;            /* Noir */
    --color-light-gray: #f5f5f5;       /* Gris clair */
}
```

### Polices

```css
--font-primary: 'Inter', sans-serif;         /* Texte principal */
--font-elegant: 'Cormorant Garamond', serif; /* Titres élégants */
```

### Animations

```css
.filter-sidebar {
    transition: transform 0.3s ease;  /* Animation d'ouverture */
}

.product-card.visible {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.3s ease;        /* Apparition des cartes */
}
```

## 📱 Responsive Design

### Desktop (> 1024px)
- Sidebar visible en permanence
- Grille 4 colonnes par défaut
- Tous les boutons de vue visibles

### Tablette (768px - 1024px)
- Sidebar en overlay
- Grille 2-3 colonnes
- Boutons de vue masqués

### Mobile (< 768px)
- Sidebar plein écran sur overlay
- Grille 1 colonne
- Barre d'outils simplifiée

## 🔧 Configuration

### Ajouter une Nouvelle Section de Filtre

Dans `collection.html`, ajoutez une nouvelle section :

```html
<div class="filter-section">
    <h3 class="filter-title">LENGTH</h3>
    <div class="filter-options">
        <label class="filter-option">
            <input type="checkbox" name="length" value="short">
            <span class="filter-label">Short (8-12")</span>
            <span class="filter-count">(5)</span>
        </label>
        <!-- Plus d'options... -->
    </div>
</div>
```

Dans `collection-filters.js`, ajoutez la logique :

```javascript
updateFilterState() {
    // Ajouter le nouveau filtre
    this.activeFilters.lengths = [];
    document.querySelectorAll('input[name="length"]:checked').forEach(input => {
        this.activeFilters.lengths.push(input.value);
    });
}
```

## 🌐 API Endpoints Utilisés

### GET `/api/products/categories`
Récupère la liste de toutes les catégories.

**Réponse :**
```json
{
    "categories": [
        {
            "id": 1,
            "name": "Wigs",
            "slug": "wigs",
            "description": "Perruques de qualité",
            "image_url": "/static/images/categories/wigs.jpg",
            "product_count": 36
        }
    ]
}
```

### GET `/api/products/`
Récupère les produits avec filtres.

**Paramètres :**
- `category_id` : ID de la catégorie
- `skip`, `limit` : Pagination
- `min_price`, `max_price` : Fourchette de prix
- `sort_by`, `sort_order` : Tri

**Réponse :**
```json
{
    "products": [...],
    "total": 36,
    "has_more": true
}
```

## ✅ Checklist de Déploiement

- [x] Header non-sticky (position: relative)
- [x] Page collection avec template dynamique
- [x] Barre d'outils avec Filter, Count, Views, Sort
- [x] Sidebar de filtres avec animations
- [x] Filtres dynamiques (Type, Brand, Price, Availability)
- [x] Bouton "Apply Filters" et "Clear All"
- [x] Badges de filtres actifs
- [x] Grille de produits responsive (2, 3, 4 colonnes)
- [x] Infinite scroll
- [x] Design minimaliste et professionnel
- [x] Mode clair (dark mode optionnel)
- [x] Responsive complet (desktop/tablette/mobile)

## 📖 Exemple Complet

### Accéder à la page "New Arrivals"

1. **URL** : `https://stelleworld.com/collections/all-new-arrivals`

2. **Backend** récupère la catégorie "all-new-arrivals"

3. **Template** affiche le hero avec le nom de la catégorie

4. **JavaScript** charge les produits de cette catégorie

5. **Utilisateur** peut :
   - Ouvrir la sidebar de filtres
   - Cocher "Full Cap Wig" dans PRODUCT TYPE
   - Sélectionner "Outre" dans BRAND
   - Ajuster le prix max à 200€
   - Cliquer sur "Apply Filters"
   - Voir les produits filtrés s'afficher

## 🎉 Résultat Final

Une page collection professionnelle et moderne qui :
- Se comporte comme bswbeautyca.com
- Offre une expérience utilisateur fluide
- S'adapte à tous les écrans
- Permet un filtrage puissant et intuitif
- Se charge rapidement avec infinite scroll

---

**Créé pour StelleWorld** | Inspiré de bswbeautyca.com 💅

