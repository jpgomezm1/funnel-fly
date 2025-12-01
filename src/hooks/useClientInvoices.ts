import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/database';

interface UseClientInvoicesOptions {
  clientId?: string;
}

export function useClientInvoices({ clientId }: UseClientInvoicesOptions) {
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      // First get all project IDs for this client
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', clientId);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map(p => p.id);

      // Then get all invoices for these projects
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      return invoicesData as Invoice[];
    },
    enabled: !!clientId,
  });

  // Calculate summary stats
  const getSummary = () => {
    const totalBilled = invoices
      .filter(i => i.status !== 'PENDING')
      .reduce((sum, i) => sum + i.total_usd, 0);

    const totalPaid = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.amount_received || 0), 0);

    const totalPending = invoices
      .filter(i => i.status === 'PENDING')
      .reduce((sum, i) => sum + i.total_usd, 0);

    const totalInvoiced = invoices
      .filter(i => i.status === 'INVOICED')
      .reduce((sum, i) => sum + i.total_usd, 0);

    const totalRetention = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.retention_amount || 0), 0);

    const pendingCount = invoices.filter(i => i.status === 'PENDING').length;
    const invoicedCount = invoices.filter(i => i.status === 'INVOICED').length;
    const paidCount = invoices.filter(i => i.status === 'PAID').length;

    // Invoices awaiting payment (INVOICED status)
    const awaitingPayment = invoices.filter(i => i.status === 'INVOICED');

    // Overdue invoices (INVOICED with due_date in the past)
    const now = new Date();
    const overdueInvoices = invoices.filter(i =>
      i.status === 'INVOICED' && i.due_date && new Date(i.due_date) < now
    );

    return {
      totalBilled,
      totalPaid,
      totalPending,
      totalInvoiced,
      totalRetention,
      pendingCount,
      invoicedCount,
      paidCount,
      awaitingPayment,
      overdueInvoices,
    };
  };

  return {
    invoices,
    isLoading,
    error,
    getSummary,
  };
}
