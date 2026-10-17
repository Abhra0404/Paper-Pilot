import { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Not opened yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not opened yet";
  return `Opened ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function Home({ papers, onUpload, onOpen, onRemove, disabled, processing }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("lastOpened");
  const [layout, setLayout] = useState("grid");
  const [section, setSection] = useState("home");
  const filteredPapers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchingPapers = query
      ? papers.filter((paper) => paper.name.toLowerCase().includes(query))
      : papers;
    return [...matchingPapers].sort((left, right) => {
      if (sortBy === "name") return left.name.localeCompare(right.name);
      if (sortBy === "pages") return (right.pages || 0) - (left.pages || 0);
      return new Date(right.lastOpenedAt || right.createdAt || 0) - new Date(left.lastOpenedAt || left.createdAt || 0);
    });
  }, [papers, search, sortBy]);
  const recentPaper = [...papers]
    .filter((paper) => paper.lastOpenedAt)
    .sort((left, right) => new Date(right.lastOpenedAt) - new Date(left.lastOpenedAt))[0];
  const totalPages = papers.reduce((total, paper) => total + (paper.pages || 0), 0);
  const scrollToLibrary = () => {
    setSection("all");
    document.querySelector(".library-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-page">
      <aside className="home-sidebar">
        <div className="home-brand">
          <img className="brand-icon" src="/paperpilot-icon.png" alt="" aria-hidden="true" />
          <div><strong>PaperPilot</strong><span>Research library</span></div>
        </div>
        <nav className="home-nav-list" aria-label="Primary navigation">
          <button className={`home-nav-item ${section === "home" ? "active" : ""}`} type="button" onClick={() => { setSection("home"); document.querySelector(".home-content")?.scrollTo({ top: 0, behavior: "smooth" }); }}><span>⌂</span> Home</button>
          <button className={`home-nav-item ${section === "all" ? "active" : ""}`} type="button" onClick={scrollToLibrary}><span>▤</span> All papers</button>
        </nav>
        <div className="home-storage">
          <div><span className="status-dot" /> Stored locally</div>
          <div className="storage-bar"><span style={{ width: `${Math.min(papers.length * 10, 100)}%` }} /></div>
          <small>{papers.length} papers · {totalPages} pages</small>
        </div>
      </aside>

      <div className="home-content">
        <div className="home-topbar">
          <label className="global-search">
            <span>⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search papers, topics, or keywords..." aria-label="Search papers, topics, or keywords" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="home-bar-status"><span className="status-dot" /> Stored locally</div>
        </div>

        <main className="home-main">
          <header className="home-header">
            <div className="hero-copy">
              <span className="eyebrow">Research library</span>
              <h2>Read less.<br />Understand more.</h2>
              <p>Keep your research papers in one focused workspace. Read the source, ask questions, and learn from the evidence.</p>
              <div className="home-actions">
                <button className="primary-btn" onClick={onUpload} disabled={disabled}><span>+</span>Add paper</button>
                <span className="action-note">Private and stored on this device</span>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-papers"><span /><span /><span /></div>
              <div className="hero-orbit" />
              <div className="hero-ai">✦</div>
              <div className="hero-features">
                <div><b>Ask questions</b><span>Get clear, source-backed answers</span></div>
                <div><b>Understand concepts</b><span>Break down complex ideas</span></div>
                <div><b>Find evidence</b><span>Jump to the exact source in the paper</span></div>
              </div>
            </div>
          </header>

          <div className="library-stats">
            <div className="library-stat"><i className="stat-icon blue">▤</i><strong>{papers.length}</strong><span>Research papers</span></div>
            <div className="library-stat"><i className="stat-icon green">✓</i><strong>{papers.filter((paper) => paper.indexed).length}</strong><span>Indexed and ready</span></div>
            <div className="library-stat"><i className="stat-icon amber">◷</i><strong>{processing ? 1 : 0}</strong><span>In progress</span></div>
            <div className="library-stat"><i className="stat-icon violet">▥</i><strong>{totalPages}</strong><span>Total pages</span></div>
          </div>

          {recentPaper && (
            <button className="continue-card" type="button" onClick={() => onOpen(recentPaper)}>
              <span className="continue-kicker">Continue reading</span>
              <span className="continue-name">{recentPaper.name}</span>
              <span className="continue-meta">{recentPaper.pages || 0} pages · {formatDate(recentPaper.lastOpenedAt).replace("Opened ", "")}</span>
              <span className="continue-arrow">→</span>
            </button>
          )}

          {papers.length === 0 ? (
            <div className="home-empty"><div className="empty-icon">▤</div><h3>Your library is waiting.</h3><p>Add a PDF to create a private, searchable learning space for your research.</p><button className="primary-btn" onClick={onUpload} disabled={disabled}><span>+</span>Add paper</button></div>
          ) : filteredPapers.length === 0 ? (
            <div className="home-empty compact"><h3>No papers found</h3><p>Try a different filename or clear the search.</p><button className="secondary-btn" type="button" onClick={() => setSearch("")}>Clear search</button></div>
          ) : (
            <section className="library-section">
              <div className="section-heading"><div><span className="eyebrow">Saved papers</span><h3>Your library <small>{filteredPapers.length}</small></h3></div><div className="library-controls"><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort papers"><option value="lastOpened">Last opened</option><option value="name">Name</option><option value="pages">Page count</option></select><button className={layout === "grid" ? "view-toggle active" : "view-toggle"} type="button" onClick={() => setLayout("grid")} aria-label="Grid view">▦</button><button className={layout === "list" ? "view-toggle active" : "view-toggle"} type="button" onClick={() => setLayout("list")} aria-label="List view">☷</button><span className="section-limit">{papers.length}/10</span></div></div>
              <div className={`paper-grid ${layout === "list" ? "list-layout" : ""}`}>
                {filteredPapers.map((paper) => (
                  <article className="paper-card" key={paper.id}>
                    <button className="paper-card-open" type="button" onClick={() => onOpen(paper)}>
                      <div className="paper-card-preview"><span>PDF</span><i /></div>
                      <div className="paper-card-body">
                        <span className="paper-card-type">PDF</span>
                        <h3 title={paper.name}>{paper.name}</h3>
                        <div className="paper-card-meta"><span>{paper.pages || 0} pages</span><span>{formatDate(paper.lastOpenedAt).replace("Opened ", "")}</span></div>
                        <div className={`paper-card-status ${paper.indexed ? "ready" : ""}`}><span className="status-dot" />{paper.indexed ? "Indexed and ready" : "Needs indexing"}</div>
                      </div>
                    </button>
                    <button className="paper-card-remove" type="button" onClick={() => onRemove(paper)} aria-label={`Remove ${paper.name}`}>×</button>
                    <button className="paper-open-label" type="button" onClick={() => onOpen(paper)}>→ Open</button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
