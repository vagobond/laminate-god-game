import { Fragment } from "react";
import { Link } from "react-router-dom";

interface MentionTextProps {
  content: string;
  className?: string;
}

// Regex to match @username mentions
// Username can contain alphanumeric characters and must be at least 2 chars
const MENTION_REGEX = /@([a-zA-Z0-9]{2,30})\b/g;

export const MentionText = ({ content, className }: MentionTextProps) => {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  // Reset regex lastIndex
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const username = match[1];
    parts.push(
      <Link
        key={`mention-${keyIndex++}`}
        to={`/${username}`}
        className="text-primary hover:underline font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no mentions found, just return the content
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </span>
  );
};
