import { useRef, useState } from "react";
import "./index.css";

function App() {
  const [paper, setPaper] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (window.electronAPI?.selectPDF) {
      const result = await window.electronAPI.selectPDF();

      if (result) {
        setPaper(result);
      }

      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      setPaper({
        name: file.name,
        path: file.name,
      });
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>PaperPilot</h1>
        <span>AI Research Assistant</span>
      </header>

      <main className="main">
        {!paper ? (
          <section className="upload-container">
            <div className="upload-icon">📄</div>

            <h2>Understand Research Papers with AI</h2>

            <p>
              Upload a research paper and explore it using AI.
            </p>

            <button onClick={handleUpload}>
              Upload PDF
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelected}
              hidden
            />

            <small>PDF files only</small>
          </section>
        ) : (
          <section className="paper-container">
            <aside className="sidebar">
              <h2>My Papers</h2>

              <div className="paper-item">
                📄 {paper.name}
              </div>
            </aside>

            <div className="paper-content">
              <h2>{paper.name}</h2>

              <div className="paper-placeholder">
                <p>PDF uploaded successfully.</p>

                <button>
                  Ask AI about this paper
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;