import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types/database';

const STALE_THRESHOLD_DAYS = 5;

export function useStaleLeads() {
  return useQuery({
    queryKey: ['stale-leads'],
    queryFn: async () => {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - STALE_THRESHOLD_DAYS);

      // Query companies that are prospects, not closed, and stale
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'prospect')
        .not('stage', 'in', '("CERRADO_GANADO","CERRADO_PERDIDO")')
        .lt('last_activity_at', thresholdDate.toISOString())
        .order('last_activity_at', { ascending: true });

      if (error) {
        // Fallback to leads table if companies table doesn't exist yet
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .not('stage', 'in', '("CERRADO_GANADO","CERRADO_PERDIDO")')
          .lt('last_activity_at', thresholdDate.toISOString())
          .order('last_activity_at', { ascending: true });

        if (leadsError) throw leadsError;
        return (leadsData || []) as Company[];
      }

      return (data || []) as Company[];
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}
