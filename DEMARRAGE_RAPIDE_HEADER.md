# 🚀 Démarrage rapide - Header StelleWorld

## Installation en 5 minutes

### 1️⃣ Appliquer la migration

```bash
cd backend
alembic upgrade head
```

Ou avec Docker :
```bash
docker-compose exec backend alembic upgrade head
```

### 2️⃣ Redémarrer le serveur

```bash
docker-compose restart backend
```

Ou en local :
```bash
# Arrêter (Ctrl+C) puis relancer
cd backend
python -m app.main
```

### 3️⃣ Tester le header

Ouvrez votre navigateur :
- **Site principal** : http://localhost:8000
- **Administration** : http://localhost:8000/admin
- **Gestion bannière** : http://localhost:8000/admin/banner

### 4️⃣ Modifier la bannière

1. Connectez-vous à l'admin
2. Cliquez sur "Bannière d'annonce" dans le menu
3. Modifiez le message et les couleurs
4. Cliquez sur "Enregistrer"
5. Rafraîchissez la page principale pour voir les changements

## ✅ C'est tout !

Le header est maintenant actif sur votre site avec :
- ✨ Bannière d'annonce personnalisable
- 🔍 Barre de recherche centrée
- 📱 Menu responsive
- 🎨 Design élégant noir/rose/blanc

## 📖 Documentation complète

- [Guide d'utilisation](docs/HEADER_USAGE.md)
- [Guide d'installation](docs/HEADER_INSTALLATION.md)
- [Fichiers créés](HEADER_CREATED.md)

## 🎨 Personnalisation rapide

### Changer le logo
Éditez `frontend/templates/components/header.html` ligne 12 :
```html
<span class="logo-text">Votre Marque</span>
```

### Changer les couleurs
Éditez `frontend/static/css/header.css` lignes 9-13 :
```css
--color-rose-powder: #votre-couleur;
--color-rose-dark: #votre-couleur;
```

### Ajouter un lien de navigation
Éditez `frontend/templates/components/header.html` après la ligne 80 :
```html
<li class="nav-item">
    <a href="/votre-page" class="nav-link">VOTRE LIEN</a>
</li>
```

## 🐛 Problème ?

### La bannière ne s'affiche pas
```bash
# Vérifier la console JavaScript (F12)
# Tester l'endpoint
curl http://localhost:8000/api/banners/active
```

### Le CSS ne se charge pas
```bash
# Vider le cache du navigateur
# Ctrl + Shift + R (Chrome/Firefox)
```

### Erreur de migration
```bash
# Vérifier le statut
alembic current

# Voir l'historique
alembic history
```

## 📞 Support

Questions ? Consultez la [documentation complète](docs/HEADER_USAGE.md) ou ouvrez une issue.

---

**Bon développement avec StelleWorld ! 🎉**

