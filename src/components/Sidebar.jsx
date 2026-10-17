export default function Sidebar({
  papers = [],
  selectedPaper,
  onSelect,
  onRemove,
  onUpload,
  onHome,
  isHome,
  disabled = false,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-icon">P</div>

          <div>
            <h1>PaperPilot</h1>
            <span>AI Research Assistant</span>
          </div>
        </div>

        <button
          className="new-paper-btn"
          onClick={onUpload}
          disabled={disabled}
        >
          <span>+</span>
          Add paper
        </button>
        <button className={`home-nav ${isHome ? "active" : ""}`} type="button" onClick={onHome}>
          <span>⌂</span>
          Home
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-label">
          <span>LIBRARY</span>
          <span>{papers.length}/10</span>
        </div>

        {papers.length > 0 ? (
          <div className="paper-list">
            {papers.map((paper) => (
              <div
                className={`paper-item ${selectedPaper?.id === paper.id ? "active" : ""}`}
                key={paper.id}
                onClick={() => onSelect(paper)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelect(paper);
                }}
              >
                <div className="paper-icon">PDF</div>
                <div className="paper-info">
                  <div className="paper-name">{paper.name}</div>
                  <div className="paper-meta">{paper.pages || 0} pages</div>
                </div>
                <button
                  className="remove-paper"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(paper);
                  }}
                  aria-label={`Remove ${paper.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-library">
            <span>No papers yet</span>
            <small>
              Add a research paper to get started
            </small>
          </div>
        )}
      </div>

      <div className="sidebar-bottom" />
    </aside>
  );
}