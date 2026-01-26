import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  KanbanSquare,
  Users,
  BarChart3,
  Target,
  FileText,
  ChevronDown,
  Building2,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigation = [
  { name: 'Funnel', href: '/', icon: KanbanSquare, badge: null },
  { name: 'Leads', href: '/leads', icon: Users, badge: null },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, badge: null },
  { name: 'Reporting', href: '/reporting', icon: FileText, badge: null },
  { name: 'Metas', href: '/goals', icon: Target, badge: null },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut } = useAuth();
  const { toast } = useToast();

  const isActive = (path: string) => currentPath === path;
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    }
  };

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-sidebar-foreground">CRM irrelevant</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestión de clientes</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 flex flex-col h-full">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link 
                      to={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent group"
                    >
                      <item.icon className={`h-4 w-4 transition-colors ${
                        isActive(item.href) 
                          ? 'text-sidebar-primary' 
                          : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                      }`} />
                      {!collapsed && (
                        <span className={`transition-colors ${
                          isActive(item.href) 
                            ? 'text-sidebar-primary font-semibold' 
                            : 'text-sidebar-foreground group-hover:text-sidebar-foreground'
                        }`}>
                          {item.name}
                        </span>
                      )}
                      {item.badge && !collapsed && (
                        <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs text-sidebar-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout button at the bottom */}
        <div className="mt-auto pb-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent"
                    >
                      <LogOut className="h-4 w-4 text-sidebar-foreground/60" />
                      {!collapsed && (
                        <span className="text-sidebar-foreground">
                          Cerrar Sesión
                        </span>
                      )}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}