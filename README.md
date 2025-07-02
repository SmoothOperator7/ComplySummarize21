# Project Apocalypse

## Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé (Windows/Mac/Linux)
- Accès à un terminal/PowerShell

## Installation et lancement rapide

1. **Clone le projet**
   ```sh
   git clone <url-du-repo>
   cd project-apocalypse
   ```

2. **Vérifie que le fichier `docker-compose.yml` existe à la racine**
   (il est déjà fourni normalement)

3. **Lance tous les services (backend, frontend, MongoDB, Ollama)**
   ```sh
   docker-compose up --build
   ```
   - La première fois, le téléchargement des images et des modèles peut être long.
   - Si tu veux arrêter :
     ```sh
     docker-compose down
     ```

4. **Accède à l'application**
   - **Frontend** : http://localhost:3000
   - **Backend API** : http://localhost:5000
   - **MongoDB** : port 27017 (pour Compass ou autre outil)
   - **Ollama** : http://localhost:11434

## Utilisation d'Ollama (modèle LLM local)

- Le backend utilise Ollama pour générer les résumés.
- Par défaut, le modèle `openchat` est utilisé. Si tu veux un autre modèle (ex : `mistral`, `llama3`), modifie le code backend et télécharge le modèle :
  ```sh
  docker exec -it project-apocalypse-ollama-1 ollama pull mistral
  ```
- Le premier chargement d'un modèle peut prendre 1 à 2 minutes.

## Variables d'environnement importantes

Dans `docker-compose.yml` (service backend) :
```yaml
environment:
  - MONGO_URI=mongodb://mongo:27017/apocalypse
  - OLLAMA_API_URL=http://ollama:11434
```

## Commandes utiles

- **Voir les logs en temps réel** :
  ```sh
  docker-compose logs -f backend
  ```
- **Arrêter tous les services** :
  ```sh
  docker-compose down
  ```
- **Rebuilder après modification** :
  ```sh
  docker-compose up --build
  ```

## Conseils
- Attends que le modèle Ollama soit bien chargé avant de tester l'upload de PDF.
- Si tu as une erreur "model not found", télécharge le modèle dans le conteneur Ollama.
- Si tu as une erreur MongoDB, vérifie que l'URL de connexion utilise bien `mongo` (et pas `localhost`).

## Dépannage
- Si le frontend "charge dans le vide", regarde les logs du backend pour voir s'il y a une erreur.
- Pour toute question, copie les logs d'erreur ici ou consulte la documentation Docker/Ollama.

---

**Projet fullstack PDF summarizer : Node.js/Express, React, MongoDB, Ollama (LLM local)**
