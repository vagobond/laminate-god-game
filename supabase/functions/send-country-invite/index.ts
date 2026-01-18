import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviteeEmail: string;
  inviterName: string;
  targetCountry: string | null;
  inviteCode: string;
  isNewCountry: boolean;
}

// HTML escape function to prevent XSS attacks in email templates
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { inviteeEmail, inviterName, targetCountry, inviteCode, isNewCountry }: InviteEmailRequest = await req.json();

    // Input validation
    if (!inviteeEmail || !isValidEmail(inviteeEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!inviterName || inviterName.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid inviter name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (targetCountry && targetCountry.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid country name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!inviteCode || inviteCode.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid invite code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending invite email to ${inviteeEmail}`);

    // Sanitize all user inputs before embedding in HTML
    const safeInviterName = escapeHtml(inviterName);
    const safeTargetCountry = targetCountry ? escapeHtml(targetCountry) : null;
    const safeInviteCode = escapeHtml(inviteCode);

    const countryText = safeTargetCountry 
      ? `to represent ${safeTargetCountry}` 
      : "to join the community";

    const specialMessage = isNewCountry 
      ? `This is a special invitation - you'll be the first person representing a new country!` 
      : "";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Xcrol <noreply@invites.xcrol.com>",
        to: [inviteeEmail],
        subject: `${safeInviterName} invited you to join Xcrol!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0a0a0a; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); }
              h1 { color: #ffffff; font-size: 28px; margin-bottom: 20px; }
              p { color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 16px; }
              .highlight { color: #a78bfa; font-weight: 600; }
              .special { background: rgba(139, 92, 246, 0.2); border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
              .special p { color: #c4b5fd; margin: 0; }
              .code { background: rgba(139, 92, 246, 0.3); color: #e9d5ff; padding: 12px 24px; border-radius: 8px; font-family: monospace; font-size: 18px; display: inline-block; margin: 20px 0; letter-spacing: 2px; }
              .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
              .footer p { color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>You've Been Invited! 🌍</h1>
                <p><span class="highlight">${safeInviterName}</span> has invited you ${countryText} on Xcrol.</p>
                ${specialMessage ? `<div class="special"><p>✨ ${specialMessage}</p></div>` : ''}
                <p>Use this invite code when you sign up:</p>
                <div class="code">${safeInviteCode}</div>
                <p>Join us to explore layers, connect with people from around the world, and build your presence on Xcrol.</p>
                <a href="https://xcrol.com/auth?invite=${encodeURIComponent(inviteCode)}" class="cta">Join Xcrol</a>
                <div class="footer">
                  <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-country-invite function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send invitation" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
