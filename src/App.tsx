import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Rooms from "./pages/Rooms";
import Guests from "./pages/Guests";
import Reservations from "./pages/Reservations";
import POS from "./pages/POS";
import Housekeeping from "./pages/Housekeeping";
import Maintenance from "./pages/Maintenance";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import Refunds from "./pages/Refunds";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/rooms" element={
              <ProtectedRoute requiredPermission="rooms.view">
                <Rooms />
              </ProtectedRoute>
            } />
            <Route path="/reservations" element={
              <ProtectedRoute requiredPermission="bookings.view">
                <Reservations />
              </ProtectedRoute>
            } />
            <Route path="/guests" element={
              <ProtectedRoute requiredPermission="guests.view">
                <Guests />
              </ProtectedRoute>
            } />
            <Route path="/pos" element={
              <ProtectedRoute requiredPermission="pos.view">
                <POS />
              </ProtectedRoute>
            } />
            <Route path="/housekeeping" element={
              <ProtectedRoute requiredPermission="housekeeping.view">
                <Housekeeping />
              </ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute requiredPermission="maintenance.view">
                <Maintenance />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute requiredPermission="inventory.view">
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredPermission="reports.view">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/finance" element={
              <ProtectedRoute requiredPermission="finance.view">
                <Finance />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredPermission="settings.view">
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/refunds" element={
              <ProtectedRoute requiredPermission="refunds.view">
                <Refunds />
              </ProtectedRoute>
            } />
            <Route path="/reviews" element={
              <ProtectedRoute>
                <Reviews />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
