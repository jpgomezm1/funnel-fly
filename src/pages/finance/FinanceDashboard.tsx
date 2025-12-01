import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceMetrics, useMonthComparison } from '@/hooks/useFinanceMetrics';
import { useFinanceTransactions } from '@/hooks/useFinanceTransactions';
import { useCurrentExchangeRate } from '@/hooks/useFinanceExchangeRates';
import {
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CLASSIFICATION_LABELS,
  IncomeCategory,
  ExpenseCategory,
} from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionModal } from '@/components/finance/TransactionModal';
import { toast } from '@/hooks/use-toast';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function FinanceDashboard() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { metrics, isLoading: metricsLoading } = useFinanceMetrics(selectedYear);
  const { comparison, isLoading: comparisonLoading } = useMonthComparison();
  const { currentRate } = useCurrentExchangeRate();
  const {
    recurringTransactions,
    createTransaction,
    isCreating,
  } = useFinanceTransactions();

  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Get current month data
  const currentMonthData = metrics?.monthlyData.find(
    m => m.month === `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
  );

  const handleCreateIncome = async (data: any) => {
    try {
      await createTransaction(data);
      toast({ title: 'Ingreso registrado', description: 'El ingreso ha sido agregado correctamente' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo registrar el ingreso', variant: 'destructive' });
      throw error;
    }
  };

  const handleCreateExpense = async (data: any) => {
    try {
      await createTransaction(data);
      toast({ title: 'Gasto registrado', description: 'El gasto ha sido agregado correctamente' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo registrar el gasto', variant: 'destructive' });
      throw error;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen financiero y control de gastos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, idx) => (
                <SelectItem key={idx} value={(idx + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setIncomeModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Ingreso
        </Button>
        <Button variant="outline" onClick={() => setExpenseModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Gasto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              {comparison && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    comparison.changes.income >= 0
                      ? "text-emerald-600 border-emerald-200"
                      : "text-red-600 border-red-200"
                  )}
                >
                  {comparison.changes.income >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  )}
                  {formatPercentage(comparison.changes.income)}
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(currentMonthData?.totalIncome || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              {comparison && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    comparison.changes.expenses <= 0
                      ? "text-emerald-600 border-emerald-200"
                      : "text-red-600 border-red-200"
                  )}
                >
                  {comparison.changes.expenses <= 0 ? (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  )}
                  {formatPercentage(comparison.changes.expenses)}
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Gastos del Mes</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(currentMonthData?.totalExpenses || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Net Income */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                (currentMonthData?.netIncome || 0) >= 0 ? "bg-blue-100" : "bg-amber-100"
              )}>
                <Wallet className={cn(
                  "h-6 w-6",
                  (currentMonthData?.netIncome || 0) >= 0 ? "text-blue-600" : "text-amber-600"
                )} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Utilidad Neta</p>
              <p className={cn(
                "text-2xl font-bold",
                (currentMonthData?.netIncome || 0) >= 0 ? "text-blue-600" : "text-amber-600"
              )}>
                {formatCurrency(currentMonthData?.netIncome || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Tasa USD/COP</p>
              <p className="text-2xl font-bold">
                ${currentRate.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fixed vs Variable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos: Fijos vs Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium">Gastos Fijos</span>
                </div>
                <span className="font-bold text-blue-700">
                  {formatCurrency(currentMonthData?.fixedExpenses || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-medium">Gastos Variables</span>
                </div>
                <span className="font-bold text-amber-700">
                  {formatCurrency(currentMonthData?.variableExpenses || 0)}
                </span>
              </div>
              {/* Percentage bar */}
              <div className="h-4 rounded-full overflow-hidden bg-slate-100 flex">
                {(currentMonthData?.totalExpenses || 0) > 0 && (
                  <>
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: `${((currentMonthData?.fixedExpenses || 0) / (currentMonthData?.totalExpenses || 1)) * 100}%`
                      }}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{
                        width: `${((currentMonthData?.variableExpenses || 0) / (currentMonthData?.totalExpenses || 1)) * 100}%`
                      }}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Fijos: {((currentMonthData?.fixedExpenses || 0) / (currentMonthData?.totalExpenses || 1) * 100).toFixed(0)}%
                </span>
                <span>
                  Variables: {((currentMonthData?.variableExpenses || 0) / (currentMonthData?.totalExpenses || 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentMonthData && Object.entries(currentMonthData.incomeByCategory)
                .filter(([_, value]) => value > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm">
                        {INCOME_CATEGORY_LABELS[category as IncomeCategory]}
                      </span>
                    </div>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              {currentMonthData &&
                Object.values(currentMonthData.incomeByCategory).every(v => v === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin ingresos registrados este mes
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentMonthData && Object.entries(currentMonthData.expenseByCategory)
                .filter(([_, value]) => value > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <span className="text-sm">
                      {EXPENSE_CATEGORY_LABELS[category as ExpenseCategory]}
                    </span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              {currentMonthData &&
                Object.values(currentMonthData.expenseByCategory).every(v => v === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4 col-span-full">
                    Sin gastos registrados este mes
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Recurring Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Transacciones Recurrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recurringTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay transacciones recurrentes configuradas
              </p>
            ) : (
              <div className="divide-y">
                {recurringTransactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        t.transaction_type === 'INCOME' ? "bg-emerald-100" : "bg-red-100"
                      )}>
                        {t.transaction_type === 'INCOME' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Receipt className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Día {t.recurring_day} de cada mes
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-bold",
                      t.transaction_type === 'INCOME' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {t.transaction_type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount_usd)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Year Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen Anual {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Ingresos</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(metrics?.totalIncome || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Gastos</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(metrics?.totalExpenses || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Utilidad Neta</p>
              <p className={cn(
                "text-xl font-bold",
                (metrics?.netIncome || 0) >= 0 ? "text-blue-600" : "text-amber-600"
              )}>
                {formatCurrency(metrics?.netIncome || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Margen</p>
              <p className="text-xl font-bold">
                {metrics && metrics.totalIncome > 0
                  ? `${((metrics.netIncome / metrics.totalIncome) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-3">Tendencia Mensual</p>
            <div className="grid grid-cols-12 gap-1">
              {metrics?.monthlyData.map((m, idx) => {
                const maxIncome = Math.max(...(metrics?.monthlyData.map(d => d.totalIncome) || [1]));
                const height = maxIncome > 0 ? (m.totalIncome / maxIncome) * 100 : 0;
                const isCurrentMonth = idx + 1 === selectedMonth;

                return (
                  <div key={m.month} className="flex flex-col items-center">
                    <div className="h-20 w-full flex items-end justify-center">
                      <div
                        className={cn(
                          "w-full rounded-t transition-all",
                          isCurrentMonth ? "bg-emerald-500" : "bg-emerald-200"
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs mt-1",
                      isCurrentMonth ? "font-bold" : "text-muted-foreground"
                    )}>
                      {MONTHS[idx].substring(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <TransactionModal
        open={incomeModalOpen}
        onOpenChange={setIncomeModalOpen}
        transactionType="INCOME"
        onSave={handleCreateIncome}
        isSaving={isCreating}
      />

      <TransactionModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        transactionType="EXPENSE"
        onSave={handleCreateExpense}
        isSaving={isCreating}
      />
    </div>
  );
}
