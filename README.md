# Project Apocalypse – PDF Résumé IA en Local

## Prérequis
- [Node.js & npm](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (pour la base de données)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass) (interface graphique pour voir les données)
- [Ollama](https://ollama.com/) (pour faire tourner le modèle IA en local)

## Installation

1. **Clonez le projet**
   ```bash
   git clone <url-du-repo>
   cd project-apocalypse
   ```

2. **Installez les dépendances backend**
   ```bash
   cd backend
   npm install
   ```

3. **Installez les dépendances frontend**
   ```bash
   cd ../frontend
   npm install
   ```

## Lancer MongoDB
- Si vous avez installé MongoDB comme service, il démarre automatiquement.
- Sinon, lancez-le dans un terminal :
  ```bash
  mongod
  ```

## Lancer Ollama avec le modèle Mistral
1. Ouvrez un terminal et lancez :
   ```bash
   ollama run mistral
   ```
   (La première fois, Ollama va télécharger le modèle.)
2. Laissez ce terminal ouvert pendant toute l'utilisation de l'application.

## Lancer le backend
Dans le dossier `backend` :
```bash
npm run dev
```

## Lancer le frontend
Dans le dossier `frontend` :
```bash
npm run dev
```

## Utilisation
- Accédez à l'application frontend (généralement sur [http://localhost:5173](http://localhost:5173)).
- Uploadez un PDF : le texte est extrait, envoyé à Ollama (modèle IA local), qui génère un résumé structuré, des points clés et des suggestions d'actions.
- L'historique des conversations est affiché dans la sidebar à gauche (comme ChatGPT).
- Toutes les réponses sont enregistrées dans MongoDB (base `apocalypse`, collection `apiresponses`).

## Souveraineté & Sécurité
- **Aucune donnée ne sort de votre machine** : tout se passe en local (extraction, IA, base de données).
- Pas de quota, pas de coût à l'usage, pas de dépendance à un cloud externe.

## Liens utiles
- [Ollama – Documentation & modèles](https://ollama.com/library)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass)
- [Node.js](https://nodejs.org/)

## Exemple de prompt pour forcer la réponse en français

```
Voici un texte extrait d'un PDF.
Si le texte n'est pas en français, traduis-le d'abord en français.
Fais ensuite un résumé structuré, liste les points clés, et propose des suggestions d'actions.
Réponds uniquement en français, au format suivant :

Résumé :
- ...
Points clés :
- ...
Suggestions d'actions :
- ...

Texte :
"""${text}"""
```

---

**Pour toute question ou contribution, ouvrez une issue ou un pull request !**