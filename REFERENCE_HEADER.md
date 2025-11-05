# 📚 Référence rapide - Header StelleWorld

## 🔗 Liens rapides

### URLs du site
- **Page d'accueil** : `http://localhost:8000`
- **Catalogue** : `http://localhost:8000/products/catalog`
- **Collections** : `http://localhost:8000/collections/{nom}`
- **Locations** : `http://localhost:8000/locations`
- **Sale Flyer** : `http://localhost:8000/sale-flyer`
- **Contact** : `http://localhost:8000/contact`

### URLs admin
- **Connexion admin** : `http://localhost:8000/admin/login`
- **Dashboard** : `http://localhost:8000/admin`
- **Gestion bannière** : `http://localhost:8000/admin/banner`
- **Produits** : `http://localhost:8000/admin/products`

### API Endpoints
- `GET /api/banners/active` - Bannière active
- `GET /api/banners/` - Liste des bannières
- `GET /api/banners/{id}` - Bannière par ID
- `POST /api/banners/` - Créer une bannière
- `PATCH /api/banners/{id}` - Mettre à jour
- `DELETE /api/banners/{id}` - Supprimer
- `GET /api/products/search?q={query}` - Recherche produits

## 📁 Fichiers créés

### Frontend
```
frontend/
├── templates/
│   ├── components/
│   │   └── header.html                    # Template principal
│   ├── locations.html                     # Page emplacements
│   ├── sale-flyer.html                    # Page promotions
│   └── contact.html                       # Page contact
└── static/
    ├── css/
    │   └── header.css                     # Styles (600+ lignes)
    └── js/
        └── header.js                      # Scripts (400+ lignes)
```

### Backend
```
backend/
├── app/
│   ├── models/
│   │   └── banner.py                      # Modèle SQLAlchemy
│   ├── schemas/
│   │   └── banner.py                      # Schémas Pydantic
│   └── api/
│       └── banner.py                      # Routes API
└── alembic/
    └── versions/
        └── 001_create_banners_table.py    # Migration
```

### Documentation
```
docs/
├── HEADER_USAGE.md                        # Guide complet
└── HEADER_INSTALLATION.md                 # Installation

HEADER_CREATED.md                          # Récapitulatif création
DEMARRAGE_RAPIDE_HEADER.md                 # Démarrage rapide
APERCU_HEADER.md                           # Aperçu visuel
REFERENCE_HEADER.md                        # Ce fichier
```

## 🎨 Variables CSS importantes

```css
/* Couleurs */
--color-black: #000000;
--color-rose-powder: #fce7f3;
--color-rose-dark: #831843;
--color-white: #ffffff;
--color-off-white: #fafaf9;

/* Dimensions */
--header-height: 60px;
--nav-height: 45px;
--announcement-height: 40px;

/* Typographie */
--font-primary: 'Inter', sans-serif;
--font-elegant: 'Cormorant Garamond', serif;
```

## 🔧 Fonctions JavaScript globales

```javascript
// Menu mobile
toggleMobileMenu()

// Bannière
closeAnnouncement()
loadActiveBanner()

// Panier
updateCartCount(count)
loadCartCount()

// Recherche
searchProducts(query, container)
```

## 💾 Modèle de bannière

```python
class Banner(Base):
    id: int                         # ID unique
    message: str                    # Message à afficher
    is_active: bool                 # Actif/inactif
    background_color: str           # Couleur fond (hex)
    text_color: str                 # Couleur texte (hex)
    created_at: datetime            # Date création
    updated_at: datetime            # Date modification
```

## 🎯 Collections disponibles

```
/collections/new-arrivals          → Nouveautés
/collections/wigs                  → Perruques
/collections/wigs/synthetic        → Perruques synthétiques
/collections/wigs/human-hair       → Cheveux naturels
/collections/wigs/lace-front       → Lace front
/collections/hair                  → Cheveux
/collections/hair/extensions       → Extensions
/collections/hair/weaves           → Tissages
/collections/hair/closures         → Closures
/collections/braid                 → Tresses
/collections/braid/kanekalon       → Kanekalon
/collections/braid/xpression       → X-pression
/collections/braid/afro            → Afro Kinky
/collections/hair-skin-care        → Soins
/collections/hair-care             → Soins cheveux
/collections/skin-care             → Soins peau
/collections/treatments            → Traitements
/collections/beauty                → Beauté
/collections/beauty/makeup         → Maquillage
/collections/beauty/cosmetics      → Cosmétiques
/collections/beauty/accessories    → Accessoires
/collections/tools                 → Outils
/collections/tools/styling         → Coiffage
/collections/tools/brushes         → Brosses/Peignes
/collections/tools/appliances      → Appareils
/collections/sale                  → Promotions
```

