import { useState } from "react";

import Sidebar from "./components/Sidebar";
import EmptyState from "./components/EmptyState";
import PaperHeader from "./components/PaperHeader";

import { chunkPages } from "./services/chunker";
import { indexPaper } from "./services/api";

function App() {
  const [paper, setPaper] = useState(null);
  const [pages, setPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    try {
      setError("");
      setLoading(true);

      const result =
        await window.electronAPI.selectPDF();

      if (!result) {
        setLoading(false);
        return;
      }

      const pdfData =
        await window.electronAPI.extractPDFText(
          result
        );

      if (!pdfData.success) {
        throw new Error(pdfData.error);
      }

      const chunks = chunkPages(
        pdfData.pageTexts
      );

      console.log(
        "Created chunks:",
        chunks
      );

      await indexPaper(chunks);

      setPaper({
        name: result.split("/").pop(),
        path: result,
      });

      setPages(pdfData.pages);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Failed to process the paper."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        paper={paper}
        onUpload={handleUpload}
      />

      <main className="main">
        {paper ? (
          <>
            <PaperHeader
              paper={paper}
              pages={pages}
            />

            <div className="workspace">
              <div className="paper-placeholder">
                <div className="placeholder-icon">
                  PDF
                </div>

                <h3>
                  {paper.name}
                </h3>

                <p>
                  Your paper has been indexed
                  successfully.
                </p>

                <span>
                  PDF viewer coming next
                </span>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            onUpload={handleUpload}
          />
        )}

        {loading && (
          <div className="processing">
            <div className="spinner" />

            <div>
              <strong>
                Processing paper
              </strong>

              <span>
                Extracting text and building
                semantic index...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="error-toast">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;