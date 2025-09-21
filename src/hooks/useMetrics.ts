import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MetricsData {
  currentMrr: number;
  goalMrr: number;
  feesMonth: number;
  feesHistorical: number;
  activeDeals: number;
  newClosesWeek: number;
  mrrByOwner: Array<{ owner_id: string; mrr: number }>;
  mrrTrend: Array<{ month: string; mrr_total: number }>;
}

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async (): Promise<MetricsData> => {
      // Current MRR
      const { data: currentMrrData, error: currentMrrError } = await supabase
        .from('deals')
        .select('mrr_usd')
        .eq('status', 'ACTIVE');
      if (currentMrrError) throw currentMrrError;
      const currentMrr = currentMrrData?.reduce((sum, deal) => sum + (deal.mrr_usd || 0), 0) || 0;

      // MRR Goal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('value_usd')
        .eq('goal_type', 'MRR_GLOBAL_USD')
        .eq('period', 'GLOBAL')
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (goalError) throw goalError;

      // Fees this month - calculate on client side
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data: feesMonthData, error: feesMonthError } = await supabase
        .from('deals')
        .select('implementation_fee_usd, created_at')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());
      if (feesMonthError) throw feesMonthError;
      const feesMonth = feesMonthData?.reduce((sum, deal) => sum + (deal.implementation_fee_usd || 0), 0) || 0;

      // Fees historical
      const { data: feesHistoricalData, error: feesHistoricalError } = await supabase
        .from('deals')
        .select('implementation_fee_usd');
      if (feesHistoricalError) throw feesHistoricalError;
      const feesHistorical = feesHistoricalData?.reduce((sum, deal) => sum + (deal.implementation_fee_usd || 0), 0) || 0;

      // Active deals count
      const { data: activeDealsData, error: activeDealsError } = await supabase
        .from('deals')
        .select('id', { count: 'exact' })
        .eq('status', 'ACTIVE');
      if (activeDealsError) throw activeDealsError;

      // New closes this week - calculate on client side
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
      weekEnd.setHours(23, 59, 59, 999);
      
      const { data: newClosesData, error: newClosesError } = await supabase
        .from('lead_stage_history')
        .select('id', { count: 'exact' })
        .eq('to_stage', 'CERRADO_GANADO')
        .gte('changed_at', weekStart.toISOString())
        .lte('changed_at', weekEnd.toISOString());
      if (newClosesError) throw newClosesError;
      const newClosesWeek = newClosesData?.length || 0;

      // MRR by owner
      const { data: mrrByOwnerData, error: mrrByOwnerError } = await supabase
        .from('deals')
        .select(`
          mrr_usd,
          lead_id,
          leads!inner(owner_id)
        `)
        .eq('status', 'ACTIVE');
      if (mrrByOwnerError) throw mrrByOwnerError;

      // Group MRR by owner
      const mrrByOwnerMap = new Map<string, number>();
      mrrByOwnerData?.forEach(deal => {
        const ownerId = (deal.leads as any)?.owner_id || 'unassigned';
        const currentMrr = mrrByOwnerMap.get(ownerId) || 0;
        mrrByOwnerMap.set(ownerId, currentMrr + (deal.mrr_usd || 0));
      });
      const mrrByOwner = Array.from(mrrByOwnerMap.entries()).map(([owner_id, mrr]) => ({
        owner_id,
        mrr
      }));

      // MRR trend last 6 months - calculate on client side
      const { data: allDealsData, error: allDealsError } = await supabase
        .from('deals')
        .select('mrr_usd, start_date')
        .eq('status', 'ACTIVE');
      if (allDealsError) throw allDealsError;

      // Generate last 6 months
      const mrrTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1); // First day of month
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
        
        const mrrForMonth = allDealsData?.reduce((sum, deal) => {
          const dealStartDate = new Date(deal.start_date);
          if (dealStartDate <= monthEnd) {
            return sum + (deal.mrr_usd || 0);
          }
          return sum;
        }, 0) || 0;

        mrrTrend.push({
          month: date.toISOString().substring(0, 7), // YYYY-MM format
          mrr_total: mrrForMonth
        });
      }

      return {
        currentMrr,
        goalMrr: goalData?.value_usd || 50000,
        feesMonth,
        feesHistorical,
        activeDeals: activeDealsData?.length || 0,
        newClosesWeek,
        mrrByOwner,
        mrrTrend,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}