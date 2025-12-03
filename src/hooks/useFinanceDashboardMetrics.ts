import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  FinanceTransaction,
  IncomeCategory,
  ExpenseCategory,
} from '@/types/database';

// Categorías de ingreso operacional (excluye aportes de socios)
const OPERATIONAL_INCOME_CATEGORIES: IncomeCategory[] = [
  'MRR',
  'IMPLEMENTATION_FEE',
  'CONSULTING',
  'OTHER_INCOME'
];

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string; // "Ene 2025 - Dic 2025"
}

export interface PeriodData {
  // Ingresos
  operationalIncome: number;
  mrr: number;
  implementationFee: number;
  consulting: number;
  otherIncome: number;
  partnerContribution: number;
  totalIncome: number;
  // Gastos
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  payroll: number;
  // Márgenes y utilidades
  grossProfit: number;
  netProfit: number;
  operationalMargin: number;
  // Burn Rate
  burnRate: number;
  // Promedios mensuales (para rangos multi-mes)
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  avgMonthlyBurn: number;
  // Metadata
  monthsInPeriod: number;
}

export interface MonthlyData {
  month: string; // YYYY-MM
  monthLabel: string; // "Ene 25"
  year: number;
  monthNum: number;
  // Ingresos
  operationalIncome: number;
  mrr: number;
  implementationFee: number;
  consulting: number;
  otherIncome: number;
  partnerContribution: number;
  totalIncome: number;
  // Gastos
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  payroll: number;
  constitutionExpenses: number; // Gastos de constitución (excluidos de utilidad real)
  // Márgenes y utilidades
  grossProfit: number;
  netProfit: number;
  operationalMargin: number;
  // Utilidad del negocio (excluyendo aportes de socios y gastos de constitución)
  businessProfit: number;
  businessExpenses: number; // totalExpenses - constitutionExpenses
  // Burn Rate
  burnRate: number;
}

export interface CategoryBreakdown {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

// Métricas de salud financiera (NO dependen del filtro de tiempo)
export interface HealthMetrics {
  // Runway calculado con últimos 3 meses
  runway: {
    monthsOfRunway: number;
    cashPosition: number;
    isCashNegative: boolean;
    avgMonthlyBurn: number;
    avgMonthlyProfit: number;
    isProfitable: boolean;
    burnPeriodUsed: string; // "Últimos 3 meses"
    monthsWithActivity: number;
  };

  // Crecimiento MRR
  mrrGrowth: {
    currentMRR: number;
    previousMRR: number;
    growthRate: number;
    trend: 'up' | 'down' | 'stable';
  };

  // Dependencia de capital
  capitalDependency: {
    operationalCoverage: number; // % gastos cubiertos por ingresos op.
    requiresInjection: boolean;
    monthlyGap: number;
  };
}

// Proyecciones financieras
export interface FinanceProjections {
  // Proyección de Runway
  runwayProjection: {
    currentRunway: number;
    projectedCashExhaustion: string | null; // Fecha ISO o null si rentable
    runwayTrend: 'improving' | 'stable' | 'declining';
  };

  // Proyección de Breakeven
  breakevenProjection: {
    currentGap: number;
    monthlyGrowthRate: number;
    projectedBreakevenDate: string | null;
    monthsToBreakeven: number | null;
    isAchievable: boolean;
  };

  // Proyección de MRR
  mrrProjection: {
    currentMRR: number;
    projectedMRR3m: number;
    projectedMRR6m: number;
    projectedMRR12m: number;
    growthRate: number;
  };

  // Proyección de Cash
  cashProjection: {
    month: string;
    optimistic: number;
    base: number;
    pessimistic: number;
    isProjection: boolean;
  }[];
}

// Alertas financieras
export interface FinanceAlert {
  type: 'runway' | 'burn' | 'mrr' | 'cash' | 'breakeven';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action?: string;
}

export interface FinanceDashboardMetrics {
  // Período seleccionado
  dateRange: DateRange;

  // Datos del período seleccionado
  currentPeriod: PeriodData;

  // Datos del período anterior (mismo rango, período previo)
  previousPeriod: PeriodData;

  // Cambios porcentuales período vs período
  periodChanges: {
    operationalIncome: number;
    totalExpenses: number;
    grossProfit: number;
    burnRate: number;
  };

  // Tendencia mensual (todos los meses en el rango + contexto)
  monthlyTrend: MonthlyData[];

  // Breakdown por categorías del período
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];

  // Top gastos
  topExpenses: {
    category: ExpenseCategory;
    label: string;
    amount: number;
    percentage: number;
  }[];

