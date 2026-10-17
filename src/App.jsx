import { useCallback, useEffect, useState } from "react";

import Chat from "./components/Chat";
import EmptyState from "./components/EmptyState";
import Home from "./components/Home";
import PaperHeader from "./components/PaperHeader";
import PdfViewer from "./components/PdfViewer";
import UploadStatus from "./components/UploadStatus";
import { chunkPages } from "./services/chunker";
import { indexPaper, queryPaper } from "./services/api";

function getSelectedFile(result) {
  if (typeof result === "string") {
    return {
      filePath: result,
      fileName: result.split(/[\\/]/).pop(),
    };
  }

  if (result && typeof result.filePath === "string") {
    return {
      filePath: result.filePath,
      fileName: result.fileName || result.filePath.split(/[\\/]/).pop(),
      fileUrl: result.fileUrl,
    };
  }

  throw new Error("The selected PDF did not include a valid file path.");
}

function App() {
  const [papers, setPapers] = useState([]);
  const [paper, setPaper] = useState(null);
  const [conversations, setConversations] = useState({});
  const [view, setView] = useState("home");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    window.electronAPI?.loadLibrary()
      .then((storedPapers) => {
        setPapers(storedPapers);
        setPaper(null);
      })
      .catch((loadError) => {
        console.error("Paper library loading failed:", loadError);
        setError(loadError.message || "Unable to load the paper library.");
      });
  }, []);

  const savePapers = async (nextPapers) => {
    await window.electronAPI.saveLibrary(nextPapers);
    setPapers(nextPapers);
  };

  const handleSelectPaper = (selectedPaper) => {
    const openedPaper = { ...selectedPaper, lastOpenedAt: new Date().toISOString() };
    setPaper(openedPaper);
    setView("workspace");
    savePapers(papers.map((item) => item.id === openedPaper.id ? openedPaper : item))
      .catch((saveError) => console.error("Paper timestamp update failed:", saveError));
    setError("");
  };

  const handleMessagesChange = useCallback((messages) => {
    if (!paper) return;
    setConversations((current) => ({ ...current, [paper.id]: messages }));
  }, [paper]);

  const handleUpload = async () => {
    let storedPath = "";
    try {
      setError("");
      setUploadStatus("selecting");

      if (!window.electronAPI?.selectPDF) {
        throw new Error("The Electron file picker is unavailable.");
      }

      const selection = await window.electronAPI.selectPDF();
      if (!selection) {
        setUploadStatus("idle");
        return;
      }

      const file = getSelectedFile(selection);
      const existingPaper = papers.find(
        (item) => item.sourcePath === file.filePath || item.path === file.filePath
      );
      if (existingPaper) {
        handleSelectPaper(existingPaper);
        setUploadStatus("completed");
        return;
      }
      if (papers.length >= 10) {
        setError("Your library is full. Remove a paper before adding another.");
        setUploadStatus("idle");
        return;
      }

      const paperId = crypto.randomUUID();
      setUploadStatus("extracting");
      storedPath = await window.electronAPI.storePDF(
        file.filePath,
        paperId,
        file.fileName
      );
      const pdfData = await window.electronAPI.extractPDFText(storedPath);

      if (!pdfData.success) {
        throw new Error(pdfData.error || "Failed to extract text from the PDF.");
      }

      const chunks = chunkPages(pdfData.pageTexts || []);
      if (chunks.length === 0) {
        throw new Error("This PDF does not contain extractable text.");
      }

      setUploadStatus("indexing");
      const nextPaper = {
        id: paperId,
        name: file.fileName,
        path: storedPath,
        sourcePath: file.filePath,
        pages: pdfData.pages || pdfData.pageTexts?.length || 0,
        indexed: true,
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };
      await indexPaper(nextPaper.id, chunks);
      const nextPapers = [nextPaper, ...papers].slice(0, 10);
      await savePapers(nextPapers);
      setPaper(nextPaper);
      setView("workspace");
      setUploadStatus("completed");
    } catch (uploadError) {
      console.error("Paper upload failed:", uploadError);
      if (storedPath) {
        await window.electronAPI.deleteStoredPDF(storedPath).catch((cleanupError) => {
          console.error("Stored PDF cleanup failed:", cleanupError);
        });
      }
      setUploadStatus("idle");
      setError(uploadError.message || "Failed to process the paper.");
    }
  };

  const handleRemovePaper = async (paperToRemove) => {
    if (!window.confirm(`Remove "${paperToRemove.name}" from your library?`)) return;
    const nextPapers = papers.filter((item) => item.id !== paperToRemove.id);
    try {
      if (paperToRemove.path && paperToRemove.path !== paperToRemove.sourcePath) {
        await window.electronAPI.deleteStoredPDF(paperToRemove.path);
      }
      await savePapers(nextPapers);
      if (paper?.id === paperToRemove.id) {
        setPaper(null);
        setView("home");
      }
    } catch (removeError) {
      console.error("Paper removal failed:", removeError);
      setError(removeError.message || "Unable to remove the paper.");
    }
  };

  return (
    <div className="app">
      <main className="main">
        {view === "workspace" && paper ? (
          <>
            <PaperHeader paper={paper} pages={paper.pages} onBack={() => {
              setView("home");
              setPaper(null);
            }} />
            <div className="workspace">
              <div className="paper-area">
                <PdfViewer key={paper.path} paper={paper} />
              </div>
              <Chat
                key={paper.id}
                indexed={paper.indexed}
                onQuery={(question) => queryPaper(paper.id, question)}
                initialMessages={conversations[paper.id]}
                onMessagesChange={handleMessagesChange}
                onBack={() => {
                  setView("home");
                  setPaper(null);
                }}
              />
            </div>
          </>
        ) : view === "home" ? (
          <Home
            papers={papers}
            onUpload={handleUpload}
            onOpen={handleSelectPaper}
            onRemove={handleRemovePaper}
            disabled={uploadStatus !== "idle" && uploadStatus !== "completed"}
            processing={uploadStatus !== "idle" && uploadStatus !== "completed"}
          />
        ) : (
          <EmptyState onUpload={handleUpload} />
        )}

        <UploadStatus status={uploadStatus} />
        {error && (
          <div className="error-toast" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">Dismiss</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
