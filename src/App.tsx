import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewInvoice from "./pages/NewInvoice";
import EditInvoice from "./pages/EditInvoice";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicInvoice from "./pages/PublicInvoice";
import DemoInvoices from "./pages/demo/DemoInvoices";
import DemoDashboard from "./pages/demo/DemoDashboard";
import DemoClients from "./pages/demo/DemoClients";
import DemoReports from "./pages/demo/DemoReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OnboardingOverlay />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/invoice/:id" element={<PublicInvoice />} />
              <Route path="/demo" element={<DemoInvoices />} />
              <Route path="/demo/dashboard" element={<DemoDashboard />} />
              <Route path="/demo/clients" element={<DemoClients />} />
              <Route path="/demo/reports" element={<DemoReports />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/invoices" element={<Navigate to="/" replace />} />
              <Route
                path="/invoices/new"
                element={
                  <ProtectedRoute>
                    <NewInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/:id"
                element={
                  <ProtectedRoute>
                    <ClientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
