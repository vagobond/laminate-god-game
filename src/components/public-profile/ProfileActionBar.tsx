import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Share2, Ban } from "lucide-react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AddFriendButton from "@/components/AddFriendButton";
import SendMessageDialog from "@/components/SendMessageDialog";
import type { PublicProfileData, FriendshipLevel } from "./usePublicProfileData";

interface ProfileActionBarProps {
  profile: PublicProfileData;
  resolvedUserId: string;
  username?: string;
  isOwnProfile: boolean;
  currentUserId: string | null;
  friendshipLevel: FriendshipLevel;
}

export const ProfileActionBar = ({
  profile,
  resolvedUserId,
  username,
  isOwnProfile,
  currentUserId,
  friendshipLevel,
}: ProfileActionBarProps) => {
  const navigate = useNavigate();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleBlockUser = async () => {
    if (!currentUserId || !resolvedUserId) return;

    setBlocking(true);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .insert({
          blocker_id: currentUserId,
          blocked_id: resolvedUserId,
        });

      if (error) throw error;

      toast.success(`Blocked ${profile.display_name || "this user"}`);
      setShowBlockDialog(false);
      navigate("/irl-layer");
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    } finally {
      setBlocking(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate("/irl-layer")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const ogUrl = username
                ? `https://ceuaibqpikcvcnmuesos.supabase.co/functions/v1/og-profile?username=${username.replace(/^@/, "")}`
                : `https://ceuaibqpikcvcnmuesos.supabase.co/functions/v1/og-profile?userId=${resolvedUserId}`;
              navigator.clipboard.writeText(ogUrl);
              toast.success("Profile link copied! Share it anywhere for a nice preview.");
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {isOwnProfile && (
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
          {resolvedUserId && friendshipLevel && (
            <SendMessageDialog
              recipientId={resolvedUserId}
              recipientName={profile.display_name || "User"}
              friendshipLevel={friendshipLevel}
              availablePlatforms={{
                linkedin: !!profile.linkedin_url,
                email: !!profile.contact_email,
                instagram: !!profile.instagram_url,
                whatsapp: !!profile.whatsapp,
                phone: !!profile.phone_number,
              }}
            />
          )}
          {resolvedUserId && <AddFriendButton profileUserId={resolvedUserId} />}
          {currentUserId && !isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowBlockDialog(true)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Block
            </Button>
          )}
        </div>
      </div>

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {profile.display_name || "this user"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this user? They won't be able to see your profile, send you messages, or add you as a friend. You can unblock them later from your profile settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              disabled={blocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blocking ? "Blocking..." : "Block User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
