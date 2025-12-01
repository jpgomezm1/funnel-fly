import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  FinanceBudget,
  FinanceTransactionType,
  IncomeCategory,
  ExpenseCategory,
} from '@/types/database';

interface BudgetFilters {
  year?: number;
  month?: number;
  type?: FinanceTransactionType;
}

export function useFinanceBudgets(filters?: BudgetFilters) {
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['finance-budgets', filters],
    queryFn: async () => {
      let query = supabase
        .from('finance_budgets')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (filters?.year) {
        query = query.eq('year', filters.year);
      }

      if (filters?.month) {
        query = query.eq('month', filters.month);
      }

      if (filters?.type) {
        query = query.eq('budget_type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FinanceBudget[];
    },
  });

  // Create or update budget
  const upsertMutation = useMutation({
    mutationFn: async (budgetData: {
      year: number;
      month: number;
      budget_type: FinanceTransactionType;
      income_category?: IncomeCategory;
      expense_category?: ExpenseCategory;
      budget_amount_usd: number;
      notes?: string;
    }) => {
      // Check if budget exists
      let query = supabase
        .from('finance_budgets')
        .select('id')
        .eq('year', budgetData.year)
        .eq('month', budgetData.month)
        .eq('budget_type', budgetData.budget_type);

      if (budgetData.income_category) {
        query = query.eq('income_category', budgetData.income_category);
      } else {
        query = query.is('income_category', null);
      }

      if (budgetData.expense_category) {
        query = query.eq('expense_category', budgetData.expense_category);
      } else {
        query = query.is('expense_category', null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('finance_budgets')
          .update({
            budget_amount_usd: budgetData.budget_amount_usd,
            notes: budgetData.notes,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('finance_budgets')
          .insert(budgetData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-budgets'] });
    },
  });

  // Delete budget
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finance_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-budgets'] });
    },
  });

  // Get total budgeted for a month
  const getTotalBudgetForMonth = (year: number, month: number, type?: FinanceTransactionType) => {
    return budgets
      .filter(b => b.year === year && b.month === month && (!type || b.budget_type === type))
      .reduce((sum, b) => sum + b.budget_amount_usd, 0);
  };

  // Get budget by category
  const getBudgetByCategory = (
    year: number,
    month: number,
    category: IncomeCategory | ExpenseCategory
  ): number => {
    const budget = budgets.find(
      b =>
        b.year === year &&
        b.month === month &&
        (b.income_category === category || b.expense_category === category)
    );
    return budget?.budget_amount_usd || 0;
  };

  return {
    budgets,
    isLoading,
    error,
    upsertBudget: upsertMutation.mutateAsync,
    deleteBudget: deleteMutation.mutateAsync,
    getTotalBudgetForMonth,
    getBudgetByCategory,
    isUpserting: upsertMutation.isPending,
  };
}
