import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Veuillez sélectionner un fichier PDF valide.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('Le fichier est trop volumineux (maximum 10MB).');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setExtractedData(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier PDF.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setExtractedData(data);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('pdf-input');
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.message || 'Erreur lors de l\'extraction du texte.');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur. Assurez-vous que le backend est démarré.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetResults = () => {
    setExtractedData(null);
    setError(null);
    setSelectedFile(null);
    const fileInput = document.getElementById('pdf-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">PDF Text Extractor</h1>
        <p className="subtitle">
          Uploadez un fichier PDF pour extraire automatiquement son contenu textuel
        </p>

        <div className="upload-form">
          <div className="file-input-wrapper">
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>

          {selectedFile && (
            <div className="success">
              ✅ Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="upload-btn"
          >
            {isUploading ? (
              <div className="loading">
                <div className="spinner"></div>
                Extraction en cours...
              </div>
            ) : (
              'Extraire le texte'
            )}
          </button>
        </div>

        {error && (
          <div className="error">
            ❌ {error}
          </div>
        )}
      </div>

      {extractedData && (
        <div className="card">
          <div className="result-card">
            <div className="result-header">
              <h2 className="result-title">Résultat de l'extraction</h2>
              <div className="result-info">
                📄 {extractedData.filename} • {extractedData.pages} page(s)
              </div>
            </div>

            {extractedData.summary && (
              <>
                <h3>Résumé structuré, points clés & suggestions</h3>
                <pre style={{whiteSpace: 'pre-wrap', background: '#f8f9fa', padding: '1em', borderRadius: '6px'}}>{extractedData.summary}</pre>
              </>
            )}

            {extractedData.text && (
              <>
                <h3>Texte brut extrait</h3>
                <pre style={{whiteSpace: 'pre-wrap', background: '#f1f3f4', padding: '1em', borderRadius: '6px'}}>{extractedData.text}</pre>
              </>
            )}

            {!extractedData.summary && !extractedData.text && (
              <div>Aucun résultat trouvé dans ce PDF.</div>
            )}

            <button
              onClick={resetResults}
              className="upload-btn"
              style={{ marginTop: '1rem', background: '#6c757d' }}
            >
              Extraire un autre PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;