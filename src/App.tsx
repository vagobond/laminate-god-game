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
        <Helmet>
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <link rel="shortcut icon" href="/favicon.png" type="image/png" />
          <link rel="apple-touch-icon" href="/favicon.png" />
        </Helmet>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TutorialProvider>
            <AppHeader />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Welcome />} />
                {/* Powers and tutorial are allowed without invite verification */}
                <Route path="/powers" element={<ProtectedRoute requireInvite={false}><Powers /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                {/* Protected routes that require invite verification */}
                <Route path="/the-river" element={<ProtectedRoute><TheRiver /></ProtectedRoute>} />
                <Route path="/the-forest" element={<ProtectedRoute><TheForest /></ProtectedRoute>} />
                <Route path="/mini-games-hub" element={<ProtectedRoute><MiniGamesHub /></ProtectedRoute>} />
                <Route path="/irl-layer" element={<ProtectedRoute><IRLLayer /></ProtectedRoute>} />
                <Route path="/hearthsurf" element={<ProtectedRoute><HearthSurfing /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/u/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/getting-started" element={<ProtectedRoute requireInvite={false}><GettingStarted /></ProtectedRoute>} />
                <Route path="/invite-friends" element={<ProtectedRoute><InviteFriends /></ProtectedRoute>} />
                <Route path="/my-xcrol" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/my-xcrol/edit" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/myxcrol" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/myxcrol/edit" element={<ProtectedRoute><MyXcrol /></ProtectedRoute>} />
                <Route path="/xcrol/:username" element={<ProtectedRoute><UserXcrol /></ProtectedRoute>} />
                <Route path="/brook/:brookId" element={<ProtectedRoute><Brook /></ProtectedRoute>} />
                <Route path="/every-country" element={<ProtectedRoute><EveryCountry /></ProtectedRoute>} />
                <Route path="/oauth/authorize" element={<OAuthAuthorize />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TutorialProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
