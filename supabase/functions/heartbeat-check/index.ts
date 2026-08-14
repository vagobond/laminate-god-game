// Dead-man's switch (DISABLED by default).
// When DEADMAN_ENABLED=1, checks admin_heartbeats for recent admin activity
// (falls back to last_sign_in_at if no heartbeat rows exist yet) and emails
// the trustee if no activity has been recorded in DEADMAN_DAYS days.
// Always records a heartbeat row in backup_runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET");
  const incoming = req.headers.get("x-cron-secret");
  if (cronSecret && incoming !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: runRow } = await admin
    .from("backup_runs")
    .insert({ kind: "heartbeat", status: "running" })
    .select("id")
    .single();

  const enabled = Deno.env.get("DEADMAN_ENABLED") === "1";
  const days = Number(Deno.env.get("DEADMAN_DAYS") ?? "90");
  const trustee = Deno.env.get("TRUSTEE_EMAIL");
  const resend = Deno.env.get("RESEND_API_KEY");

  const notes: Record<string, unknown> = { enabled, days, trustee_set: !!trustee };
  let alerted = false;

  if (enabled && trustee && resend) {
    // Find the most recent admin activity from the heartbeats table,
    // falling back to last_sign_in_at for admins who haven't triggered
    // a heartbeat row yet (backwards-compatible).
    const { data: heartbeat } = await admin
      .from("admin_heartbeats")
      .select("last_seen_at")
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let mostRecent = heartbeat?.last_seen_at
      ? new Date(heartbeat.last_seen_at).getTime()
      : 0;

    // Fallback: if no heartbeat rows exist yet, check last_sign_in_at
    if (!mostRecent) {
      const { data: admins } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      for (const r of admins ?? []) {
        const { data: u } = await admin.auth.admin.getUserById(r.user_id);
        const t = u?.user?.last_sign_in_at ? new Date(u.user.last_sign_in_at).getTime() : 0;
        if (t > mostRecent) mostRecent = t;
      }
    }
    notes.most_recent_admin_activity = mostRecent ? new Date(mostRecent).toISOString() : null;
    const ageMs = Date.now() - mostRecent;
    if (mostRecent && ageMs > days * 86400 * 1000) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Xcrol Trustee <trustee@xcrol.com>",
            to: [trustee],
            subject: "Xcrol heartbeat overdue — revival packet attached",
            text: [
              `No admin activity has been recorded on Xcrol for over ${days} days.`,
              "",
              "Backups: see your Backblaze B2 bucket (xcrol-backups).",
              "Revival instructions: docs/RUNBOOK.md in the GitHub mirror.",
              "",
              "If this is a false alarm, sign in to dismiss.",
            ].join("\n"),
          }),
        });
        alerted = true;
      } catch (e) {
        notes.alert_error = e instanceof Error ? e.message : String(e);
      }
    }
  }

  await admin
    .from("backup_runs")
    .update({
      status: "success",
      finished_at: new Date().toISOString(),
      notes: { ...notes, alerted },
    })
    .eq("id", runRow!.id);

  return new Response(JSON.stringify({ ok: true, enabled, alerted, notes }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
