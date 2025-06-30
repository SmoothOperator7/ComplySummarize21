import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

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
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="file-input"
              />
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
                {isUploading ? 'Extraction en cours...' : 'Extraire le texte'}
              </button>
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
                style={{ marginTop: '1rem', background: '#6c757d' }}
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