  // Ratios financieros (del período)
  ratios: {
    payrollToRevenue: number;
    fixedCostsToRevenue: number;
    variableCostsToRevenue: number;
    operationalMargin: number;
    burnRateRatio: number;
  };

  // Punto de equilibrio mensual
  breakeven: {
    monthlyFixedCosts: number;
    averageVariableCostRatio: number;
    breakEvenRevenue: number;
    currentGap: number;
    isAchievable: boolean;
  };

  // Runway (LEGACY - mantener por compatibilidad, usar healthMetrics)
  runway: {
    totalCapitalInjected: number;
    estimatedCashPosition: number;
    averageMonthlyBurn: number;
    monthsOfRunway: number;
    isProfitable: boolean;
    avgMonthlyProfit: number;
    isCashNegative: boolean;
  };

  // NUEVAS métricas de salud (NO dependen del filtro)
  healthMetrics: HealthMetrics;

  // Proyecciones
  projections: FinanceProjections;

  // Alertas automáticas
  alerts: FinanceAlert[];

  // Transacciones recurrentes activas
  recurringExpenses: {
    total: number;
    count: number;
    items: { description: string; amount: number; day: number }[];
  };

  recurringIncome: {
    total: number;
    count: number;
    items: { description: string; amount: number; day: number }[];
  };
}

const MONTH_LABELS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const EXPENSE_CATEGORY_COLORS_MAP: Record<ExpenseCategory, string> = {
  'PAYROLL': '#3B82F6',
  'OFFICE': '#6366F1',
  'SUBSCRIPTIONS': '#06B6D4',
  'INFRASTRUCTURE': '#0EA5E9',
  'INSURANCE': '#8B5CF6',
  'ACCOUNTING': '#A855F7',
  'BANKING': '#64748B',
  'MARKETING': '#F59E0B',
  'SALES_COMMISSION': '#F97316',
  'FREELANCERS': '#F43F5E',
  'TRAVEL': '#EC4899',
  'EQUIPMENT': '#EF4444',
  'BRAND': '#84CC16',
  'TRAINING': '#10B981',
  'EVENTS': '#EAB308',
  'LEGAL': '#D946EF',
  'CONSTITUTION': '#8B5CF6',
  'TAXES': '#14B8A6',
  'OTHER_EXPENSE': '#6B7280'
};

const INCOME_CATEGORY_COLORS_MAP: Record<IncomeCategory, string> = {
  'MRR': '#10B981',
  'IMPLEMENTATION_FEE': '#3B82F6',
  'CONSULTING': '#8B5CF6',
  'PARTNER_CONTRIBUTION': '#F59E0B',
  'OTHER_INCOME': '#6B7280'
};

const INCOME_CATEGORY_LABELS_MAP: Record<IncomeCategory, string> = {
  'MRR': 'MRR',
  'IMPLEMENTATION_FEE': 'Fee Implementación',
  'CONSULTING': 'Consultoría',
  'PARTNER_CONTRIBUTION': 'Aporte Socios',
  'OTHER_INCOME': 'Otros'
};

const EXPENSE_CATEGORY_LABELS_MAP: Record<ExpenseCategory, string> = {
  'PAYROLL': 'Nómina',
  'OFFICE': 'Oficina',
  'SUBSCRIPTIONS': 'Suscripciones',
  'INFRASTRUCTURE': 'Infraestructura',
  'INSURANCE': 'Seguros',
  'ACCOUNTING': 'Contabilidad',
  'BANKING': 'Gastos Bancarios',
  'MARKETING': 'Marketing',
  'SALES_COMMISSION': 'Comisiones',
  'FREELANCERS': 'Freelancers',
  'TRAVEL': 'Viáticos',
  'EQUIPMENT': 'Equipos',
  'BRAND': 'Branding',
  'TRAINING': 'Capacitación',
  'EVENTS': 'Eventos',
  'LEGAL': 'Legal',
  'CONSTITUTION': 'Constitución',
  'TAXES': 'Impuestos',
  'OTHER_EXPENSE': 'Otros'
};

