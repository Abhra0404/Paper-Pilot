import { useEffect, useRef, useState } from "react";

import Message from "./Message";

export default function Chat({ indexed, onQuery }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Upload and index a paper, then ask me about its concepts, methods, or findings.",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const submitQuestion = async (value, retryId) => {
    const trimmedQuestion = value.trim();
    if (!trimmedQuestion || isSubmitting || !indexed) return;

    setIsSubmitting(true);
    setQuestion("");
    setMessages((current) => {
      const withoutRetry = retryId
        ? current.filter((message) => message.id !== retryId)
        : current;
      return [
        ...withoutRetry,
        ...(retryId ? [] : [{ id: crypto.randomUUID(), role: "user", content: trimmedQuestion }]),
      ];
    });

    try {
      const response = await onQuery(trimmedQuestion);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer || "The service returned an empty answer.",
          sources: response.sources,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error.message || "Unable to answer that question.",
          error: true,
          question: trimmedQuestion,
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitQuestion(question);
  };

  return (
    <section className="chat-panel">
      <div className="chat-heading">
        <div>
          <span className="eyebrow">Research assistant</span>
          <h3>Ask about this paper</h3>
        </div>
        <span className={`index-badge ${indexed ? "ready" : ""}`}>
          {indexed ? "Ready" : "Index required"}
        </span>
      </div>

      <div className="messages" aria-live="polite">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onRetry={(retryQuestion) => submitQuestion(retryQuestion, message.id)}
          />
        ))}
        {isSubmitting && (
          <div className="typing-indicator" aria-label="PaperPilot is thinking">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
          placeholder={indexed ? "Ask a question about the paper..." : "Index a paper to start asking questions"}
          disabled={!indexed || isSubmitting}
          rows={2}
        />
        <button
          className="send-button"
          type="submit"
          disabled={!indexed || !question.trim() || isSubmitting}
        >
          {isSubmitting ? "..." : "Send"}
        </button>
      </form>
      <p className="chat-hint">Enter to send · Shift + Enter for a new line</p>
    </section>
  );
}
