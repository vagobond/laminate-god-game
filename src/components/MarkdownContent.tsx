import { useMemo } from "react";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent = ({ content, className = "" }: MarkdownContentProps) => {
  const renderedContent = useMemo(() => {
    // Escape HTML to prevent XSS
    let html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Convert markdown to HTML
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.+?)_/g, "<em>$1</em>");

    // Strikethrough: ~~text~~
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // Inline code: `code`
    html = html.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-xs font-mono">$1</code>');

    // Links: [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
    );

    // Auto-link URLs (not already in anchor tags)
    html = html.replace(
      /(?<!href=")(?<!">)(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
    );

    // Line breaks
    html = html.replace(/\n/g, "<br />");

    return html;
  }, [content]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default MarkdownContent;
