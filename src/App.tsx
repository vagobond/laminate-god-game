import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { TutorialProvider } from "@/components/onboarding";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuestAuthGateProvider } from "@/components/auth/GuestAuthGate";
import { Loader2 } from "lucide-react";
import AppHeader from "./components/AppHeader";
import OfflineBanner from "./components/OfflineBanner";
import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Route error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-4 py-2 rounded bg-primary text-primary-foreground"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
const TheVillage = lazy(() => import("./pages/TheVillage"));
const GroupProfile = lazy(() => import("./pages/GroupProfile"));
const TheTown = lazy(() => import("./pages/TheTown"));
const TheCastle = lazy(() => import("./pages/TheCastle"));
const EveryCountry = lazy(() => import("./pages/EveryCountry"));
const OAuthAuthorize = lazy(() => import("./pages/OAuthAuthorize"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ContentPolicy = lazy(() => import("./pages/ContentPolicy"));
const Developers = lazy(() => import("./pages/Developers"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const SharedPost = lazy(() => import("./pages/SharedPost"));
const PublicHost = lazy(() => import("./pages/PublicHost"));
const Map = lazy(() => import("./pages/Map"));
const Scrolls = lazy(() => import("./pages/Scrolls"));
const ScrollEditor = lazy(() => import("./pages/ScrollEditor"));
const ScrollReader = lazy(() => import("./pages/ScrollReader"));
const ScrollAiTutorial = lazy(() => import("./pages/ScrollAiTutorial"));
const CastleLibrary = lazy(() => import("./pages/CastleLibrary"));
const PublicationReader = lazy(() => import("./pages/PublicationReader"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

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
        {/* Favicon links are in index.html — no duplicates here */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TutorialProvider>
            <GuestAuthGateProvider>
            <AppHeader />
            <OfflineBanner />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <main>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/powers" element={<ProtectedRoute><Powers /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                {/* Public-readable routes (guests can browse, replies prompt sign-up) */}
                <Route path="/the-river" element={<TheRiver />} />
                <Route path="/the-village" element={<TheVillage />} />
                <Route path="/group/:slug" element={<GroupProfile />} />
                <Route path="/u/:userId" element={<PublicProfile />} />
                {/* Protected routes */}
                <Route path="/the-forest" element={<ProtectedRoute><TheForest /></ProtectedRoute>} />
                <Route path="/mini-games-hub" element={<ProtectedRoute><MiniGamesHub /></ProtectedRoute>} />
                <Route path="/irl-layer" element={<ProtectedRoute><IRLLayer /></ProtectedRoute>} />
                <Route path="/hearthsurf" element={<ProtectedRoute><HearthSurfing /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/getting-started" element={<GettingStarted />} />
                <Route path="/invite-friends" element={<ProtectedRoute><InviteFriends /></ProtectedRoute>} />
                <Route path="/my-xcrol" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/my-xcrol/edit" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/myxcrol" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/myxcrol/edit" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/xcrol/:username" element={<ProtectedRoute><UserXcrol /></ProtectedRoute>} />
                <Route path="/brook/:brookId" element={<ProtectedRoute><Brook /></ProtectedRoute>} />
                <Route path="/the-town" element={<TheTown />} />
                <Route path="/the-castle" element={<ProtectedRoute><TheCastle /></ProtectedRoute>} />
                <Route path="/every-country" element={<ProtectedRoute><EveryCountry /></ProtectedRoute>} />
                <Route path="/oauth/authorize" element={<OAuthAuthorize />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/content-policy" element={<ContentPolicy />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/post/:postId" element={<SharedPost />} />
                <Route path="/host/:username" element={<PublicHost />} />
                <Route path="/install-app" element={<InstallApp />} />
                <Route path="/map" element={<Map />} />
                <Route path="/scrolls" element={<ProtectedRoute><Scrolls /></ProtectedRoute>} />
                <Route path="/scrolls/ai-setup" element={<ProtectedRoute><ScrollAiTutorial /></ProtectedRoute>} />
                <Route path="/scrolls/:scrollId" element={<ProtectedRoute><ScrollEditor /></ProtectedRoute>} />
                <Route path="/scrolls/:scrollId/read" element={<ProtectedRoute><ScrollReader /></ProtectedRoute>} />
                <Route path="/the-castle/library" element={<CastleLibrary />} />
                <Route path="/library/:slug" element={<PublicationReader />} />
                <Route path="/:username" element={<PublicProfile />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </main>
            </Suspense>
            </ErrorBoundary>
            </GuestAuthGateProvider>
          </TutorialProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
