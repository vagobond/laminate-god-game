import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window size in seconds (default 60). */
  windowSeconds?: number;
}

/** Best-effort client IP. Supabase's edge gateway sets x-forwarded-for. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
