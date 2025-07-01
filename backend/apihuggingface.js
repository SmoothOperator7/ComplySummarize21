const axios = require("axios");
require("dotenv").config();

const HF_API_URL = process.env.HUGGINGFACE_API_URL;
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

/**
 * Envoie un texte à l'API Hugging Face pour obtenir un résumé structuré, des points clés et des suggestions d'actions.
 * @param {string} text - Le texte extrait du PDF.
 * @returns {Promise<string>} - La réponse générée par le modèle.
 */
async function summarizeWithHuggingFace(text) {
  const prompt = `
Voici un texte extrait d'un PDF.

Ta tâche :
1. Génère d'abord un titre court et pertinent pour ce résumé (commence toujours par la ligne : Titre : ...).
2. Fais-en un résumé structuré, liste les points clés, et propose des suggestions d'actions.
3. Réponds uniquement en français, même si le texte est dans une autre langue. N'utilise jamais l'anglais.
4. Respecte OBLIGATOIREMENT le format suivant, sans rien ajouter ni retirer :

Titre : [un titre court]
Résumé :
- ...
Points clés :
- ...
Suggestions d'actions :
- ...

Exemple :
Texte source :
TD React
Juin 2025
Objectif : Créer une application web pour explorer les Pokémons et gérer des équipes.

Réponse attendue :
Titre : Application React - Pokémons & Équipes
Résumé :
- Ce projet consiste à développer une application React permettant d'explorer les Pokémons et de gérer des équipes.
Points clés :
- Utilisation de l'API PokeAPI
- Gestion des équipes avec JSONPlaceholder
Suggestions d'actions :
- Structurer le projet en deux modules
- Ajouter des fonctionnalités de tri et de pagination

Texte à résumer :
\"\"\"${text}\"\"\"
`;

  try {
    console.log("--- PROMPT ENVOYÉ À HUGGING FACE ---");
    console.log(prompt);

    const response = await axios.post(
      HF_API_URL,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("--- RÉPONSE DE HUGGING FACE ---");
    console.log(response.data);

    let generated =
      response.data[0]?.generated_text || "Aucune réponse du modèle.";
    // Supprime le prompt du début de la réponse si présent
    if (generated.startsWith(prompt)) {
      generated = generated.slice(prompt.length).trim();
    }
    return generated;
  } catch (error) {
    console.error(
      "Erreur lors de l'appel à l'API Hugging Face:",
      error.response?.data || error.message
    );
    throw new Error("Erreur lors de la génération du résumé via Hugging Face.");
  }
}

module.exports = { summarizeWithHuggingFace };
