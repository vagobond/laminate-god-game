import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import AppHeader from "./components/AppHeader";

// Lazy load all route components for code splitting
const Welcome = lazy(() => import("./pages/Welcome"));
const Powers = lazy(() => import("./pages/Powers"));
const Auth = lazy(() => import("./pages/Auth"));
const TheRiver = lazy(() => import("./pages/TheRiver"));
const TheForest = lazy(() => import("./pages/TheForest"));
const MiniGamesHub = lazy(() => import("./pages/MiniGamesHub"));
const IRLLayer = lazy(() => import("./pages/IRLLayer"));
const HearthSurfing = lazy(() => import("./pages/HearthSurfing"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
const InviteFriends = lazy(() => import("./pages/InviteFriends"));
const MyXcrol = lazy(() => import("./pages/MyXcrol"));
const UserXcrol = lazy(() => import("./pages/UserXcrol"));
const Brook = lazy(() => import("./pages/Brook"));
const EveryCountry = lazy(() => import("./pages/EveryCountry"));
const OAuthAuthorize = lazy(() => import("./pages/OAuthAuthorize"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Developers = lazy(() => import("./pages/Developers"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppHeader />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/powers" element={<Powers />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/the-river" element={<TheRiver />} />
              <Route path="/the-forest" element={<TheForest />} />
              <Route path="/mini-games-hub" element={<MiniGamesHub />} />
              <Route path="/irl-layer" element={<IRLLayer />} />
              <Route path="/hearth-surfing" element={<HearthSurfing />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/u/:userId" element={<PublicProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/getting-started" element={<GettingStarted />} />
              <Route path="/invite-friends" element={<InviteFriends />} />
              <Route path="/my-xcrol" element={<MyXcrol />} />
              <Route path="/my-xcrol/edit" element={<MyXcrol />} />
              <Route path="/myxcrol" element={<MyXcrol />} />
              <Route path="/myxcrol/edit" element={<MyXcrol />} />
              <Route path="/xcrol/:username" element={<UserXcrol />} />
              <Route path="/brook/:brookId" element={<Brook />} />
              <Route path="/every-country" element={<EveryCountry />} />
              <Route path="/oauth/authorize" element={<OAuthAuthorize />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/developers" element={<Developers />} />
              <Route path="/:username" element={<PublicProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
