# 🚀 Installation du Header StelleWorld

## Installation rapide

### 1. Migrations de base de données

Créer la table des bannières :

```bash
# Depuis le dossier backend
cd backend

# Appliquer la migration
alembic upgrade head

# Ou avec Docker
docker-compose exec backend alembic upgrade head
```

### 2. Vérifier les fichiers

Assurez-vous que tous les fichiers sont présents :

```
✅ frontend/templates/components/header.html
✅ frontend/static/css/header.css
✅ frontend/static/js/header.js
✅ backend/app/models/banner.py
✅ backend/app/schemas/banner.py
✅ backend/app/api/banner.py
✅ backend/alembic/versions/001_create_banners_table.py
```

### 3. Redémarrer l'application

```bash
# Avec Docker
docker-compose restart backend

# Ou en local
# Arrêter et relancer le serveur FastAPI
```

### 4. Tester le header

1. Ouvrir le navigateur : `http://localhost:8000`
2. Vérifier que le header s'affiche correctement
3. Tester le menu mobile sur petit écran (F12 > Mode responsive)
4. Vérifier la bannière d'annonce en haut

### 5. Accéder au back-office

1. Se connecter à l'admin : `http://localhost:8000/admin/login`
2. Aller dans "Bannière d'annonce"
3. Modifier le message et les couleurs
4. Sauvegarder et vérifier sur le site

## 🔧 Configuration

### Modifier les collections

Dans `frontend/templates/components/header.html`, cherchez la section navigation et modifiez les liens :

```html
<li class="nav-item">
    <a href="/collections/votre-collection" class="nav-link">
        VOTRE COLLECTION
    </a>
</li>
```

### Ajouter des sous-catégories

```html
<li class="nav-item nav-dropdown">
    <a href="/collections/votre-collection" class="nav-link">
        VOTRE COLLECTION
        <i class="fas fa-chevron-down nav-arrow"></i>
    </a>
    <div class="dropdown-menu">
        <a href="/collections/sous-cat-1" class="dropdown-item">Sous-catégorie 1</a>
        <a href="/collections/sous-cat-2" class="dropdown-item">Sous-catégorie 2</a>
    </div>
</li>
```

### Modifier le logo

Remplacez le texte par une image dans `header.html` :

```html
<div class="header-logo">
    <a href="/">
        <img src="/static/images/logo.png" 
             alt="StelleWorld" 
             class="h-10">
    </a>
</div>
```

### Personnaliser les couleurs

Dans `frontend/static/css/header.css` :

```css
:root {
    --color-black: #000000;           /* Votre noir */
    --color-rose-powder: #fce7f3;     /* Votre rose poudré */
    --color-rose-dark: #831843;       /* Votre rose foncé */
    --color-white: #ffffff;           /* Votre blanc */
    --color-off-white: #fafaf9;       /* Votre blanc cassé */
}
```

### Modifier la police

Ajoutez Google Fonts dans `base.html` :

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
```

Puis dans `header.css` :

```css
:root {
    --font-elegant: 'Playfair Display', serif;
}
```

## 🎨 Personnalisation de la bannière par défaut

Si vous voulez changer la bannière par défaut, modifiez la migration :

`backend/alembic/versions/001_create_banners_table.py`

```python
op.execute("""
    INSERT INTO banners (message, is_active, background_color, text_color)
    VALUES ('🎉 Votre message personnalisé !', true, '#fce7f3', '#831843')
""")
```

Puis réinitialisez la base de données ou créez une nouvelle bannière via l'API/admin.

## 📱 Tester le responsive

### Chrome DevTools
1. F12 ou Clic droit > Inspecter
2. Ctrl+Shift+M (Mode responsive)
3. Tester différentes tailles :
   - Mobile : 375px
   - Tablet : 768px
   - Desktop : 1440px

### Firefox
1. F12 ou Clic droit > Inspecter
2. Ctrl+Shift+M (Vue adaptative)

## 🐛 Résolution de problèmes

### Erreur : Module 'banner' not found

Vérifiez que le fichier `backend/app/api/banner.py` existe et que l'import est correct dans `main.py`.

### La bannière ne s'affiche pas

1. Vérifiez la console JavaScript (F12)
2. Testez l'endpoint : `http://localhost:8000/api/banners/active`
3. Vérifiez que la migration a été exécutée

### Erreur de base de données

```bash
# Réinitialiser les migrations (ATTENTION : efface les données)
alembic downgrade base
alembic upgrade head
```

### Le CSS ne se charge pas

1. Vérifiez que le fichier existe : `frontend/static/css/header.css`
2. Vérifiez le lien dans `base.html` :
   ```html
   <link rel="stylesheet" href="/static/css/header.css">
   ```
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Le JavaScript ne fonctionne pas

1. Ouvrez la console (F12)
2. Vérifiez les erreurs
3. Testez manuellement :
   ```javascript
   toggleMobileMenu()
   ```

## 🚀 Déploiement en production

### 1. Variables d'environnement

Assurez-vous que `.env` est configuré :

```env
DATABASE_URL=postgresql://user:pass@host/dbname
SECRET_KEY=your-secret-key
```

### 2. Build Docker

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 4. Vérifications

- [ ] Header s'affiche correctement
- [ ] Bannière visible et modifiable
- [ ] Menu mobile fonctionne
- [ ] Recherche active
- [ ] Liens de navigation valides
- [ ] Responsive testé sur mobile réel

## 📊 Monitoring

### Vérifier les logs

```bash
# Logs du backend
docker-compose logs -f backend

# Logs Nginx
docker-compose logs -f nginx
```

### Tester les endpoints

```bash
# Bannière active
curl http://localhost:8000/api/banners/active

# Health check
curl http://localhost:8000/health
```

## 🎓 Ressources

- [Documentation complète du header](HEADER_USAGE.md)
- [README principal](../README.md)
- [Guide d'installation générale](INSTALL.md)

## ✅ Checklist de validation

- [ ] Les migrations sont appliquées
- [ ] Le header s'affiche sur toutes les pages
- [ ] La bannière est modifiable depuis l'admin
- [ ] Le menu mobile fonctionne (< 768px)
- [ ] La recherche affiche des résultats
- [ ] Le compteur de panier fonctionne
- [ ] Tous les liens de navigation sont valides
- [ ] Le design est fidèle à bswbeautyca.com
- [ ] Le site est responsive (mobile, tablet, desktop)
- [ ] Les couleurs correspondent à la charte graphique
- [ ] Les polices sont élégantes et lisibles

## 🎉 C'est terminé !

Votre header moderne inspiré de bswbeautyca.com est maintenant installé et fonctionnel. 

Pour toute question, consultez la [documentation complète](HEADER_USAGE.md) ou contactez le support.

