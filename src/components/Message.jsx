import SourceCard from "./SourceCard";
import MarkdownContent from "./MarkdownContent";

export default function Message({ message, onRetry }) {
  const isUser = message.role === "user";
  const sources = Array.isArray(message.sources) ? message.sources : [];

  return (
    <article className={`message message-${message.role}`}>
      <div className="message-label">{isUser ? "You" : "PaperPilot"}</div>
      <div className="message-content">
        <MarkdownContent>{message.content}</MarkdownContent>
      </div>
      {!isUser && sources.length > 0 && (
        <details className="sources">
          <summary className="sources-heading">
            <span>Sources</span>
            <span className="sources-count">{sources.length}</span>
          </summary>
          <div className="source-list">
            {sources.map((source, index) => (
              <SourceCard
                key={`${source.page_number ?? "source"}-${index}`}
                source={source}
              />
            ))}
          </div>
        </details>
      )}
      {message.error && (
        <button className="retry-button" type="button" onClick={() => onRetry(message.question)}>
          Try again
        </button>
      )}
    </article>
  );
}
