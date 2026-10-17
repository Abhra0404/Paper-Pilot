export default function PaperHeader({
  paper,
  pages,
  status = "Indexed",
  onBack,
}) {
  return (
    <header className="paper-header">
      <button className="back-button" type="button" onClick={onBack}>
        ←
      </button>
      <div>
        <div className="breadcrumb">
          <button type="button" onClick={onBack}>Library</button>
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

      <div className="paper-header-actions">
        <div className={`status status-${status.toLowerCase()}`}>
          <span className="status-dot" />
          {status}
        </div>
      </div>
    </header>
  );
}