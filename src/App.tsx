import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Powers from "./pages/Powers";
import AboutLaminate from "./pages/AboutLaminate";
import PaderFamilias from "./pages/PaderFamilias";
import EnterLamsterverse from "./pages/EnterLamsterverse";
import CreateLayer from "./pages/CreateLayer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/powers" element={<Powers />} />
          <Route path="/about-laminate" element={<AboutLaminate />} />
          <Route path="/pader-familias" element={<PaderFamilias />} />
          <Route path="/enter-lamsterverse" element={<EnterLamsterverse />} />
          <Route path="/create-layer" element={<CreateLayer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
