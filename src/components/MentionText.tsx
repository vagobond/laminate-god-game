import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MentionTextProps {
  content: string;
  className?: string;
}

// Usernames are lowercase alphanumerics + underscore (profiles CHECK
// constraint). The leading capture group keeps email addresses
// ("jd@host.com") and mid-word @s from linkifying: the character before the
// @ must not be word-ish. The trailing lookahead stops a match from ending
// mid-token. Matching is case-insensitive; checks/links use the lowercase
// form while the original text is displayed.
const MENTION_REGEX = /(^|[^A-Za-z0-9._-])@([a-z0-9_]{2,30})(?![A-Za-z0-9_])/gi;

// A mention is only rendered as a link once the username is confirmed to
// exist. Unknown or nonexistent names stay plain text — a typo or the domain
// half of an email must never become a Page Not Found link. Existence
// results are cached for the session; lookups from all mounted MentionTexts
// are batched into one query per tick-window.
const knownUsernames = new Map<string, boolean>();
let pendingLookups: Set<string> | null = null;
let pendingFlush: Promise<void> | null = null;

function ensureChecked(names: string[]): Promise<void> | null {
  const unknown = names.filter((n) => !knownUsernames.has(n));
  if (unknown.length === 0) return null;
  if (!pendingLookups) pendingLookups = new Set();
  for (const n of unknown) pendingLookups.add(n);
  if (!pendingFlush) {
    pendingFlush = new Promise<void>((resolve) => window.setTimeout(resolve, 50)).then(
      async () => {
        const batch = pendingLookups ? [...pendingLookups] : [];
        pendingLookups = null;
        pendingFlush = null;
        if (batch.length === 0) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .in("username", batch);
        // On error, leave names unknown: they render as plain text (fail
        // closed) and will be retried on the next mount.
        if (error) return;
        const found = new Set((data ?? []).map((r) => r.username));
        for (const n of batch) knownUsernames.set(n, found.has(n));
      }
    );
  }
  return pendingFlush;
}

function extractCandidates(content: string): string[] {
  const names = new Set<string>();
  MENTION_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MENTION_REGEX.exec(content)) !== null) {
    names.add(m[2].toLowerCase());
  }
  return [...names];
}

export const MentionText = ({ content, className }: MentionTextProps) => {
  const candidates = useMemo(() => extractCandidates(content), [content]);
  const [, setCheckTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const flush = ensureChecked(candidates);
    if (flush) {
      flush.then(() => {
        if (!cancelled) setCheckTick((t) => t + 1);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [candidates]);

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(content)) !== null) {
    const prefix = match[1];
    const displayName = match[2];
    const username = displayName.toLowerCase();
    const mentionStart = match.index + prefix.length;

    if (mentionStart > lastIndex) {
      parts.push(content.slice(lastIndex, mentionStart));
    }

    if (knownUsernames.get(username) === true) {
      parts.push(
        <Link
          key={`mention-${keyIndex++}`}
          to={`/${username}`}
          className="text-primary hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          @{displayName}
        </Link>
      );
    } else {
      parts.push(`@${displayName}`);
    }

    lastIndex = mentionStart + displayName.length + 1;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

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
