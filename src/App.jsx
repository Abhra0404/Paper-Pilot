import { useRef, useState } from "react";
import { PDFParse } from "pdf-parse";
import { chunkText } from "./services/chunker";
import { indexPaper, queryPaper } from "./services/api";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import "./index.css";

PDFParse.setWorker(pdfWorkerUrl);

function App() {
  const [paper, setPaper] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [asking, setAsking] = useState(false);
  const fileInputRef = useRef(null);

  const indexExtractedText = async (extractedText) => {
    const chunks = chunkText(extractedText);

    if (chunks.length === 0) {
      throw new Error("The PDF does not contain extractable text.");
    }

    await indexPaper(chunks);
  };

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
      const extracted = await window.electronAPI.extractPDFText(result.path);

      if (!extracted.success) {
        throw new Error(extracted.error);
      }

      setText(extracted.text);
      await indexExtractedText(extracted.text);
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

    setError("");
    setPaper({ name: file.name, path: file.name });
    setLoading(true);

    try {
      const parser = new PDFParse({
        data: await file.arrayBuffer(),
      });
      const result = await parser.getText();

      await parser.destroy();
      setText(result.text);
      await indexExtractedText(result.text);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestion = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    setError("");
    setAsking(true);

    try {
      const result = await queryPaper(trimmedQuestion);
      setAnswer(result.answer);
      setSources(result.sources ?? []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail ?? err.message);
    } finally {
      setAsking(false);
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

              {!loading && !error && text && (
                <section className="chat-section">
                  <h3>Ask about this paper</h3>
                  <form className="question-box" onSubmit={handleQuestion}>
                    <input
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="What is the main contribution?"
                      disabled={asking}
                    />
                    <button type="submit" disabled={asking || !question.trim()}>
                      {asking ? "Thinking..." : "Ask"}
                    </button>
                  </form>

                  {answer && (
                    <div className="search-results">
                      <h3>Answer</h3>
                      <p>{answer}</p>
                      {sources.length > 0 && (
                        <>
                          <h4>Sources</h4>
                          {sources.map((source, index) => (
                            <div className="result" key={`${source.score}-${index}`}>
                              <div className="score">
                                Relevance: {source.score.toFixed(3)}
                              </div>
                              <p>{source.text}</p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;