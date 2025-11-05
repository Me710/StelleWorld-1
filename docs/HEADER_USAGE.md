# 🎨 Documentation du Header StelleWorld

## Vue d'ensemble

Le header de StelleWorld est un composant moderne et élégant inspiré de bswbeautyca.com. Il comprend :
- Une bannière d'annonce personnalisable et éditable
- Un logo élégant avec typographie sophistiquée
- Une barre de recherche centrée avec autocomplétion
- Des icônes d'action (compte, panier, Instagram)
- Une navigation horizontale avec dropdowns
- Un design responsive avec menu mobile

## 🎨 Palette de couleurs

### Couleurs principales
- **Noir** : `#000000` - Texte principal et navigation
- **Rose poudré** : `#fce7f3` - Bannière et accents
- **Rose foncé** : `#831843` - Texte de bannière et hover
- **Blanc cassé** : `#fafaf9` - Arrière-plans subtils
- **Blanc** : `#ffffff` - Fond principal

### Couleurs secondaires
- **Gris moyen** : `#6b6b6b` - Texte secondaire
- **Gris clair** : `#f5f5f5` - Bordures et séparations
- **Rose clair** : `#fbcfe8` - Hover states
- **Rose** : `#f9a8d4` - Focus states

## 📦 Structure des fichiers

```
frontend/
├── templates/
│   └── components/
│       └── header.html           # Template du header
└── static/
    ├── css/
    │   └── header.css            # Styles du header
    └── js/
        └── header.js             # Scripts d'interaction

backend/
├── app/
│   ├── models/
│   │   └── banner.py             # Modèle de bannière
│   ├── schemas/
│   │   └── banner.py             # Schémas Pydantic
│   └── api/
│       └── banner.py             # Routes API bannière
└── alembic/
    └── versions/
        └── 001_create_banners_table.py  # Migration DB
```

## 🚀 Utilisation

### Inclure le header dans une page

Dans votre template Jinja2 :

```html
{% extends "base.html" %}

{% block content %}
  <!-- Votre contenu ici -->
{% endblock %}
```

Le header est automatiquement inclus dans `base.html` via :

```html
{% include "components/header.html" %}
```

### Charger les assets

Assurez-vous que les CSS et JS sont chargés dans `base.html` :

```html
<!-- CSS -->
<link rel="stylesheet" href="/static/css/header.css">

<!-- JavaScript -->
<script src="/static/js/header.js"></script>
```

## 🎯 Fonctionnalités

### 1. Bannière d'annonce éditable

La bannière peut être gérée depuis le back-office admin.

#### API Endpoints

- **GET** `/api/banners/active` - Récupérer la bannière active
- **GET** `/api/banners/` - Lister toutes les bannières (admin)
- **GET** `/api/banners/{id}` - Récupérer une bannière par ID
- **POST** `/api/banners/` - Créer une bannière
- **PATCH** `/api/banners/{id}` - Mettre à jour une bannière
- **DELETE** `/api/banners/{id}` - Supprimer une bannière

#### Exemple d'utilisation de l'API

```javascript
// Récupérer la bannière active
const response = await fetch('/api/banners/active');
const banner = await response.json();

// Mettre à jour la bannière
const response = await fetch('/api/banners/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '🎉 Nouvelle promotion !',
    background_color: '#fce7f3',
    text_color: '#831843',
    is_active: true
  })
});
```

### 2. Recherche avec autocomplétion

La barre de recherche affiche des suggestions en temps réel.

```javascript
// Personnaliser le comportement de recherche
function searchProducts(query, container) {
  // Logique de recherche personnalisée
}
```

### 3. Panier avec badge

Le compteur du panier se met à jour automatiquement.

```javascript
// Mettre à jour le compteur
updateCartCount(5); // Affiche "5" dans le badge
```

### 4. Menu mobile responsive

Le menu mobile s'active automatiquement sur les petits écrans.

```javascript
// Ouvrir/fermer le menu mobile
toggleMobileMenu();
```

## 🎨 Personnalisation

### Modifier les couleurs

Dans `frontend/static/css/header.css`, modifiez les variables CSS :

```css
:root {
    --color-black: #000000;
    --color-rose-powder: #fce7f3;
    --color-rose-dark: #831843;
    /* ... autres variables */
}
```

