export default function Sidebar({
  paper,
  onUpload,
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
      </div>

      <div className="sidebar-section">
        <div className="section-label">
          LIBRARY
        </div>

        {paper ? (
          <div className="paper-item active">
            <div className="paper-icon">PDF</div>

            <div className="paper-info">
              <div className="paper-name">
                {paper.name}
              </div>

              <div className="paper-meta">
                Current paper
              </div>
            </div>
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