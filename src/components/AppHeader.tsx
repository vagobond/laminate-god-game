import { useNavigate } from "react-router-dom";
import { Home, Globe, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import AudioMuteButton from "./AudioMuteButton";
import { ThemeToggle } from "./ThemeToggle";

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-2">
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
      <AudioMuteButton />
      <ThemeToggle />
      <NotificationBell />
      <UserMenu />
    </header>
  );
};

export default AppHeader;
