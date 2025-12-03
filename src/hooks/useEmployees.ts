import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  name: string;
  display_name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  salary_usd: number;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTransaction {
  id: string;
  transaction_date: string;
  description: string;
  vendor_or_source: string | null;
  amount_usd: number;
  amount_original: number;
  currency: string;
  expense_category: string | null;
  payment_method: string | null;
  notes: string | null;
}

export interface EmployeeWithStats extends Employee {
  total_paid_usd: number;
  transaction_count: number;
  last_payment_date: string | null;
  avg_monthly_cost: number;
}

// Fetch all employees with their payment stats
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async (): Promise<EmployeeWithStats[]> => {
      // Fetch employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('display_name');

      if (empError) throw empError;

      // Fetch all expense transactions to calculate stats
      const { data: transactions, error: txError } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('transaction_type', 'EXPENSE')
        .order('transaction_date', { ascending: false });

      if (txError) throw txError;

      // Calculate stats for each employee
      const employeesWithStats: EmployeeWithStats[] = (employees || []).map((emp: Employee) => {
        const empName = emp.name.toLowerCase();

        // Find transactions that match this employee
        const empTransactions = (transactions || []).filter((t: EmployeeTransaction) => {
          const vendor = (t.vendor_or_source || '').toLowerCase();
          const desc = (t.description || '').toLowerCase();
          return vendor.includes(empName) || desc.includes(empName);
        });

        const total_paid_usd = empTransactions.reduce((sum: number, t: EmployeeTransaction) => sum + (Number(t.amount_usd) || 0), 0);
        const transaction_count = empTransactions.length;
        const last_payment_date = empTransactions.length > 0 ? empTransactions[0].transaction_date : null;

        // Calculate average monthly cost (based on months with activity)
        const monthsSet = new Set(empTransactions.map((t: EmployeeTransaction) => t.transaction_date.substring(0, 7)));
        const monthsWithActivity = monthsSet.size || 1;
        const avg_monthly_cost = total_paid_usd / monthsWithActivity;

        return {
          ...emp,
          salary_usd: Number(emp.salary_usd) || 0,
          total_paid_usd,
          transaction_count,
          last_payment_date,
          avg_monthly_cost,
        };
      });

      return employeesWithStats;
    },
  });
}

// Fetch transactions for a specific employee
export function useEmployeeTransactions(employeeId: string | null) {
  return useQuery({
    queryKey: ['employee-transactions', employeeId],
    queryFn: async (): Promise<{ employee: Employee; transactions: EmployeeTransaction[]; monthlyBreakdown: MonthlyBreakdown[] }> => {
      if (!employeeId) throw new Error('No employee ID provided');

      // Fetch the employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      // Fetch all expense transactions
      const { data: allTransactions, error: txError } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('transaction_type', 'EXPENSE')
        .order('transaction_date', { ascending: false });

      if (txError) throw txError;

      const empName = employee.name.toLowerCase();

      // Filter transactions for this employee
      const transactions = (allTransactions || []).filter((t: EmployeeTransaction) => {
        const vendor = (t.vendor_or_source || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        return vendor.includes(empName) || desc.includes(empName);
      });

      // Calculate monthly breakdown
      const monthlyMap = new Map<string, number>();
      transactions.forEach((t: EmployeeTransaction) => {
        const month = t.transaction_date.substring(0, 7); // YYYY-MM
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + (Number(t.amount_usd) || 0));
      });

      const monthlyBreakdown: MonthlyBreakdown[] = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => b.month.localeCompare(a.month));

      return {
        employee: { ...employee, salary_usd: Number(employee.salary_usd) || 0 },
        transactions,
        monthlyBreakdown,
      };
    },
    enabled: !!employeeId,
  });
}

export interface MonthlyBreakdown {
  month: string;
  amount: number;
}

// Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

// Update employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

// Delete employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
