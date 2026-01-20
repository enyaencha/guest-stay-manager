import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Rooms from "./pages/Rooms";
import Guests from "./pages/Guests";
import POS from "./pages/POS";
import Housekeeping from "./pages/Housekeeping";
import Maintenance from "./pages/Maintenance";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import Refunds from "./pages/Refunds";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/housekeeping" element={<Housekeeping />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
