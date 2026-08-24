// One-shot (re-runnable) backfill: resolve stored previews for entries that
// have a link but were created before 20260824090000_entry_link_previews.
//
// Without this, old entries keep hitting the per-render edge-call path (and
// the rate limit) forever. Run it a few times until it reports done:0.
//
//   curl -X POST "$SUPABASE_URL/functions/v1/backfill-link-previews" \
//     -H "Authorization: Bearer $SERVICE_ROLE_KEY"
//
// Service-role only: it writes to other people's rows. Batch-limited so a run
// stays inside the function's wall-clock budget.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveLinkPreview } from "../_shared/linkpreview.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH = 25;

function normalizeLink(link: string): string {
  const t = link.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function clamp(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "service role required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Entries with a link that have never had a preview resolved.
  const { data: rows, error } = await admin
    .from("xcrol_entries")
    .select("id, link")
    .not("link", "is", null)
    .is("preview_fetched_at", null)
    .limit(BATCH);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let done = 0;
  let withPreview = 0;

  for (const row of rows ?? []) {
    const url = normalizeLink(row.link as string);
    let fields: Record<string, unknown> = {
      preview_type: null,
      preview_title: null,
      preview_description: null,
      preview_image_url: null,
      preview_site_name: null,
      preview_favicon_url: null,
    };

    try {
      // Resolve in-process via the shared module: no HTTP round-trip, so this
      // never touches link-preview's per-IP rate limit and needs no user token.
      const d = await resolveLinkPreview(url);
      if (d?.type && ["pixelfed", "peertube", "generic"].includes(d.type)) {
        fields = {
          preview_type: d.type,
          preview_title: clamp(d.title, 300),
          preview_description: clamp(d.description, 500),
          preview_image_url: clamp(d.image_url, 2000),
          preview_site_name: clamp(d.site_name, 120),
          preview_favicon_url: clamp(d.favicon_url, 2000),
        };
        withPreview++;
      }
    } catch (e) {
      console.error("preview probe failed for", row.id, e);
    }

    // Always stamp preview_fetched_at, even when nothing was found — that is
    // what marks the row "resolved" so it is not retried on every run and the
    // client stops falling back to a per-render fetch.
    const { error: upErr } = await admin
      .from("xcrol_entries")
      .update({ ...fields, preview_fetched_at: new Date().toISOString() })
      .eq("id", row.id);
    if (upErr) console.error("update failed for", row.id, upErr.message);
    else done++;
  }

  const remaining = (rows ?? []).length === BATCH;
  return new Response(
    JSON.stringify({ done, withPreview, moreLikely: remaining }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
