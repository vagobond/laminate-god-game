import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Droplets, Search, Mail, User } from "lucide-react";

interface CreateBrookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated: () => void;
}

interface SearchResult {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export const CreateBrookDialog = ({ open, onOpenChange, userId, onCreated }: CreateBrookDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMode, setInviteMode] = useState<"search" | "email">("search");
  const [inactivityDays, setInactivityDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedUser(null);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .neq("id", userId)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users we already have a brook with
      const { data: existingBrooks } = await supabase
        .from("brooks")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .in("status", ["pending", "active"]);

      const existingPartnerIds = new Set(
        (existingBrooks || []).map(b => b.user1_id === userId ? b.user2_id : b.user1_id)
      );

      setSearchResults((data || []).filter(u => !existingPartnerIds.has(u.id)));
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedUser && !inviteEmail) {
      toast.error("Please select a user or enter an email");
      return;
    }

    if (inviteMode === "email" && inviteEmail) {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setLoading(true);
    try {
      // Check if we're at the limit
      const { data: countData } = await supabase
        .from("brooks")
        .select("id", { count: "exact" })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .in("status", ["pending", "active"]);

      if ((countData?.length || 0) >= 5) {
        toast.error("You can only have up to 5 active brooks");
        return;
      }

      let targetUserId = selectedUser?.id;

      // If inviting by email, check if they're already a user
      if (inviteMode === "email" && inviteEmail) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", inviteEmail.toLowerCase())
          .maybeSingle();

        if (existingUser) {
          targetUserId = existingUser.id;
        }
      }

      if (targetUserId) {
        // Check for existing brook
        const { data: existing } = await supabase
          .from("brooks")
          .select("id")
          .or(`and(user1_id.eq.${userId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${userId})`)
          .in("status", ["pending", "active"])
          .maybeSingle();

        if (existing) {
          toast.error("You already have a brook with this person");
          return;
        }

        // Create brook with existing user
        const { error } = await supabase
          .from("brooks")
          .insert({
            user1_id: userId,
            user2_id: targetUserId,
            status: "pending",
            inactivity_days: parseInt(inactivityDays)
          });

        if (error) throw error;
        toast.success("Brook invitation sent!");
      } else {
        // Create brook with email invite (user doesn't exist yet)
        // We need a placeholder user2_id, so we'll use the user1_id temporarily
        // and store the invite email
        const { error } = await supabase
          .from("brooks")
          .insert({
            user1_id: userId,
            user2_id: userId, // Temporary, will be updated when user signs up
            status: "pending",
            inactivity_days: parseInt(inactivityDays),
            invite_email: inviteEmail.toLowerCase()
          });

        if (error) throw error;
        toast.success("Brook invitation created!", { 
          description: "They'll see it when they join XCROL" 
        });
      }

      onCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating brook:", error);
      toast.error("Failed to create brook");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setInviteEmail("");
    setInviteMode("search");
    setInactivityDays("7");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Start a Brook
          </DialogTitle>
          <DialogDescription>
            Create a private two-person stream. Invite by email or find an existing Xcroler.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={inviteMode === "search" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setInviteMode("search")}
              className="flex-1 gap-2"
            >
              <User className="w-4 h-4" />
              Find Xcroler
            </Button>
            <Button
              variant={inviteMode === "email" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setInviteMode("email")}
              className="flex-1 gap-2"
            >
              <Mail className="w-4 h-4" />
              Invite by Email
            </Button>
          </div>

          {inviteMode === "search" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searching && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}

              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchResults([]);
                        setSearchQuery(user.display_name || user.username || "");
                      }}
                      className="w-full p-2 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                        {user.display_name?.[0] || user.username?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{user.display_name || user.username}</p>
                        {user.username && user.display_name && (
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="p-3 bg-secondary/50 rounded-md flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                    {selectedUser.display_name?.[0] || selectedUser.username?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{selectedUser.display_name || selectedUser.username}</p>
                    {selectedUser.username && (
                      <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                They'll see the invite when they join XCROL with this email
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Inactivity reminder after</Label>
            <Select value={inactivityDays} onValueChange={setInactivityDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="9">9 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={loading || (!selectedUser && !inviteEmail)}
          >
            {loading ? "Creating..." : "Start Brook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};