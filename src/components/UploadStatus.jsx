const statusCopy = {
  selecting: ["Choose a paper", "Select a PDF from your computer..."],
  extracting: ["Reading paper", "Extracting text from the PDF..."],
  indexing: ["Indexing paper", "Building a semantic index for your paper..."],
};

export default function UploadStatus({ status }) {
  if (!status || status === "idle" || status === "completed") return null;

  const [title, detail] = statusCopy[status] || statusCopy.indexing;

  return (
    <div className="processing" role="status" aria-live="polite">
      <div className="spinner" />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
