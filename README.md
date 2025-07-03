# Project Apocalypse

## Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé (Windows/Mac/Linux)
- [Ollama](https://ollama.com/download) installé sur ta machine (hors Docker)
- Accès à un terminal/PowerShell

## Installation et lancement rapide

1. **Clone le projet**
   ```sh
   git clone <url-du-repo>
   cd project-apocalypse
   ```

2. **Vérifie que le fichier `docker-compose.yml` existe à la racine**
   (il est déjà fourni normalement)

3. **Lance Ollama en natif sur ta machine Windows**
   - Ouvre un terminal et lance :
     ```sh
     ollama serve
     ```
   - Vérifie que http://localhost:11434 affiche "Ollama is running".
   - Télécharge le modèle souhaité (exemple avec mistral) :
     ```sh
     ollama pull mistral
     ```

4. **Adapte la configuration du backend**
   - Le backend doit pointer vers Ollama natif. Dans `docker-compose.yml`, la variable d'environnement doit être :
     ```yaml
     environment:
       - OLLAMA_API_URL=http://host.docker.internal:11434
     ```
   - (C'est déjà configuré normalement)

5. **Lance les services Docker (backend, frontend, mongo)**
   ```sh
   docker-compose up --build backend frontend mongo
   ```
   - *Ne lance pas le service Ollama dans Docker, il n'est plus utilisé.*

6. **Accède à l'application**
   - **Frontend** : http://localhost:3000
   - **Backend API** : http://localhost:5000
   - **MongoDB** : port 27017 (pour Compass ou autre outil)
   - **Ollama** : http://localhost:11434 (doit afficher "Ollama is running")

## Variables d'environnement importantes

Dans `docker-compose.yml` (service backend) :
```yaml
environment:
  - MONGO_URI=mongodb://mongo:27017/apocalypse
  - OLLAMA_API_URL=http://host.docker.internal:11434
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
- Si tu as une erreur "model not found", télécharge le modèle dans Ollama natif.
- Si tu as une erreur MongoDB, vérifie que l'URL de connexion utilise bien `mongo` (et pas `localhost`).

## Dépannage
- Si le frontend "charge dans le vide", regarde les logs du backend pour voir s'il y a une erreur.
- Pour toute question, copie les logs d'erreur ici ou consulte la documentation Docker/Ollama.

---

**Projet fullstack PDF summarizer : Node.js/Express, React, MongoDB, Ollama (LLM local, natif)**
