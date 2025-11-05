# Test Rapide - Page Collection

## 🚀 Démarrage Rapide

### 1. Lancer le serveur
```bash
cd backend
python -m app.main
# ou
make dev
```

### 2. Accéder à la page collection

#### Option A : Via une catégorie existante
```
http://localhost:8000/collections/wigs
http://localhost:8000/collections/hair
http://localhost:8000/collections/braid
```

#### Option B : Créer une nouvelle catégorie

Si vous n'avez pas encore de catégories avec des slugs, créez-en une via l'admin ou l'API :

**Via API (avec curl) :**
```bash
curl -X POST http://localhost:8000/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "All New Arrivals",
    "slug": "all-new-arrivals",
    "description": "Découvrez nos dernières nouveautés",
    "is_active": true
  }'
```

**Via Admin Panel :**
```
http://localhost:8000/admin/categories
```

### 3. Tester les fonctionnalités

#### ✅ Page s'affiche correctement
- Hero section avec titre de la catégorie
- Barre d'outils avec "Filter", compteur, et "Sort by"
- Grille de produits qui se charge

#### ✅ Header non-sticky
- Scroller la page vers le bas
- Le header doit défiler avec le contenu (ne reste pas fixé en haut)

#### ✅ Sidebar de filtres

**Desktop :**
- La sidebar doit être visible à gauche (280px de large)

**Mobile/Tablette :**
- Cliquer sur le bouton "Filter"
- La sidebar s'ouvre depuis la gauche avec animation
- Overlay sombre apparaît derrière
- Cliquer sur X ou sur l'overlay pour fermer

#### ✅ Filtres fonctionnels
1. Cocher quelques checkboxes dans "PRODUCT TYPE"
2. Sélectionner une marque dans "BRAND"
3. Ajuster le prix avec le slider
4. Cliquer sur "Apply Filters"
5. Les produits doivent se recharger
6. Les badges de filtres actifs apparaissent au-dessus de la grille

#### ✅ Tri
1. Changer le "Sort by" (ex: Price: Low to High)
2. Les produits doivent se réorganiser

#### ✅ Vues (Desktop seulement)
1. Cliquer sur les boutons de vue (2, 3, 4 colonnes)
2. La grille doit changer de layout

#### ✅ Infinite Scroll
1. Scroller jusqu'en bas de la page
2. Plus de produits doivent se charger automatiquement
3. Spinner de chargement doit apparaître brièvement

## 🐛 Dépannage

### Problème : Page 404
**Cause** : La catégorie n'existe pas dans la base de données

**Solution** : 
- Vérifier que le slug existe dans la table `categories`
- Créer la catégorie via l'admin ou l'API

### Problème : Aucun produit affiché
**Cause** : Pas de produits dans cette catégorie

**Solution** :
- Ajouter des produits via l'admin
- Vérifier que `category_id` est correctement lié aux produits

### Problème : Sidebar ne s'ouvre pas
**Cause** : Erreur JavaScript

**Solution** :
- Ouvrir la console du navigateur (F12)
- Vérifier s'il y a des erreurs
- S'assurer que `collection-filters.js` est bien chargé

### Problème : Filtres ne fonctionnent pas
**Cause** : API ne répond pas ou erreurs

**Solution** :
- Vérifier que l'API `/api/products/` fonctionne
- Tester dans le navigateur : `http://localhost:8000/api/products/?category_id=1`
- Vérifier la console pour les erreurs réseau

### Problème : Styles cassés
**Cause** : CSS non chargé

**Solution** :
- Vérifier que `collection.css` existe dans `frontend/static/css/`
- Vérifier les permissions du dossier `static`
- Recharger la page avec Ctrl+F5 (cache)

## 📊 Checklist de Test

### Fonctionnalités de Base
- [ ] La page collection s'affiche
- [ ] Le hero affiche le bon nom de catégorie
- [ ] Les produits se chargent
- [ ] Le compteur affiche le bon nombre
- [ ] Le header n'est PAS sticky

### Sidebar
- [ ] Bouton "Filter" ouvre la sidebar
- [ ] Animation fluide (0.3s)
- [ ] Overlay apparaît (mobile/tablette)
- [ ] Bouton X ferme la sidebar
- [ ] Clic sur overlay ferme la sidebar

### Filtres
- [ ] Checkboxes sont cliquables
- [ ] Prix min/max fonctionnent
- [ ] Slider de prix fonctionne
- [ ] "Apply Filters" applique les filtres
- [ ] "Clear All" réinitialise tout
- [ ] Badges de filtres actifs s'affichent
- [ ] Clic sur badge supprime le filtre

### Grille et Produits
- [ ] Cartes produits s'affichent correctement
- [ ] Images se chargent
- [ ] Prix affiché correctement
- [ ] Bouton "Ajouter au panier" fonctionne
- [ ] Hover effects sur les cartes

### Tri et Vues
- [ ] Sort by change l'ordre des produits
- [ ] Boutons de vue changent le layout (desktop)
- [ ] Infinite scroll charge plus de produits

### Responsive
- [ ] Desktop : Sidebar visible, grille 4 colonnes
- [ ] Tablette : Sidebar en overlay, grille 2-3 colonnes
- [ ] Mobile : Sidebar plein écran, grille 1 colonne

## 🎉 Tout Fonctionne ?

Si tous les tests passent, votre page collection est prête !

### Prochaines étapes :
1. Ajoutez plus de catégories
2. Remplissez avec des vrais produits
3. Personnalisez les couleurs dans `collection.css`
4. Ajoutez des filtres supplémentaires si nécessaire

---

**Besoin d'aide ?** Consultez `COLLECTION_PAGE_GUIDE.md` pour la documentation complète.