## 🎨 Couleurs prédéfinies admin

### Fond
- Rose poudré : `#fce7f3`
- Bleu clair : `#dbeafe`
- Jaune pâle : `#fef3c7`

### Texte
- Rose foncé : `#831843`
- Gris foncé : `#1f2937`
- Noir : `#000000`

## 📱 Breakpoints responsive

```css
/* Mobile */
@media (max-width: 480px)

/* Tablet */
@media (max-width: 768px)

/* Small tablet */
@media (max-width: 1024px)

/* Desktop */
@media (min-width: 1025px)
```

## 🚀 Commandes utiles

### Migrations
```bash
# Appliquer
alembic upgrade head

# Annuler
alembic downgrade -1

# Créer nouvelle
alembic revision -m "message"

# Voir historique
alembic history
```

### Docker
```bash
# Démarrer
docker-compose up -d

# Redémarrer backend
docker-compose restart backend

# Logs
docker-compose logs -f backend

# Shell
docker-compose exec backend bash
```

### Base de données
```bash
# Accéder à PostgreSQL
docker-compose exec db psql -U user -d stelleworld

# Voir les bannières
SELECT * FROM banners;

# Activer une bannière
UPDATE banners SET is_active = true WHERE id = 1;
```

## 🔍 Tests

### Tester l'API
```bash
# Bannière active
curl http://localhost:8000/api/banners/active

# Créer bannière
curl -X POST http://localhost:8000/api/banners/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test",
    "is_active": true,
    "background_color": "#fce7f3",
    "text_color": "#831843"
  }'

# Mettre à jour
curl -X PATCH http://localhost:8000/api/banners/1 \
  -H "Content-Type: application/json" \
  -d '{"message": "Nouveau message"}'
```

### Tester le responsive
```javascript
// Dans la console Chrome (F12)

// Mode mobile
window.innerWidth = 375;
window.dispatchEvent(new Event('resize'));

// Mode tablet
window.innerWidth = 768;
window.dispatchEvent(new Event('resize'));

// Mode desktop
window.innerWidth = 1440;
window.dispatchEvent(new Event('resize'));
```

## 🎓 Personnalisation courante

### Changer le logo texte
`frontend/templates/components/header.html:12`
```html
<span class="logo-text">Votre Marque</span>
```

### Ajouter un lien nav
`frontend/templates/components/header.html:80`
```html
<li class="nav-item">
    <a href="/votre-lien" class="nav-link">NOUVEAU LIEN</a>
</li>
```

### Modifier couleur principale
`frontend/static/css/header.css:13`
```css
--color-rose-powder: #votre-couleur;
```

### Changer police logo
`frontend/static/css/header.css:17`
```css
--font-elegant: 'Votre Police', serif;
```

## 📊 Structure de la base de données

```sql
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    message VARCHAR NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    background_color VARCHAR NOT NULL DEFAULT '#fce7f3',
    text_color VARCHAR NOT NULL DEFAULT '#831843',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🐛 Dépannage rapide

| Problème | Solution |
|----------|----------|
| Bannière invisible | Vérifier migration + bannière active en DB |
| CSS ne charge pas | Vider cache (Ctrl+Shift+R) |
| JS ne fonctionne pas | Vérifier console F12 |
| Menu mobile cassé | Vérifier Alpine.js chargé |
| Erreur API 404 | Vérifier routes dans main.py |
| Dropdown ne s'ouvre pas | Vérifier classes CSS nav-dropdown |

## 📞 Support

- **Documentation** : [docs/HEADER_USAGE.md](docs/HEADER_USAGE.md)
- **Installation** : [docs/HEADER_INSTALLATION.md](docs/HEADER_INSTALLATION.md)
- **Démarrage** : [DEMARRAGE_RAPIDE_HEADER.md](DEMARRAGE_RAPIDE_HEADER.md)
- **Aperçu** : [APERCU_HEADER.md](APERCU_HEADER.md)

## ✅ Checklist finale

- [ ] Migration appliquée
- [ ] Serveur redémarré
- [ ] Header visible sur le site
- [ ] Bannière modifiable
- [ ] Menu mobile fonctionne
- [ ] Recherche active
- [ ] Tous les liens valides
- [ ] Responsive testé
- [ ] Couleurs correctes
- [ ] Performance OK

---

**Référence complète du header StelleWorld v1.0** 🎉

