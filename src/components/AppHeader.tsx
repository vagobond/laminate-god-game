import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Globe, Waves, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/components/onboarding";
import villageIconSrc from "@/assets/village-icon.png";
import xcrolLogo from "@/assets/xcrol-logo.webp";
import SurferIcon from "@/components/icons/SurferIcon";

const UserMenu = lazy(() => import("./UserMenu"));
const NotificationBell = lazy(() => import("./NotificationBell"));
const VillageBadge = lazy(() => import("./VillageBadge"));
const WorldBadge = lazy(() => import("./WorldBadge"));

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { reopenTutorial } = useTutorial();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-1 sm:gap-2 border-b border-border/40 bg-background/70 px-2 backdrop-blur-md sm:px-4">
      <button
        onClick={() => navigate(user ? "/powers" : "/")}
        className="mr-auto flex items-center"
        aria-label="XCROL home"
      >
        <img src={xcrolLogo} alt="XCROL" className="h-8 w-auto" />
      </button>
      {authLoading ? null : user ? (
        <>
          <Button variant="ghost" size="icon" onClick={() => navigate("/powers")} className="h-9 w-9" title="Home" aria-label="Home">
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/the-river")} className="h-9 w-9" title="The River" aria-label="The River">
            <Waves className="h-5 w-5" />
          </Button>
          <Suspense fallback={
            <Button variant="ghost" size="icon" className="h-9 w-9" title="The Village">
              <img src={villageIconSrc} alt="Village" className="h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
            </Button>
          }>
            <VillageBadge />
          </Suspense>
          <Suspense fallback={
            <Button variant="ghost" size="icon" className="h-9 w-9" title="The World">
              <Globe className="h-5 w-5" />
            </Button>
          }>
            <WorldBadge />
          </Suspense>
          <Button variant="ghost" size="icon" onClick={() => navigate("/hearthsurf")} className="h-9 w-9" title="Hearth Surf" aria-label="Hearth Surf">
            <SurferIcon className="h-5 w-5" />
          </Button>
        </>
      ) : (
        <>
          {/* Anon visitors don't know the icons yet — show text labels on wider screens */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="h-9 px-2" title="Home" aria-label="Home">
            <Home className="h-5 w-5" />
            <span className="hidden lg:inline text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/the-river")} className="h-9 px-2" title="The River" aria-label="The River">
            <Waves className="h-5 w-5" />
            <span className="hidden lg:inline text-xs">River</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/the-village")} className="h-9 px-2" title="The Village" aria-label="The Village">
            <img src={villageIconSrc} alt="" className="h-5 w-5 invert dark:invert-0 brightness-150 contrast-150" />
            <span className="hidden lg:inline text-xs">Village</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/map")} className="h-9 px-2" title="The World" aria-label="The World">
            <Globe className="h-5 w-5" />
            <span className="hidden lg:inline text-xs">World</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/hearthsurf")} className="h-9 px-2" title="Hearth Surf" aria-label="Hearth Surf">
            <SurferIcon className="h-5 w-5" />
            <span className="hidden lg:inline text-xs">Hearth Surf</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={reopenTutorial} className="h-9 px-2" title="Tour Xcrol" aria-label="Tour Xcrol">
            <Sparkles className="h-5 w-5" />
            <span className="hidden lg:inline text-xs">Tour</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/getting-started")} className="h-9 px-2" title="Help & FAQ" aria-label="Help & FAQ">
            <HelpCircle className="h-5 w-5" />
            <span className="hidden lg:inline text-xs">Help</span>
          </Button>
        </>
      )}
      <ThemeToggle />
      {user && (
        <Suspense fallback={null}>
          <NotificationBell />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <UserMenu />
      </Suspense>
    </header>
  );
};

export default AppHeader;
