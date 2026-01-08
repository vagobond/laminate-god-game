import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Powers from "./pages/Powers";
import Auth from "./pages/Auth";
import TheRiver from "./pages/TheRiver";
import MiniGamesHub from "./pages/MiniGamesHub";
import IRLLayer from "./pages/IRLLayer";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import GettingStarted from "./pages/GettingStarted";
import InviteFriends from "./pages/InviteFriends";
import MyXcrol from "./pages/MyXcrol";
import UserXcrol from "./pages/UserXcrol";
import EveryCountry from "./pages/EveryCountry";
import NotFound from "./pages/NotFound";
import AppHeader from "./components/AppHeader";
import OAuthAuthorize from "./pages/OAuthAuthorize";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Developers from "./pages/Developers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppHeader />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/powers" element={<Powers />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/the-river" element={<TheRiver />} />
          <Route path="/mini-games-hub" element={<MiniGamesHub />} />
          <Route path="/irl-layer" element={<IRLLayer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/u/:userId" element={<PublicProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/getting-started" element={<GettingStarted />} />
          <Route path="/invite-friends" element={<InviteFriends />} />
          <Route path="/my-xcrol" element={<MyXcrol />} />
          <Route path="/xcrol/:username" element={<UserXcrol />} />
          <Route path="/every-country" element={<EveryCountry />} />
          <Route path="/oauth/authorize" element={<OAuthAuthorize />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/:username" element={<PublicProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
