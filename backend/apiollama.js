const axios = require('axios');

/**
 * Envoie un prompt à Ollama (modèle local) et récupère la réponse.
 * @param {string} prompt - Le prompt à envoyer au modèle.
 * @returns {Promise<string>} - La réponse générée.
 */
async function summarizeWithOllama(prompt) {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
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