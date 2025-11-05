# 🔐 Guide d'Authentification Administrateur - StelleWorld

## 🚀 Configuration Initiale

### 1. Initialiser la Base de Données

Pour créer l'utilisateur administrateur par défaut et les données d'exemple :

```bash
cd backend
python init_stelleworld_db.py
```

Cette commande va créer :
- ✅ Utilisateur admin par défaut : `admin@stelleworld.com` / `admin123`
- ✅ Utilisateur test : `user@stelleworld.com` / `user123`
- ✅ 5 catégories de produits
- ✅ 4 produits d'exemple

### 2. Démarrer le Serveur

```bash
cd backend
python run.py
```

Le serveur sera accessible à : `http://localhost:8000`

## 🔑 Accès Administration

### URLs Principales

- **Site principal** : `http://localhost:8000`
- **Login Admin** : `http://localhost:8000/admin/login`
- **Dashboard Admin** : `http://localhost:8000/admin`
- **Documentation API** : `http://localhost:8000/api/docs`

### Comptes par Défaut

#### 👑 Administrateur
- **Email** : `admin@stelleworld.com`
- **Mot de passe** : `admin123`
- **Privilèges** : Accès complet au backoffice

#### 👤 Utilisateur Test
- **Email** : `user@stelleworld.com`
- **Mot de passe** : `user123`
- **Privilèges** : Accès utilisateur standard (pas d'accès admin)

## 🛡️ Sécurité

### Protection des Routes
- ✅ **Middleware automatique** : Toutes les routes `/admin/*` sont protégées
- ✅ **Authentification JWT** : Tokens sécurisés avec expiration
- ✅ **Vérification des privilèges** : Seuls les administrateurs peuvent accéder au backoffice
- ✅ **Redirections intelligentes** : Redirection vers login si non authentifié

### Gestion des Erreurs
- **401 Unauthorized** : Token manquant ou invalide
- **403 Forbidden** : Utilisateur connecté mais sans privilèges admin
- **Redirection automatique** : Vers `/admin/login` pour les pages HTML

## 🎯 Fonctionnalités du Backoffice

### Dashboard Principal
- 📊 **Statistiques temps réel** : CA, commandes, utilisateurs
- 📈 **Graphiques interactifs** : Évolution des ventes
- 🚨 **Alertes** : Stock faible, nouveaux messages

### Gestion Produits
- ✅ **CRUD complet** : Créer, modifier, supprimer des produits
- 🖼️ **Upload d'images** : Glisser-déposer avec prévisualisation
- 📦 **Gestion stock** : Modification en temps réel avec alertes
- 🏷️ **Catégories** : Organisation et classification

### Analytics Avancés
- 📈 **Statistiques détaillées** : Ventes, clients, produits
- 📊 **Graphiques multiples** : Barres, camemberts, courbes
- 📥 **Export de données** : CSV pour analyse externe

## 🧪 Tests

### Lancer les Tests

```bash
cd backend
make test                  # Tous les tests
make test-admin           # Tests admin uniquement
make test-auth            # Tests d'authentification
make test-coverage        # Tests avec couverture
```

### Tests Automatisés Inclus
- ✅ **Authentification admin** : Login, logout, vérifications
- ✅ **Protection des routes** : Accès autorisé/refusé
- ✅ **Gestion des produits** : CRUD via API admin
- ✅ **Initialisation DB** : Création utilisateur par défaut

## 🔧 Développement

### Commandes Utiles

```bash
# Développement
make dev                  # Serveur de développement
make init-db             # Réinitialiser la base de données
make format              # Formater le code
make lint                # Vérifier la qualité

# Base de données
make reset-db            # Réinitialiser complètement la DB
make seed                # Alimenter avec des données de test
```

### Structure des Fichiers Admin

```
backend/
├── app/
│   ├── api/admin.py           # API endpoints admin
│   ├── core/
│   │   ├── init_db.py         # Script d'initialisation
│   │   └── admin_middleware.py # Protection des routes
│   └── models/                # Modèles de données
├── tests/
│   ├── conftest.py            # Fixtures de test
│   └── test_admin_auth.py     # Tests d'authentification
└── init_stelleworld_db.py     # Script d'initialisation

frontend/
├── templates/admin/
│   ├── base.html             # Template de base admin
│   ├── login.html            # Page de connexion
│   ├── dashboard.html        # Dashboard principal
│   ├── products.html         # Gestion produits
│   └── access-denied.html    # Page d'accès refusé
└── static/js/main.js         # JavaScript principal
```

## 🚨 Sécurité en Production

### ⚠️ Actions Importantes

1. **Changer le mot de passe admin** après la première connexion
2. **Modifier la clé secrète JWT** dans les variables d'environnement
3. **Activer HTTPS** en production
4. **Configurer des limites de taux** (rate limiting)
5. **Activer les logs de sécurité**

### Variables d'Environnement

```bash
SECRET_KEY=votre-cle-secrete-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=votre-url-base-production
```

## 📞 Support

En cas de problème :

1. **Vérifier les logs** : Consulter la console pour les erreurs
2. **Tester la connexion** : S'assurer que l'utilisateur admin existe
3. **Réinitialiser** : Relancer `python init_stelleworld_db.py` si nécessaire
4. **Tests** : Exécuter `make test-admin` pour diagnostiquer

---

✨ **Le système d'authentification administrateur est maintenant opérationnel !**

🔗 **Accédez au backoffice** : [http://localhost:8000/admin/login](http://localhost:8000/admin/login)
