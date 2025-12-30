import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  displayName: string;
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

    const { email, displayName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} (${displayName})`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "XCROL <noreply@invites.xcrol.com>",
        to: [email],
        subject: "Why XCROL exists — and why I'm grateful you're here",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { 
                font-family: Georgia, 'Times New Roman', serif; 
                margin: 0; 
                padding: 0; 
                background: #0a0a0a; 
                color: #e0e0e0;
                line-height: 1.7;
              }
              .container { 
                max-width: 650px; 
                margin: 0 auto; 
                padding: 40px 20px; 
              }
              .card { 
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
                border-radius: 16px; 
                padding: 48px; 
                border: 1px solid rgba(139, 92, 246, 0.3); 
              }
              h1 { 
                color: #ffffff; 
                font-size: 24px; 
                margin-bottom: 32px; 
                font-weight: normal;
              }
              h2 {
                color: #a78bfa;
                font-size: 18px;
                margin-top: 32px;
                margin-bottom: 16px;
                font-weight: 600;
              }
              p { 
                color: #c0c0c0; 
                font-size: 16px; 
                line-height: 1.8; 
                margin-bottom: 20px; 
              }
              .highlight { 
                color: #a78bfa; 
                font-weight: 600; 
              }
              .section {
                margin: 32px 0;
                padding: 24px;
                background: rgba(139, 92, 246, 0.1);
                border-radius: 12px;
                border-left: 4px solid #8b5cf6;
              }
              .section-title {
                color: #e9d5ff;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
              }
              ul {
                margin: 0;
                padding-left: 20px;
              }
              li {
                color: #b0b0b0;
                margin-bottom: 8px;
                font-size: 15px;
              }
              .signature {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid rgba(139, 92, 246, 0.3);
              }
              .signature p {
                margin-bottom: 8px;
              }
              a { 
                color: #a78bfa; 
                text-decoration: underline; 
              }
              .cta { 
                display: inline-block; 
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); 
                color: white; 
                padding: 14px 32px; 
                border-radius: 8px; 
                text-decoration: none; 
                font-weight: 600; 
                margin-top: 24px; 
              }
              .divider {
                border: none;
                border-top: 1px solid rgba(139, 92, 246, 0.3);
                margin: 32px 0;
              }
              .footer { 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 1px solid rgba(255,255,255,0.1); 
              }
              .footer p { 
                color: #666; 
                font-size: 14px; 
              }
              .friendship-levels {
                margin-top: 12px;
              }
              .level-tag {
                display: inline-block;
                background: rgba(139, 92, 246, 0.2);
                color: #c4b5fd;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 13px;
                margin-right: 8px;
                margin-bottom: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Dear ${displayName || 'Friend'},</h1>
                
                <p>I want to share why XCROL matters — and why I'm grateful you're here.</p>
                
                <div class="section">
                  <div class="section-title">🌊 The River</div>
                  <p style="margin-bottom: 12px;">The River is the heart of XCROL. It's a social feed with:</p>
                  <ul>
                    <li>No algorithms</li>
                    <li>No ads</li>
                    <li>Strict chronological order</li>
                    <li>One post per user per day</li>
                    <li>240 characters (optional link)</li>
                    <li>No photos, no videos, no walls of text</li>
                  </ul>
                  <p style="margin-top: 16px; margin-bottom: 0;">The goal isn't content. It's awareness. A simple, calm way to keep up with the people you actually care about and what's happening in their lives — without noise or manipulation.</p>
                </div>
                
                <p>You don't need to abandon your other social networks. In fact, you shouldn't. Facebook Groups, Instagram photos, YouTube videos — those platforms are great at what they do.</p>
                
                <p><strong>They're just not great at what we once thought they were for: keeping track of the people we love.</strong></p>
                
                <div class="section">
                  <div class="section-title">🌍 The World</div>
                  <p style="margin-bottom: 0;">The World is our map layer. Hometowns matter because real relationships live in real places. When you set yours, you're joining a global network of actual humans — making travel more meaningful and opening the door to real-life connections: hosting friends, meeting friends-of-friends, grabbing food, walking, exploring, or just being human together.</p>
                </div>
                
                <div class="section">
                  <div class="section-title">👤 You (Your Profile)</div>
                  <p style="margin-bottom: 0;">Your profile is the foundation of everything. The more you share (only what you're comfortable with), the more valuable XCROL becomes — and you control who sees what through friendship levels.</p>
                </div>
                
                <p>I'm making XCROL as secure and safe as possible using all the tools available, but it's still the internet. <strong>Please never share anything you wouldn't want the world to know</strong> — like passwords, financial information, or sensitive secrets. If you are planning a war, for example, don't use XCROL to do it; I hear Signal is the network of choice for that.</p>
                
                <p>Finally, I want you to know how much I appreciate you. Most early users are people I care deeply about — people I invited because I want them in my life. The fact that you showed up means more to me than I can easily express.</p>
                
                <p><strong>If you haven't yet, please take a few minutes to complete your profile.</strong> You're helping shape something intentional, human, and real. Your early and active participation will help me identify things that need to be fixed, make it safer, and make it better for everyone that will follow (like the people you care about).</p>
                
                <p>Thank you for being here. Thank you for showing up.</p>
                
                <div class="signature">
                  <p style="margin-bottom: 4px;">~CD</p>
                  <p><a href="https://www.xcrol.com/@cd">https://www.xcrol.com/@cd</a> - Make sure you add me as a friend or accept my friend request!</p>
                </div>
                
                <hr class="divider">
                
                <h2>Quick Start Guide</h2>
                <p>This is a quick guide to help you get the most out of XCROL from the start.</p>
                
                <h2>1. Complete Your Profile (You)</h2>
                <p>Your profile is your digital identity inside XCROL.</p>
                <ul>
                  <li>Add a display name and avatar so people recognize you</li>
                  <li>Write a short bio that captures who you are</li>
                  <li>Add personal info (birthday, nicknames, hometown, etc.)</li>
                  <li>Connect social links if you want</li>
                </ul>
                <p>Every field has visibility controls, so you decide exactly who sees what. Share only what you're comfortable with — but know that fuller profiles create stronger, more meaningful connections.</p>
                
                <h2>2. Set Your Hometown (The World)</h2>
                <p>Your hometown isn't just a detail — it's the foundation of the map.</p>
                <ul>
                  <li>Pin where you're from to join the global network of real people</li>
                  <li>See where friends are from and where connections exist</li>
                  <li>Make travel more human by knowing who's connected where</li>
                </ul>
                <p>Hometowns will power future features like local discovery, meetups, and travel-based connections. Early users who set theirs now will be first to benefit.</p>
                
                <h2>3. Understand Friendship Levels</h2>
                <p>Not all relationships are the same — and XCROL embraces that.</p>
                <div class="friendship-levels">
                  <span class="level-tag">Close Friend</span>
                  <span class="level-tag">Buddy</span>
                  <span class="level-tag">Friendly Acquaintance</span>
                  <span class="level-tag">Secret Friend</span>
                  <span class="level-tag">Fake Friend</span>
                </div>
                <p style="margin-top: 16px;">Each level controls what someone can see about you. Your data, your rules.</p>
                
                <h2>4. Post in The River</h2>
                <p>The River is simple by design.</p>
                <ul>
                  <li>One post per day per user</li>
                  <li>240 characters, optional link</li>
                  <li>No photos, no videos</li>
                  <li>Chronological, no algorithms, no ads</li>
                </ul>
                <p>Think of it as a daily pulse — a small signal that helps your people stay connected to your life.</p>
                
                <p><strong>That's it.</strong> XCROL works best when it's calm, intentional, and real — just like the relationships it's built for.</p>
                
                <p>Thanks for helping shape this from the beginning.</p>
                
                <p style="color: #a78bfa; font-weight: 600;">— XCROL</p>
                
                <a href="https://www.xcrol.com/profile" class="cta">Complete Your Profile</a>
                
                <div class="footer">
                  <p>You received this email because you signed up for XCROL.</p>
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

    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
