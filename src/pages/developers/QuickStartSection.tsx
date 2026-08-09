import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { CodeBlock, endpoints, XCROL_PUBLIC_API_KEY } from "./shared";

export default function QuickStartSection() {
  return (
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

        <Card>
          <CardHeader>
            <CardTitle>Step 1.5: Copy/Paste Checklist (don't mix these up)</CardTitle>
            <CardDescription>
              Most <strong>"Authentication Failed"</strong> / <strong>non-2xx</strong> errors come from a missing header or swapped credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Client ID (public)</strong>: from <strong>Settings → Developer Apps</strong>. It looks like <code className="bg-muted px-1 rounded">9c611f…</code>
                (this is <em>not</em> the internal UUID).
              </li>
              <li>
                <strong>Client Secret (private)</strong>: from <strong>Settings → Developer Apps</strong>. Keep it server-side only.
              </li>
              <li>
                <strong>Public API Key (public)</strong>: required <code className="bg-muted px-1 rounded">apikey</code> header for calling <strong>Token Exchange</strong> and <strong>User Info</strong>.
              </li>
            </ul>

            <CodeBlock code={`apikey: ${XCROL_PUBLIC_API_KEY}`} />

            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <strong>User Info requires TWO headers:</strong>
              <div className="mt-2 space-y-1 font-mono text-xs">
                <div>Authorization: Bearer &lt;access_token&gt;</div>
                <div>apikey: {XCROL_PUBLIC_API_KEY}</div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <p className="text-sm font-medium text-destructive mb-2">⛔ Common Mistake: Wrong Path</p>
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
                <p className="text-primary">✅ https://staging.myapp.com/auth/xcrol/callback</p>
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
            <p className="text-muted-foreground">When a user clicks "Login with Xcrol", redirect them to:</p>
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
            <p className="text-muted-foreground text-sm">Response:</p>
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
            <p className="text-muted-foreground">Use the access token to fetch the user's profile:</p>
            <CodeBlock code={`GET ${endpoints.userinfo}
Authorization: Bearer ACCESS_TOKEN
apikey: XCROL_PUBLIC_API_KEY`} />
            <p className="text-muted-foreground text-sm">Response:</p>
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
  );
}
