import { Fragment } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function renderFormula(expression, displayMode, key) {
  try {
    return (
      <span
        key={key}
        className={displayMode ? "math-block" : "math-inline"}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(expression, {
            displayMode,
            throwOnError: false,
            strict: "ignore",
          }),
        }}
      />
    );
  } catch {
    return <code key={key}>{expression}</code>;
  }
}

function renderInline(text) {
  const tokenPattern =
    /(\\\([^)\n]+\\\)|\$[^$\n]+\$|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenPattern);

  return parts.map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      return renderFormula(part.slice(1, -1), false, index);
    }

    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      return renderFormula(part.slice(2, -2), false, index);
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={index} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

export default function MarkdownContent({ children }) {
  const lines = String(children || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;
  let code = null;
  let math = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={`paragraph-${blocks.length}`}>
          {paragraph.map((line, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {renderInline(line)}
            </Fragment>
          ))}
        </p>,
      );
      paragraph = [];
    }
  };

  const flushList = () => {
    if (!list) return;
    const ListTag = list.ordered ? "ol" : "ul";
    blocks.push(
      <ListTag key={`list-${blocks.length}`}>
        {list.items.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ListTag>,
    );
    list = null;
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      if (code) {
        blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
        code = null;
      } else {
        code = [];
      }
      return;
    }

    if (math) {
      const closingIndex = line.indexOf("$$");
      if (closingIndex >= 0) {
        math.push(line.slice(0, closingIndex));
        blocks.push(
          renderFormula(math.join("\n").trim(), true, `math-${blocks.length}`),
        );
        math = null;
      } else {
        math.push(line);
      }
      return;
    }

    if (line.trim().startsWith("$$")) {
      flushParagraph();
      flushList();
      const trimmed = line.trim();
      const closingIndex = trimmed.indexOf("$$", 2);
      if (closingIndex >= 0) {
        blocks.push(
          renderFormula(trimmed.slice(2, closingIndex).trim(), true, `math-${blocks.length}`),
        );
      } else {
        math = [trimmed.slice(2)];
      }
      return;
    }

    if (code) {
      code.push(line);
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const listItem = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
    const quote = line.match(/^\s*>\s?(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      const HeadingTag = `h${heading[1].length}`;
      blocks.push(<HeadingTag key={`heading-${blocks.length}`}>{renderInline(heading[2])}</HeadingTag>);
    } else if (listItem) {
      flushParagraph();
      const ordered = /^\d+\./.test(listItem[1]);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(listItem[2]);
    } else if (quote) {
      flushParagraph();
      flushList();
      blocks.push(<blockquote key={`quote-${blocks.length}`}>{renderInline(quote[1])}</blockquote>);
    } else if (line.trim()) {
      flushList();
      paragraph.push(line);
    } else {
      flushParagraph();
      flushList();
    }
  });

  flushParagraph();
  flushList();
  if (code) {
    blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
  }
  if (math) {
    blocks.push(renderFormula(math.join("\n").trim(), true, `math-${blocks.length}`));
  }

  return <div className="markdown-content">{blocks}</div>;
}
