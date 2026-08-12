import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useGroups } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { useGroupActivity } from "@/hooks/use-group-activity";
import { useRequireAuth } from "@/components/auth/GuestAuthGate";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFriendshipShortLabel } from "@/lib/friendship-labels";
import { useEffect, useMemo } from "react";

const TheVillage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const { data: groups, isLoading } = useGroups();
  const isGuest = !user;

  // Guests only see public-trust groups.
  const visibleGroups = useMemo(
    () => (isGuest ? (groups ?? []).filter((g) => g.trust_level === "public") : groups ?? []),
    [groups, isGuest]
  );

  const myGroups = visibleGroups.filter((g) => g.is_member || g.creator_id === user?.id);
  const otherGroups = visibleGroups.filter((g) => !g.is_member && g.creator_id !== user?.id);

  const memberGroupIds = useMemo(() => myGroups.map((g) => g.id), [myGroups]);
  const activityCounts = useGroupActivity(memberGroupIds);

  // Clear the header village badge locally on visit, but DO NOT touch
  // per-group last_visited_at — that's updated only when the user actually
  // opens an individual group, so per-post "New" markers survive.
  useEffect(() => {
    if (!user?.id) return;
    window.dispatchEvent(new Event("village-visited"));
  }, [user?.id]);

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-20 pb-8 max-w-4xl mx-auto">
      <Helmet>
        <title>The Village | Xcrol</title>
        <meta name="description" content="Public communities and groups on XCROL — browse the Village and join the conversation." />
        <link rel="canonical" href="https://xcrol.com/the-village" />
        <meta property="og:title" content="The Village — XCROL" />
        <meta property="og:url" content="https://xcrol.com/the-village" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Button
        variant="ghost"
        size="sm"
        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-glow">The Village</h1>
          <p className="text-muted-foreground mt-1">
            {isGuest ? "Browse public communities — sign up to join or create a group." : "Communities you belong to and can discover"}
          </p>
        </div>
        {user ? (
          <CreateGroupDialog />
        ) : (
          <Button onClick={() => requireAuth("create or join groups")}>Sign up</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {myGroups.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">{isGuest ? "Public Groups" : "Your Groups"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    newPostCount={activityCounts.get(group.id) ?? 0}
                    to={`/group/${group.slug}`}
                  />
                ))}
              </div>
            </section>
          )}

          {otherGroups.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">{isGuest ? "Public Groups" : "Discover Groups"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherGroups.map((group) => (
                  <GroupCard key={group.id} group={group} newPostCount={0} to={`/group/${group.slug}`} />
                ))}
              </div>
            </section>
          )}

          {visibleGroups.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isGuest ? "No public groups yet." : "No groups yet. Be the first to create one!"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GroupCard = ({
  group,
  newPostCount,
  to,
}: {
  group: ReturnType<typeof useGroups>["data"] extends (infer T)[] | undefined ? T : never;
  newPostCount: number;
  to: string;
}) => (
  <Link to={to} className="block no-underline">
  <Card
    className="cursor-pointer hover:border-primary/50 transition-colors"
  >
    <CardHeader className="flex flex-row items-center gap-3 pb-2">
      <div className="relative shrink-0">
        <Avatar className="h-16 w-16 ring-1 ring-border/60 bg-muted">
          {group.avatar_url ? (
            <img src={group.avatar_url} alt={group.name} className="aspect-square h-full w-full object-cover" />
          ) : (
            <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        {newPostCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {newPostCount > 99 ? "99+" : newPostCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <CardTitle className="text-base truncate">{group.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{group.member_count} member{group.member_count !== 1 ? "s" : ""}</p>
      </div>
    </CardHeader>
    <CardContent className="pt-0 space-y-2">
      {group.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs border-secondary/40 bg-secondary/10 text-secondary">
          {getFriendshipShortLabel(group.trust_level)}
        </Badge>
        {group.membership_status === "pending" && (
          <Badge variant="outline" className="text-xs">Pending</Badge>
        )}
      </div>
    </CardContent>
  </Card>
  </Link>
);

export default TheVillage;