### Ajouter des liens de navigation

Dans `frontend/templates/components/header.html`, ajoutez un item :

```html
<li class="nav-item">
    <a href="/nouvelle-page" class="nav-link">NOUVEAU</a>
</li>
```

Pour un lien avec dropdown :

```html
<li class="nav-item nav-dropdown">
    <a href="/collection" class="nav-link">
        COLLECTION
        <i class="fas fa-chevron-down nav-arrow"></i>
    </a>
    <div class="dropdown-menu">
        <a href="/collection/item1" class="dropdown-item">Item 1</a>
        <a href="/collection/item2" class="dropdown-item">Item 2</a>
    </div>
</li>
```

### Modifier le logo

Dans `frontend/templates/components/header.html` :

```html
<div class="header-logo">
    <a href="/">
        <img src="/static/images/logo.png" alt="StelleWorld" class="logo-image">
        <!-- ou -->
        <span class="logo-text">Votre Marque</span>
    </a>
</div>
```

## 🔧 Configuration Back-office

### Accéder à la gestion de bannière

1. Connectez-vous au back-office : `/admin/login`
2. Dans le menu latéral, cliquez sur **"Bannière d'annonce"**
3. URL directe : `/admin/banner`

### Modifier la bannière

L'interface admin permet de :
- Modifier le message
- Changer la couleur de fond
- Changer la couleur du texte
- Activer/désactiver la bannière
- Utiliser des émojis suggérés
- Prévisualiser en temps réel

### Couleurs prédéfinies

**Fond :**
- Rose poudré : `#fce7f3`
- Bleu clair : `#dbeafe`
- Jaune pâle : `#fef3c7`

**Texte :**
- Rose foncé : `#831843`
- Gris foncé : `#1f2937`
- Noir : `#000000`

## 📱 Responsive Design

### Breakpoints

- **Desktop** : > 1024px - Header complet avec navigation horizontale
- **Tablet** : 768px - 1024px - Navigation condensée
- **Mobile** : < 768px - Menu hamburger avec navigation latérale

### Tester le responsive

```javascript
// Désactiver temporairement le menu mobile pour tester
document.querySelector('.mobile-menu-toggle').style.display = 'none';
```

## ⚙️ Variables JavaScript globales

```javascript
// Fonctions exposées globalement
window.toggleMobileMenu()      // Toggle menu mobile
window.closeAnnouncement()     // Fermer la bannière
window.updateCartCount(count)  // Mettre à jour le panier
window.loadCartCount()         // Charger le compteur du panier
```

## 🔍 Dépannage

### La bannière ne s'affiche pas

1. Vérifier que la migration a été exécutée :
   ```bash
   alembic upgrade head
   ```

2. Vérifier qu'une bannière active existe dans la DB
3. Vérifier la console JavaScript pour des erreurs

### Le menu mobile ne fonctionne pas

1. Vérifier que `header.js` est chargé
2. Vérifier la console pour des erreurs JavaScript
3. Tester manuellement : `toggleMobileMenu()` dans la console

### La recherche ne fonctionne pas

1. Vérifier que l'endpoint `/api/products/search` existe
2. Vérifier les paramètres de requête (query, limit)
3. Tester l'endpoint directement dans le navigateur

## 🎓 Bonnes pratiques

1. **Performance** : Le header utilise du throttling pour optimiser le scroll
2. **Accessibilité** : Les focus states sont définis pour la navigation au clavier
3. **SEO** : Les liens utilisent des balises `<a>` sémantiques
4. **Mobile-first** : Le CSS est responsive par défaut
5. **Progressive enhancement** : Le header fonctionne sans JavaScript

## 🚀 Améliorations futures

- [ ] Recherche vocale
- [ ] Mode sombre automatique
- [ ] Animations avancées avec GSAP
- [ ] Mega menu pour les grandes collections
- [ ] Sticky header avec effet de transparence au scroll
- [ ] Notifications push pour les nouvelles annonces

## 📞 Support

Pour toute question ou problème :
- Documentation principale : [README.md](../README.md)
- Issues GitHub : [GitHub Issues]
- Email : support@stelleworld.com

