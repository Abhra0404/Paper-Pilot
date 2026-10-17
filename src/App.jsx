import { useState } from "react";

import Chat from "./components/Chat";
import EmptyState from "./components/EmptyState";
import PaperHeader from "./components/PaperHeader";
import PdfViewer from "./components/PdfViewer";
import Sidebar from "./components/Sidebar";
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
  const [paper, setPaper] = useState(null);
  const [pages, setPages] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleUpload = async () => {
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
      setUploadStatus("extracting");
      const pdfData = await window.electronAPI.extractPDFText(file.filePath);

      if (!pdfData.success) {
        throw new Error(pdfData.error || "Failed to extract text from the PDF.");
      }

      const chunks = chunkPages(pdfData.pageTexts || []);
      if (chunks.length === 0) {
        throw new Error("This PDF does not contain extractable text.");
      }

      setUploadStatus("indexing");
      await indexPaper(chunks);

      setPaper({
        name: file.fileName,
        path: file.filePath,
        fileUrl: file.fileUrl,
      });
      setPages(pdfData.pages || pdfData.pageTexts?.length || 0);
      setUploadStatus("completed");
    } catch (uploadError) {
      console.error("Paper upload failed:", uploadError);
      setUploadStatus("idle");
      setError(uploadError.message || "Failed to process the paper.");
    }
  };

  return (
    <div className="app">
      <Sidebar paper={paper} onUpload={handleUpload} disabled={uploadStatus !== "idle" && uploadStatus !== "completed"} />
      <main className="main">
        {paper ? (
          <>
            <PaperHeader paper={paper} pages={pages} />
            <div className="workspace">
              <div className="paper-area">
                <PdfViewer key={paper.path} paper={paper} />
              </div>
              <Chat indexed onQuery={queryPaper} />
            </div>
          </>
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
