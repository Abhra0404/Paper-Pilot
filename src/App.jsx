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
  const [messages, setMessages] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);

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
  const handleAsk = async () => {
  if (!question.trim() || queryLoading) {
    return;
  }

  const userQuestion = question.trim();

  setQuestion("");

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      content: userQuestion,
    },
  ]);

  setQueryLoading(true);

  try {
    const data = await queryPaper(userQuestion);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
      },
    ]);
  } catch (error) {
    console.error("Query failed:", error);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Sorry, I couldn't process that question.",
      },
    ]);
  } finally {
    setQueryLoading(false);
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

  <div className="paper-header">
    <div>
      <h2>{paper.name}</h2>
      <p>AI-powered research assistant</p>
    </div>
  </div>

  <div className="chat-container">

    <div className="messages">

      {messages.length === 0 && (
        <div className="welcome">
          <div className="welcome-icon">
            📚
          </div>

          <h2>Ask about this paper</h2>

          <p>
            Ask questions about the research,
            methodology, results, or conclusions.
          </p>

          <div className="suggestions">

            <button
              onClick={() =>
                setQuestion(
                  "What is the main contribution of this paper?"
                )
              }
            >
              What is the main contribution?
            </button>

            <button
              onClick={() =>
                setQuestion(
                  "What methodology does the paper use?"
                )
              }
            >
              Explain the methodology
            </button>

            <button
              onClick={() =>
                setQuestion(
                  "What are the main results?"
                )
              }
            >
              What are the main results?
            </button>

          </div>
        </div>
      )}

      {messages.map((message, index) => (

        <div
          key={index}
          className={`message ${message.role}`}
        >

          <div className="message-label">
            {message.role === "user"
              ? "You"
              : "PaperPilot"}
          </div>

          <div className="message-content">
            {message.content}
          </div>

          {message.role === "assistant" &&
            message.sources?.length > 0 && (

              <div className="sources">

                <div className="sources-title">
                  Sources
                </div>

                {message.sources.map(
                  (source, sourceIndex) => (

                    <div
                      key={sourceIndex}
                      className="source"
                    >
                      <span>
                        Source {sourceIndex + 1}
                      </span>

                      <p>
                        {source.text}
                      </p>

                      <small>
                        Relevance:{" "}
                        {source.score.toFixed(3)}
                      </small>
                    </div>

                  )
                )}

              </div>

            )}

        </div>

      ))}

      {queryLoading && (

        <div className="message assistant">

          <div className="message-label">
            PaperPilot
          </div>

          <div className="message-content">
            Thinking...
          </div>

        </div>

      )}

    </div>

    <div className="chat-input-container">

      <input
        type="text"
        placeholder="Ask anything about this paper..."
        value={question}
        onChange={(e) =>
          setQuestion(e.target.value)
        }
        onKeyDown={(e) => {

          if (e.key === "Enter") {
            handleAsk();
          }

        }}
      />

      <button
        onClick={handleAsk}
        disabled={queryLoading}
      >
        {queryLoading ? "..." : "Send"}
      </button>

    </div>

  </div>

</div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;