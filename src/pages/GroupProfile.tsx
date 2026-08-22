import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useGroupBySlug,
  useGroupMembers,
  useGroupPosts,
  useCreateGroupPost,
  useJoinGroup,
  useLeaveGroup,
  useUpdateMember,
  useDeleteGroupPost,
  useUpdateGroupPost,
  useUpdateGroup,
} from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import GroupHeader from "@/components/group/GroupHeader";
import GroupPostsTab from "@/components/group/GroupPostsTab";
import GroupMembersTab from "@/components/group/GroupMembersTab";
import GroupRequestsTab from "@/components/group/GroupRequestsTab";
import GroupSettingsTab from "@/components/group/GroupSettingsTab";

const GroupProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const focusPostId = searchParams.get("post");
  const focusCommentId = searchParams.get("comment");
  const { user } = useAuth();
  const { data: group, isLoading, isError, refetch } = useGroupBySlug(slug);
  const { data: members } = useGroupMembers(group?.id);
  // Load posts whenever the viewer can see them: members OR anyone (incl. guests)
  // when the group is publicly readable.
  const isPublicGroup = group?.trust_level === "public";
  const canReadPosts = !!group && (group.is_member || isPublicGroup);
  const { data: posts } = useGroupPosts(canReadPosts ? group?.id : undefined);
  const createPost = useCreateGroupPost();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const updateMember = useUpdateMember();
  const deletePost = useDeleteGroupPost();
  const updatePost = useUpdateGroupPost();
  const updateGroup = useUpdateGroup();

  // Server-side last_visited_at: captured on mount, then updated server-side
  const [lastVisitedAt, setLastVisitedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!group?.id || !user?.id || !group.is_member) return;

    let cancelled = false;

    const recordVisit = async () => {
      // First, read the current last_visited_at so we can show "New" badges for posts since then
      const { data: membership } = await supabase
        .from("group_members")
        .select("last_visited_at, created_at")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (cancelled) return;

      if (membership) {
        // Use last_visited_at if set, otherwise fall back to membership created_at
        setLastVisitedAt(membership.last_visited_at ?? membership.created_at);
      }

      // Now update last_visited_at to now() on the server
      await supabase
        .from("group_members")
        .update({ last_visited_at: new Date().toISOString() })
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .eq("status", "active");

      // Tell the Village activity hook to recompute so the header badge clears
      if (!cancelled) {
        window.dispatchEvent(new Event("village-visited"));
      }
    };

    recordVisit();

    return () => {
      cancelled = true;
    };
  }, [group?.id, user?.id, group?.is_member]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // A failed request (network blip, expired token) is not a missing group.
  if (isError && !group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-muted-foreground">Couldn't load this group — probably a connection blip.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const activeMembers = members?.filter((m) => m.status === "active") ?? [];
  const pendingMembers = members?.filter((m) => m.status === "pending") ?? [];
  const isCreator = user?.id === group.creator_id;

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-20 pb-8 max-w-3xl mx-auto">
      <Helmet>
        <title>{group.name} | The Village | Xcrol</title>
        <meta name="description" content={group.description ?? `${group.name} group`} />
      </Helmet>

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <Link to="/the-village">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to The Village
        </Link>
      </Button>

      <GroupHeader
        group={group}
        isCreator={isCreator}
        userId={user?.id}
        onJoin={() => joinGroup.mutate({ groupId: group.id, requireApproval: group.require_approval })}
        onLeave={() => leaveGroup.mutate(group.id)}
        joinPending={joinGroup.isPending}
      />

      {group.is_member ? (
        <Tabs defaultValue="posts">
           <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="members">Members ({activeMembers.length})</TabsTrigger>
            {group.is_admin && pendingMembers.length > 0 && (
              <TabsTrigger value="requests">Requests ({pendingMembers.length})</TabsTrigger>
            )}
            {group.is_admin && (
              <TabsTrigger value="settings">Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <GroupPostsTab
              posts={posts}
              group={group}
              userId={user?.id}
              onCreatePost={async (content, link) => {
                await createPost.mutateAsync({ group_id: group.id, content, link });
              }}
              onDeletePost={(postId) => deletePost.mutate({ postId, groupId: group.id })}
              onUpdatePost={async (postId, content, link) => {
                await updatePost.mutateAsync({ postId, groupId: group.id, content, link });
              }}
              createPending={createPost.isPending}
              lastVisitedAt={lastVisitedAt}
              focusPostId={focusPostId}
              focusCommentId={focusCommentId}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <GroupMembersTab
              members={activeMembers}
              isAdmin={!!group.is_admin}
              userId={user?.id}
              onPromote={(id) => updateMember.mutate({ memberId: id, updates: { role: "co_admin" } })}
              onDemote={(id) => updateMember.mutate({ memberId: id, updates: { role: "member" } })}
            />
          </TabsContent>

          {group.is_admin && (
            <TabsContent value="requests" className="mt-4">
              <GroupRequestsTab
                pendingMembers={pendingMembers}
                onApprove={(id) => updateMember.mutate({ memberId: id, updates: { status: "active" } })}
                onReject={(id) => updateMember.mutate({ memberId: id, updates: { status: "rejected" } })}
              />
            </TabsContent>
          )}

          {group.is_admin && (
            <TabsContent value="settings" className="mt-4">
              <GroupSettingsTab
                group={group}
                onSave={async (updates) => {
                  await updateGroup.mutateAsync({ groupId: group.id, updates });
                }}
                saving={updateGroup.isPending}
              />
            </TabsContent>
          )}
        </Tabs>
      ) : isPublicGroup ? (
        <GroupPostsTab
          posts={posts}
          group={group}
          userId={user?.id}
          onCreatePost={async (content, link) => {
            await createPost.mutateAsync({ group_id: group.id, content, link });
          }}
          onDeletePost={(postId) => deletePost.mutate({ postId, groupId: group.id })}
          onUpdatePost={async (postId, content, link) => {
            await updatePost.mutateAsync({ postId, groupId: group.id, content, link });
          }}
          createPending={createPost.isPending}
          lastVisitedAt={lastVisitedAt}
          focusPostId={focusPostId}
          focusCommentId={focusCommentId}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{user ? "Join this group to see posts and members" : "Sign in and join this group to see posts and members"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GroupProfile;
