export default function EmptyState({
  onUpload,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        ✦
      </div>

      <h2>
        Understand research papers faster.
      </h2>

      <p>
        Upload a research paper and ask questions,
        explore concepts, and find the evidence
        behind every answer.
      </p>

      <button
        className="primary-btn"
        onClick={onUpload}
      >
        <span>+</span>
        Upload research paper
      </button>

      <div className="supported">
        PDF files · Local processing · AI-powered
      </div>

      <div className="suggestions">
        <div className="suggestion">
          <strong>Understand concepts</strong>
          <span>
            Explain the proposed architecture
          </span>
        </div>

        <div className="suggestion">
          <strong>Summarize findings</strong>
          <span>
            Summarize the key results
          </span>
        </div>

        <div className="suggestion">
          <strong>Find supporting evidence</strong>
          <span>
            Find experiments that support the claim
          </span>
        </div>
      </div>
    </div>
  );
}