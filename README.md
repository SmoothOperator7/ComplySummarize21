# PDF Text Extractor - Fullstack Application

Une application fullstack pour extraire le texte des fichiers PDF avec un backend Node.js/Express et un frontend React.

## 🏗️ Architecture

```
pdf-text-extractor/
├── backend/           # API Node.js/Express
│   ├── server.js      # Serveur principal
│   ├── package.json   # Dépendances backend
│   └── uploads/       # Dossier temporaire (créé automatiquement)
├── frontend/          # Application React
│   ├── src/
│   │   ├── App.jsx    # Composant principal
│   │   ├── main.jsx   # Point d'entrée
│   │   └── index.css  # Styles
│   ├── package.json   # Dépendances frontend
│   └── vite.config.js # Configuration Vite
└── package.json       # Scripts globaux
```

## 🚀 Installation et démarrage

### Installation des dépendances
```bash
npm run install-all
```

### Démarrage en mode développement
```bash
npm run dev
```

Cette commande démarre simultanément :
- Backend sur http://localhost:5000
- Frontend sur http://localhost:3000

### Démarrage séparé

**Backend uniquement :**
```bash
npm run backend
```

**Frontend uniquement :**
```bash
npm run frontend
```

## 🔧 Fonctionnalités

### Backend (Node.js/Express)
- ✅ Route POST `/upload` pour recevoir les fichiers PDF
- ✅ Utilisation de `multer` pour la gestion des uploads
- ✅ Extraction de texte avec `pdf-parse`
- ✅ Validation des fichiers (type PDF, taille max 10MB)
- ✅ Nettoyage automatique des fichiers temporaires
- ✅ Gestion d'erreurs complète
- ✅ CORS configuré pour le frontend

### Frontend (React)
- ✅ Interface utilisateur moderne et responsive
- ✅ Upload de fichiers PDF via FormData
- ✅ Affichage du texte extrait
- ✅ Gestion des états de chargement
- ✅ Validation côté client
- ✅ Messages d'erreur informatifs
- ✅ Design avec animations et micro-interactions

## 📡 API Endpoints

### POST /upload
Upload et extraction de texte d'un fichier PDF.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: fichier PDF (champ 'pdf')

**Response:**
```json
{
  "success": true,
  "filename": "document.pdf",
  "text": "Texte extrait du PDF...",
  "pages": 5,
  "info": {
    "Title": "Titre du document",
    "Author": "Auteur"
  }
}
```

### GET /
Endpoint de test pour vérifier que l'API fonctionne.

## 🛠️ Technologies utilisées

### Backend
- **Express.js** - Framework web
- **Multer** - Gestion des uploads de fichiers
- **pdf-parse** - Extraction de texte PDF
- **CORS** - Gestion des requêtes cross-origin

### Frontend
- **React** - Bibliothèque UI
- **Vite** - Outil de build et serveur de développement
- **CSS moderne** - Animations et design responsive

## 📝 Utilisation

1. Démarrez l'application avec `npm run dev`
2. Ouvrez http://localhost:3000 dans votre navigateur
3. Sélectionnez un fichier PDF (max 10MB)
4. Cliquez sur "Extraire le texte"
5. Le texte extrait s'affiche automatiquement

## 🔒 Sécurité

- Validation stricte des types de fichiers (PDF uniquement)
- Limite de taille de fichier (10MB)
- Nettoyage automatique des fichiers temporaires
- Gestion d'erreurs sécurisée

## 🎨 Design

L'interface utilise un design moderne avec :
- Dégradés de couleurs
- Animations fluides
- États de hover interactifs
- Design responsive pour mobile et desktop
- Feedback visuel pour toutes les actions utilisateur