import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
import TechPhase0Projects from "./pages/tech/TechPhase0Projects";
import TechPhase0ProjectDetail from "./pages/tech/TechPhase0ProjectDetail";
// Finance
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinanceIncome from "./pages/finance/FinanceIncome";
import FinanceExpenses from "./pages/finance/FinanceExpenses";
import FinancePayroll from "./pages/finance/FinancePayroll";
import FinanceAccounting from "./pages/finance/FinanceAccounting";
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

const RoleRoute = ({ module, children }: { module: string; children: React.ReactNode }) => {
  const { hasAccess, isLoading, role } = useUserRole();

  console.log('[RoleRoute] module:', module, 'isLoading:', isLoading, 'role:', role, 'hasAccess:', hasAccess(module));

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess(module)) {
    console.warn('[RoleRoute] ACCESS DENIED for module:', module, '- redirecting to /');
    return <Navigate to="/" replace />;
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
                    {/* Sales routes */}
                    <Route path="/funnel" element={<RoleRoute module="sales"><Funnel /></RoleRoute>} />
                    <Route path="/empresas" element={<RoleRoute module="sales"><Empresas /></RoleRoute>} />
                    <Route path="/empresas/:empresaId" element={<RoleRoute module="sales"><EmpresaDetail /></RoleRoute>} />
                    <Route path="/empresas/:empresaId/proyectos/:projectId" element={<RoleRoute module="sales"><ProjectDetail /></RoleRoute>} />
                    <Route path="/analytics" element={<RoleRoute module="sales"><Analytics /></RoleRoute>} />
                    <Route path="/clients" element={<RoleRoute module="sales"><ActiveClients /></RoleRoute>} />
                    <Route path="/clients/:id" element={<RoleRoute module="sales"><ClientDetail /></RoleRoute>} />
                    <Route path="/clients/:clientId/proyectos/:projectId" element={<RoleRoute module="sales"><ProjectDetail /></RoleRoute>} />
                    <Route path="/sales/calls" element={<RoleRoute module="sales"><Calls /></RoleRoute>} />
                    {/* Tech routes */}
                    <Route path="/tech/phase0" element={<RoleRoute module="tech"><TechPhase0Projects /></RoleRoute>} />
                    <Route path="/tech/phase0/:projectId" element={<RoleRoute module="tech"><TechPhase0ProjectDetail /></RoleRoute>} />
                    <Route path="/tech/projects" element={<RoleRoute module="tech"><TechProjects /></RoleRoute>} />
                    <Route path="/tech/projects/:projectId" element={<RoleRoute module="tech"><TechProjectDetail /></RoleRoute>} />
                    <Route path="/tech/metrics" element={<RoleRoute module="tech"><TechMetrics /></RoleRoute>} />
                    {/* Marketing routes */}
                    <Route path="/marketing/hub" element={<RoleRoute module="marketing"><HubAnalytics /></RoleRoute>} />
                    <Route path="/marketing/webinars" element={<RoleRoute module="marketing"><Webinars /></RoleRoute>} />
                    <Route path="/marketing/webinars/:id" element={<RoleRoute module="marketing"><WebinarDetail /></RoleRoute>} />
                    <Route path="/marketing/social" element={<RoleRoute module="marketing"><SocialMedia /></RoleRoute>} />
                    {/* Finance routes */}
                    <Route path="/finance" element={<RoleRoute module="finance"><FinanceDashboard /></RoleRoute>} />
                    <Route path="/finance/income" element={<RoleRoute module="finance"><FinanceIncome /></RoleRoute>} />
                    <Route path="/finance/expenses" element={<RoleRoute module="finance"><FinanceExpenses /></RoleRoute>} />
                    <Route path="/finance/payroll" element={<RoleRoute module="finance"><FinancePayroll /></RoleRoute>} />
                    <Route path="/finance/accounting" element={<RoleRoute module="finance"><FinanceAccounting /></RoleRoute>} />
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
