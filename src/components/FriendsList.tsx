import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useFriendsData } from "@/components/friends/useFriendsData";
import { FriendItem } from "@/components/friends/FriendItem";
import { ReceivedRequestsSection, SentRequestsSection } from "@/components/friends/FriendRequestSections";
import { EditLevelDialog, AcceptRequestDialog, UnfriendDialog, MessageFriendDialog } from "@/components/friends/FriendsDialogs";
import type { Friend, FriendRequest, FriendshipLevel } from "@/components/friends/types";

interface FriendsListProps {
  userId: string;
  viewerId?: string | null;
  showLevels?: boolean;
}

const FriendsList = ({ userId, viewerId, showLevels = false }: FriendsListProps) => {
  const navigate = useNavigate();
  const {
    regularFriends,
    secretFriends,
    secretEnemies,
    sentRequests,
    receivedRequests,
    loading,
    customFriendshipType,
    processing,
    isOwnProfile,
    nudgeFriendRequest,
    cancelSentRequest,
    declineRequest,
    acceptRequest,
    unfriend,
    updateFriendLevel,
  } = useFriendsData({ userId, viewerId });

  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [unfriendingFriend, setUnfriendingFriend] = useState<Friend | null>(null);
  const [messagingFriend, setMessagingFriend] = useState<Friend | null>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<FriendRequest | null>(null);

  const handleEditLevel = async (friend: Friend) => {
    const { data } = await supabase
      .from("friendships")
      .select("uses_custom_type")
      .eq("id", friend.id)
      .single();
    setEditingFriend({ ...friend, uses_custom_type: data?.uses_custom_type || false });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Loading friends...</p>
        </CardContent>
      </Card>
    );
  }

  if (regularFriends.length === 0 && secretFriends.length === 0 && secretEnemies.length === 0 && sentRequests.length === 0 && receivedRequests.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No friends yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/the-forest")}
          >
            <Users className="w-5 h-5" />
            Friends ({regularFriends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isOwnProfile && (
            <ReceivedRequestsSection
              requests={receivedRequests}
              onAccept={setAcceptingRequest}
              onDecline={declineRequest}
            />
          )}

          {regularFriends.length > 0 ? (
            <div className="space-y-2">
              {regularFriends.map((friend) => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  isOwnProfile={isOwnProfile}
                  showLevelBadge={isOwnProfile}
                  customTypeName={customFriendshipType?.name}
                  onMessage={setMessagingFriend}
                  onEdit={handleEditLevel}
                  onUnfriend={setUnfriendingFriend}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No friends yet</p>
          )}

          {isOwnProfile && secretFriends.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-purple-500 mb-3">Shadow Allies (Secret Friends) ({secretFriends.length})</h4>
              <div className="space-y-2">
                {secretFriends.map((friend) => (
                  <FriendItem
                    key={friend.id}
                    friend={friend}
                    isOwnProfile={isOwnProfile}
                    showLevelBadge={false}
                    customTypeName={customFriendshipType?.name}
                    onMessage={setMessagingFriend}
                    onEdit={handleEditLevel}
                    onUnfriend={setUnfriendingFriend}
                  />
                ))}
              </div>
            </div>
          )}

          {isOwnProfile && secretEnemies.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-red-500 mb-3">Shadow Friends (Secret Enemies) ({secretEnemies.length})</h4>
              <p className="text-xs text-muted-foreground mb-2">They think they're your friend, but get no real access or see decoy info.</p>
              <div className="space-y-2">
                {secretEnemies.map((friend) => (
                  <FriendItem
                    key={friend.id}
                    friend={friend}
                    isOwnProfile={isOwnProfile}
                    showLevelBadge={false}
                    customTypeName={customFriendshipType?.name}
                    onMessage={setMessagingFriend}
                    onEdit={handleEditLevel}
                    onUnfriend={setUnfriendingFriend}
                  />
                ))}
              </div>
            </div>
          )}

          {isOwnProfile && (
            <SentRequestsSection
              requests={sentRequests}
              onNudge={nudgeFriendRequest}
              onCancel={cancelSentRequest}
            />
          )}
        </CardContent>
      </Card>

      <EditLevelDialog
        friend={editingFriend}
        customFriendshipType={customFriendshipType}
        processing={processing}
        onClose={() => setEditingFriend(null)}
        onSave={(friendId, level, usesCustom) => {
          updateFriendLevel(friendId, level === "custom" ? "buddy" : level, usesCustom);
          setEditingFriend(null);
        }}
      />

      <AcceptRequestDialog
        request={acceptingRequest}
        customFriendshipType={customFriendshipType}
        processing={processing}
        onClose={() => setAcceptingRequest(null)}
        onAccept={(request, level, useCustom) => {
          acceptRequest(request, level, useCustom);
          setAcceptingRequest(null);
        }}
      />

      <UnfriendDialog
        friend={unfriendingFriend}
        onClose={() => setUnfriendingFriend(null)}
        onConfirm={(friend) => {
          unfriend(friend);
          setUnfriendingFriend(null);
        }}
      />

      <MessageFriendDialog
        friend={messagingFriend}
        onClose={() => setMessagingFriend(null)}
      />
    </>
  );
};

export default FriendsList;
