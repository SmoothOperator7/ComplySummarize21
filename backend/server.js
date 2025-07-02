require('dotenv').config();

const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { summarizeWithOllama } = require('./apiollama');
const mongoose = require('mongoose');
const ApiResponse = require('./models/ApiResponse');
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : null;
const ALGORITHM = 'aes-256-cbc';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

function encrypt(text) {
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY non définie dans les variables d\'environnement');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY non définie dans les variables d\'environnement');
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Route pour l'upload et l'extraction de texte PDF
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier PDF fourni'
      });
    }

    const filePath = req.file.path;
    
    // Lire le fichier PDF
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Extraire le texte du PDF
    const pdfData = await pdfParse(pdfBuffer);
    
    // Supprimer le fichier temporaire après extraction
    fs.unlinkSync(filePath);
    
    // Appeler Ollama pour résumé structuré, points clés, suggestions d'actions
    let summary = '';
    try {
      // Construire un prompt structuré qui demande aussi un titre
      const prompt = `
Lis le texte ci-dessous et produis une réponse structurée en quatre parties distinctes, en français uniquement :
1. Titre du document (une phrase courte et descriptive)
2. Résumé (3 à 5 phrases)
3. Points clés (liste à puces)
4. Suggestions d'action (liste à puces)
Respecte strictement ce format et n'ajoute rien d'autre.

Texte :
${pdfData.text}
`;

      console.log('Prompt envoyé à Ollama :\n', prompt);
      console.log('Envoi à Ollama...');
      summary = await summarizeWithOllama(prompt);
      console.log('Résumé reçu d\'Ollama :', summary);
    } catch (err) {
      console.error('Erreur lors de la génération du résumé via Ollama:', err);
      summary = 'Erreur lors de la génération du résumé via Ollama.';
    }
    
    // Extraire le titre généré par l'IA (tolère '1. Titre du document :', 'Titre :', etc.)
    let titre = `Résumé : ${req.file.originalname}`;
    const titreRegex = /^ *(\d+\.)? *Titre( du document)? *: *(.+)/im;
    const titreMatch = summary.match(titreRegex);
    if (titreMatch) {
      titre = titreMatch[3].trim();
    } else {
      // Sinon, prend la première ligne non vide et courte (<100 caractères)
      const nonEmptyLines = summary.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (nonEmptyLines.length > 0) {
        // Prend les deux premières lignes non vides
        titre = nonEmptyLines.slice(0, 2).join(' ');
      }
    }
    
    // Chiffrer la réponse avant stockage
    let encryptedSummary = '';
    try {
      encryptedSummary = encrypt(summary);
    } catch (e) {
      console.error('Erreur de chiffrement :', e);
      return res.status(500).json({ success: false, message: 'Erreur de chiffrement des données.' });
    }
    
    // Enregistrer la réponse dans MongoDB
    try {
      await ApiResponse.create({
        response: encryptedSummary,
        filename: req.file.originalname,
        pages: pdfData.numpages,
        info: pdfData.info,
        name: titre // Utilise le titre généré par l'IA
      });
      console.log('Réponse enregistrée en base');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement en base:', err);
    }
    
    // Retourner la réponse structurée au frontend
    res.json({
      success: true,
      filename: req.file.originalname,
      summary: summary, // déjà en clair ici
      pages: pdfData.numpages,
      info: pdfData.info,
      name: titre // Retourne aussi le titre généré
    });

  } catch (error) {
    console.error('Erreur lors de l\'extraction du PDF:', error);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'extraction du texte du PDF',
      error: error.message
    });
  }
});

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'API PDF Text Extractor - Backend en fonctionnement',
    endpoints: {
      upload: 'POST /upload - Upload et extraction de texte PDF'
    }
  });
});

// Gestion des erreurs multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux (max 10MB)'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message
  });
});

app.get('/history', async (req, res) => {
  try {
    const history = await ApiResponse.find().sort({ createdAt: -1 }).limit(50);
    // Déchiffrer les réponses
    const historyDecrypted = history.map(item => ({
      ...item.toObject(),
      response: (() => { try { return decrypt(item.response); } catch { return '[Erreur de déchiffrement]'; } })()
    }));
    res.json({ success: true, history: historyDecrypted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'historique' });
  }
});

// Route pour renommer une conversation
app.patch('/history/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nom invalide.' });
    }
    const updated = await ApiResponse.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Conversation non trouvée.' });
    }
    res.json({ success: true, conversation: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors du renommage.' });
  }
});

// Suppression d'une conversation
app.delete('/history/:id', async (req, res) => {
  try {
    await ApiResponse.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression.' });
  }
});

mongoose.connect('mongodb://localhost:27017/apocalypse', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connecté à MongoDB'))
.catch(err => console.error('Erreur MongoDB:', err));

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📁 Dossier uploads: ${uploadsDir}`);
});