function getMonthsBetween(startDate: string, endDate: string): { year: number; month: number }[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months: { year: number; month: number }[] = [];

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    months.push({ year: current.getFullYear(), month: current.getMonth() + 1 });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function processMonthlyData(transactions: FinanceTransaction[], year: number, month: number): MonthlyData {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const monthTransactions = transactions.filter(t =>
    t.transaction_date.startsWith(monthStr)
  );

  // Ingresos por categoría
  const incomeByCategory = monthTransactions
    .filter(t => t.transaction_type === 'INCOME')
    .reduce((acc, t) => {
      const cat = t.income_category || 'OTHER_INCOME';
      acc[cat] = (acc[cat] || 0) + t.amount_usd;
      return acc;
    }, {} as Record<string, number>);

  const mrr = incomeByCategory['MRR'] || 0;
  const implementationFee = incomeByCategory['IMPLEMENTATION_FEE'] || 0;
  const consulting = incomeByCategory['CONSULTING'] || 0;
  const otherIncome = incomeByCategory['OTHER_INCOME'] || 0;
  const partnerContribution = incomeByCategory['PARTNER_CONTRIBUTION'] || 0;

  const operationalIncome = mrr + implementationFee + consulting + otherIncome;
  const totalIncome = operationalIncome + partnerContribution;

  // Gastos
  const expenses = monthTransactions.filter(t => t.transaction_type === 'EXPENSE');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount_usd, 0);

  const fixedExpenses = expenses
    .filter(t => t.expense_classification === 'FIXED')
    .reduce((sum, t) => sum + t.amount_usd, 0);

  const variableExpenses = expenses
    .filter(t => t.expense_classification === 'VARIABLE')
    .reduce((sum, t) => sum + t.amount_usd, 0);

  const payroll = expenses
    .filter(t => t.expense_category === 'PAYROLL')
    .reduce((sum, t) => sum + t.amount_usd, 0);

  // Gastos de constitución (para excluir de análisis de utilidad)
  const constitutionExpenses = expenses
    .filter(t => t.expense_category === 'CONSTITUTION')
    .reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);

  // Cálculos
  const grossProfit = operationalIncome - totalExpenses;
  const netProfit = totalIncome - totalExpenses;
  const operationalMargin = operationalIncome > 0 ? (grossProfit / operationalIncome) * 100 : 0;
  const burnRate = Math.max(0, totalExpenses - operationalIncome);

  // Utilidad real del negocio (sin aportes de socios ni gastos de constitución)
  const businessExpenses = Math.max(0, totalExpenses - constitutionExpenses);
  const businessProfit = operationalIncome - businessExpenses;

  return {
    month: monthStr,
    monthLabel: `${MONTH_LABELS_SHORT[month - 1]} ${String(year).slice(2)}`,
    year,
    monthNum: month,
    operationalIncome,
    mrr,
    implementationFee,
    consulting,
    otherIncome,
    partnerContribution,
    totalIncome,
    totalExpenses,
    fixedExpenses,
    variableExpenses,
    payroll,
    constitutionExpenses,
    grossProfit,
    netProfit,
    operationalMargin,
    businessProfit,
    businessExpenses,
    burnRate
  };
}

function processPeriodData(monthlyData: MonthlyData[]): PeriodData {
  const monthsInPeriod = monthlyData.length || 1;

  // CORREGIDO: Solo contar meses con actividad real para promedios
  const monthsWithActivity = monthlyData.filter(m =>
    m.totalExpenses > 0 || m.operationalIncome > 0
  ).length || 1;

  const totals = monthlyData.reduce((acc, m) => ({
    operationalIncome: acc.operationalIncome + m.operationalIncome,
    mrr: acc.mrr + m.mrr,
    implementationFee: acc.implementationFee + m.implementationFee,
    consulting: acc.consulting + m.consulting,
    otherIncome: acc.otherIncome + m.otherIncome,
    partnerContribution: acc.partnerContribution + m.partnerContribution,
    totalIncome: acc.totalIncome + m.totalIncome,
    totalExpenses: acc.totalExpenses + m.totalExpenses,
    fixedExpenses: acc.fixedExpenses + m.fixedExpenses,
    variableExpenses: acc.variableExpenses + m.variableExpenses,
    payroll: acc.payroll + m.payroll,
  }), {
    operationalIncome: 0,
    mrr: 0,
    implementationFee: 0,
    consulting: 0,
    otherIncome: 0,
    partnerContribution: 0,
    totalIncome: 0,
    totalExpenses: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    payroll: 0,
  });

  const grossProfit = totals.operationalIncome - totals.totalExpenses;
  const netProfit = totals.totalIncome - totals.totalExpenses;
  const operationalMargin = totals.operationalIncome > 0 ? (grossProfit / totals.operationalIncome) * 100 : 0;
  const burnRate = Math.max(0, totals.totalExpenses - totals.operationalIncome);

  return {
    ...totals,
    grossProfit,
    netProfit,
    operationalMargin,
    burnRate,
    // CORREGIDO: Usar meses con actividad, no meses del período
    avgMonthlyIncome: totals.operationalIncome / monthsWithActivity,
    avgMonthlyExpenses: totals.totalExpenses / monthsWithActivity,
    avgMonthlyBurn: burnRate / monthsWithActivity,
    monthsInPeriod,
  };
}

