import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserIcon, LogIn, LogOut, Settings, Shield, Mail, Scroll, Users, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useUnreadMessages } from "@/hooks/use-unread-messages";

const UserMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { unreadCount, refreshUnreadCount } = useUnreadMessages(user?.id || null);

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      setDisplayName(null);
      setIsAdmin(false);
      return;
    }
    // Defer data fetches outside onAuthStateChange to avoid deadlocks
    loadProfile(user.id);
    checkAdminStatus(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);


  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, display_name, username")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setAvatarUrl(data.avatar_url);
      setDisplayName(data.display_name);
      setUsername(data.username);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  if (!user) {
    return (
      <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && user?.id) refreshUnreadCount();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || undefined} alt={displayName || "User"} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-background border border-border" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {displayName && <p className="font-medium">{displayName}</p>}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            const handle = (username ?? "").replace(/^@+/, "");
            navigate(handle ? `/@${handle}` : `/u/${user.id}`);
          }}
          className="cursor-pointer"
        >
          <UserIcon className="w-4 h-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/the-forest")}
          className="cursor-pointer"
        >
          <Users className="w-4 h-4 mr-2" />
          My Friends
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer">
          <Mail className="w-4 h-4 mr-2" />
          Messages
          {unreadCount > 0 && (
            <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/my-xcrol")} className="cursor-pointer">
          <Scroll className="w-4 h-4 mr-2" />
          My Xcrol
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/getting-started")} className="cursor-pointer">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & FAQ
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
            <Shield className="w-4 h-4 mr-2" />
            Admin Dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
