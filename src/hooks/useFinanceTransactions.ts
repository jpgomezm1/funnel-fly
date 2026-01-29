import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  FinanceTransaction,
  FinanceTransactionType,
  IncomeCategory,
  ExpenseCategory,
  ExpenseClassification,
  PaymentMethod,
  RecurringFrequency,
  getExpenseClassification,
} from '@/types/database';

const RECEIPT_BUCKET = 'finance-receipts';

// Upload receipt file to Supabase storage
export async function uploadReceiptFile(file: File, transactionType: FinanceTransactionType): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${transactionType.toLowerCase()}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(fileName, file);

  if (error) throw error;
  return fileName;
}

// Delete receipt file from Supabase storage
export async function deleteReceiptFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .remove([filePath]);

  if (error) throw error;
}

// Get signed URL for receipt file
export async function getReceiptUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;

  const { data, error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) return null;
  return data.signedUrl;
}

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
  recurring_frequency?: RecurringFrequency;
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

      const baseData = {
        ...data,
        amount_usd,
        expense_classification,
        is_recurring: data.is_recurring || false,
      };

      // If recurring, generate all past occurrences
      // For MONTHLY: recurring_day is required
      // For BIWEEKLY: uses transaction_date as start, recurring_day not required
      const frequency = data.recurring_frequency || 'MONTHLY';
      const canGenerateRecurring = data.is_recurring && (frequency === 'BIWEEKLY' || data.recurring_day);

      if (canGenerateRecurring) {
        // Parse dates by extracting components directly from the string to avoid timezone issues
        const parseLocalDate = (dateStr: string): { year: number; month: number; day: number } => {
          const [year, month, day] = dateStr.split('-').map(Number);
          return { year, month: month - 1, day }; // month is 0-indexed
        };

        const startParts = parseLocalDate(data.transaction_date);
        const startYear = startParts.year;
        const startMonth = startParts.month;
        const startDay = startParts.day;

        // Create startDate for comparisons (using local noon to avoid timezone issues)
        const startDate = new Date(startYear, startMonth, startDay, 12, 0, 0);

        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        // Use end date if provided, otherwise use today
        let endDate = today;
        let endYear = today.getFullYear();
        let endMonth = today.getMonth();

        if (data.recurring_end_date) {
          // Trust the user's end date - they may be registering completed recurring expenses
          const endParts = parseLocalDate(data.recurring_end_date);
          endYear = endParts.year;
          endMonth = endParts.month;
          endDate = new Date(endParts.year, endParts.month, endParts.day, 23, 59, 59);
        }

        const occurrences: typeof baseData[] = [];
        const targetDay = data.recurring_day;

        // Safety limit to prevent infinite loops
        const maxIterations = frequency === 'BIWEEKLY' ? 240 : 120; // More iterations for biweekly
        let iterations = 0;

        // Helper function to format date from components
        const formatDateFromParts = (year: number, month: number, day: number): string => {
          return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        };

        // Helper function to format date from Date object
        const formatDate = (date: Date): string => {
          return formatDateFromParts(date.getFullYear(), date.getMonth(), date.getDate());
        };

        if (frequency === 'BIWEEKLY') {
          // Biweekly: every 15 days from start date
          let currentDate = new Date(startYear, startMonth, startDay, 12, 0, 0);

          while (iterations < maxIterations) {
            // Stop if we've passed the end date
            if (currentDate > endDate) {
              break;
            }

            // Add occurrence
            occurrences.push({
              ...baseData,
              transaction_date: formatDate(currentDate),
            });

            // Move forward 15 days
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 15);

            iterations++;
          }
        } else {
          // Monthly: same day each month
          // IMPORTANT: Start from the year/month extracted directly from the input string
          let currentYear = startYear;
          let currentMonth = startMonth;

          while (iterations < maxIterations) {
            // Get the last day of the current month
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            // Use target day or last day of month if target doesn't exist
            const dayToUse = Math.min(targetDay!, lastDayOfMonth);

            // Create occurrence date using extracted year/month to preserve original year
            const occurrenceDate = new Date(currentYear, currentMonth, dayToUse, 12, 0, 0);

            // Stop if we've passed the end date
            if (occurrenceDate > endDate) {
              break;
            }

            // Only add if on or after start date
            if (occurrenceDate >= startDate) {
              occurrences.push({
                ...baseData,
                transaction_date: formatDateFromParts(currentYear, currentMonth, dayToUse),
              });
            }

            // Move to next month
            currentMonth++;
            if (currentMonth > 11) {
              currentMonth = 0;
              currentYear++;
            }

            iterations++;
          }
        }

        if (occurrences.length === 0) {
          throw new Error('No hay ocurrencias para crear');
        }

        // Insert all occurrences
        const { data: results, error } = await supabase
          .from('finance_transactions')
          .insert(occurrences)
          .select();

        if (error) throw error;
        return results[0] as FinanceTransaction;
      } else {
        // Single transaction (non-recurring)
        const { data: result, error } = await supabase
          .from('finance_transactions')
          .insert(baseData)
          .select()
          .single();

        if (error) throw error;
        return result as FinanceTransaction;
      }
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

  // Toggle recurring active status
  const toggleRecurringActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('finance_transactions')
        .update({ is_active: isActive })
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
    toggleRecurringActive: toggleRecurringActiveMutation.mutateAsync,
    isTogglingActive: toggleRecurringActiveMutation.isPending,
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
