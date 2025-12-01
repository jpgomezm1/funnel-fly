import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FinanceExchangeRate } from '@/types/database';

export function useFinanceExchangeRates() {
  const queryClient = useQueryClient();

  const { data: exchangeRates = [], isLoading, error } = useQuery({
    queryKey: ['finance-exchange-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_exchange_rates')
        .select('*')
        .order('rate_date', { ascending: false });

      if (error) throw error;
      return data as FinanceExchangeRate[];
    },
  });

  // Get latest rate
  const latestRate = exchangeRates[0];

  // Get rate for a specific date
  const getRateForDate = (date: string): number | undefined => {
    // Find the rate for the exact date or the most recent rate before that date
    const rate = exchangeRates.find(r => r.rate_date <= date);
    return rate?.usd_to_cop;
  };

  // Create or update rate for a date
  const upsertMutation = useMutation({
    mutationFn: async ({ rate_date, usd_to_cop, source = 'manual' }: {
      rate_date: string;
      usd_to_cop: number;
      source?: string;
    }) => {
      // Check if rate exists for this date
      const { data: existing } = await supabase
        .from('finance_exchange_rates')
        .select('id')
        .eq('rate_date', rate_date)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('finance_exchange_rates')
          .update({ usd_to_cop, source })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('finance_exchange_rates')
          .insert({ rate_date, usd_to_cop, source });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-exchange-rates'] });
    },
  });

  // Delete rate
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finance_exchange_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-exchange-rates'] });
    },
  });

  return {
    exchangeRates,
    latestRate,
    getRateForDate,
    isLoading,
    error,
    upsertExchangeRate: upsertMutation.mutateAsync,
    deleteExchangeRate: deleteMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
  };
}

// Hook to get or fetch the current exchange rate
export function useCurrentExchangeRate() {
  const { latestRate, isLoading } = useFinanceExchangeRates();

  // Default rate if none is set (approximate)
  const DEFAULT_RATE = 4200;

  return {
    currentRate: latestRate?.usd_to_cop || DEFAULT_RATE,
    rateDate: latestRate?.rate_date,
    isLoading,
  };
}
