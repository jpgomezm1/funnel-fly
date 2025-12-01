import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceType, InvoiceStatus, DealCurrency } from '@/types/database';

const IVA_RATE = 0.19; // 19% IVA in Colombia

interface UseProjectInvoicesOptions {
  projectId?: string;
}

interface CreateInvoiceData {
  invoice_type: InvoiceType;
  period_month?: string;
  concept: string;
  subtotal: number;
  has_iva: boolean;
  is_cuenta_cobro?: boolean; // true = cuenta de cobro, false = factura
  currency: DealCurrency;
  exchange_rate?: number;
  invoice_number?: string;
  due_date?: string;
  notes?: string;
}

interface UpdateInvoiceData {
  concept?: string;
  subtotal?: number;
  has_iva?: boolean;
  currency?: DealCurrency;
  exchange_rate?: number;
  invoice_number?: string;
  invoice_file_path?: string;
  status?: InvoiceStatus;
  due_date?: string;
  paid_at?: string;
  amount_received?: number;
  retention_amount?: number;
  notes?: string;
}

interface MarkAsPaidData {
  paid_at: string;
  amount_received: number;
  retention_amount?: number;
  payment_proof_path?: string;
}

export function useProjectInvoices({ projectId }: UseProjectInvoicesOptions) {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('period_month', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!projectId,
  });

  // Calculate IVA and totals
  const calculateTotals = (subtotal: number, hasIva: boolean, currency: DealCurrency, exchangeRate?: number) => {
    const ivaAmount = hasIva ? subtotal * IVA_RATE : 0;
    const total = subtotal + ivaAmount;
    const totalUsd = currency === 'USD' ? total : (exchangeRate ? total / exchangeRate : 0);

    return {
      iva_amount: Math.round(ivaAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      total_usd: Math.round(totalUsd * 100) / 100,
    };
  };

  // Create invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      if (!projectId) throw new Error('No project ID provided');

      const totals = calculateTotals(data.subtotal, data.has_iva, data.currency, data.exchange_rate);

      const invoiceData = {
        project_id: projectId,
        invoice_type: data.invoice_type,
        period_month: data.period_month || null,
        concept: data.concept,
        subtotal: data.subtotal,
        has_iva: data.has_iva,
        is_cuenta_cobro: data.is_cuenta_cobro || false,
        iva_amount: totals.iva_amount,
        total: totals.total,
        currency: data.currency,
        exchange_rate: data.exchange_rate || null,
        total_usd: totals.total_usd,
        invoice_number: data.invoice_number || null,
        due_date: data.due_date || null,
        notes: data.notes || null,
        status: 'PENDING' as InvoiceStatus,
      };

      const { data: result, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;
      return result as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
    },
  });

  // Update invoice
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, updates }: { invoiceId: string; updates: UpdateInvoiceData }) => {
      // Recalculate totals if subtotal or has_iva changed
      let finalUpdates: any = { ...updates };

      if (updates.subtotal !== undefined || updates.has_iva !== undefined) {
        const invoice = invoices.find(i => i.id === invoiceId);
        if (invoice) {
          const subtotal = updates.subtotal ?? invoice.subtotal;
          const hasIva = updates.has_iva ?? invoice.has_iva;
          const currency = updates.currency ?? invoice.currency;
          const exchangeRate = updates.exchange_rate ?? invoice.exchange_rate;

          const totals = calculateTotals(subtotal, hasIva, currency, exchangeRate);
          finalUpdates = { ...finalUpdates, ...totals };
        }
      }

      const { data, error } = await supabase
        .from('invoices')
        .update({ ...finalUpdates, updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
    },
  });

  // Mark invoice as invoiced (factura cargada)
  const markAsInvoicedMutation = useMutation({
    mutationFn: async ({ invoiceId, invoiceNumber, invoiceFilePath }: {
      invoiceId: string;
      invoiceNumber?: string;
      invoiceFilePath?: string;
    }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'INVOICED' as InvoiceStatus,
          invoice_number: invoiceNumber || null,
          invoice_file_path: invoiceFilePath || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
    },
  });

  // Mark invoice as paid
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: string; data: MarkAsPaidData }) => {
      const { data: result, error } = await supabase
        .from('invoices')
        .update({
          status: 'PAID' as InvoiceStatus,
          paid_at: data.paid_at,
          amount_received: data.amount_received,
          retention_amount: data.retention_amount || 0,
          payment_proof_path: data.payment_proof_path || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return result as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
    },
  });

  // Delete invoice
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
    },
  });

  // Generate recurring invoices for a project
  const generateRecurringInvoices = async (
    deal: {
      mrr_original: number;
      currency: DealCurrency;
      exchange_rate?: number;
      billing_start_date?: string;
      first_month_covered?: boolean;
      start_date: string;
    },
    upToMonth: Date // Generate invoices up to this month
  ) => {
    if (!projectId) throw new Error('No project ID provided');

    const startDate = deal.billing_start_date
      ? new Date(deal.billing_start_date)
      : new Date(deal.start_date);

    // If first month is covered by implementation, start from next month
    if (deal.first_month_covered) {
      startDate.setMonth(startDate.getMonth() + 1);
    }

    // Set to first day of month
    startDate.setDate(1);

    const existingMonths = new Set(
      invoices
        .filter(i => i.invoice_type === 'RECURRING' && i.period_month)
        .map(i => i.period_month!.substring(0, 7)) // YYYY-MM
    );

    const newInvoices: CreateInvoiceData[] = [];
    const currentMonth = new Date(startDate);

    while (currentMonth <= upToMonth) {
      const monthKey = currentMonth.toISOString().substring(0, 7);

      if (!existingMonths.has(monthKey)) {
        const monthName = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

        newInvoices.push({
          invoice_type: 'RECURRING',
          period_month: `${monthKey}-01`,
          concept: `Mensualidad ${monthName}`,
          subtotal: deal.mrr_original,
          has_iva: true, // Recurring usually has IVA
          currency: deal.currency,
          exchange_rate: deal.exchange_rate,
        });
      }

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Create all new invoices
    for (const invoiceData of newInvoices) {
      await createInvoiceMutation.mutateAsync(invoiceData);
    }

    return newInvoices.length;
  };

  // Get summary stats
  const getInvoiceSummary = () => {
    const advanceInvoices = invoices.filter(i => i.invoice_type === 'ADVANCE');
    const implementationInvoices = invoices.filter(i => i.invoice_type === 'IMPLEMENTATION');
    const recurringInvoices = invoices.filter(i => i.invoice_type === 'RECURRING');

    const totalBilled = invoices
      .filter(i => i.status !== 'PENDING')
      .reduce((sum, i) => sum + i.total_usd, 0);

    const totalPaid = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.amount_received || 0), 0);

    const totalPending = invoices
      .filter(i => i.status === 'PENDING')
      .reduce((sum, i) => sum + i.total_usd, 0);

    const totalRetention = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.retention_amount || 0), 0);

    // Total IVA owed to DIAN (only from paid invoices with IVA)
    const totalIvaOwed = invoices
      .filter(i => i.status === 'PAID' && i.has_iva)
      .reduce((sum, i) => sum + i.iva_amount, 0);

    return {
      advanceInvoices,
      implementationInvoices,
      recurringInvoices,
      totalBilled,
      totalPaid,
      totalPending,
      totalRetention,
      totalIvaOwed,
      pendingCount: invoices.filter(i => i.status === 'PENDING').length,
      invoicedCount: invoices.filter(i => i.status === 'INVOICED').length,
      paidCount: invoices.filter(i => i.status === 'PAID').length,
    };
  };

  return {
    invoices,
    isLoading,
    error,
    createInvoice: createInvoiceMutation.mutateAsync,
    updateInvoice: updateInvoiceMutation.mutateAsync,
    markAsInvoiced: markAsInvoicedMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    deleteInvoice: deleteInvoiceMutation.mutateAsync,
    generateRecurringInvoices,
    getInvoiceSummary,
    isCreating: createInvoiceMutation.isPending,
    isUpdating: updateInvoiceMutation.isPending,
    isDeleting: deleteInvoiceMutation.isPending,
  };
}
