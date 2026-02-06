import { useState } from "react";
import { Copy, Check, ExternalLink, Code, Key, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const SUPABASE_URL = "https://ceuaibqpikcvcnmuesos.supabase.co";
const XCROL_PUBLIC_API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const endpoints = {
  authorization: "https://xcrol.com/oauth/authorize",
  token: `${SUPABASE_URL}/functions/v1/oauth-token`,
  userinfo: `${SUPABASE_URL}/functions/v1/oauth-userinfo`,
};

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

const EndpointCard = ({ title, url, method = "GET" }: { title: string; url: string; method?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded shrink-0">
          {method}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{url}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default function Developers() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80">
            <img src="/favicon.png" alt="Xcrol" className="h-8 w-8" />
            <span className="font-semibold">Xcrol Developers</span>
          </button>
          <Button variant="outline" onClick={() => navigate("/settings")}>
            <Key className="h-4 w-4 mr-2" />
            Manage Apps
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Login with Xcrol</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Let users sign in with their Xcrol account. Access profile data, connections, and more with OAuth 2.0.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/settings")}>
              <Code className="h-4 w-4 mr-2" />
              Create an App
            </Button>
            <Button variant="outline" asChild>
              <a href="#quick-start">
                Quick Start
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Endpoints */}
          <section>
            <h2 className="text-2xl font-bold mb-6">OAuth Endpoints</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  API Endpoints
                </CardTitle>
                <CardDescription>
                  Use these exact URLs in your OAuth implementation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <EndpointCard 
                  title="Authorization (User Consent)" 
                  url={endpoints.authorization}
                  method="GET"
                />
                <EndpointCard 
                  title="Token Exchange" 
                  url={endpoints.token}
                  method="POST"
                />
                <EndpointCard 
                  title="User Info" 
                  url={endpoints.userinfo}
                  method="GET"
                />
              </CardContent>
            </Card>

<div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Required:</strong> Requests to <strong>Token Exchange</strong> and <strong>User Info</strong> must include an
                <code className="bg-background px-1 rounded mx-1">apikey</code> header. If you omit it, you'll often see
                <strong className="mx-1">"Authentication Failed"</strong> and the request may not reach the endpoint.
              </p>
              <CodeBlock code={`apikey: ${XCROL_PUBLIC_API_KEY}`} />
              <p className="text-xs text-muted-foreground mt-3">
                (Some HTTP clients support passing this as a URL query param 
                <code className="bg-background px-1 rounded mx-1">?apikey=...</code>, but headers are recommended.)
              </p>
            </div>

            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>⚠️ Common Mistake:</strong> The Authorization endpoint is the <strong>frontend page</strong> at xcrol.com,
                not the Supabase function. The Token endpoint is the Supabase function. Don't mix these up!
              </p>
            </div>
          </section>

          {/* Quick Start */}
          <section id="quick-start">
            <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
            
            <div className="space-y-6">
<Card>
                <CardHeader>
                  <CardTitle>Step 1: Register Your Application</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Go to your <a href="/settings" className="text-primary underline">Settings → Developer Apps</a> and create a new OAuth application.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li><strong>App Name:</strong> Your application's name (shown to users)</li>
                    <li><strong>Homepage URL:</strong> Your application's homepage</li>
                    <li><strong>Redirect URI:</strong> Where users return after authorization — see the section below for exact formatting</li>
                  </ul>
                  <p className="text-muted-foreground">
                    After creating the app, you'll receive a <strong>Client ID</strong> and <strong>Client Secret</strong>.
                  </p>
                </CardContent>
              </Card>

              {/* Redirect URI Configuration */}
              <Card className="border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Redirect URI Configuration
                  </CardTitle>
                  <CardDescription>
                    The redirect URI must match <strong>exactly</strong>. This is the most common source of authorization errors.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-2">
                      ⛔ Common Mistake: Wrong Path
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Many integrations fail because the path in the registered URI doesn't match the actual callback route in your app.
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-destructive">❌ Wrong: <code className="bg-muted px-1 rounded">/auth/callback/</code> (if your app uses <code className="bg-muted px-1 rounded">/auth/xcrol/callback</code>)</p>
                      <p className="text-primary">✅ Correct: <code className="bg-muted px-1 rounded">/auth/xcrol/callback</code> (must match your actual route)</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Formatting Rules</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li><strong>No trailing slash</strong> — use <code className="bg-muted px-1 rounded">/callback</code> not <code className="bg-muted px-1 rounded">/callback/</code></li>
                      <li><strong>Include protocol</strong> — always include <code className="bg-muted px-1 rounded">https://</code></li>
                      <li><strong>Exact path match</strong> — the path in the URI must match your callback route exactly</li>
                      <li><strong>One URI per line</strong> — each redirect URI must be entered as a separate entry</li>
                      <li><strong>Include www if used</strong> — <code className="bg-muted px-1 rounded">https://www.example.com</code> and <code className="bg-muted px-1 rounded">https://example.com</code> are different URIs</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Example: Multi-Environment Redirect URIs</p>
                    <p className="text-xs text-muted-foreground mb-3">Each of these should be added as a separate entry:</p>
                    <div className="space-y-1 font-mono text-sm">
                      <p className="text-primary">✅ http://localhost:3000/auth/xcrol/callback</p>
                      <p className="text-primary">✅ https://preview--abc123.lovable.app/auth/xcrol/callback</p>
                      <p className="text-primary">✅ https://www.myapp.com/auth/xcrol/callback</p>
                      <p className="text-primary">✅ https://myapp.com/auth/xcrol/callback</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>⚠️ Tip:</strong> Check what callback route your framework uses. For example, some OAuth libraries 
                      use <code className="bg-muted px-1 rounded">/auth/callback</code>, while others use <code className="bg-muted px-1 rounded">/auth/xcrol/callback</code> or <code className="bg-muted px-1 rounded">/api/auth/callback/xcrol</code>. 
                      Your registered URI must match exactly.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Redirect Users to Authorize</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    When a user clicks "Login with Xcrol", redirect them to:
                  </p>
                  <CodeBlock code={`${endpoints.authorization}?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://yourapp.com/auth/xcrol/callback&
  response_type=code&
  scope=profile:read&
  state=RANDOM_STATE_STRING`} />
                  <div className="text-sm space-y-2">
                    <p><strong>Parameters:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><code className="bg-muted px-1 rounded">client_id</code> - Your app's Client ID</li>
                      <li><code className="bg-muted px-1 rounded">redirect_uri</code> - Must match your registered redirect URI exactly</li>
                      <li><code className="bg-muted px-1 rounded">response_type</code> - Always <code className="bg-muted px-1 rounded">code</code></li>
                      <li><code className="bg-muted px-1 rounded">scope</code> - Space-separated scopes (see below)</li>
                      <li><code className="bg-muted px-1 rounded">state</code> - Random string to prevent CSRF (you verify this later)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Exchange Code for Token</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    After the user authorizes, they're redirected to your callback URL with a <code className="bg-muted px-1 rounded">code</code> parameter. 
                    Exchange this for an access token:
                  </p>
                  <CodeBlock code={`POST ${endpoints.token}
Content-Type: application/json
apikey: XCROL_PUBLIC_API_KEY

{
  "grant_type": "authorization_code",
  "code": "THE_AUTH_CODE",
  "redirect_uri": "https://yourapp.com/auth/xcrol/callback",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}`} />
                  <p className="text-muted-foreground text-sm">
                    Response:
                  </p>
                  <CodeBlock code={`{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJl...",
  "scope": "profile:read"
}`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 4: Fetch User Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Use the access token to fetch the user's profile:
                  </p>
                  <CodeBlock code={`GET ${endpoints.userinfo}
Authorization: Bearer ACCESS_TOKEN
apikey: XCROL_PUBLIC_API_KEY`} />
                  <p className="text-muted-foreground text-sm">
                    Response:
                  </p>
                  <CodeBlock code={`{
  "sub": "user-uuid",
  "name": "John Doe",
  "username": "johndoe",
  "picture": "https://...",
  "bio": "Hello world",
  "link": "https://..."
}`} />
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <strong>ℹ️ Note:</strong> The response uses standard OAuth claims: <code className="bg-muted px-1 rounded">sub</code> (user ID), 
                      <code className="bg-muted px-1 rounded">name</code> (display name), and <code className="bg-muted px-1 rounded">picture</code> (avatar URL).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Code Examples */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Code Examples</h2>
            
            <Tabs defaultValue="javascript">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript" className="mt-4">
                <CodeBlock
                  language="javascript"
                  code={`// You must include an apikey header when calling the Token + User Info endpoints.
// This is a PUBLIC key (not your client secret).
const XCROL_PUBLIC_API_KEY = "XCROL_PUBLIC_API_KEY";

// Step 1: Redirect to authorization
const authorizeUrl = new URL("${endpoints.authorization}");
authorizeUrl.searchParams.set("client_id", CLIENT_ID);
authorizeUrl.searchParams.set("redirect_uri", "https://yourapp.com/auth/xcrol/callback");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("scope", "profile:read");
authorizeUrl.searchParams.set("state", crypto.randomUUID());

window.location.href = authorizeUrl.toString();

// Step 2: In your callback handler, exchange the code
async function handleCallback(code) {
  const response = await fetch("${endpoints.token}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: XCROL_PUBLIC_API_KEY,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "https://yourapp.com/auth/xcrol/callback",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error("Token exchange failed [" + response.status + "]: " + errText);
  }

  const tokens = await response.json();
  const access_token = tokens.access_token;

  // Step 3: Fetch user info
  const userResponse = await fetch("${endpoints.userinfo}", {
    headers: {
      Authorization: "Bearer " + access_token,
      apikey: XCROL_PUBLIC_API_KEY,
    },
  });

  if (!userResponse.ok) {
    const errText = await userResponse.text();
    throw new Error("Userinfo failed [" + userResponse.status + "]: " + errText);
  }

  const user = await userResponse.json();

  // Map standard OAuth claims
  const userData = {
    id: user.sub,           // Standard OAuth 'sub' claim
    displayName: user.name, // Standard OAuth 'name' claim
    avatarUrl: user.picture // Standard OAuth 'picture' claim
  };

  console.log("Logged in as:", userData.displayName);
}`} 
                />
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <CodeBlock language="python" code={`import requests
from urllib.parse import urlencode
import secrets

XCROL_PUBLIC_API_KEY = "XCROL_PUBLIC_API_KEY"

# Step 1: Generate authorization URL
params = {
    "client_id": CLIENT_ID,
    "redirect_uri": "https://yourapp.com/auth/xcrol/callback",
    "response_type": "code",
    "scope": "profile:read",
    "state": secrets.token_urlsafe(16)
}
auth_url = f"${endpoints.authorization}?{urlencode(params)}"
# Redirect user to auth_url

# Step 2: Exchange code for token (in callback handler)
def handle_callback(code):
    response = requests.post(
        "${endpoints.token}",
        headers={"apikey": XCROL_PUBLIC_API_KEY},
        json={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": "https://yourapp.com/auth/xcrol/callback",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        }
    )
    response.raise_for_status()
    tokens = response.json()

    # Step 3: Fetch user info
    user_response = requests.get(
        "${endpoints.userinfo}",
        headers={
            "Authorization": f"Bearer {tokens['access_token']}",
            "apikey": XCROL_PUBLIC_API_KEY,
        }
    )
    user_response.raise_for_status()
    user = user_response.json()

    # Map standard OAuth claims
    user_data = {
        "id": user["sub"],
        "display_name": user["name"],
        "avatar_url": user["picture"],
    }
    print(f"Logged in as: {user_data['display_name']}")`} />
              </TabsContent>

              <TabsContent value="curl" className="mt-4">
                <CodeBlock code={`# Exchange authorization code for token
curl -X POST "${endpoints.token}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: XCROL_PUBLIC_API_KEY" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_HERE",
    "redirect_uri": "https://yourapp.com/auth/xcrol/callback",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'

# Fetch user info
curl "${endpoints.userinfo}" \\
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \\
  -H "apikey: XCROL_PUBLIC_API_KEY"`} />
              </TabsContent>
            </Tabs>
          </section>

          {/* Available Scopes */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Available Scopes</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                    <code className="bg-background px-2 py-1 rounded text-sm font-mono">profile:read</code>
                    <div>
                      <p className="font-medium">Read Profile</p>
                      <p className="text-sm text-muted-foreground">Access basic profile info (name, avatar, bio)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                    <code className="bg-background px-2 py-1 rounded text-sm font-mono">connections:read</code>
                    <div>
                      <p className="font-medium">Read Connections</p>
                      <p className="text-sm text-muted-foreground">View the user's friendship connections</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                    <code className="bg-background px-2 py-1 rounded text-sm font-mono">xcrol:read</code>
                    <div>
                      <p className="font-medium">Read Xcrol Entries</p>
                      <p className="text-sm text-muted-foreground">Access the user's Xcrol journal entries</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Troubleshooting */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Troubleshooting</h2>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ Getting HTML instead of JSON from token endpoint</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    You're calling the wrong URL. Make sure you're using the Supabase function URL for the token endpoint:
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-red-500">Wrong: <code className="bg-muted px-1 rounded">https://xcrol.com/oauth/token</code></p>
                    <p className="text-green-500">Correct: <code className="bg-muted px-1 rounded">{endpoints.token}</code></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-destructive mb-2">❌ "Authentication Failed" / 401 when calling Token or User Info</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Your request is missing the required <code className="bg-muted px-1 rounded">apikey</code> header.
                    Add it to both the Token Exchange and User Info calls.
                  </p>
                  <div className="mt-2">
                    <CodeBlock code={`apikey: ${XCROL_PUBLIC_API_KEY}`} />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ Getting JSON directly instead of consent page</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    You're calling the Supabase function directly for authorization. The authorization URL should be the frontend page:
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-red-500">Wrong: <code className="bg-muted px-1 rounded">{SUPABASE_URL}/functions/v1/oauth-authorize</code></p>
                    <p className="text-green-500">Correct: <code className="bg-muted px-1 rounded">{endpoints.authorization}</code></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ "Redirect URI not registered" error</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    The redirect_uri in your request must <strong>exactly</strong> match one of your registered redirect URIs.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Check for trailing slashes (<code className="bg-muted px-1 rounded">/callback</code> vs <code className="bg-muted px-1 rounded">/callback/</code>)</li>
                    <li>Check protocol (<code className="bg-muted px-1 rounded">http</code> vs <code className="bg-muted px-1 rounded">https</code>)</li>
                    <li>Check exact domain and path matching</li>
                    <li>For multi-environment apps, register <strong>all</strong> redirect URIs (dev, staging, production)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ "Failed to load authorization request" or blank page</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Your preview/development URL is different from the registered production URL.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    <strong>Solution:</strong> Register both development and production redirect URIs in your Xcrol app settings, 
                    or hardcode the production redirect URI when building the authorize URL.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ "Session expired or invalid" after redirect</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    The OAuth state was stored in <code className="bg-muted px-1 rounded">sessionStorage</code> on one domain but the callback redirected to a different domain. 
                    <code className="bg-muted px-1 rounded">sessionStorage</code> is not shared across origins.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    <strong>Solution:</strong> Ensure the OAuth flow starts and ends on the same domain. 
                    For multi-environment apps, use the same domain for both initiating auth and receiving the callback.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ "Invalid authorization code" error</h3>
                  <p className="text-muted-foreground text-sm">
                    Authorization codes expire after 10 minutes and can only be used once. 
                    Make sure you're exchanging the code immediately after receiving it.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ "Invalid user data" or user profile not saving correctly</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    You may be using incorrect field names. The <code className="bg-muted px-1 rounded">/oauth-userinfo</code> endpoint returns <strong>standard OAuth claims</strong>, not custom field names.
                  </p>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Correct field mapping:</p>
                    <CodeBlock code={`const xcrolUser = await userInfoResponse.json();

// Correct field mapping
const userId = xcrolUser.sub;           // NOT 'id'
const displayName = xcrolUser.name;     // NOT 'display_name'
const avatarUrl = xcrolUser.picture;    // NOT 'avatar_url'
const bio = xcrolUser.bio;
const username = xcrolUser.username;
const link = xcrolUser.link;`} />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-red-500 mb-2">❌ Blank page after successful OAuth</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Silent JavaScript errors in the callback handler, often due to field mapping issues.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    <strong>Solution:</strong> Add comprehensive error handling and log the actual API response to debug field names:
                  </p>
                  <div className="mt-2">
                    <CodeBlock code={`console.log("Xcrol user data:", JSON.stringify(xcrolUser));`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Multi-Environment Setup */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Multi-Environment Setup</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  If you have multiple environments (development, staging, production), you'll need to register 
                  all redirect URIs in your Xcrol app settings.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Example redirect URIs to register:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground font-mono">
                    <li>http://localhost:3000/auth/xcrol/callback</li>
                    <li>https://myapp-staging.vercel.app/auth/xcrol/callback</li>
                    <li>https://myapp.com/auth/xcrol/callback</li>
                  </ul>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <strong>⚠️ Important:</strong> Ensure the OAuth flow starts and ends on the same domain to avoid 
                    <code className="bg-muted px-1 rounded mx-1">sessionStorage</code> issues with state validation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Support */}
          <section>
            <Card className="bg-muted/50">
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  If you're having trouble integrating Login with Xcrol, reach out to us.
                </p>
                <Button variant="outline" asChild>
                  <a href="mailto:support@xcrol.com">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
