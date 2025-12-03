import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProcessResult {
  transactions_created: number;
  transactions_processed: number;
  details: Array<{
    parent_id: string;
    new_id: string;
    description: string;
    amount_usd: number;
    date: string;
  }>;
}

interface ProcessParams {
  year?: number;
  month?: number;
}

export function useProcessRecurringTransactions() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params?: ProcessParams) => {
      const { data, error } = await supabase.rpc('process_recurring_transactions', {
        target_year: params?.year ?? null,
        target_month: params?.month ?? null,
      });

      if (error) throw error;

      // The function returns an array with one row
      const result = data?.[0] as ProcessResult | undefined;

      // Log the execution
      if (result) {
        const now = new Date();
        await supabase.from('recurring_transactions_log').insert({
          target_year: params?.year ?? now.getFullYear(),
          target_month: params?.month ?? (now.getMonth() + 1),
          transactions_created: result.transactions_created,
          transactions_processed: result.transactions_processed,
          details: result.details,
          triggered_by: 'manual_ui',
        });
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate all finance queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-metrics'] });
    },
  });

  return {
    processRecurring: mutation.mutateAsync,
    isProcessing: mutation.isPending,
    lastResult: mutation.data,
    error: mutation.error,
  };
}

// Hook to get the execution log
export function useRecurringTransactionsLog(limit = 10) {
  const { data, isLoading } = useQuery({
    queryKey: ['recurring-transactions-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });

  return { logs: data ?? [], isLoading };
}
