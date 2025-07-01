import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingDots, setLoadingDots] = useState('');

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
        setSelectedConversation(null);
        fetchHistory();
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
    setSelectedConversation(null);
    const fileInput = document.getElementById('pdf-input');
    if (fileInput) fileInput.value = '';
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/history');
      const data = await res.json();
      if (data.success) setHistory(data.history);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!isUploading) {
      setLoadingDots('');
      return;
    }
    const interval = setInterval(() => {
      setLoadingDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, [isUploading]);

  return (
    <div className="app-container">
      <div className="sidebar">
        <button
          className="upload-btn"
          style={{ width: '100%', marginBottom: '1em', background: '#4f8cff' ,}}
          onClick={resetResults}
        >
          + Nouveau chat
        </button>
        <h2>Conversations</h2>
        <ul>
          {history.map(conv => (
            <li
              key={conv._id}
              onClick={() => {
                setSelectedConversation(conv);
                setExtractedData(null);
                setSelectedFile(null);
                setError(null);
              }}
              className={selectedConversation && selectedConversation._id === conv._id ? 'selected' : ''}
            >
              {conv.createdAt ? new Date(conv.createdAt).toLocaleString() : conv._id}
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        <div className="header">PDF Text Extractor</div>
        {!selectedConversation && (
          <>
            <div className="upload-form">
              <label htmlFor="pdf-input" className="pdf-upload-label">
                <span className="pdf-upload-icon" aria-hidden="true">
                  {/* Icône PDF SVG */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" fill="#4f8cff"/><path d="M8 8h8v2H8V8zm0 4h5v2H8v-2z" fill="#fff"/></svg>
                </span>
                <span className="pdf-upload-text">{selectedFile ? "Changer de fichier PDF" : "Choisir un fichier PDF"}</span>
              </label>
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="custom-file-input"
                style={{ display: 'none' }}
              />
              {selectedFile && !isUploading && (
                <div className="pdf-pill">
                  <span className="pdf-pill-name">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('pdf-input');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="pdf-pill-remove"
                    aria-label="Supprimer le fichier"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              )}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="upload-btn"
              >
                {isUploading ? 'Extraction en cours...' : 'Extraire le texte'}
              </button>
              {isUploading && (
                <>
                  <div className="progress-bar-container">
                    <div className="progress-bar"></div>
                  </div>
                  <div style={{textAlign: 'center', fontSize: '0.95rem', color: '#555'}}>
                    Génération de la réponse par l'IA
                    <span className="loading-dots">{loadingDots}</span>
                  </div>
                </>
              )}
            </div>
            {error && (
              <div className="error">
                ❌ {error}
              </div>
            )}
          </>
        )}
        {selectedConversation ? (
          <div className="result-card">
            <div className="result-header">
              Conversation du {new Date(selectedConversation.createdAt).toLocaleString()}
            </div>
            <pre>{selectedConversation.response}</pre>
          </div>
        ) : (
          extractedData && (
            <div className="result-card">
              <div className="result-header">
                Résultat de l'extraction
                <div className="result-info">
                  📄 {extractedData.filename} • {extractedData.pages} page(s)
                </div>
              </div>
              {extractedData.summary && (
                <>
                  <h3>Résumé structuré, points clés & suggestions</h3>
                  <pre>{extractedData.summary}</pre>
                </>
              )}
              {extractedData.text && (
                <>
                  <h3>Texte brut extrait</h3>
                  <pre>{extractedData.text}</pre>
                </>
              )}
              {!extractedData.summary && !extractedData.text && (
                <div>Aucun résultat trouvé dans ce PDF.</div>
              )}
              <button
                onClick={resetResults}
                className="upload-btn"
                style={{ marginTop: '1rem', background: '#4f8cff' }}
              >
                Extraire un autre PDF
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;