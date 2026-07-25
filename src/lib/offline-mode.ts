// Tier 2 read-only static fallback.
//
// When the backend (Postgres / edge functions) is unreachable, the public
// surface of the app stays usable by reading a snapshot JSON written nightly
// by the `nightly-backup` edge function to the public `public-snapshots`
// storage bucket. Writes are disabled with a banner.
//
// This is intentionally lightweight and isolated — no React Query, no
// Supabase client. The snapshot URL is served from the Storage CDN which
// caches independently from Postgres compute.

import { useEffect, useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

export const SNAPSHOT_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/public-snapshots/latest.json`
  : null;

export interface PublicSnapshot {
  generated_at: string;
  stats: {
    entries_today: number;
    hometowns_total: number;
    countries_total: number;
    brooks_active: number;
  };
  // Forward-compatible: more public collections may be added later.
  // Consumers should treat unknown fields as optional.
  river?: Array<{
    id: string;
    user_id: string;
    username: string | null;
    display_name: string | null;
    content: string;
    created_at: string;
  }>;
  publications?: Array<{
    id: string;
    slug: string;
    title: string;
    author_id: string;
    published_at: string;
  }>;
}

let cached: PublicSnapshot | null = null;
let inflight: Promise<PublicSnapshot | null> | null = null;

export async function fetchSnapshot(): Promise<PublicSnapshot | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  if (!SNAPSHOT_URL) return null;
  inflight = (async () => {
    try {
      const res = await fetch(SNAPSHOT_URL, { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as PublicSnapshot;
      cached = json;
      return json;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export type BackendStatus = "checking" | "online" | "offline";

/**
 * Lightweight backend health probe. Hits the JWT-free `health` edge function.
 *
 * Mobile-safe: slow/flaky mobile networks (and PWA cold starts where the tab
 * is backgrounded) used to abort the single 6s request and latch the app into
 * read-only mode forever. Now we retry a few times with a generous timeout,
 * respect navigator.onLine, and re-probe when the device comes back online or
 * the tab becomes visible again.
 */
export function useBackendHealth(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    if (!SUPABASE_URL) {
      setStatus("offline");
      return;
    }

    let cancelled = false;
    let controller: AbortController | null = null;

    const probeOnce = async (timeoutMs: number) => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), timeoutMs);
      try {
        // Any HTTP response — even 5xx — means the edge network is reachable.
        await fetch(`${SUPABASE_URL}/functions/v1/health`, {
          signal: controller.signal,
          cache: "no-store",
        });
        return true;
      } catch {
        return false;
      } finally {
        clearTimeout(timeout);
      }
    };

    const run = async () => {
      // Browser already knows there's no connectivity — don't burn retries.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (!cancelled) setStatus("offline");
        return;
      }
      // 3 attempts with increasing patience: 10s, 15s, 20s.
      for (const timeoutMs of [10000, 15000, 20000]) {
        const ok = await probeOnce(timeoutMs);
        if (cancelled) return;
        if (ok) {
          setStatus("online");
          return;
        }
        // Tab backgrounded mid-probe (common on mobile) — don't count it.
        if (typeof document !== "undefined" && document.hidden) return;
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
      }
      if (!cancelled) setStatus("offline");
    };

    void run();

    const retry = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.hidden) return;
      setStatus("checking");
      void run();
    };

    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", retry);

    return () => {
      cancelled = true;
      controller?.abort();
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", retry);
    };
  }, []);

  return status;
}

