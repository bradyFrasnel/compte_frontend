# Vue 3 + TypeS# Compte Frontend - Application de Gestion

## Déploiement sur Vercel

### Prérequis
- Compte Vercel créé
- URL de l'API backend configurée

### Configuration de l'environnement

1. **Variables d'environnement sur Vercel :**
   - Allez dans les settings de votre projet Vercel
   - Ajoutez la variable : `VITE_API_URL`
   - Valeur : `https://votre-backend-url.com`

### Structure du projet
```
├── src/
│   ├── views/
│   │   ├── viewsHtml/     # Composants Vue
│   │   └── viewsCss/      # Styles CSS
│   ├── api/               # Configuration API
│   └── stores/            # Pinia stores
├── public/                # Assets statiques
├── dist/                 # Build de production
├── vercel.json           # Configuration Vercel
└── package.json          # Dépendances
```

### Fonctionnalités
- Authentification (Login/Register)
- Dashboard avec gestion des transactions
- Validation admin (Approuver/Rejeter/Supprimer)
- Modification des transactions par les utilisateurs
- Retrait avec justification obligatoire
- Design responsive

### Endpoints API utilisés
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription
- `GET /transactions` - Liste des transactions
- `POST /transactions/admin/withdraw-with-justification` - Retrait
- `PATCH /transactions/admin/validate/{id}` - Validation admin
- `DELETE /transactions/admin/delete/{id}` - Suppression admin
- `PATCH /transactions/update/{id}` - Mise à jour utilisateur

### Build
```bash
npm run build
```

### Déploiement automatique
Le projet se déploie automatiquement sur Vercel lors d'un push sur la branche principale.
