import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  KanbanSquare,
  Building2,
  BarChart3,
  Handshake,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Megaphone,
  Rocket,
  Video,
  Share2,
  Code2,
  FolderKanban,
  Timer,
  Wallet,
  DollarSign,
  Receipt,
  PieChart,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavModule {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: NavItem[];
}

const modules: NavModule[] = [
  {
    name: 'Sales',
    icon: TrendingUp,
    color: 'text-emerald-500',
    items: [
      { name: 'Funnel', href: '/', icon: KanbanSquare },
      { name: 'Empresas', href: '/empresas', icon: Building2 },
      { name: 'Clientes', href: '/clients', icon: Handshake },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    name: 'Marketing',
    icon: Megaphone,
    color: 'text-purple-500',
    items: [
      { name: 'irrelevant Hub', href: '/marketing/hub', icon: Rocket },
      { name: 'Webinars', href: '/marketing/webinars', icon: Video },
      { name: 'Redes Sociales', href: '/marketing/social', icon: Share2 },
    ],
  },
  {
    name: 'Tech',
    icon: Code2,
    color: 'text-blue-500',
    items: [
      { name: 'Proyectos', href: '/tech/projects', icon: FolderKanban },
      { name: 'Métricas', href: '/tech/metrics', icon: Timer },
    ],
  },
  {
    name: 'Finance',
    icon: Wallet,
    color: 'text-amber-500',
    items: [
      { name: 'Dashboard', href: '/finance', icon: PieChart },
      { name: 'Ingresos', href: '/finance/income', icon: DollarSign },
      { name: 'Gastos', href: '/finance/expenses', icon: Receipt },
    ],
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(['Sales']);
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-expand module that contains current route
  useEffect(() => {
    modules.forEach((module) => {
      const hasActiveItem = module.items.some(
        (item) =>
          item.href === location.pathname ||
          (item.href !== '/' && location.pathname.startsWith(item.href))
      );
      if (hasActiveItem && !expandedModules.includes(module.name)) {
        setExpandedModules((prev) => [...prev, module.name]);
      }
    });
  }, [location.pathname]);

  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const isItemActive = (href: string) => {
    // Exact match for root and specific dashboard routes
    if (href === '/' || href === '/finance' || href === '/analytics') {
      return location.pathname === href;
    }
    // For other routes, check exact match or if it's a sub-route
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background border-border shadow-sm"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-sidebar-border">
            <img
              src="https://academy.stayirrelevant.com/assets/irrelevant-logo-B9hN0rDI.png"
              alt="Irrelevant"
              className="h-7 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            <div className="space-y-6">
              {modules.map((module) => {
                const isExpanded = expandedModules.includes(module.name);
                const hasActiveItem = module.items.some((item) => isItemActive(item.href));

                return (
                  <div key={module.name}>
                    {/* Module header */}
                    <button
                      onClick={() => toggleModule(module.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors",
                        hasActiveItem
                          ? "text-sidebar-foreground"
                          : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <module.icon className={cn("h-4 w-4", module.color)} />
                        <span>{module.name}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isExpanded ? "rotate-90" : ""
                        )}
                      />
                    </button>

                    {/* Module items */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200",
                        isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="relative pl-3">
                        {/* Vertical line connector */}
                        <div className="absolute left-[21px] top-0 bottom-0 w-px bg-sidebar-border" />

                        <div className="space-y-0.5">
                          {module.items.map((item) => {
                            const isActive = isItemActive(item.href);
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all relative",
                                  isActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                )}
                              >
                                {/* Horizontal connector line */}
                                <div className={cn(
                                  "absolute left-0 w-3 h-px",
                                  isActive ? "bg-sidebar-primary" : "bg-sidebar-border group-hover:bg-sidebar-foreground/30"
                                )} />

                                <item.icon className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  isActive ? "" : "opacity-70 group-hover:opacity-100"
                                )} />
                                <span className="truncate">{item.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer with logout */}
          <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
            <p className="text-xs text-sidebar-foreground/40 text-center">
              irrelevant ERP v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="h-full p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
