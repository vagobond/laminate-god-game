// Relationship-ladder API for "Login with Xcrol" satellite apps.
//
// GET with a Bearer access token carrying the relationship:read scope and
// ?target_user_id= or ?target_username=. Returns the relationship level the
// TARGET has granted the token's user — the same rung that gates content
// visibility inside Xcrol — so satellites can friend-gate their own content
// (e.g. victories for buddies+, private notes for close friends) without
// owning a social graph.
//
// Privacy rules:
//  - secret_friend is reported as close_friend (its effective visibility
//    tier); the secrecy of the designation is never exposed.
//  - secret_enemy / fake_friend / not_friend are secret negative
//    designations and are reported as no relationship (level: null).
//  - Blocks (either direction) also read as level: null — indistinguishable
//    from "no relationship".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// oauth_tokens stores sha256 hex digests, never plaintext — hash before lookup.
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Collapse secret designations to what the token's user is allowed to know.
function maskLevel(level: string | null): string | null {
  if (!level) return null;
  if (level === "secret_friend") return "close_friend";
  if (level === "secret_enemy" || level === "fake_friend" || level === "not_friend") return null;
  return level;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await enforceRateLimit(req, "oauth-relationship", { limit: 30 }, corsHeaders);
  if (limited) return limited;

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "invalid_token", error_description: "Missing or invalid bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "WWW-Authenticate": "Bearer" } }
      );
    }

    const accessToken = authHeader.substring(7);

    // Find token
    const { data: token, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("user_id, scopes, access_token_expires_at, revoked")
      .eq("access_token", await sha256Hex(accessToken))
      .eq("revoked", false)
      .single();

    if (tokenError || !token) {
      return new Response(
        JSON.stringify({ error: "invalid_token", error_description: "Token not found or revoked" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "WWW-Authenticate": "Bearer" } }
      );
    }

    // Check expiration
    if (new Date(token.access_token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "invalid_token", error_description: "Token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "WWW-Authenticate": "Bearer" } }
      );
    }

    // Check scope
    const scopes = token.scopes as string[];
    if (!scopes.includes("relationship:read")) {
      return new Response(
        JSON.stringify({ error: "insufficient_scope", error_description: "relationship:read scope required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user from query
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("target_user_id");
    const targetUsername = url.searchParams.get("target_username");

    if (!targetUserId && !targetUsername) {
      return new Response(
        JSON.stringify({ error: "invalid_request", error_description: "target_user_id or target_username required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resolvedTargetId = targetUserId;

    // Resolve username to ID if needed
    if (!resolvedTargetId && targetUsername) {
      const { data: resolvedId, error: resolveError } = await supabase
        .rpc("resolve_username_to_id", { target_username: targetUsername });

      if (resolveError || !resolvedId) {
        return new Response(
          JSON.stringify({ error: "not_found", error_description: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      resolvedTargetId = resolvedId;
    }

    // A block in either direction reads as no relationship — never reveal it.
    // FAIL CLOSED: if either block lookup errors, treat as blocked (level null)
    // rather than leaking a rung past a block we couldn't verify.
    const [blockA, blockB] = await Promise.all([
      supabase.rpc("is_blocked", { blocker_id: resolvedTargetId, blocked_id: token.user_id }),
      supabase.rpc("is_blocked", { blocker_id: token.user_id, blocked_id: resolvedTargetId }),
    ]);
    const blockedByTarget = blockA.error ? true : !!blockA.data;
    const blockedByUser = blockB.error ? true : !!blockB.data;
    if (blockA.error || blockB.error) {
      console.error("oauth-relationship: is_blocked errored, failing closed", blockA.error?.message ?? blockB.error?.message);
    }

    let level: string | null = null;
    if (!blockedByTarget && !blockedByUser) {
      // The rung the target granted the token's user — same primitive that
      // gates content visibility inside Xcrol.
      const { data: rawLevel, error: levelError } = await supabase
        .rpc("get_friendship_level", {
          viewer_id: token.user_id,
          profile_id: resolvedTargetId,
        });

      if (levelError) {
        console.error("get_friendship_level error:", levelError);
        return new Response(
          JSON.stringify({ error: "server_error", error_description: "Failed to look up relationship level" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      level = maskLevel(rawLevel as string | null);
    }

    return new Response(
      JSON.stringify({
        sub: token.user_id,
        target_id: resolvedTargetId,
        level,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth relationship error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
