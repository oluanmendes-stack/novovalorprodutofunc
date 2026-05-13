import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Batch from "./pages/Batch";
import Compatibility from "./pages/Compatibility";
import Settings from "./pages/Settings";
import TestPDF from "./pages/TestPDF";
import NotFound from "./pages/NotFound";
import { clearGoogleDriveImageCache } from "./services/googleDriveImageService";

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Limpar cache ao carregar
    clearGoogleDriveImageCache();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/batch" element={<Batch />} />
      <Route path="/compatibility" element={<Compatibility />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/test-pdf" element={<TestPDF />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

createRoot(document.getElementById("root")!).render(<App />);
