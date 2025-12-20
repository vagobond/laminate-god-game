import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Powers from "./pages/Powers";
import AboutLaminate from "./pages/AboutLaminate";
import CreationHub from "./pages/CreationHub";
import CreateLayer from "./pages/CreateLayer";
import ExploreLayers from "./pages/ExploreLayers";
import PaderFamilias from "./pages/PaderFamilias";
import EnterLamsterverse from "./pages/EnterLamsterverse";
import BranchFromVerse from "./pages/BranchFromVerse";
import LayerTree from "./pages/LayerTree";
import Leaderboard from "./pages/Leaderboard";
import Auth from "./pages/Auth";
import OnboardingGuide from "./pages/OnboardingGuide";
import VerseAdventure from "./pages/VerseAdventure";
import DeathHistory from "./pages/DeathHistory";
import IRLLayer from "./pages/IRLLayer";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import AppHeader from "./components/AppHeader";

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
          <Route path="/about-laminate" element={<AboutLaminate />} />
          <Route path="/creation-hub" element={<CreationHub />} />
          <Route path="/create-layer" element={<CreateLayer />} />
          <Route path="/explore-layers" element={<ExploreLayers />} />
          <Route path="/pader-familias" element={<PaderFamilias />} />
          <Route path="/enter-lamsterverse" element={<EnterLamsterverse />} />
          <Route path="/branch-from-verse" element={<BranchFromVerse />} />
          <Route path="/layer-tree" element={<LayerTree />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding-guide" element={<OnboardingGuide />} />
          <Route path="/verse-adventure" element={<VerseAdventure />} />
          <Route path="/death-history" element={<DeathHistory />} />
          <Route path="/irl-layer" element={<IRLLayer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/u/:userId" element={<PublicProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
