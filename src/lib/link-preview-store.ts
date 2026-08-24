import { supabase } from "@/integrations/supabase/client";

/**
 * Stored-preview helpers.
 *
 * Previews are resolved ONCE, when a link is attached to an entry, and stored
 * on the entry row. Rendering reads those columns and makes no edge call, so
 * The River no longer spends the link-preview rate limit (30/min/IP) on every
 * page view.
 */

export interface StoredPreview {
  preview_type: "pixelfed" | "peertube" | "generic" | null;
  preview_title: string | null;
  preview_description: string | null;
  preview_image_url: string | null;
  preview_site_name: string | null;
  preview_favicon_url: string | null;
}

/** Row shape carrying stored preview columns, as returned by reads. */
export interface PreviewRowFields extends Partial<StoredPreview> {
  preview_fetched_at?: string | null;
}

/** Column list for `.select()` on xcrol_entries reads that render previews. */
export const PREVIEW_COLUMNS =
  "preview_type, preview_title, preview_description, preview_image_url, preview_site_name, preview_favicon_url, preview_fetched_at";

export const EMPTY_PREVIEW: StoredPreview = {
  preview_type: null,
  preview_title: null,
  preview_description: null,
  preview_image_url: null,
  preview_site_name: null,
  preview_favicon_url: null,
};

// Mirrors the DB CHECK constraints so a hostile OG tag can't fail the insert.
const LIMITS = {
  preview_title: 300,
  preview_description: 500,
  preview_image_url: 2000,
  preview_site_name: 120,
  preview_favicon_url: 2000,
} as const;

function clamp(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

/** Entries store bare links too; the edge function wants an absolute URL. */
export function normalizeLink(link: string): string {
  const t = link.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/**
 * Resolve a link's preview via the edge function. Never throws and never
 * blocks a post: any failure (rate limit, timeout, unknown type) resolves to
 * EMPTY_PREVIEW, which stores as NULLs and simply renders no card.
 */
export async function resolvePreview(link: string): Promise<StoredPreview> {
  const url = normalizeLink(link);
  try {
    const { data, error } = await supabase.functions.invoke("link-preview", {
      body: { url },
    });
    if (error || !data?.type || data.type === "unknown") return EMPTY_PREVIEW;
    if (!["pixelfed", "peertube", "generic"].includes(data.type)) return EMPTY_PREVIEW;

    return {
      preview_type: data.type,
      preview_title: clamp(data.title, LIMITS.preview_title),
      preview_description: clamp(data.description, LIMITS.preview_description),
      preview_image_url: clamp(data.image_url, LIMITS.preview_image_url),
      preview_site_name: clamp(data.site_name, LIMITS.preview_site_name),
      preview_favicon_url: clamp(data.favicon_url, LIMITS.preview_favicon_url),
    };
  } catch {
    return EMPTY_PREVIEW;
  }
}

/**
 * Preview fields for an entry write. Returns EMPTY_PREVIEW for a removed or
 * blank link so stale preview data can never outlive the link it described.
 */
export async function previewFieldsFor(link: string | null): Promise<StoredPreview> {
  if (!link || !link.trim()) return EMPTY_PREVIEW;
  return resolvePreview(link);
}

/**
 * True when a row carries renderable stored preview data.
 * Anything with a preview_type has been resolved; NULL means never fetched or
 * nothing worth showing.
 */
export function hasStoredPreview(row: Partial<StoredPreview> | null | undefined): boolean {
  return !!row?.preview_type;
}

/**
 * Pull the preview columns off a fetched row.
 *
 * Returns `undefined` when the row predates stored previews — a link with no
 * `preview_fetched_at` was never resolved, so the renderer should fall back to
 * fetching it once. A resolved row (even one that found nothing) returns a
 * StoredPreview, which tells the renderer "this is settled, make no call".
 */
export function pickStoredPreview(
  row: PreviewRowFields | null | undefined,
): StoredPreview | undefined {
  if (!row) return undefined;
  const resolved = !!row.preview_fetched_at || !!row.preview_type;
  if (!resolved) return undefined;
  return {
    preview_type: row.preview_type ?? null,
    preview_title: row.preview_title ?? null,
    preview_description: row.preview_description ?? null,
    preview_image_url: row.preview_image_url ?? null,
    preview_site_name: row.preview_site_name ?? null,
    preview_favicon_url: row.preview_favicon_url ?? null,
  };
}
