import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  name: string;
  slug: string;
  role: 'sales' | 'tech' | 'both';
  color: string;
  color_hex: string;
  is_active: boolean;
  created_at: string;
}

export function useTeamMembers() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as TeamMember[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const salesMembers = members.filter(m => m.role === 'sales' || m.role === 'both');
  const techMembers = members.filter(m => m.role === 'tech' || m.role === 'both');

  const getMemberBySlug = (slug: string | null | undefined): TeamMember | undefined => {
    if (!slug) return undefined;
    return members.find(m => m.slug === slug);
  };

  const getMemberName = (slug: string | null | undefined): string => {
    if (!slug) return 'Sin asignar';
    const member = getMemberBySlug(slug);
    return member?.name || slug;
  };

  const getMemberColor = (slug: string | null | undefined): string => {
    if (!slug) return 'bg-gray-500';
    const member = getMemberBySlug(slug);
    return member?.color || 'bg-gray-500';
  };

  const getMemberColorHex = (slug: string | null | undefined): string => {
    if (!slug) return '#6B7280';
    const member = getMemberBySlug(slug);
    return member?.color_hex || '#6B7280';
  };

  return {
    members,
    salesMembers,
    techMembers,
    getMemberBySlug,
    getMemberName,
    getMemberColor,
    getMemberColorHex,
    isLoading,
  };
}
