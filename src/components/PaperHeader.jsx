export default function PaperHeader({
  paper,
  pages,
  status = "Indexed",
}) {
  return (
    <header className="paper-header">
      <div>
        <div className="breadcrumb">
          Library
          <span>/</span>
          Current paper
        </div>

        <h2>{paper?.name}</h2>

        <div className="paper-stats">
          <span>PDF</span>
          <span>•</span>
          <span>{pages || 0} pages</span>
        </div>
      </div>

      <div className={`status status-${status.toLowerCase()}`}>
        <span className="status-dot" />
        {status}
      </div>
    </header>
  );
}