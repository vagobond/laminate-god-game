import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";
import { resolveLinkPreview } from "../_shared/linkpreview.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Anonymous-caller authorization ─────────────────────────────────

// True when the url is the stored `link` of at least one PUBLIC entry.
// can_view_xcrol_entry(owner, privacy, NULL) reduces to privacy = 'public'
// for an anonymous viewer, so a direct filter is equivalent and cheaper.
// Fails CLOSED: any error means "not authorized" — anonymous previews are a
// convenience, never worth an open proxy.
async function urlIsPublicEntryLink(url: string): Promise<boolean> {
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    // BrookPostCard prepends "https://" to bare stored links before asking
    // for a preview, so also match the un-prefixed stored form.
    const candidates = [url];
    if (url.startsWith('https://')) candidates.push(url.slice('https://'.length));
    if (url.startsWith('http://')) candidates.push(url.slice('http://'.length));
    const { data, error } = await admin
      .from('xcrol_entries')
      .select('id')
      .in('link', candidates)
      .eq('privacy_level', 'public')
      .limit(1);
    if (error) {
      console.error('public-entry check failed (fail-closed):', error.message);
      return false;
    }
    return (data ?? []).length > 0;
  } catch (e) {
    console.error('public-entry check error (fail-closed):', e);
    return false;
  }
}

// ─── Main handler ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: a logged-in member may preview ANY url (compose-time
    // previews of links they are about to post). An anonymous visitor (anon
    // apikey, or no valid user token) may only preview a url that appears
    // verbatim as the `link` of a PUBLIC entry — content they are already
    // authorized to read on The River / shared-post pages. This keeps the
    // function from being an open fetch proxy while letting logged-out
    // readers see the same previews members do.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData } = await supabaseClient.auth.getClaims(token);
    const isAuthedUser = !!claimsData?.claims;

    // Per-IP rate limit (fail-open, like every other public function). Each
    // preview is up to four outbound fetches, so this is cost + abuse control.
    const limited = await enforceRateLimit(req, "link-preview", { limit: 30 }, corsHeaders);
    if (limited) return limited;

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAuthedUser && !(await urlIsPublicEntryLink(url))) {
      // Fail closed for anonymous callers: no public entry carries this link.
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolution (SSRF guard included) lives in _shared/linkpreview.ts so the
    // backfill function can call it directly.
    const result = await resolveLinkPreview(url);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // Same URL is previewed by many viewers — let the CDN serve it.
        'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ type: 'unknown', error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
