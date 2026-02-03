import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ROLE_MODULES: Record<string, string[]> = {
  superadmin: ['sales', 'marketing', 'tech', 'finance'],
  comercial: ['sales', 'marketing', 'tech'],
  tecnologia: ['tech'],
  socio: ['sales', 'marketing', 'tech'],
};

export function useUserRole() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, display_name')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const role = data?.role ?? null;
  const displayName = data?.display_name ?? null;

  const hasAccess = (module: string): boolean => {
    if (!role) return false;
    return ROLE_MODULES[role]?.includes(module) ?? false;
  };

  return { role, displayName, isLoading, hasAccess };
}
