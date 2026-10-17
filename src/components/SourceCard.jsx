import { useState } from "react";

const EXCERPT_LIMIT = 220;

export default function SourceCard({ source }) {
  const [expanded, setExpanded] = useState(false);
  const text = typeof source?.text === "string" ? source.text.trim() : "";
  const isLong = text.length > EXCERPT_LIMIT;
  const pageNumber = source?.page_number ?? source?.pageNumber;
  const score =
    typeof source?.score === "number" ? `${Math.round(source.score * 100)}% match` : null;

  return (
    <article className="source-card">
      <div className="source-card-header">
        <span>Source</span>
        <div className="source-meta">
          {pageNumber != null && <span>Page {pageNumber}</span>}
          {score && <span>{score}</span>}
        </div>
      </div>
      {text ? (
        <p className={expanded || !isLong ? "" : "source-excerpt-collapsed"}>
          {text}
        </p>
      ) : (
        <p className="source-unavailable">No excerpt returned.</p>
      )}
      {isLong && (
        <button
          className="source-toggle"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </article>
  );
}
