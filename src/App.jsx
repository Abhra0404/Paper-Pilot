import { useRef, useState } from "react";
import { PDFParse } from "pdf-parse";
import { chunkText } from "./services/chunker";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import "./index.css";

PDFParse.setWorker(pdfWorkerUrl);

function App() {
  const [paper, setPaper] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

const handleUpload = async () => {
  setError("");

  if (!window.electronAPI?.selectPDF) {
    fileInputRef.current?.click();
    return;
  }

  const result = await window.electronAPI.selectPDF();

  if (!result) return;

  setPaper(result);
  setLoading(true);

  try {
    const extracted = await window.electronAPI.extractPDFText(
      result.path
    );

    if (!extracted.success) {
      throw new Error(extracted.error);
    }

    setText(extracted.text);

    const chunks = chunkText(extracted.text);

    console.log("Total chunks:", chunks.length);
    console.log("First chunk:", chunks[0]);

  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setPaper({ name: file.name, path: file.name });
    setLoading(true);

    try {
      const parser = new PDFParse({
        data: await file.arrayBuffer(),
      });
      const result = await parser.getText();

      await parser.destroy();
      setText(result.text);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
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

              {loading && (
                <div className="paper-placeholder">
                  <p>Extracting text...</p>
                </div>
              )}

              {error && (
                <div className="paper-placeholder">
                  <p>Extraction failed:</p>
                  <p>{error}</p>
                </div>
              )}

              {!loading && !error && text && (
                <div className="text-viewer">
                  <h3>Extracted Text</h3>
                  <pre>{text}</pre>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;