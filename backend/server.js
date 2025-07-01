const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { summarizeWithOllama } = require('./apiollama');
const mongoose = require('mongoose');
const ApiResponse = require('./models/ApiResponse');
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
      summary = await summarizeWithOllama(pdfData.text);
    } catch (err) {
      summary = 'Erreur lors de la génération du résumé via Ollama.';
    }
    
    // Enregistrer la réponse dans MongoDB
    try {
      await ApiResponse.create({ response: summary });
      console.log('Réponse enregistrée en base');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement en base:', err);
    }
    
    // Retourner la réponse structurée au frontend
    res.json({
      success: true,
      filename: req.file.originalname,
      summary,
      pages: pdfData.numpages,
      info: pdfData.info
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
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'historique' });
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