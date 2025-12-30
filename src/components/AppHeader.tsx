import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import AudioMuteButton from "./AudioMuteButton";

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/powers")}
        className="h-9 w-9"
      >
        <Home className="h-5 w-5" />
      </Button>
      <AudioMuteButton />
      <NotificationBell />
      <UserMenu />
    </header>
  );
};

export default AppHeader;
