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
Lis le texte ci-dessous et produis une réponse structurée en trois parties distinctes, en français uniquement :
1. Résumé (3 à 5 phrases)
2. Points clés (liste à puces)
3. Suggestions d'action (liste à puces)
Respecte strictement ce format et n'ajoute rien d'autre.

Texte :
${text}
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