// Helper para formatear USD
function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper para generar proyección de cash
function generateCashProjection(
  currentCash: number,
  avgBurn: number,
  avgProfit: number,
  isProfitable: boolean
): { month: string; optimistic: number; base: number; pessimistic: number; isProjection: boolean }[] {
  const projection: { month: string; optimistic: number; base: number; pessimistic: number; isProjection: boolean }[] = [];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i + 1);
    const monthLabel = `${months[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;

    if (isProfitable) {
      // Si es rentable, el cash crece
      projection.push({
        month: monthLabel,
        optimistic: currentCash + (avgProfit * 1.2 * (i + 1)),
        base: currentCash + (avgProfit * (i + 1)),
        pessimistic: currentCash + (avgProfit * 0.8 * (i + 1)),
        isProjection: true
      });
    } else {
      // Si no es rentable, el cash decrece
      projection.push({
        month: monthLabel,
        optimistic: Math.max(0, currentCash - (avgBurn * 0.8 * (i + 1))),
        base: Math.max(0, currentCash - (avgBurn * (i + 1))),
        pessimistic: Math.max(0, currentCash - (avgBurn * 1.2 * (i + 1))),
        isProjection: true
      });
    }
  }

  return projection;
}

function getPreviousPeriodRange(startDate: string, endDate: string): { startDate: string; endDate: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the duration in milliseconds
  const durationMs = end.getTime() - start.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  // Previous period ends the day before current period starts
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  // Previous period starts (duration) days before prevEnd
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - durationDays + 1);

  return {
    startDate: prevStart.toISOString().split('T')[0],
    endDate: prevEnd.toISOString().split('T')[0],
  };
}

export function useFinanceDashboardMetrics(startDate: string, endDate: string) {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['finance-dashboard-metrics', startDate, endDate],
    queryFn: async (): Promise<FinanceDashboardMetrics> => {
      // Get previous period for comparison
      const prevPeriod = getPreviousPeriodRange(startDate, endDate);

      // Fetch transactions from previous period start to current period end
      const { data: transactions, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .gte('transaction_date', prevPeriod.startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      const allTransactions = (transactions || []) as FinanceTransaction[];

      // Get months in current period
      const currentMonths = getMonthsBetween(startDate, endDate);
      const currentMonthlyData = currentMonths.map(({ year, month }) =>
        processMonthlyData(allTransactions, year, month)
      );

      // Get months in previous period
      const prevMonths = getMonthsBetween(prevPeriod.startDate, prevPeriod.endDate);
      const prevMonthlyData = prevMonths.map(({ year, month }) =>
        processMonthlyData(allTransactions, year, month)
      );

      // Process period data
      const currentPeriod = processPeriodData(currentMonthlyData);
      const previousPeriod = processPeriodData(prevMonthlyData);

      // Period over period changes
      const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const periodChanges = {
        operationalIncome: calcChange(currentPeriod.operationalIncome, previousPeriod.operationalIncome),
        totalExpenses: calcChange(currentPeriod.totalExpenses, previousPeriod.totalExpenses),
        grossProfit: calcChange(currentPeriod.grossProfit, previousPeriod.grossProfit),
        burnRate: calcChange(currentPeriod.burnRate, previousPeriod.burnRate)
      };

      // Build date range label
      const startParts = startDate.split('-');
      const endParts = endDate.split('-');
      const startLabel = `${MONTH_LABELS_SHORT[parseInt(startParts[1]) - 1]} ${startParts[0]}`;
      const endLabel = `${MONTH_LABELS_SHORT[parseInt(endParts[1]) - 1]} ${endParts[0]}`;
      const dateRangeLabel = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;

      const dateRange: DateRange = {
        startDate,
        endDate,
        label: dateRangeLabel,
      };

      // Category breakdowns for the period
      const periodTransactions = allTransactions.filter(t =>
        t.transaction_date >= startDate && t.transaction_date <= endDate
      );

      const incomeByCategory: CategoryBreakdown[] = [];
      const incomeTxns = periodTransactions.filter(t => t.transaction_type === 'INCOME');
      const totalIncomeForBreakdown = incomeTxns.reduce((sum, t) => sum + t.amount_usd, 0);

      const incomeGrouped = incomeTxns.reduce((acc, t) => {
        const cat = t.income_category || 'OTHER_INCOME';
        acc[cat] = (acc[cat] || 0) + t.amount_usd;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(incomeGrouped).forEach(([category, amount]) => {
        if (amount > 0) {
          incomeByCategory.push({
            category,
            label: INCOME_CATEGORY_LABELS_MAP[category as IncomeCategory] || category,
            amount,
            percentage: totalIncomeForBreakdown > 0 ? (amount / totalIncomeForBreakdown) * 100 : 0,
            color: INCOME_CATEGORY_COLORS_MAP[category as IncomeCategory] || '#6B7280'
          });
        }
      });
      incomeByCategory.sort((a, b) => b.amount - a.amount);

      const expenseByCategory: CategoryBreakdown[] = [];
      const expenseTxns = periodTransactions.filter(t => t.transaction_type === 'EXPENSE');
      const totalExpenseForBreakdown = expenseTxns.reduce((sum, t) => sum + t.amount_usd, 0);

      const expenseGrouped = expenseTxns.reduce((acc, t) => {
        const cat = t.expense_category || 'OTHER_EXPENSE';
        acc[cat] = (acc[cat] || 0) + t.amount_usd;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(expenseGrouped).forEach(([category, amount]) => {
        if (amount > 0) {
          expenseByCategory.push({
            category,
            label: EXPENSE_CATEGORY_LABELS_MAP[category as ExpenseCategory] || category,
            amount,
            percentage: totalExpenseForBreakdown > 0 ? (amount / totalExpenseForBreakdown) * 100 : 0,
            color: EXPENSE_CATEGORY_COLORS_MAP[category as ExpenseCategory] || '#6B7280'
          });
        }
      });
      expenseByCategory.sort((a, b) => b.amount - a.amount);

      // Top expenses
      const topExpenses = expenseByCategory.slice(0, 5).map(e => ({
        category: e.category as ExpenseCategory,
        label: e.label,
        amount: e.amount,
        percentage: e.percentage
      }));

      // Ratios (based on period totals)
      const opIncome = currentPeriod.operationalIncome || 1;
      const ratios = {
        payrollToRevenue: (currentPeriod.payroll / opIncome) * 100,
        fixedCostsToRevenue: (currentPeriod.fixedExpenses / opIncome) * 100,
        variableCostsToRevenue: (currentPeriod.variableExpenses / opIncome) * 100,
        operationalMargin: currentPeriod.operationalMargin,
        burnRateRatio: opIncome > 0 ? (currentPeriod.burnRate / opIncome) * 100 : 0
      };

      // Breakeven (using period averages)
      // CORREGIDO: Usar meses con actividad para calcular promedio de fijos
      const monthsWithActivityForBreakeven = currentMonthlyData.filter(m =>
        m.totalExpenses > 0 || m.operationalIncome > 0
      ).length || 1;

      const avgVariableRatio = currentPeriod.operationalIncome > 0
        ? currentPeriod.variableExpenses / currentPeriod.operationalIncome
        : 0.3;
      const avgMonthlyFixed = currentPeriod.fixedExpenses / monthsWithActivityForBreakeven;

      // CORREGIDO: Si ratio >= 1, el modelo es insostenible
      const isBreakevenAchievable = avgVariableRatio < 1;
      const breakEvenRevenue = isBreakevenAchievable
        ? avgMonthlyFixed / (1 - avgVariableRatio)
        : Infinity;

      const breakeven = {
        monthlyFixedCosts: avgMonthlyFixed,
        averageVariableCostRatio: avgVariableRatio,
        breakEvenRevenue: isBreakevenAchievable ? breakEvenRevenue : avgMonthlyFixed * 10, // Para UI
        currentGap: currentPeriod.avgMonthlyIncome - (isBreakevenAchievable ? breakEvenRevenue : avgMonthlyFixed * 10),
        isAchievable: isBreakevenAchievable
      };

      // ============================================================
      // RUNWAY CALCULATION - CORREGIDO
      // Usar SIEMPRE los últimos 3 meses para burn rate (independiente del filtro)
      // ============================================================

      // Una sola query para todo (optimización)
      const allTimeTransactions = await supabase
        .from('finance_transactions')
        .select('*')
        .order('transaction_date', { ascending: true });

      const allTxns = (allTimeTransactions.data || []) as FinanceTransaction[];

      // Calcular cash position (all time)
      const totalCapitalInjected = allTxns
        .filter(t => t.income_category === 'PARTNER_CONTRIBUTION')
        .reduce((sum, t) => sum + t.amount_usd, 0);

      const totalOperationalIncome = allTxns
        .filter(t => t.transaction_type === 'INCOME' && OPERATIONAL_INCOME_CATEGORIES.includes(t.income_category as IncomeCategory))
        .reduce((sum, t) => sum + t.amount_usd, 0);

      const totalExpensesAllTime = allTxns
        .filter(t => t.transaction_type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount_usd, 0);

      // CORREGIDO: NO ocultar valores negativos
      const estimatedCashPosition = totalCapitalInjected + totalOperationalIncome - totalExpensesAllTime;
      const isCashNegative = estimatedCashPosition < 0;

      // ============================================================
      // RUNWAY - CORREGIDO según definición del usuario:
      // Runway = Cash Position / Gastos Fijos del ÚLTIMO MES COMPLETO
      // Asume que NO vamos a vender nada más (worst case)
      // ============================================================

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Último mes completo = mes anterior al actual
      // Si estamos en Diciembre 2025, usamos Noviembre 2025
      const lastCompleteMonth = now.getMonth() === 0
        ? { year: now.getFullYear() - 1, month: 12 }
        : { year: now.getFullYear(), month: now.getMonth() }; // getMonth() es 0-indexed, así que month actual - 1 + 1 = month

      // Encontrar el último mes con datos de gastos fijos
      // Intentamos el mes anterior, si no hay datos, retrocedemos
      let lastMonthWithFixedExpenses = { ...lastCompleteMonth };
      let lastMonthData = processMonthlyData(allTxns, lastMonthWithFixedExpenses.year, lastMonthWithFixedExpenses.month);

      // Si no hay gastos fijos en el último mes, retroceder hasta encontrar uno
      let attempts = 0;
      while (lastMonthData.fixedExpenses === 0 && attempts < 6) {
        lastMonthWithFixedExpenses.month--;
        if (lastMonthWithFixedExpenses.month < 1) {
          lastMonthWithFixedExpenses.month = 12;
          lastMonthWithFixedExpenses.year--;
        }
        lastMonthData = processMonthlyData(allTxns, lastMonthWithFixedExpenses.year, lastMonthWithFixedExpenses.month);
        attempts++;
      }

      // Gastos fijos del último mes (esto es lo que cuesta la empresa mensualmente)
      const monthlyFixedCost = lastMonthData.fixedExpenses;
      const lastMonthLabel = `${MONTH_LABELS_SHORT[lastMonthWithFixedExpenses.month - 1]} ${lastMonthWithFixedExpenses.year}`;

      // Calcular runway: Cash / Gastos Fijos mensuales
      // Si no hay gastos fijos, runway es infinito
      // Si cash es negativo, runway es 0
      const monthsOfRunway = monthlyFixedCost > 0
        ? Math.max(0, estimatedCashPosition / monthlyFixedCost)
        : estimatedCashPosition > 0 ? 999 : 0;

      // Para backwards compatibility, mantenemos isProfitable y avgMonthlyProfit
      // pero basados en el último mes
      const lastMonthNet = lastMonthData.operationalIncome - lastMonthData.totalExpenses;
      const isProfitable = lastMonthNet > 0;
      const avgMonthlyProfit = isProfitable ? lastMonthNet : 0;

      // También necesitamos datos de meses recientes para MRR Growth
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
      const recentMonths = getMonthsBetween(threeMonthsAgoStr, todayStr);
      const recentMonthlyData = recentMonths.map(({ year, month }) =>
        processMonthlyData(allTxns, year, month)
      );

      // Solo meses con actividad real (para cálculos de tendencia)
      const monthsWithActivity = recentMonthlyData.filter(m =>
        m.totalExpenses > 0 || m.operationalIncome > 0
      ).length || 1;

      const recentTotals = recentMonthlyData.reduce((acc, m) => ({
        expenses: acc.expenses + m.totalExpenses,
        operationalIncome: acc.operationalIncome + m.operationalIncome,
        mrr: acc.mrr + m.mrr,
      }), { expenses: 0, operationalIncome: 0, mrr: 0 });

      const runway = {
        totalCapitalInjected,
        estimatedCashPosition,
        averageMonthlyBurn: monthlyFixedCost, // Ahora es el costo fijo mensual
        monthsOfRunway,
        isProfitable,
        avgMonthlyProfit,
        isCashNegative,
        // Nuevos campos para mayor claridad
        lastMonthUsed: lastMonthLabel,
        monthlyFixedCost,
        lastMonthTotalExpenses: lastMonthData.totalExpenses,
        lastMonthFixedExpenses: lastMonthData.fixedExpenses,
        lastMonthVariableExpenses: lastMonthData.variableExpenses,
        // Datos completos del mes anterior para P&L
        lastMonthOperationalIncome: lastMonthData.operationalIncome,
        lastMonthGrossProfit: lastMonthData.grossProfit,
        lastMonthBurnRate: lastMonthData.burnRate,
      };

      // ============================================================
      // HEALTH METRICS - Métricas de salud (NO dependen del filtro)
      // ============================================================

      // MRR Growth (comparar último mes con mes anterior)
      const currentMonthMRR = recentMonthlyData.length > 0
        ? recentMonthlyData[recentMonthlyData.length - 1].mrr
        : 0;
      const previousMonthMRR = recentMonthlyData.length > 1
        ? recentMonthlyData[recentMonthlyData.length - 2].mrr
        : 0;
      const mrrGrowthRate = previousMonthMRR > 0
        ? ((currentMonthMRR - previousMonthMRR) / previousMonthMRR) * 100
        : currentMonthMRR > 0 ? 100 : 0;

      const healthMetrics: HealthMetrics = {
        runway: {
          monthsOfRunway,
          cashPosition: estimatedCashPosition,
          isCashNegative,
          avgMonthlyBurn: monthlyFixedCost, // CORREGIDO: Solo gastos fijos del último mes
          avgMonthlyProfit,
          isProfitable,
          burnPeriodUsed: lastMonthLabel, // CORREGIDO: Indicar qué mes se usa
          monthsWithActivity
        },
        mrrGrowth: {
          currentMRR: currentMonthMRR,
          previousMRR: previousMonthMRR,
          growthRate: mrrGrowthRate,
          trend: mrrGrowthRate > 5 ? 'up' : mrrGrowthRate < -5 ? 'down' : 'stable'
        },
        capitalDependency: {
          operationalCoverage: recentTotals.expenses > 0
            ? (recentTotals.operationalIncome / recentTotals.expenses) * 100
            : 100,
          requiresInjection: recentTotals.operationalIncome < recentTotals.expenses,
          monthlyGap: (recentTotals.operationalIncome - recentTotals.expenses) / monthsWithActivity
        }
      };

      // ============================================================
      // PROJECTIONS - Proyecciones financieras
      // ============================================================

      // Fecha de agotamiento de cash (basado en gastos fijos)
      let projectedCashExhaustion: string | null = null;
      if (monthlyFixedCost > 0 && estimatedCashPosition > 0) {
        const exhaustionDate = new Date();
        exhaustionDate.setMonth(exhaustionDate.getMonth() + Math.floor(monthsOfRunway));
        projectedCashExhaustion = exhaustionDate.toISOString().split('T')[0];
      }

      // Trend del runway (comparar gastos fijos del período con último mes)
      const avgFixedInPeriod = currentPeriod.fixedExpenses / (currentPeriod.monthsInPeriod || 1);
      const burnTrend = avgFixedInPeriod < monthlyFixedCost ? 'improving' :
                       avgFixedInPeriod > monthlyFixedCost * 1.1 ? 'declining' : 'stable';

      // Proyección de breakeven
      let projectedBreakevenDate: string | null = null;
      let monthsToBreakeven: number | null = null;
      if (!isBreakevenAchievable) {
        // Si modelo insostenible, no hay fecha
        monthsToBreakeven = null;
      } else if (currentPeriod.avgMonthlyIncome >= breakEvenRevenue) {
        // Ya alcanzado
        monthsToBreakeven = 0;
        projectedBreakevenDate = todayStr;
      } else if (mrrGrowthRate > 0) {
        // Calcular cuántos meses para alcanzar breakeven
        const gapToClose = breakEvenRevenue - currentPeriod.avgMonthlyIncome;
        const monthlyGrowth = currentMonthMRR * (mrrGrowthRate / 100);
        if (monthlyGrowth > 0) {
          monthsToBreakeven = Math.ceil(gapToClose / monthlyGrowth);
          const beDate = new Date();
          beDate.setMonth(beDate.getMonth() + monthsToBreakeven);
          projectedBreakevenDate = beDate.toISOString().split('T')[0];
        }
      }

      // Proyección de MRR
      const mrrGrowthMonthly = mrrGrowthRate / 100;
      const projections: FinanceProjections = {
        runwayProjection: {
          currentRunway: monthsOfRunway,
          projectedCashExhaustion,
          runwayTrend: burnTrend as 'improving' | 'stable' | 'declining'
        },
        breakevenProjection: {
          currentGap: breakeven.currentGap,
          monthlyGrowthRate: mrrGrowthRate,
          projectedBreakevenDate,
          monthsToBreakeven,
          isAchievable: isBreakevenAchievable
        },
        mrrProjection: {
          currentMRR: currentMonthMRR,
          projectedMRR3m: currentMonthMRR * Math.pow(1 + mrrGrowthMonthly, 3),
          projectedMRR6m: currentMonthMRR * Math.pow(1 + mrrGrowthMonthly, 6),
          projectedMRR12m: currentMonthMRR * Math.pow(1 + mrrGrowthMonthly, 12),
          growthRate: mrrGrowthRate
        },
        cashProjection: generateCashProjection(estimatedCashPosition, monthlyFixedCost, avgMonthlyProfit, isProfitable)
      };

      // ============================================================
      // ALERTS - Alertas automáticas
      // ============================================================
      const alerts: FinanceAlert[] = [];

      // Critical alerts
      if (monthsOfRunway < 3 && !isProfitable) {
        alerts.push({
          type: 'runway',
          severity: 'critical',
          message: `Runway crítico: ${monthsOfRunway.toFixed(1)} meses restantes`,
          action: 'Revisar escenarios'
        });
      }
      if (isCashNegative) {
        alerts.push({
          type: 'cash',
          severity: 'critical',
          message: `Cash position negativo: ${formatUSD(estimatedCashPosition)}`,
          action: 'Inyectar capital'
        });
      }

      // Warning alerts
      if (monthsOfRunway >= 3 && monthsOfRunway < 6 && !isProfitable) {
        alerts.push({
          type: 'runway',
          severity: 'warning',
          message: `Runway en zona de alerta: ${monthsOfRunway.toFixed(1)} meses`,
          action: 'Planificar contingencia'
        });
      }
      if (!isBreakevenAchievable) {
        alerts.push({
          type: 'breakeven',
          severity: 'warning',
          message: 'Modelo de costos insostenible (gastos variables > ingresos)',
          action: 'Revisar estructura de costos'
        });
      }

      // Info alerts (positive)
      if (isProfitable) {
        alerts.push({
          type: 'mrr',
          severity: 'info',
          message: `Empresa rentable: +${formatUSD(avgMonthlyProfit)}/mes de ganancia`,
        });
      }
      if (mrrGrowthRate > 10) {
        alerts.push({
          type: 'mrr',
          severity: 'info',
          message: `MRR creciendo: +${mrrGrowthRate.toFixed(1)}% vs mes anterior`,
        });
      }

      // Recurring transactions
      const recurringTxns = allTxns.filter(t =>
        t.is_recurring &&
        t.parent_transaction_id === null &&
        (!t.recurring_end_date || new Date(t.recurring_end_date) >= new Date())
      );

      const recurringExpensesList = recurringTxns
        .filter(t => t.transaction_type === 'EXPENSE')
        .map(t => ({ description: t.description, amount: t.amount_usd, day: t.recurring_day || 1 }));

      const recurringIncomeList = recurringTxns
        .filter(t => t.transaction_type === 'INCOME')
        .map(t => ({ description: t.description, amount: t.amount_usd, day: t.recurring_day || 1 }));

      const recurringExpenses = {
        total: recurringExpensesList.reduce((sum, r) => sum + r.amount, 0),
        count: recurringExpensesList.length,
        items: recurringExpensesList.sort((a, b) => b.amount - a.amount)
      };

      const recurringIncome = {
        total: recurringIncomeList.reduce((sum, r) => sum + r.amount, 0),
        count: recurringIncomeList.length,
        items: recurringIncomeList.sort((a, b) => b.amount - a.amount)
      };

      return {
        dateRange,
        currentPeriod,
        previousPeriod,
        periodChanges,
        monthlyTrend: currentMonthlyData,
        incomeByCategory,
        expenseByCategory,
        topExpenses,
        ratios,
        breakeven,
        runway,
        healthMetrics,
        projections,
        alerts,
        recurringExpenses,
        recurringIncome
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  return { metrics, isLoading, error };
}

// Hook para obtener la tasa de cambio actual
export function useExchangeRate() {
  const { data, isLoading } = useQuery({
    queryKey: ['current-exchange-rate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_exchange_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return 4200; // Default fallback
      return data.usd_to_cop || 4200;
    }
  });

  return { exchangeRate: data || 4200, isLoading };
}

// Presets de rangos de fecha
export type DateRangePreset =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'last_year'
  | 'all_time'
  | 'custom';

export function getDateRangeFromPreset(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (preset) {
    case 'this_month': {
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'last_month': {
      const start = new Date(currentYear, currentMonth - 1, 1);
      const end = new Date(currentYear, currentMonth, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'last_3_months': {
      const start = new Date(currentYear, currentMonth - 2, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'last_6_months': {
      const start = new Date(currentYear, currentMonth - 5, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'this_year': {
      return {
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
      };
    }
    case 'last_year': {
      return {
        startDate: `${currentYear - 1}-01-01`,
        endDate: `${currentYear - 1}-12-31`,
      };
    }
    case 'all_time': {
      return {
        startDate: '2020-01-01',
        endDate: `${currentYear}-12-31`,
      };
    }
    default:
      return {
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
      };
  }
}

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  'this_month': 'Este mes',
  'last_month': 'Mes anterior',
  'last_3_months': 'Últimos 3 meses',
  'last_6_months': 'Últimos 6 meses',
  'this_year': 'Este año',
  'last_year': 'Año anterior',
  'all_time': 'Todo el historial',
  'custom': 'Personalizado',
};
