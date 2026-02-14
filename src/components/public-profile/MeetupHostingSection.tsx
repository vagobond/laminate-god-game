import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Home } from "lucide-react";
import { MeetupRequestDialog } from "@/components/MeetupRequestDialog";
import { HostingRequestDialog } from "@/components/HostingRequestDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MeetupHostingSectionProps {
  resolvedUserId: string;
  profileName: string;
  isOwnProfile: boolean;
  prefsLoading: boolean;
  meetupPrefs: any;
  hostingPrefs: any;
  canRequestMeetupOrHosting: boolean;
  isLoggedIn: boolean;
}

export const MeetupHostingSection = ({
  resolvedUserId,
  profileName,
  isOwnProfile,
  prefsLoading,
  meetupPrefs,
  hostingPrefs,
  canRequestMeetupOrHosting,
  isLoggedIn,
}: MeetupHostingSectionProps) => {
  const navigate = useNavigate();
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
  const [showInsufficientLevelModal, setShowInsufficientLevelModal] = useState<"meetup" | "hosting" | null>(null);

  const shouldShow = prefsLoading || meetupPrefs?.is_open_to_meetups || hostingPrefs?.is_open_to_hosting || isOwnProfile;
  if (!shouldShow) return null;

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          {prefsLoading ? (
            <p className="text-center text-muted-foreground text-sm">Loading meetups & hosting…</p>
          ) : isOwnProfile ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">Meetups & Hosting</h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {meetupPrefs?.is_open_to_meetups && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                    <Coffee className="w-4 h-4 text-primary" />
                    <span>Open to Meetups</span>
                  </div>
                )}
                {hostingPrefs?.is_open_to_hosting && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                    <Home className="w-4 h-4 text-primary" />
                    <span>Open to Hosting</span>
                  </div>
                )}
              </div>

              {!meetupPrefs?.is_open_to_meetups && !hostingPrefs?.is_open_to_hosting && (
                <p className="text-center text-muted-foreground text-sm">
                  You haven't enabled meetups or hosting. Go to your{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/profile")}>
                    profile settings
                  </Button>
                  .
                </p>
              )}

              {meetupPrefs?.meetup_description && (
                <p className="text-sm text-muted-foreground text-center italic">
                  Meetups: "{meetupPrefs.meetup_description}"
                </p>
              )}
              {hostingPrefs?.hosting_description && (
                <p className="text-sm text-muted-foreground text-center italic">
                  Hosting: "{hostingPrefs.hosting_description}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">Meetups & Hosting</h2>

              <div className="flex flex-wrap gap-4 justify-center">
                {meetupPrefs?.is_open_to_meetups && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                    <Coffee className="w-4 h-4 text-primary" />
                    <span>Open to Meetups</span>
                  </div>
                )}
                {hostingPrefs?.is_open_to_hosting && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                    <Home className="w-4 h-4 text-primary" />
                    <span>Open to Hosting</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {meetupPrefs?.is_open_to_meetups && (
                  <div className="text-center">
                    {canRequestMeetupOrHosting ? (
                      <MeetupRequestDialog recipientId={resolvedUserId} recipientName={profileName} />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!isLoggedIn) setShowLoginRequiredModal(true);
                          else setShowInsufficientLevelModal("meetup");
                        }}
                      >
                        <Coffee className="w-4 h-4 mr-2" />
                        Request Meetup
                      </Button>
                    )}
                    {meetupPrefs.meetup_description && (
                      <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                        {meetupPrefs.meetup_description}
                      </p>
                    )}
                  </div>
                )}
                {hostingPrefs?.is_open_to_hosting && (
                  <div className="text-center">
                    {canRequestMeetupOrHosting ? (
                      <HostingRequestDialog recipientId={resolvedUserId} recipientName={profileName} />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!isLoggedIn) setShowLoginRequiredModal(true);
                          else setShowInsufficientLevelModal("hosting");
                        }}
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Request to Stay
                      </Button>
                    )}
                    {hostingPrefs.hosting_description && (
                      <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                        {hostingPrefs.hosting_description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Required Modal */}
      <AlertDialog open={showLoginRequiredModal} onOpenChange={setShowLoginRequiredModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to create a free account to request meetups and hosting. Join our community to connect with travelers around the world!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/auth")}>
              Sign Up Free
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Insufficient Friendship Level Modal */}
      <AlertDialog open={!!showInsufficientLevelModal} onOpenChange={() => setShowInsufficientLevelModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Friendship Level Required</AlertDialogTitle>
            <AlertDialogDescription>
              You don't have the required friendship trust level to send a {showInsufficientLevelModal} request to {profileName}.
              Build your connection first by becoming friends at the "Wayfarer (Acquaintance)" level or higher.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInsufficientLevelModal(null)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
