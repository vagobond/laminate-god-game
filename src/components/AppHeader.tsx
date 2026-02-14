import { useNavigate } from "react-router-dom";
import { Home, Globe, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import AudioMuteButton from "./AudioMuteButton";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/use-auth";

const AppHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-2">
      {user && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/powers")}
            className="h-9 w-9"
            title="Home"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/irl-layer")}
            className="h-9 w-9"
            title="The World"
          >
            <Globe className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/the-river")}
            className="h-9 w-9"
            title="The River"
          >
            <Waves className="h-5 w-5" />
          </Button>
        </>
      )}
      <AudioMuteButton />
      <ThemeToggle />
      {user && <NotificationBell />}
      <UserMenu />
    </header>
  );
};

export default AppHeader;
