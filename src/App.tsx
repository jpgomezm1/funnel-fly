import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import Funnel from "./pages/Funnel";
import Empresas from "./pages/Empresas";
import EmpresaDetail from "./pages/EmpresaDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Analytics from "./pages/Analytics";
import ActiveClients from "./pages/ActiveClients";
import ClientDetail from "./pages/ClientDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
// Marketing
import HubAnalytics from "./pages/marketing/HubAnalytics";
import Webinars from "./pages/marketing/Webinars";
import WebinarDetail from "./pages/marketing/WebinarDetail";
import SocialMedia from "./pages/marketing/SocialMedia";
// Tech
import TechProjects from "./pages/tech/TechProjects";
import TechProjectDetail from "./pages/tech/TechProjectDetail";
import TechMetrics from "./pages/tech/TechMetrics";
// Finance
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinanceIncome from "./pages/finance/FinanceIncome";
import FinanceExpenses from "./pages/finance/FinanceExpenses";
import FinancePayroll from "./pages/finance/FinancePayroll";
import FinanceAccounting from "./pages/finance/FinanceAccounting";
import { FinanceGuard } from "./components/guards/FinanceGuard";
// Sales
import Calls from "./pages/sales/Calls";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/funnel" element={<Funnel />} />
                    <Route path="/empresas" element={<Empresas />} />
                    <Route path="/empresas/:empresaId" element={<EmpresaDetail />} />
                    <Route path="/empresas/:empresaId/proyectos/:projectId" element={<ProjectDetail />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/clients" element={<ActiveClients />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/clients/:clientId/proyectos/:projectId" element={<ProjectDetail />} />
                    {/* Tech routes */}
                    <Route path="/tech/projects" element={<TechProjects />} />
                    <Route path="/tech/projects/:projectId" element={<TechProjectDetail />} />
                    <Route path="/tech/metrics" element={<TechMetrics />} />
                    {/* Marketing routes */}
                    <Route path="/marketing/hub" element={<HubAnalytics />} />
                    <Route path="/marketing/webinars" element={<Webinars />} />
                    <Route path="/marketing/webinars/:id" element={<WebinarDetail />} />
                    <Route path="/marketing/social" element={<SocialMedia />} />
                    {/* Sales routes */}
                    <Route path="/sales/calls" element={<Calls />} />
                    {/* Finance routes - protected with password */}
                    <Route path="/finance" element={<FinanceGuard><FinanceDashboard /></FinanceGuard>} />
                    <Route path="/finance/income" element={<FinanceGuard><FinanceIncome /></FinanceGuard>} />
                    <Route path="/finance/expenses" element={<FinanceGuard><FinanceExpenses /></FinanceGuard>} />
                    <Route path="/finance/payroll" element={<FinanceGuard><FinancePayroll /></FinanceGuard>} />
                    <Route path="/finance/accounting" element={<FinanceGuard><FinanceAccounting /></FinanceGuard>} />
                    {/* Legacy routes - redirect to empresas */}
                    <Route path="/leads" element={<Empresas />} />
                    <Route path="/leads/:id" element={<EmpresaDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
