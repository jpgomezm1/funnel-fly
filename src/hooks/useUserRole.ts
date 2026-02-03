import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ROLE_MODULES: Record<string, string[]> = {
  superadmin: ['sales', 'marketing', 'tech', 'finance'],
  comercial: ['sales', 'marketing', 'tech'],
  tecnologia: ['tech'],
  socio: ['sales', 'marketing', 'tech'],
};

interface UserRole {
  role: string;
  display_name: string;
}

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      console.log('[useUserRole] Fetching role for user:', user!.id, user!.email);
      // Cast to 'any' to bypass generated types that don't include user_roles
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role, display_name')
        .eq('user_id', user!.id)
        .single();

      console.log('[useUserRole] Supabase response - data:', data, 'error:', error);
      if (error) throw error;
      return data as UserRole;
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 1000 * 60 * 10,
  });

  // Consider loading if auth is still loading OR query is still loading
  const isLoading = authLoading || queryLoading;

  const role = data?.role ?? null;
  const displayName = data?.display_name ?? null;

  console.log('[useUserRole] State - authLoading:', authLoading, 'queryLoading:', queryLoading, 'isLoading:', isLoading, 'role:', role, 'user?.id:', user?.id, 'queryError:', queryError);

  const hasAccess = (module: string): boolean => {
    if (!role) return false;
    const allowed = ROLE_MODULES[role]?.includes(module) ?? false;
    console.log('[useUserRole] hasAccess("' + module + '") → role:', role, 'allowed:', allowed);
    return allowed;
  };

  return { role, displayName, isLoading, hasAccess };
}
