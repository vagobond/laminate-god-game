import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  trust_level: string;
  require_approval: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_member?: boolean;
  is_admin?: boolean;
  membership_status?: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  link: string | null;
  created_at: string;
  updated_at?: string | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export const useGroups = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      const { data: groups, error } = await supabase
        .from("groups")
        .select("id, name, slug, description, avatar_url, trust_level, require_approval, creator_id, created_at, updated_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!groups.length) return [] as Group[];

      const groupIds = groups.map((g) => g.id);

      // Get member counts using SECURITY DEFINER function (visible even for non-members)
      const countPromises = groupIds.map((id) =>
        supabase.rpc("get_group_member_count", { target_group_id: id })
      );
      const countResults = await Promise.all(countPromises);
      const countMap = new Map<string, number>();
      groupIds.forEach((id, i) => {
        countMap.set(id, (countResults[i].data as number) ?? 0);
      });

      // Get current user's membership info (RLS will return only rows the user can see)
      let myMembershipMap = new Map<string, { status: string; role: string }>();
      if (user) {
        const { data: myMemberships } = await supabase
          .from("group_members")
          .select("group_id, status, role")
          .eq("user_id", user.id)
          .in("group_id", groupIds);

        for (const m of myMemberships ?? []) {
          myMembershipMap.set(m.group_id, { status: m.status, role: m.role });
        }
      }

      return groups.map((g) => {
        const myMembership = myMembershipMap.get(g.id);

        return {
          ...g,
          member_count: countMap.get(g.id) ?? 0,
          is_member: myMembership?.status === "active",
          is_admin: false,
          membership_status: myMembership?.status ?? null,
        } as Group;
      });
    },
  });
};

export const useGroupBySlug = (slug: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug");

      // maybeSingle: a missing group is a successful null result, not an
      // error — .single() threw PGRST116 on zero rows, which made
      // GroupProfile's error/retry card fire for genuinely absent groups.
      const { data: group, error } = await supabase
        .from("groups")
        .select("id, name, slug, description, avatar_url, trust_level, require_approval, creator_id, created_at, updated_at")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!group) return null;

      // Use SECURITY DEFINER RPC so anon visitors can read member counts too
      const { data: countData } = await supabase.rpc("get_group_member_count", {
        target_group_id: group.id,
      });
      const count = (countData as number | null) ?? 0;

      let is_member = false;
      let is_admin = false;
      let membership_status: string | null = null;

      if (user) {
        const { data: mem } = await supabase
          .from("group_members")
          .select("status, role")
          .eq("group_id", group.id)
          .eq("user_id", user.id)
          .maybeSingle();

        membership_status = mem?.status ?? null;
        is_member = mem?.status === "active";
        is_admin = is_member && (mem?.role === "admin" || mem?.role === "co_admin");
      }

      return {
        ...group,
        member_count: count ?? 0,
        is_member,
        is_admin,
        membership_status,
      } as Group;
    },
    enabled: !!slug,
  });
};

export const useGroupMembers = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from("group_members")
        .select("id, group_id, user_id, role, status, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Enrich with profiles
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      return data.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? null,
      })) as GroupMember[];
    },
    enabled: !!groupId,
  });
};

export const useGroupPosts = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ["group-posts", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from("group_posts")
        .select("id, group_id, user_id, content, link, created_at, updated_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      return data.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id) ?? null,
      })) as GroupPost[];
    },
    enabled: !!groupId,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      slug: string;
      description?: string;
      trust_level: string;
      avatar_url?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Create the group
      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name: params.name,
          slug: params.slug,
          description: params.description ?? null,
          trust_level: params.trust_level,
          avatar_url: params.avatar_url ?? null,
          creator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "admin",
          status: "active",
        });

      if (memberError) throw memberError;
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Group created!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating group", description: err.message, variant: "destructive" });
    },
  });
};

export const useCreateGroupPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { group_id: string; content: string; link?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("group_posts").insert({
        group_id: params.group_id,
        user_id: user.id,
        content: params.content,
        link: params.link ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["group-posts", vars.group_id] });
    },
    onError: (err: Error) => {
      toast({ title: "Error posting", description: err.message, variant: "destructive" });
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { groupId: string; requireApproval: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const status = params.requireApproval ? "pending" : "active";
      const { error } = await supabase.from("group_members").insert({
        group_id: params.groupId,
        user_id: user.id,
        role: "member",
        status,
      });
      if (error) throw error;
      return { requireApproval: params.requireApproval };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      toast({ title: result.requireApproval ? "Join request sent!" : "Joined group!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      toast({ title: "Left group" });
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { memberId: string; updates: { status?: string; role?: string } }) => {
      const { error } = await supabase
        .from("group_members")
        .update(params.updates)
        .eq("id", params.memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
    },
  });
};

export const useUpdateGroupPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { postId: string; groupId: string; content: string; link?: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("group_posts")
        .update({ content: params.content, link: params.link ?? null })
        .eq("id", params.postId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["group-posts", vars.groupId] });
      toast({ title: "Post updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating post", description: err.message, variant: "destructive" });
    },
  });
};

export const useDeleteGroupPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string; groupId: string }) => {
      const { error } = await supabase
        .from("group_posts")
        .delete()
        .eq("id", params.postId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["group-posts", vars.groupId] });
    },
  });
};


export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      groupId: string;
      updates: { name?: string; description?: string | null; avatar_url?: string | null; trust_level?: string; require_approval?: boolean };
    }) => {
      const { error } = await supabase
        .from("groups")
        .update(params.updates)
        .eq("id", params.groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
      toast({ title: "Group updated!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating group", description: err.message, variant: "destructive" });
    },
  });
};
