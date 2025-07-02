const axios = require('axios');

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://ollama:11434';

/**
 * Envoie un prompt à Ollama (modèle local) et récupère la réponse.
 * @param {string} prompt - Le prompt à envoyer au modèle.
 * @returns {Promise<string>} - La réponse générée.
 */
async function summarizeWithOllama(prompt) {
  try {
    const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
      model: 'openchat',
      prompt: prompt,
      stream: false
    });
    return response.data.response;
  } catch (error) {
    console.error('Erreur lors de l\'appel à Ollama:', error.response?.data || error.message);
    throw new Error('Erreur lors de la génération du résumé via Ollama.');
  }
}

module.exports = { summarizeWithOllama };