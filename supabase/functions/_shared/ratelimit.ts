import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window size in seconds (default 60). */
  windowSeconds?: number;
}

/**
 * Best-effort client IP for rate-limit bucketing (2026-08-21 audit, item 3).
 *
 * The FIRST x-forwarded-for entry is client-suppliable (a direct caller can
 * send its own XFF header and rotate buckets), so it is only trusted when the
 * request carries the shared worker secret — i.e. it came from our Cloudflare
 * worker, which sets XFF to the real visitor IP (cf-connecting-ip).
 * Otherwise prefer cf-connecting-ip (set by the edge, not spoofable), then the
 * LAST XFF entry (appended by the nearest trusted proxy), then "unknown".
 *
 * WORKER_TRUST_SECRET is optional: when unset, worker-path requests bucket by
 * the worker's egress IP — coarser, but cards are edge-cached 6h so misses are
 * rare, and rate limiting here is cost protection (fail-open) not security.
 */
export function clientIp(req: Request): string {
  const xff = (req.headers.get("x-forwarded-for") || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const secret = Deno.env.get("WORKER_TRUST_SECRET");
  if (secret && req.headers.get("x-worker-secret") === secret && xff[0]) {
    return xff[0];
  }
  return req.headers.get("cf-connecting-ip") || xff[xff.length - 1] || "unknown";
}

/**
 * Per-IP fixed-window rate limit backed by the check_rate_limit() RPC.
 * Returns a 429 Response when over the limit, otherwise null.
 *
 * FAILS OPEN: if the RPC is missing or the DB call errors, the request is
 * allowed and the failure is logged — rate limiting is cost protection,
 * and must never become the thing that takes login down.
 */
export async function enforceRateLimit(
  req: Request,
  bucket: string,
  { limit, windowSeconds = 60 }: RateLimitOptions,
  extraHeaders: Record<string, string> = {},
): Promise<Response | null> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
      p_key: `${bucket}:${clientIp(req)}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error(`rate-limit check failed for ${bucket} (fail-open):`, error.message);
      return null;
    }
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(windowSeconds),
          ...extraHeaders,
        },
      });
    }
    return null;
  } catch (e) {
    console.error(`rate-limit exception for ${bucket} (fail-open):`, e);
    return null;
  }
}
