import { useEffect, useMemo, useState } from "react";
import { ensureMentionsChecked, isKnownMention } from "@/components/MentionText";

// Same shape as MentionText's regex, adapted to this file's lookbehind style:
// underscores allowed (DB charset), no matching inside URLs or email-ish
// tokens, no bleeding into longer tokens.
const MD_MENTION_REGEX = /(?<![\/A-Za-z0-9._-])@([a-z0-9_]{2,30})(?![A-Za-z0-9_])/gi;

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent = ({ content, className = "" }: MarkdownContentProps) => {
  // Mentions render as links only once the username is confirmed to exist
  // (shared session cache with MentionText) — never dead profile links.
  const [checkVersion, setCheckTick] = useState(0);
  useEffect(() => {
    const names: string[] = [];
    MD_MENTION_REGEX.lastIndex = 0;
    let mm: RegExpExecArray | null;
    while ((mm = MD_MENTION_REGEX.exec(content)) !== null) names.push(mm[1].toLowerCase());
    let cancelled = false;
    const flush = ensureMentionsChecked(names);
    if (flush) flush.then(() => { if (!cancelled) setCheckTick((t) => t + 1); });
    return () => { cancelled = true; };
  }, [content]);

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

    // @username mentions — link to user profile, but only for usernames
    // confirmed to exist (see the effect above); unknown names stay text.
    html = html.replace(MD_MENTION_REGEX, (full, name: string) =>
      isKnownMention(name)
        ? `<a href="/${name.toLowerCase()}" class="text-primary font-medium hover:underline">@${name}</a>`
        : full
    );

    // Strip javascript: links (XSS prevention)
    html = html.replace(/<a\s+href\s*=\s*"javascript:[^"]*"[^>]*>[^<]*<\/a>/gi, '');

    // Line breaks
    html = html.replace(/\n/g, "<br />");

    return html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, checkVersion]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default MarkdownContent;
