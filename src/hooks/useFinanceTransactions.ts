import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  FinanceTransaction,
  FinanceTransactionType,
  IncomeCategory,
  ExpenseCategory,
  ExpenseClassification,
  PaymentMethod,
  getExpenseClassification,
} from '@/types/database';

interface TransactionFilters {
  type?: FinanceTransactionType;
  startDate?: string;
  endDate?: string;
  category?: IncomeCategory | ExpenseCategory;
  classification?: ExpenseClassification;
  currency?: 'USD' | 'COP';
  isRecurring?: boolean;
}

interface CreateTransactionData {
  transaction_type: FinanceTransactionType;
  income_category?: IncomeCategory;
  expense_category?: ExpenseCategory;
  amount_original: number;
  currency: 'USD' | 'COP';
  exchange_rate?: number;
  description: string;
  vendor_or_source?: string;
  reference_number?: string;
  transaction_date: string;
  is_recurring?: boolean;
  recurring_day?: number;
  recurring_end_date?: string;
  payment_method?: PaymentMethod;
  receipt_path?: string;
  notes?: string;
}

export function useFinanceTransactions(filters?: TransactionFilters) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['finance-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('finance_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (filters?.type) {
        query = query.eq('transaction_type', filters.type);
      }

      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }

      if (filters?.classification) {
        query = query.eq('expense_classification', filters.classification);
      }

      if (filters?.currency) {
        query = query.eq('currency', filters.currency);
      }

      if (filters?.isRecurring !== undefined) {
        query = query.eq('is_recurring', filters.isRecurring);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FinanceTransaction[];
    },
  });

  // Create transaction
  const createMutation = useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      // Calculate amount_usd
      let amount_usd = data.amount_original;
      if (data.currency === 'COP' && data.exchange_rate) {
        amount_usd = data.amount_original / data.exchange_rate;
      }

      // Auto-set expense_classification based on category
      let expense_classification: ExpenseClassification | undefined;
      if (data.transaction_type === 'EXPENSE' && data.expense_category) {
        expense_classification = getExpenseClassification(data.expense_category);
      }

      const insertData = {
        ...data,
        amount_usd,
        expense_classification,
        is_recurring: data.is_recurring || false,
      };

      const { data: result, error } = await supabase
        .from('finance_transactions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result as FinanceTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-metrics'] });
    },
  });

  // Update transaction
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateTransactionData> }) => {
      // Recalculate amount_usd if amount or currency changed
      let updateData: any = { ...updates };

      if (updates.amount_original !== undefined || updates.currency !== undefined || updates.exchange_rate !== undefined) {
        const amount = updates.amount_original ?? 0;
        const currency = updates.currency ?? 'USD';
        const rate = updates.exchange_rate;

        if (currency === 'COP' && rate) {
          updateData.amount_usd = amount / rate;
        } else {
          updateData.amount_usd = amount;
        }
      }

      // Update classification if category changed
      if (updates.expense_category) {
        updateData.expense_classification = getExpenseClassification(updates.expense_category);
      }

      const { error } = await supabase
        .from('finance_transactions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-metrics'] });
    },
  });

  // Delete transaction
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-metrics'] });
    },
  });

  // Filter helpers
  const incomeTransactions = transactions.filter(t => t.transaction_type === 'INCOME');
  const expenseTransactions = transactions.filter(t => t.transaction_type === 'EXPENSE');
  const fixedExpenses = expenseTransactions.filter(t => t.expense_classification === 'FIXED');
  const variableExpenses = expenseTransactions.filter(t => t.expense_classification === 'VARIABLE');
  const recurringTransactions = transactions.filter(t => t.is_recurring);

  // Totals
  const totalIncomeUsd = incomeTransactions.reduce((sum, t) => sum + t.amount_usd, 0);
  const totalExpensesUsd = expenseTransactions.reduce((sum, t) => sum + t.amount_usd, 0);
  const totalFixedExpensesUsd = fixedExpenses.reduce((sum, t) => sum + t.amount_usd, 0);
  const totalVariableExpensesUsd = variableExpenses.reduce((sum, t) => sum + t.amount_usd, 0);
  const netIncomeUsd = totalIncomeUsd - totalExpensesUsd;

  return {
    transactions,
    incomeTransactions,
    expenseTransactions,
    fixedExpenses,
    variableExpenses,
    recurringTransactions,
    totalIncomeUsd,
    totalExpensesUsd,
    totalFixedExpensesUsd,
    totalVariableExpensesUsd,
    netIncomeUsd,
    isLoading,
    error,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook for fetching a single transaction
export function useFinanceTransaction(transactionId?: string) {
  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['finance-transaction', transactionId],
    queryFn: async () => {
      if (!transactionId) return null;

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      return data as FinanceTransaction;
    },
    enabled: !!transactionId,
  });

  return { transaction, isLoading, error };
}
