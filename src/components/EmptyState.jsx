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
          <strong>Ask questions</strong>
          <span>
            "What is the main contribution?"
          </span>
        </div>

        <div className="suggestion">
          <strong>Understand concepts</strong>
          <span>
            "Explain the proposed architecture"
          </span>
        </div>

        <div className="suggestion">
          <strong>Find evidence</strong>
          <span>
            "What experiments support the claim?"
          </span>
        </div>
      </div>
    </div>
  );
}