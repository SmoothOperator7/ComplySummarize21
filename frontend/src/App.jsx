import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingDots, setLoadingDots] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

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
        // Rafraîchir l'historique et sélectionner la nouvelle conversation
        fetchHistory().then(() => {
          setTimeout(() => {
            setHistory(prevHistory => {
              let conv = null;
              if (data.id || data._id) {
                conv = prevHistory.find(c => c._id === (data.id || data._id));
              }
              if (!conv && prevHistory.length > 0) {
                conv = prevHistory[0]; // la plus récente
              }
              if (conv) setSelectedConversation(conv);
              return prevHistory;
            });
          }, 200); // petit délai pour laisser le temps à fetchHistory
        });
        setError(null);
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

  // Fonction utilitaire pour générer le PDF
  function downloadPdfFromText(text, filename = null) {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(text, 180);
    doc.setFontSize(14);
    doc.text(lines, 15, 20);
    const date = new Date().toISOString().slice(0, 10);
    doc.save(filename || `resume-${date}.pdf`);
  }

  // Ajoute une fonction pour supprimer une conversation
  const handleDeleteConversation = async (convId) => {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    try {
      await fetch(`${API_BASE_URL}/history/${convId}`, { method: 'DELETE' });
      fetchHistory();
      if (selectedConversation && selectedConversation._id === convId) {
        setSelectedConversation(null);
      }
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  // Ajoute une fonction pour renommer une conversation
  const handleRenameConversation = async (convId) => {
    try {
      await fetch(`${API_BASE_URL}/history/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue })
      });
      setRenamingId(null);
      setRenameValue("");
      fetchHistory();
    } catch (err) {
      alert("Erreur lors du renommage.");
    }
  };

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
              style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'row-reverse', justifyContent: 'space-between' }}
              className={selectedConversation && selectedConversation._id === conv._id ? 'selected' : ''}
            >
              {/* 3 petits points à droite */}
              <span
                className="sidebar-menu-btn"
                tabIndex={0}
                onClick={e => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === conv._id ? null : conv._id);
                }}
                onBlur={() => setTimeout(() => setOpenMenuId(null), 200)}
                style={{ marginLeft: '0.5em', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Options"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="#888"/><circle cx="12" cy="12" r="1.5" fill="#888"/><circle cx="12" cy="19" r="1.5" fill="#888"/></svg>
              </span>
              {/* Menu contextuel avec icônes */}
              {openMenuId === conv._id && (
                <div className="sidebar-menu-popup">
                  <button className="sidebar-menu-item" onClick={() => { setRenamingId(conv._id); setRenameValue(conv.name || ''); setOpenMenuId(null); }}>
                    <span className="sidebar-menu-action-icon" aria-hidden="true">
                      {/* Icône crayon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 20h4.586a1 1 0 0 0 .707-.293l9.414-9.414a2 2 0 0 0 0-2.828l-2.172-2.172a2 2 0 0 0-2.828 0L4.293 14.707A1 1 0 0 0 4 15.414V20z" stroke="#000000" strokeWidth="1.5" fill="none"/><path d="M14.5 7.5l2 2" stroke="#000000" strokeWidth="1.5"/></svg>
                    </span>
                    Renommer
                  </button>
                  <button className="sidebar-menu-item" onClick={() => { downloadPdfFromText(conv.response, `resume-${new Date(conv.createdAt).toISOString().slice(0,10)}.pdf`); setOpenMenuId(null); }}>
                    <span className="sidebar-menu-action-icon" aria-hidden="true">
                      {/* Icône download */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-5-5m5 5l5-5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="19" width="18" height="2" rx="1" fill="#000000"/></svg>
                    </span>
                    Télécharger
                  </button>
                  <button className="sidebar-menu-item" onClick={() => { handleDeleteConversation(conv._id); setOpenMenuId(null); }}>
                    <span className="sidebar-menu-action-icon" aria-hidden="true">
                      {/* Icône poubelle moderne */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V6M4 6h16M5 6v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6M10 11v6M14 11v6" stroke="#c33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    Supprimer
                  </button>
                </div>
              )}
              {/* Renommage inline */}
              {renamingId === conv._id ? (
                <form style={{ flex: 1, display: 'flex', alignItems: 'center' }} onSubmit={e => { e.preventDefault(); handleRenameConversation(conv._id); }}>
                  <input
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    autoFocus
                    style={{ flex: 1, fontSize: '1em', padding: '0.2em 0.5em', borderRadius: 4, border: '1px solid #bbb', marginRight: 4 }}
                    onBlur={() => setRenamingId(null)}
                  />
                  <button type="submit" style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 4, padding: '0.2em 0.7em', cursor: 'pointer' }}>OK</button>
                </form>
              ) : (
                <span
                  onClick={() => {
                    setSelectedConversation(conv);
                    setExtractedData(null);
                    setSelectedFile(null);
                    setError(null);
                  }}
                  style={{ flex: 1, cursor: 'pointer', padding: '0.2em 0' }}
                >
                  {conv.name || (conv.createdAt ? new Date(conv.createdAt).toLocaleString() : conv._id)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        {!selectedConversation && (
          <>
            <div className="header">PDF résumé par IA</div>
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
              <div className="pdf-upload-limit">
                Limite : 10 Mo maximum par PDF
              </div>
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
                title={!selectedFile ? "Veuillez ajouter un PDF pour générer le résumé du pdf" : ""}
              >
                {isUploading
                  ? <>Génération du résumé en cours{loadingDots}</>
                  : 'Générer le résumé'}
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
            {(selectedConversation.filename || selectedConversation.pages) && (
              <div className="result-info">
                {selectedConversation.filename && (
                  <span>📄 {selectedConversation.filename}</span>
                )}
                {selectedConversation.pages && (
                  <span style={{marginLeft: selectedConversation.filename ? '0.7em' : 0}}>
                    • {selectedConversation.pages} page{selectedConversation.pages > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
            <pre>{selectedConversation.response}</pre>
            <button
              className="pdf-download-btn"
              onClick={() => downloadPdfFromText(selectedConversation.response, `resume-${new Date(selectedConversation.createdAt).toISOString().slice(0,10)}.pdf`)}
              style={{marginTop: '1em'}}
            >
              <span className="pdf-download-icon" aria-hidden="true" style={{marginRight: '0.5em', verticalAlign: 'middle'}}>
                {/* Icône download */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-5-5m5 5l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="19" width="18" height="2" rx="1" fill="#fff"/></svg>
              </span>
              Télécharger le résumé en PDF
            </button>
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
                  <button
                    className="pdf-download-btn"
                    onClick={() => downloadPdfFromText(extractedData.summary)}
                    style={{marginTop: '1em'}}
                  >
                    <span className="pdf-download-icon" aria-hidden="true" style={{marginRight: '0.5em', verticalAlign: 'middle'}}>
                      {/* Icône download */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-5-5m5 5l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="19" width="18" height="2" rx="1" fill="#fff"/></svg>
                    </span>
                    <span className="pdf-download-icon" aria-hidden="true" style={{marginRight: '0.5em', verticalAlign: 'middle'}}>
                      {/* Icône PDF */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" fill="#4f8cff"/><path d="M8 8h8v2H8v-2z" fill="#fff"/></svg>
                    </span>
                    Télécharger le résumé en PDF
                  </button>
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