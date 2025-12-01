import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  FinanceTransaction,
  IncomeCategory,
  ExpenseCategory,
  ExpenseClassification,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '@/types/database';

interface MonthlyMetrics {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  netIncome: number;
  incomeByCategory: Record<IncomeCategory, number>;
  expenseByCategory: Record<ExpenseCategory, number>;
}

interface YearlyMetrics {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  netIncome: number;
  monthlyData: MonthlyMetrics[];
}

export function useFinanceMetrics(year?: number, month?: number) {
  const currentDate = new Date();
  const targetYear = year || currentDate.getFullYear();
  const targetMonth = month; // undefined means all months of the year

  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-metrics', targetYear, targetMonth],
    queryFn: async () => {
      // Build date range
      let startDate: string;
      let endDate: string;

      if (targetMonth) {
        // Specific month
        startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;
      } else {
        // Full year
        startDate = `${targetYear}-01-01`;
        endDate = `${targetYear}-12-31`;
      }

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      const transactions = data as FinanceTransaction[];

      // Calculate metrics
      return calculateMetrics(transactions, targetYear);
    },
  });

  return {
    metrics: data,
    isLoading,
    error,
  };
}

function calculateMetrics(transactions: FinanceTransaction[], year: number): YearlyMetrics {
  // Group by month
  const byMonth: Record<string, FinanceTransaction[]> = {};

  transactions.forEach(t => {
    const month = t.transaction_date.substring(0, 7); // YYYY-MM
    if (!byMonth[month]) {
      byMonth[month] = [];
    }
    byMonth[month].push(t);
  });

  // Calculate monthly metrics
  const monthlyData: MonthlyMetrics[] = [];

  // Create entries for all 12 months
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${year}-${String(m).padStart(2, '0')}`;
    const monthTransactions = byMonth[monthKey] || [];

    const incomeByCategory = {} as Record<IncomeCategory, number>;
    const expenseByCategory = {} as Record<ExpenseCategory, number>;

    // Initialize all categories to 0
    (Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).forEach(cat => {
      incomeByCategory[cat] = 0;
    });
    (Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).forEach(cat => {
      expenseByCategory[cat] = 0;
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let fixedExpenses = 0;
    let variableExpenses = 0;

    monthTransactions.forEach(t => {
      if (t.transaction_type === 'INCOME') {
        totalIncome += t.amount_usd;
        if (t.income_category) {
          incomeByCategory[t.income_category] += t.amount_usd;
        }
      } else {
        totalExpenses += t.amount_usd;
        if (t.expense_category) {
          expenseByCategory[t.expense_category] += t.amount_usd;
        }
        if (t.expense_classification === 'FIXED') {
          fixedExpenses += t.amount_usd;
        } else {
          variableExpenses += t.amount_usd;
        }
      }
    });

    monthlyData.push({
      month: monthKey,
      totalIncome,
      totalExpenses,
      fixedExpenses,
      variableExpenses,
      netIncome: totalIncome - totalExpenses,
      incomeByCategory,
      expenseByCategory,
    });
  }

  // Calculate yearly totals
  const yearlyTotals = monthlyData.reduce(
    (acc, m) => ({
      totalIncome: acc.totalIncome + m.totalIncome,
      totalExpenses: acc.totalExpenses + m.totalExpenses,
      fixedExpenses: acc.fixedExpenses + m.fixedExpenses,
      variableExpenses: acc.variableExpenses + m.variableExpenses,
    }),
    { totalIncome: 0, totalExpenses: 0, fixedExpenses: 0, variableExpenses: 0 }
  );

  return {
    year,
    ...yearlyTotals,
    netIncome: yearlyTotals.totalIncome - yearlyTotals.totalExpenses,
    monthlyData,
  };
}

// Hook for getting current month summary
export function useCurrentMonthMetrics() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { metrics, isLoading, error } = useFinanceMetrics(year, month);

  const currentMonthData = metrics?.monthlyData.find(
    m => m.month === `${year}-${String(month).padStart(2, '0')}`
  );

  return {
    currentMonth: currentMonthData,
    isLoading,
    error,
  };
}

// Hook for comparing with previous month
export function useMonthComparison() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Previous month
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-month-comparison', currentYear, currentMonth],
    queryFn: async () => {
      // Get current month transactions
      const currentStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const currentEnd = new Date(currentYear, currentMonth, 0).getDate();
      const currentEndDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${currentEnd}`;

      // Get previous month transactions
      const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
      const prevEnd = new Date(prevYear, prevMonth, 0).getDate();
      const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevEnd}`;

      const [currentResult, prevResult] = await Promise.all([
        supabase
          .from('finance_transactions')
          .select('*')
          .gte('transaction_date', currentStart)
          .lte('transaction_date', currentEndDate),
        supabase
          .from('finance_transactions')
          .select('*')
          .gte('transaction_date', prevStart)
          .lte('transaction_date', prevEndDate),
      ]);

      if (currentResult.error) throw currentResult.error;
      if (prevResult.error) throw prevResult.error;

      const currentTransactions = currentResult.data as FinanceTransaction[];
      const prevTransactions = prevResult.data as FinanceTransaction[];

      const calcTotals = (txs: FinanceTransaction[]) => {
        const income = txs.filter(t => t.transaction_type === 'INCOME');
        const expenses = txs.filter(t => t.transaction_type === 'EXPENSE');
        return {
          totalIncome: income.reduce((sum, t) => sum + t.amount_usd, 0),
          totalExpenses: expenses.reduce((sum, t) => sum + t.amount_usd, 0),
          fixedExpenses: expenses.filter(t => t.expense_classification === 'FIXED').reduce((sum, t) => sum + t.amount_usd, 0),
          variableExpenses: expenses.filter(t => t.expense_classification === 'VARIABLE').reduce((sum, t) => sum + t.amount_usd, 0),
        };
      };

      const current = calcTotals(currentTransactions);
      const previous = calcTotals(prevTransactions);

      return {
        current: {
          ...current,
          netIncome: current.totalIncome - current.totalExpenses,
        },
        previous: {
          ...previous,
          netIncome: previous.totalIncome - previous.totalExpenses,
        },
        changes: {
          income: previous.totalIncome > 0 ? ((current.totalIncome - previous.totalIncome) / previous.totalIncome) * 100 : 0,
          expenses: previous.totalExpenses > 0 ? ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100 : 0,
          netIncome: previous.totalIncome - previous.totalExpenses !== 0
            ? (((current.totalIncome - current.totalExpenses) - (previous.totalIncome - previous.totalExpenses)) / Math.abs(previous.totalIncome - previous.totalExpenses)) * 100
            : 0,
        },
      };
    },
  });

  return {
    comparison: data,
    isLoading,
    error,
  };
}
