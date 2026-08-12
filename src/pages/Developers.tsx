import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Code, Key, ArrowRight, ExternalLink } from "lucide-react";
import EndpointsSection from "./developers/EndpointsSection";
import QuickStartSection from "./developers/QuickStartSection";
import CodeExamplesSection from "./developers/CodeExamplesSection";
import TroubleshootingSection from "./developers/TroubleshootingSection";

export default function Developers() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-14">
      <Helmet>
        <title>Xcrol Developers — OAuth & API Documentation</title>
        <meta name="description" content="Build apps on XCROL. OAuth 2.0 flows, API endpoints, and the connection-degree primitive for trust-aware integrations." />
        <link rel="canonical" href="https://xcrol.com/developers" />
        <meta property="og:title" content="Xcrol Developers — OAuth & API Documentation" />
        <meta property="og:description" content="Build apps on XCROL. OAuth 2.0 flows, API endpoints, and the connection-degree primitive for trust-aware integrations." />
        <meta property="og:url" content="https://xcrol.com/developers" />
      </Helmet>

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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <EndpointsSection />
          <QuickStartSection />
          <CodeExamplesSection />

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

          <TroubleshootingSection />

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
