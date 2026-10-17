import { useEffect, useState } from "react";

export default function PdfViewer({ paper }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    if (!paper?.path || !window.electronAPI?.readPDF) return undefined;

    window.electronAPI
      .readPDF(paper.path)
      .then((data) => {
        if (cancelled) return;
        const blob = new Blob([data], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to load PDF preview:", error);
          setHasError(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [paper?.path]);

  if (hasError || !paper?.path || !window.electronAPI?.readPDF) {
    return (
      <div className="pdf-viewer-fallback">
        <div className="placeholder-icon">PDF</div>
        <h3>{paper?.name || "Paper preview"}</h3>
        <p>Preview unavailable. You can still ask questions about the indexed paper.</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-fallback">
        <div className="spinner" />
        <p>Loading PDF preview...</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <iframe
        title={`Preview of ${paper.name}`}
        src={pdfUrl}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
