import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Eye, Link2, Code, Scroll } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import BlockedUsersManager from "@/components/BlockedUsersManager";
import ConnectedAppsManager from "@/components/ConnectedAppsManager";
import DeveloperAppsManager from "@/components/DeveloperAppsManager";
import { useTutorial } from "@/components/onboarding";
import { useSettingsData } from "@/components/settings/useSettingsData";
import { IntegrationsSection } from "@/components/settings/IntegrationsSection";
import { DataPrivacySection } from "@/components/settings/DataPrivacySection";
import { NotificationsPrivacySection } from "@/components/settings/NotificationsPrivacySection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { AccountDeletionSection } from "@/components/settings/AccountDeletionSection";

const Settings = () => {
  const navigate = useNavigate();
  const { reopenTutorial } = useTutorial();
  const { user, loading: authLoading } = useAuth();

  const {
    settings,
    settingsLoaded,
    handleSettingChange,
    existingRequest,
    setExistingRequest,
    loadingRequest,
    loadDeletionRequest,
  } = useSettingsData(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !settingsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and data controls</p>
            </div>

            <IntegrationsSection />
            <DataPrivacySection settings={settings} onSettingChange={handleSettingChange} />
            <NotificationsPrivacySection settings={settings} onSettingChange={handleSettingChange} />
            <PasswordSection />

            {/* Blocked Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Blocked Users
                </CardTitle>
                <CardDescription>Manage users you've blocked</CardDescription>
              </CardHeader>
              <CardContent>
                <BlockedUsersManager />
              </CardContent>
            </Card>

            {/* Connected Apps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Connected Apps
                </CardTitle>
                <CardDescription>
                  Apps you've authorized to access your XCROL account. Revoke access anytime.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectedAppsManager />
              </CardContent>
            </Card>

            {/* Developer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Developer
                </CardTitle>
                <CardDescription>
                  Create OAuth apps to let other sites use "Login with XCROL".{" "}
                  <a href="https://xcrol.com/developers" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View documentation →
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeveloperAppsManager />
              </CardContent>
            </Card>

            {/* Help & Tutorial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scroll className="w-5 h-5" />
                  Help & Tutorial
                </CardTitle>
                <CardDescription>Revisit the guided introduction to XCROL</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    reopenTutorial();
                    navigate("/powers");
                  }}
                  className="w-full"
                >
                  <Scroll className="w-4 h-4 mr-2" />
                  Reopen the Scroll
                </Button>
              </CardContent>
            </Card>

            {user && (
              <AccountDeletionSection
                userId={user.id}
                existingRequest={existingRequest}
                loadingRequest={loadingRequest}
                setExistingRequest={setExistingRequest}
                loadDeletionRequest={loadDeletionRequest}
              />
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Settings;
