import { useState, useMemo } from 'react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Play,
  Loader2,
  DollarSign,
  PiggyBank,
  Flame,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Clock,
  RefreshCw,
  Users,
  Building,
  CreditCard,
  Calendar,
  ChevronDown,
  Calculator,
  Sparkles,
  TrendingUp as TrendUp,
  Minus as MinusIcon,
  PlusCircle,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import {
  useFinanceDashboardMetrics,
  useExchangeRate,
  getDateRangeFromPreset,
  DATE_RANGE_PRESET_LABELS,
  DateRangePreset,
} from '@/hooks/useFinanceDashboardMetrics';
import { useFinanceTransactions } from '@/hooks/useFinanceTransactions';
import { useProcessRecurringTransactions } from '@/hooks/useProcessRecurringTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionModal } from '@/components/finance/TransactionModal';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { formatDateToBogota } from '@/lib/date-utils';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type Currency = 'USD' | 'COP';

export default function FinanceDashboard() {
  // Date range state
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('this_year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Get the actual date range based on preset or custom dates
  const dateRange = useMemo(() => {
    if (selectedPreset === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return getDateRangeFromPreset(selectedPreset);
  }, [selectedPreset, customStartDate, customEndDate]);

  const [currency, setCurrency] = useState<Currency>('USD');

  const { metrics, isLoading } = useFinanceDashboardMetrics(dateRange.startDate, dateRange.endDate);
  const { exchangeRate } = useExchangeRate();
  const { createTransaction, isCreating } = useFinanceTransactions();
  const { processRecurring, isProcessing } = useProcessRecurringTransactions();

  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // What-If Calculator state
  const [whatIfReduceExpenses, setWhatIfReduceExpenses] = useState(0);
  const [whatIfIncreaseMRR, setWhatIfIncreaseMRR] = useState(0);
  const [whatIfInjectCapital, setWhatIfInjectCapital] = useState(0);

  // Currency conversion helper
  const convert = (amountUsd: number) => {
    if (currency === 'COP') {
      return amountUsd * exchangeRate;
    }
    return amountUsd;
  };

  const formatCurrency = (amount: number) => {
    const converted = convert(amount);
    if (currency === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(converted);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const handleProcessRecurring = async () => {
    try {
      const now = new Date();
      const result = await processRecurring({ year: now.getFullYear(), month: now.getMonth() + 1 });
      if (result?.transactions_created === 0) {
        toast({
          title: 'Sin transacciones pendientes',
          description: 'No hay transacciones recurrentes pendientes para este período',
        });
      } else {
        toast({
          title: 'Transacciones procesadas',
          description: `Se crearon ${result?.transactions_created} transacciones recurrentes`,
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron procesar las transacciones recurrentes',
        variant: 'destructive',
      });
    }
  };

  const handleCreateIncome = async (data: any) => {
    try {
      await createTransaction(data);
      toast({ title: 'Ingreso registrado', description: 'El ingreso ha sido agregado correctamente' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo registrar el ingreso', variant: 'destructive' });
      throw new Error();
    }
  };

  const handleCreateExpense = async (data: any) => {
    try {
      await createTransaction(data);
      toast({ title: 'Gasto registrado', description: 'El gasto ha sido agregado correctamente' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo registrar el gasto', variant: 'destructive' });
      throw new Error();
    }
  };

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  // What-If Calculator calculations - MUST be before any conditional returns
  // CORREGIDO: Runway = Cash / Gastos Fijos (sin incluir ingresos, worst case)
  const whatIfResults = useMemo(() => {
    if (!metrics) return null;

    const { runway, healthMetrics } = metrics;
    if (!healthMetrics || !runway) return null;

    const currentCashPosition = runway.estimatedCashPosition;
    // Costo fijo mensual (lo que cuesta la empresa)
    const currentFixedCost = runway.averageMonthlyBurn; // Ahora es el costo fijo del último mes

    // Nuevo escenario
    const newFixedCost = Math.max(0, currentFixedCost - whatIfReduceExpenses);
    const newCashPosition = currentCashPosition + whatIfInjectCapital;
    // MRR no afecta el runway base (worst case = sin ventas), pero sí el "runway con ventas"
    const monthlyMRR = whatIfIncreaseMRR;

    // Runway base: Cash / Gastos Fijos (sin ventas)
    const currentRunway = runway.monthsOfRunway;
    const newRunwayBase = newFixedCost > 0
      ? newCashPosition / newFixedCost
      : newCashPosition > 0 ? 999 : 0;

    // Runway con MRR: si MRR > Gastos Fijos, es rentable
    const newNetBurn = Math.max(0, newFixedCost - monthlyMRR);
    const newIsProfitable = monthlyMRR >= newFixedCost;
    const newMonthlyProfit = newIsProfitable ? monthlyMRR - newFixedCost : 0;
    const newRunwayWithMRR = newNetBurn > 0
      ? newCashPosition / newNetBurn
      : newIsProfitable ? 999 : newRunwayBase;

    // Usamos el runway CON MRR para el escenario
    const newRunway = newRunwayWithMRR;

    // Calculate deltas
    const runwayDelta = newRunway - currentRunway;
    const burnDelta = newFixedCost - currentFixedCost;
    const cashDelta = whatIfInjectCapital;

    return {
      currentRunway,
      newRunway,
      runwayDelta,
      currentBurn: currentFixedCost,
      newNetBurn: newFixedCost, // Nuevo costo fijo
      burnDelta,
      newCashPosition,
      cashDelta,
      newIsProfitable,
      newMonthlyProfit,
      breakevenAchieved: newIsProfitable,
      newBreakeven: newFixedCost, // El breakeven es = costos fijos cuando no hay variables
      hasChanges: whatIfReduceExpenses > 0 || whatIfIncreaseMRR > 0 || whatIfInjectCapital > 0,
      // Nuevos campos para claridad
      monthlyMRR,
      newFixedCost,
    };
  }, [metrics, whatIfReduceExpenses, whatIfIncreaseMRR, whatIfInjectCapital]);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { currentPeriod, previousPeriod, periodChanges, monthlyTrend, ratios, breakeven, runway, healthMetrics, projections, alerts } = metrics;

  // Prepare chart data
  const trendChartData = monthlyTrend.map(m => ({
    month: m.monthLabel,
    ingresos: convert(m.operationalIncome),
    gastos: convert(m.totalExpenses),
    utilidad: convert(m.grossProfit),
    aportes: convert(m.partnerContribution),
  }));

  const burnChartData = monthlyTrend.map(m => ({
    month: m.monthLabel,
    burnRate: convert(m.burnRate),
  }));

  // Historical expense breakdown (fixed vs variable)
  const expenseHistoryData = monthlyTrend.map(m => ({
    month: m.monthLabel,
    fijos: convert(m.fixedExpenses),
    variables: convert(m.variableExpenses),
    total: convert(m.totalExpenses),
  }));

  // Historical income by category
  const incomeHistoryData = monthlyTrend.map(m => ({
    month: m.monthLabel,
    mrr: convert(m.mrr),
    implementacion: convert(m.implementationFee),
    consultoria: convert(m.consulting),
    otros: convert(m.otherIncome),
    aportes: convert(m.partnerContribution),
  }));

  // Utilidad del negocio (excluyendo constitución y aportes de socios)
  // Usamos fallback calculado si los campos no existen (para compatibilidad)
  const businessProfitData = monthlyTrend.map(m => {
    const constitutionExp = m.constitutionExpenses ?? 0;
    const businessExp = m.businessExpenses ?? (m.totalExpenses - constitutionExp);
    const businessProf = m.businessProfit ?? (m.operationalIncome - businessExp);
    return {
      month: m.monthLabel,
      ingresos: convert(m.operationalIncome ?? 0),
      gastos: convert(businessExp),
      utilidad: convert(businessProf),
      constitucion: convert(constitutionExp),
      margen: (m.operationalIncome ?? 0) > 0 ? ((businessProf / m.operationalIncome) * 100).toFixed(1) : '0',
    };
  });

  // Utilidad acumulada
  let cumulativeProfit = 0;
  const cumulativeProfitData = monthlyTrend.map(m => {
    const constitutionExp = m.constitutionExpenses ?? 0;
    const businessExp = m.businessExpenses ?? (m.totalExpenses - constitutionExp);
    const businessProf = m.businessProfit ?? (m.operationalIncome - businessExp);
    cumulativeProfit += businessProf;
    return {
      month: m.monthLabel,
      utilidadMes: convert(businessProf),
      utilidadAcumulada: convert(cumulativeProfit),
    };
  });

  // Totales para resumen de utilidad
  const totalBusinessIncome = monthlyTrend.reduce((sum, m) => sum + (m.operationalIncome ?? 0), 0);
  const totalBusinessExpenses = monthlyTrend.reduce((sum, m) => {
    const constitutionExp = m.constitutionExpenses ?? 0;
    return sum + (m.businessExpenses ?? (m.totalExpenses - constitutionExp));
  }, 0);
  const totalBusinessProfit = monthlyTrend.reduce((sum, m) => {
    const constitutionExp = m.constitutionExpenses ?? 0;
    const businessExp = m.businessExpenses ?? (m.totalExpenses - constitutionExp);
    return sum + (m.businessProfit ?? (m.operationalIncome - businessExp));
  }, 0);
  const totalConstitution = monthlyTrend.reduce((sum, m) => sum + (m.constitutionExpenses ?? 0), 0);
  const avgBusinessMargin = totalBusinessIncome > 0 ? (totalBusinessProfit / totalBusinessIncome) * 100 : 0;

  // Status indicators - USANDO healthMetrics (independiente del filtro)
  const isBreakevenAchieved = breakeven.isAchievable && currentPeriod.avgMonthlyIncome >= breakeven.breakEvenRevenue;
  const isProfitableHealth = healthMetrics?.runway?.isProfitable ?? false;
  const isProfitablePeriod = currentPeriod.grossProfit > 0;

  // Runway status basado en healthMetrics (NO cambia con filtro)
  const runwayMonths = healthMetrics?.runway?.monthsOfRunway ?? runway.monthsOfRunway;
  const runwayStatus = isProfitableHealth ? 'profitable' :
    runwayMonths >= 12 ? 'safe' :
    runwayMonths >= 6 ? 'warning' : 'critical';

  // Check if single month
  const isSingleMonth = currentPeriod.monthsInPeriod === 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Finance Dashboard
          </h1>
          <p className="text-muted-foreground">
            {metrics.dateRange.label} • {currentPeriod.monthsInPeriod} {currentPeriod.monthsInPeriod === 1 ? 'mes' : 'meses'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={currency === 'USD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrency('USD')}
            >
              USD
            </Button>
            <Button
              variant={currency === 'COP' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrency('COP')}
            >
              COP
            </Button>
          </div>

          {/* Date Range Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {DATE_RANGE_PRESET_LABELS[selectedPreset]}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Período</Label>
                  <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATE_RANGE_PRESET_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPreset === 'custom' && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm">Desde</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Hasta</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  {dateRange.startDate} → {dateRange.endDate}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setIncomeModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Ingreso
        </Button>
        <Button variant="outline" onClick={() => setExpenseModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Gasto
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleProcessRecurring}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Procesar Recurrentes
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Genera las transacciones recurrentes pendientes para el mes actual</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Alertas */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => a.severity === 'critical').map((alert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{alert.message}</p>
                {alert.action && <p className="text-xs text-red-600">{alert.action}</p>}
              </div>
            </div>
          ))}
          {alerts.filter(a => a.severity === 'warning').map((alert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">{alert.message}</p>
                {alert.action && <p className="text-xs text-amber-600">{alert.action}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECCIÓN: SALUD FINANCIERA (NO cambia con filtro) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Salud Financiera</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs">Basado en {healthMetrics?.runway?.burnPeriodUsed || 'último mes'}</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">El Runway se calcula con los gastos fijos del último mes completo ({healthMetrics?.runway?.burnPeriodUsed}), asumiendo que no hay nuevas ventas.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Cash Position */}
          <Card className={cn(
            "border",
            runway.isCashNegative ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
          )}>
            <CardContent className="p-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full text-left">
                    <div className={cn(
                      "flex items-center gap-2 mb-1",
                      runway.isCashNegative ? "text-red-600" : "text-slate-600"
                    )}>
                      <PiggyBank className="h-4 w-4" />
                      <span className="text-xs font-medium">Cash Position</span>
                    </div>
                    <p className={cn(
                      "text-xl font-bold",
                      runway.isCashNegative ? "text-red-700" : "text-slate-700"
                    )}>
                      {formatCurrency(runway.estimatedCashPosition)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {runway.isCashNegative ? 'Déficit acumulado' : 'disponible estimado'}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Capital inyectado + Ingresos operacionales - Gastos (histórico completo)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Costo Fijo Mensual */}
          <Card className="border bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full text-left">
                    <div className="flex items-center gap-2 mb-1 text-orange-600">
                      <Flame className="h-4 w-4" />
                      <span className="text-xs font-medium">Costo Fijo/mes</span>
                    </div>
                    <p className="text-xl font-bold text-orange-700">
                      {formatCurrency(runway.averageMonthlyBurn)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      gastos fijos ({healthMetrics?.runway?.burnPeriodUsed})
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lo que cuesta mantener la empresa mensualmente (solo gastos fijos del último mes con datos)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Runway */}
          <Card className={cn(
            "border",
            runwayStatus === 'profitable' ? "bg-emerald-50 border-emerald-200" :
            runwayStatus === 'safe' ? "bg-emerald-50 border-emerald-200" :
            runwayStatus === 'warning' ? "bg-amber-50 border-amber-200" :
            "bg-red-50 border-red-200"
          )}>
            <CardContent className="p-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full text-left">
                    <div className={cn(
                      "flex items-center gap-2 mb-1",
                      runwayStatus === 'profitable' || runwayStatus === 'safe' ? "text-emerald-600" :
                      runwayStatus === 'warning' ? "text-amber-600" : "text-red-600"
                    )}>
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {isProfitableHealth ? 'Estado' : 'Runway'}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xl font-bold",
                      runwayStatus === 'profitable' || runwayStatus === 'safe' ? "text-emerald-700" :
                      runwayStatus === 'warning' ? "text-amber-700" : "text-red-700"
                    )}>
                      {isProfitableHealth ? 'Rentable' : `${runwayMonths.toFixed(1)}m`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isProfitableHealth ? 'sin fecha límite' : 'sin vender nada más'}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {isProfitableHealth
                        ? 'La empresa genera ganancias, no necesita runway'
                        : `Cash Position (${formatCurrency(runway.estimatedCashPosition)}) / Costo Fijo Mensual (${formatCurrency(runway.averageMonthlyBurn)})`}
                    </p>
                    <p className="text-xs mt-1 opacity-75">Asume que no hay nuevas ventas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* MRR Growth */}
          <Card className={cn(
            "border",
            (healthMetrics?.mrrGrowth?.trend === 'up') ? "bg-emerald-50 border-emerald-200" :
            (healthMetrics?.mrrGrowth?.trend === 'down') ? "bg-red-50 border-red-200" :
            "bg-slate-50 border-slate-200"
          )}>
            <CardContent className="p-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full text-left">
                    <div className={cn(
                      "flex items-center gap-2 mb-1",
                      (healthMetrics?.mrrGrowth?.trend === 'up') ? "text-emerald-600" :
                      (healthMetrics?.mrrGrowth?.trend === 'down') ? "text-red-600" : "text-slate-600"
                    )}>
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-medium">MRR Growth</span>
                    </div>
                    <p className={cn(
                      "text-xl font-bold",
                      (healthMetrics?.mrrGrowth?.trend === 'up') ? "text-emerald-700" :
                      (healthMetrics?.mrrGrowth?.trend === 'down') ? "text-red-700" : "text-slate-700"
                    )}>
                      {healthMetrics?.mrrGrowth?.growthRate >= 0 ? '+' : ''}
                      {(healthMetrics?.mrrGrowth?.growthRate ?? 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(healthMetrics?.mrrGrowth?.currentMRR ?? 0)} MRR actual
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Crecimiento del MRR mes a mes (comparando los 2 últimos meses)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECCIÓN: PERÍODO SELECCIONADO (SÍ cambia con filtro) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Período: {metrics.dateRange.label}</h2>
          <Badge variant="secondary" className="text-xs">{currentPeriod.monthsInPeriod} {currentPeriod.monthsInPeriod === 1 ? 'mes' : 'meses'}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Ingresos Operacionales */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Ingresos Op.</span>
              </div>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(currentPeriod.operationalIncome)}
              </p>
              {!isSingleMonth && (
                <p className="text-xs text-muted-foreground">
                  Prom: {formatCurrency(currentPeriod.avgMonthlyIncome)}/mes
                </p>
              )}
              {periodChanges.operationalIncome !== 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs mt-1",
                    periodChanges.operationalIncome >= 0
                      ? "text-emerald-600 border-emerald-300"
                      : "text-red-600 border-red-300"
                  )}
                >
                  {periodChanges.operationalIncome >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {formatPercentage(periodChanges.operationalIncome)} vs ant.
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Gastos Totales */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Gastos</span>
              </div>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(currentPeriod.totalExpenses)}
              </p>
              {!isSingleMonth && (
                <p className="text-xs text-muted-foreground">
                  Prom: {formatCurrency(currentPeriod.avgMonthlyExpenses)}/mes
                </p>
              )}
              {periodChanges.totalExpenses !== 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs mt-1",
                    periodChanges.totalExpenses <= 0
                      ? "text-emerald-600 border-emerald-300"
                      : "text-red-600 border-red-300"
                  )}
                >
                  {periodChanges.totalExpenses <= 0 ? <ArrowDownRight className="h-3 w-3 mr-0.5" /> : <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                  {formatPercentage(periodChanges.totalExpenses)} vs ant.
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Utilidad Operacional */}
          <Card className={cn(
            "border",
            isProfitablePeriod ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
          )}>
            <CardContent className="p-4">
              <div className={cn(
                "flex items-center gap-2 mb-1",
                isProfitablePeriod ? "text-blue-600" : "text-amber-600"
              )}>
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Utilidad Op.</span>
              </div>
              <p className={cn(
                "text-xl font-bold",
                isProfitablePeriod ? "text-blue-700" : "text-amber-700"
              )}>
                {formatCurrency(currentPeriod.grossProfit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Margen: {currentPeriod.operationalMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          {/* Aportes de Socios */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Aportes Socios</span>
              </div>
              <p className="text-xl font-bold text-amber-700">
                {formatCurrency(currentPeriod.partnerContribution)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                en el período
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="pnl" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            P&L
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-1.5">
            <PieChart className="h-4 w-4" />
            Análisis Gastos
          </TabsTrigger>
          <TabsTrigger value="runway" className="flex items-center gap-1.5">
            <Flame className="h-4 w-4" />
            Runway
          </TabsTrigger>
          <TabsTrigger value="projections" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Proyecciones
          </TabsTrigger>
          <TabsTrigger value="utilidad" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Utilidad
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendencia Ingresos vs Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tendencia: Ingresos vs Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                    />
                    <Legend />
                    <Bar dataKey="aportes" name="Aportes" fill="#F59E0B" opacity={0.5} />
                    <Line type="monotone" dataKey="ingresos" name="Ingresos Op." stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Burn Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Burn Rate Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={burnChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                    />
                    <Area
                      type="monotone"
                      dataKey="burnRate"
                      name="Burn Rate"
                      stroke="#F97316"
                      fill="#F97316"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Period Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen del Período: {metrics.dateRange.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Ingresos Op.</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(currentPeriod.operationalIncome)}
                  </p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Aportes Socios</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatCurrency(currentPeriod.partnerContribution)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gastos</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(currentPeriod.totalExpenses)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">G. Fijos</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(currentPeriod.fixedExpenses)}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">G. Variables</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(currentPeriod.variableExpenses)}
                  </p>
                </div>
                <div className={cn(
                  "text-center p-4 rounded-lg",
                  currentPeriod.grossProfit >= 0 ? "bg-emerald-50" : "bg-red-50"
                )}>
                  <p className="text-sm text-muted-foreground">Utilidad Op.</p>
                  <p className={cn(
                    "text-xl font-bold",
                    currentPeriod.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(currentPeriod.grossProfit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: P&L */}
        <TabsContent value="pnl" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado de Resultados Simplificado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado de Resultados - {metrics.dateRange.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ingresos */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-semibold text-emerald-700 border-b pb-2">
                    <span>INGRESOS OPERACIONALES</span>
                    <span>{formatCurrency(currentPeriod.operationalIncome)}</span>
                  </div>
                  <div className="pl-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MRR</span>
                      <span>{formatCurrency(currentPeriod.mrr)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee de Implementación</span>
                      <span>{formatCurrency(currentPeriod.implementationFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consultoría</span>
                      <span>{formatCurrency(currentPeriod.consulting)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Otros Ingresos</span>
                      <span>{formatCurrency(currentPeriod.otherIncome)}</span>
                    </div>
                  </div>
                </div>

                {/* Gastos */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-semibold text-red-700 border-b pb-2">
                    <span>GASTOS OPERACIONALES</span>
                    <span>({formatCurrency(currentPeriod.totalExpenses)})</span>
                  </div>
                  <div className="pl-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gastos Fijos</span>
                      <span>({formatCurrency(currentPeriod.fixedExpenses)})</span>
                    </div>
                    <div className="flex justify-between pl-4 text-xs">
                      <span className="text-muted-foreground">- Nómina</span>
                      <span>({formatCurrency(currentPeriod.payroll)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gastos Variables</span>
                      <span>({formatCurrency(currentPeriod.variableExpenses)})</span>
                    </div>
                  </div>
                </div>

                {/* Utilidad Operacional */}
                <div className={cn(
                  "flex justify-between items-center font-bold text-lg border-t-2 pt-3",
                  isProfitablePeriod ? "text-emerald-700" : "text-red-700"
                )}>
                  <span>UTILIDAD OPERACIONAL</span>
                  <span>{formatCurrency(currentPeriod.grossProfit)}</span>
                </div>

                {/* Aportes de Socios */}
                {currentPeriod.partnerContribution > 0 && (
                  <>
                    <div className="flex justify-between items-center text-amber-700 pt-2">
                      <span className="font-medium">+ Aportes de Socios</span>
                      <span>{formatCurrency(currentPeriod.partnerContribution)}</span>
                    </div>
                    <div className={cn(
                      "flex justify-between items-center font-bold text-lg border-t-2 pt-3",
                      currentPeriod.netProfit >= 0 ? "text-blue-700" : "text-red-700"
                    )}>
                      <span>RESULTADO NETO</span>
                      <span>{formatCurrency(currentPeriod.netProfit)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Ratios Financieros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ratios Financieros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Margen Operacional */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Margen Operacional</span>
                    <span className={cn(
                      "font-bold",
                      ratios.operationalMargin >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {ratios.operationalMargin.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.max(0, ratios.operationalMargin + 50))}
                    className="h-2"
                  />
                </div>

                {/* Nómina / Ingresos */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nómina / Ingresos</span>
                    <span className={cn(
                      "font-bold",
                      ratios.payrollToRevenue <= 40 ? "text-emerald-600" :
                      ratios.payrollToRevenue <= 60 ? "text-amber-600" : "text-red-600"
                    )}>
                      {ratios.payrollToRevenue.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, ratios.payrollToRevenue)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">Recomendado: &lt;40%</p>
                </div>

                {/* Gastos Fijos / Ingresos */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>G. Fijos / Ingresos</span>
                    <span className={cn(
                      "font-bold",
                      ratios.fixedCostsToRevenue <= 50 ? "text-emerald-600" :
                      ratios.fixedCostsToRevenue <= 70 ? "text-amber-600" : "text-red-600"
                    )}>
                      {ratios.fixedCostsToRevenue.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, ratios.fixedCostsToRevenue)}
                    className="h-2"
                  />
                </div>

                {/* Gastos Variables / Ingresos */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>G. Variables / Ingresos</span>
                    <span className="font-bold text-slate-600">
                      {ratios.variableCostsToRevenue.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, ratios.variableCostsToRevenue)}
                    className="h-2"
                  />
                </div>

                {/* Breakeven */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Punto de Equilibrio (mensual)
                    </span>
                    {isBreakevenAchieved ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Alcanzado
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Por alcanzar
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingresos necesarios/mes</span>
                      <span>{formatCurrency(breakeven.breakEvenRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Promedio actual/mes</span>
                      <span>{formatCurrency(currentPeriod.avgMonthlyIncome)}</span>
                    </div>
                    <div className={cn(
                      "flex justify-between font-medium pt-1 border-t",
                      breakeven.currentGap >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      <span>Diferencia</span>
                      <span>{breakeven.currentGap >= 0 ? '+' : ''}{formatCurrency(breakeven.currentGap)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparación con mes anterior (siempre muestra el mes anterior al actual) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mes Anterior ({runway.lastMonthUsed})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Ingresos Op.</p>
                  <p className="text-lg font-bold">{formatCurrency(runway.lastMonthOperationalIncome)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gastos Totales</p>
                  <p className="text-lg font-bold">{formatCurrency(runway.lastMonthTotalExpenses)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Utilidad Op.</p>
                  <p className="text-lg font-bold">{formatCurrency(runway.lastMonthGrossProfit)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gastos Fijos</p>
                  <p className="text-lg font-bold">{formatCurrency(runway.averageMonthlyBurn)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Base para Runway</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análisis de Gastos */}
        <TabsContent value="expenses" className="space-y-6">
          {/* Historical Charts - Full Width */}
          <div className="grid grid-cols-1 gap-6">
            {/* Historical Expense Trend: Fixed vs Variable */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Gastos: Fijos vs Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={expenseHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                    />
                    <Legend />
                    <Bar dataKey="fijos" name="Gastos Fijos" stackId="expenses" fill="#3B82F6" />
                    <Bar dataKey="variables" name="Gastos Variables" stackId="expenses" fill="#F97316" />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Historical Income by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Ingresos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={incomeHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="mrr" name="MRR" stackId="income" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="implementacion" name="Fee Implementación" stackId="income" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="consultoria" name="Consultoría" stackId="income" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="otros" name="Otros" stackId="income" stroke="#6B7280" fill="#6B7280" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="aportes" name="Aportes Socios" stackId="income" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Current Period Analysis - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart de Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución de Gastos - {metrics.dateRange.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={metrics.expenseByCategory}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ label, percentage }) => `${label}: ${percentage.toFixed(0)}%`}
                        labelLine={true}
                      >
                        {metrics.expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sin gastos registrados en el período
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 Categorías de Gasto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.topExpenses.map((expense, idx) => (
                  <div key={expense.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{idx + 1}.</span>
                        <span>{expense.label}</span>
                      </span>
                      <span className="font-bold">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={expense.percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {expense.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}

                {metrics.topExpenses.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Sin gastos registrados en el período
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Fijos vs Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gastos Fijos vs Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Gastos Fijos</p>
                        <p className="text-sm text-muted-foreground">Compromisos mensuales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-700">
                        {formatCurrency(currentPeriod.fixedExpenses)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentPeriod.totalExpenses ? ((currentPeriod.fixedExpenses / currentPeriod.totalExpenses) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Gastos Variables</p>
                        <p className="text-sm text-muted-foreground">Según operación</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-700">
                        {formatCurrency(currentPeriod.variableExpenses)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentPeriod.totalExpenses ? ((currentPeriod.variableExpenses / currentPeriod.totalExpenses) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-4 rounded-full overflow-hidden bg-slate-100 flex">
                    {currentPeriod.totalExpenses > 0 ? (
                      <>
                        <div
                          className="bg-blue-500 h-full"
                          style={{
                            width: `${(currentPeriod.fixedExpenses / currentPeriod.totalExpenses) * 100}%`
                          }}
                        />
                        <div
                          className="bg-orange-500 h-full"
                          style={{
                            width: `${(currentPeriod.variableExpenses / currentPeriod.totalExpenses) * 100}%`
                          }}
                        />
                      </>
                    ) : (
                      <div className="w-full text-center text-xs text-muted-foreground py-0.5">
                        Sin datos
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos por Categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución de Ingresos - {metrics.dateRange.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.incomeByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics.incomeByCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v / (currency === 'COP' ? exchangeRate : 1)).replace(/[^\d,$MK]/g, '')} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={100} />
                      <RechartsTooltip
                        formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                      />
                      <Bar dataKey="amount" name="Monto" radius={[0, 4, 4, 0]}>
                        {metrics.incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Sin ingresos registrados en el período
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Runway */}
        <TabsContent value="runway" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Runway Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Runway Estimado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn(
                  "p-6 rounded-xl text-center",
                  runwayStatus === 'safe' ? "bg-emerald-50" :
                  runwayStatus === 'warning' ? "bg-amber-50" :
                  "bg-red-50"
                )}>
                  <p className={cn(
                    "text-5xl font-bold",
                    runwayStatus === 'safe' ? "text-emerald-700" :
                    runwayStatus === 'warning' ? "text-amber-700" :
                    "text-red-700"
                  )}>
                    {runway.monthsOfRunway >= 999 ? '∞' : runway.monthsOfRunway.toFixed(1)}
                  </p>
                  <p className="text-lg text-muted-foreground mt-1">meses de operación</p>
                  {runwayStatus === 'safe' && (
                    <Badge className="mt-3 bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Runway Saludable
                    </Badge>
                  )}
                  {runwayStatus === 'warning' && (
                    <Badge className="mt-3 bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requiere Atención
                    </Badge>
                  )}
                  {runwayStatus === 'critical' && (
                    <Badge className="mt-3 bg-red-100 text-red-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Situación Crítica
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-muted-foreground">Capital Inyectado (Aportes)</span>
                    <span className="font-bold text-amber-600">{formatCurrency(runway.totalCapitalInjected)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-muted-foreground">Posición de Caja Estimada</span>
                    <span className={cn(
                      "font-bold",
                      runway.estimatedCashPosition >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(runway.estimatedCashPosition)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-muted-foreground">Burn Rate Promedio</span>
                    <span className="font-bold text-orange-600">{formatCurrency(runway.averageMonthlyBurn)}/mes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recurrentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Transacciones Recurrentes Activas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gastos Recurrentes */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-medium text-red-600">Gastos Recurrentes</p>
                    <Badge variant="outline" className="text-red-600">
                      {metrics.recurringExpenses.count} activos • {formatCurrency(metrics.recurringExpenses.total)}/mes
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {metrics.recurringExpenses.items.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-red-50 rounded">
                        <span>{item.description}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {metrics.recurringExpenses.items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">Sin gastos recurrentes</p>
                    )}
                  </div>
                </div>

                {/* Ingresos Recurrentes */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-medium text-emerald-600">Ingresos Recurrentes</p>
                    <Badge variant="outline" className="text-emerald-600">
                      {metrics.recurringIncome.count} activos • {formatCurrency(metrics.recurringIncome.total)}/mes
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {metrics.recurringIncome.items.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-emerald-50 rounded">
                        <span>{item.description}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {metrics.recurringIncome.items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">Sin ingresos recurrentes</p>
                    )}
                  </div>
                </div>

                {/* Balance Recurrente */}
                <div className={cn(
                  "p-4 rounded-lg text-center",
                  (metrics.recurringIncome.total - metrics.recurringExpenses.total) >= 0 ? "bg-emerald-50" : "bg-red-50"
                )}>
                  <p className="text-sm text-muted-foreground">Balance Recurrente Mensual</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    (metrics.recurringIncome.total - metrics.recurringExpenses.total) >= 0 ? "text-emerald-700" : "text-red-700"
                  )}>
                    {formatCurrency(metrics.recurringIncome.total - metrics.recurringExpenses.total)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Burn Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolución del Burn Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`} />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [formatCurrency(value / (currency === 'COP' ? exchangeRate : 1)), name]}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos Op." fill="#10B981" opacity={0.7} />
                  <Bar dataKey="gastos" name="Gastos" fill="#EF4444" opacity={0.7} />
                  <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Proyecciones */}
        <TabsContent value="projections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* What-If Calculator */}
            <Card className="lg:row-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Calculadora What-If
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Simula escenarios para ver cómo afectan tu runway y rentabilidad
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reduce Expenses Input */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-red-600">
                    <MinusIcon className="h-4 w-4" />
                    Reducir gastos en (mensual)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={whatIfReduceExpenses || ''}
                      onChange={(e) => setWhatIfReduceExpenses(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="text-right"
                    />
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                  {whatIfReduceExpenses > 0 && whatIfResults && (
                    <p className="text-xs text-emerald-600">
                      → Burn rate: {formatCurrency(whatIfResults.currentBurn)} → {formatCurrency(whatIfResults.newNetBurn)}
                    </p>
                  )}
                </div>

                {/* Increase MRR Input */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    Aumentar MRR en (mensual)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={whatIfIncreaseMRR || ''}
                      onChange={(e) => setWhatIfIncreaseMRR(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="text-right"
                    />
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                  {whatIfIncreaseMRR > 0 && (
                    <p className="text-xs text-emerald-600">
                      → MRR: {formatCurrency(currentPeriod.avgMonthlyIncome)} → {formatCurrency(currentPeriod.avgMonthlyIncome + whatIfIncreaseMRR)}
                    </p>
                  )}
                </div>

                {/* Inject Capital Input */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-amber-600">
                    <Banknote className="h-4 w-4" />
                    Inyectar capital (único)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={whatIfInjectCapital || ''}
                      onChange={(e) => setWhatIfInjectCapital(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                  {whatIfInjectCapital > 0 && whatIfResults && (
                    <p className="text-xs text-amber-600">
                      → Cash: {formatCurrency(runway.estimatedCashPosition)} → {formatCurrency(whatIfResults.newCashPosition)}
                    </p>
                  )}
                </div>

                {/* Reset Button */}
                {whatIfResults?.hasChanges && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setWhatIfReduceExpenses(0);
                      setWhatIfIncreaseMRR(0);
                      setWhatIfInjectCapital(0);
                    }}
                  >
                    Limpiar escenario
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Resultados del Escenario
                </CardTitle>
              </CardHeader>
              <CardContent>
                {whatIfResults?.hasChanges ? (
                  <div className="space-y-4">
                    {/* New Runway */}
                    <div className={cn(
                      "p-4 rounded-lg",
                      whatIfResults.newIsProfitable ? "bg-emerald-50" :
                      whatIfResults.newRunway >= 12 ? "bg-emerald-50" :
                      whatIfResults.newRunway >= 6 ? "bg-amber-50" : "bg-red-50"
                    )}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-muted-foreground">Nuevo Runway</p>
                          <p className={cn(
                            "text-3xl font-bold",
                            whatIfResults.newIsProfitable ? "text-emerald-700" :
                            whatIfResults.newRunway >= 12 ? "text-emerald-700" :
                            whatIfResults.newRunway >= 6 ? "text-amber-700" : "text-red-700"
                          )}>
                            {whatIfResults.newIsProfitable ? 'Rentable' :
                             whatIfResults.newRunway >= 999 ? '∞' : `${whatIfResults.newRunway.toFixed(1)}m`}
                          </p>
                        </div>
                        {!whatIfResults.newIsProfitable && whatIfResults.runwayDelta !== 0 && (
                          <Badge
                            className={cn(
                              whatIfResults.runwayDelta > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {whatIfResults.runwayDelta > 0 ? '+' : ''}
                            {whatIfResults.runwayDelta.toFixed(1)} meses
                          </Badge>
                        )}
                      </div>
                      {whatIfResults.newIsProfitable && (
                        <p className="text-sm text-emerald-600 mt-2">
                          +{formatCurrency(whatIfResults.newMonthlyProfit)}/mes de ganancia
                        </p>
                      )}
                    </div>

                    {/* New Burn Rate */}
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-muted-foreground">Nuevo Burn Rate</span>
                      <div className="text-right">
                        <span className="font-bold">
                          {whatIfResults.newNetBurn === 0 ? '$0' : formatCurrency(whatIfResults.newNetBurn)}
                        </span>
                        <span className="text-sm text-muted-foreground">/mes</span>
                        {whatIfResults.burnDelta !== 0 && (
                          <span className={cn(
                            "ml-2 text-xs",
                            whatIfResults.burnDelta < 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            ({whatIfResults.burnDelta < 0 ? '' : '+'}{formatCurrency(whatIfResults.burnDelta)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakeven Status */}
                    <div className={cn(
                      "flex justify-between items-center p-3 rounded-lg",
                      whatIfResults.breakevenAchieved ? "bg-emerald-50" : "bg-amber-50"
                    )}>
                      <span className="text-muted-foreground">Breakeven</span>
                      <Badge className={cn(
                        whatIfResults.breakevenAchieved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {whatIfResults.breakevenAchieved ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Alcanzado
                          </>
                        ) : (
                          <>
                            <Target className="h-3 w-3 mr-1" />
                            {formatCurrency(whatIfResults.newBreakeven)}/mes
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Ajusta los valores en la calculadora para ver cómo afectan tus métricas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current vs Projected Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparación: Actual vs Escenario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <span>Métrica</span>
                    <span className="text-center">Actual</span>
                    <span className="text-center">Escenario</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-muted-foreground">Runway</span>
                    <span className="text-center font-medium">
                      {runwayMonths >= 999 ? '∞' : `${runwayMonths.toFixed(1)}m`}
                    </span>
                    <span className={cn(
                      "text-center font-medium",
                      whatIfResults?.hasChanges && (
                        whatIfResults.newRunway > runwayMonths
                          ? "text-emerald-600"
                          : whatIfResults.newRunway < runwayMonths ? "text-red-600" : ""
                      )
                    )}>
                      {whatIfResults?.hasChanges
                        ? (whatIfResults.newRunway >= 999 ? '∞' : `${whatIfResults.newRunway.toFixed(1)}m`)
                        : '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-muted-foreground">Burn Rate</span>
                    <span className="text-center font-medium">
                      {formatCurrency(runway.averageMonthlyBurn)}
                    </span>
                    <span className={cn(
                      "text-center font-medium",
                      whatIfResults?.hasChanges && whatIfResults.newNetBurn < runway.averageMonthlyBurn
                        ? "text-emerald-600"
                        : whatIfResults?.hasChanges && whatIfResults.newNetBurn > runway.averageMonthlyBurn
                        ? "text-red-600" : ""
                    )}>
                      {whatIfResults?.hasChanges
                        ? (whatIfResults.newNetBurn === 0 ? '$0' : formatCurrency(whatIfResults.newNetBurn))
                        : '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-muted-foreground">Cash Position</span>
                    <span className="text-center font-medium">
                      {formatCurrency(runway.estimatedCashPosition)}
                    </span>
                    <span className={cn(
                      "text-center font-medium",
                      whatIfResults?.hasChanges && whatIfResults.newCashPosition > runway.estimatedCashPosition
                        ? "text-emerald-600" : ""
                    )}>
                      {whatIfResults?.hasChanges ? formatCurrency(whatIfResults.newCashPosition) : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Projection Chart */}
          {projections?.cashProjection && projections.cashProjection.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Proyección de Cash (12 meses)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Escenarios basados en tendencia actual: optimista (+10%), base (actual), pesimista (-10%)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={projections.cashProjection.map(p => ({
                    ...p,
                    optimistic: convert(p.optimistic),
                    base: convert(p.base),
                    pessimistic: convert(p.pessimistic),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="optimistic"
                      name="Optimista"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Area
                      type="monotone"
                      dataKey="base"
                      name="Base"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="pessimistic"
                      name="Pesimista"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Projections Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MRR Projection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Proyección MRR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Actual</span>
                    <span className="font-medium">{formatCurrency(projections?.mrrProjection?.currentMRR ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">+3 meses</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(projections?.mrrProjection?.projectedMRR3m ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">+6 meses</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(projections?.mrrProjection?.projectedMRR6m ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">+12 meses</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(projections?.mrrProjection?.projectedMRR12m ?? 0)}
                    </span>
                  </div>
                  <div className="pt-2 border-t text-center">
                    <Badge className={cn(
                      (projections?.mrrProjection?.growthRate ?? 0) >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {(projections?.mrrProjection?.growthRate ?? 0) >= 0 ? '+' : ''}
                      {(projections?.mrrProjection?.growthRate ?? 0).toFixed(1)}% crecimiento/mes
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Breakeven Projection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Proyección Breakeven
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projections?.breakevenProjection?.isAchievable ? (
                    projections.breakevenProjection.currentGap >= 0 ? (
                      <div className="text-center p-4 bg-emerald-50 rounded-lg">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                        <p className="font-medium text-emerald-700">Breakeven Alcanzado</p>
                        <p className="text-sm text-emerald-600">
                          +{formatCurrency(projections.breakevenProjection.currentGap)} sobre el punto de equilibrio
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-amber-700">
                          {projections.breakevenProjection.monthsToBreakeven ?? '?'}
                        </p>
                        <p className="text-sm text-muted-foreground">meses para alcanzar</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Fecha estimada: {projections.breakevenProjection.projectedBreakevenDate
                            ? formatDateToBogota(projections.breakevenProjection.projectedBreakevenDate, 'MMM yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                      <p className="font-medium text-red-700">Modelo Insostenible</p>
                      <p className="text-sm text-red-600">
                        Los gastos variables superan los ingresos
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Runway Projection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Proyección Runway
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Runway Actual</span>
                    <span className="font-bold text-lg">
                      {isProfitableHealth ? 'Rentable' : `${runwayMonths.toFixed(1)}m`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tendencia</span>
                    <Badge className={cn(
                      projections?.runwayProjection?.runwayTrend === 'improving'
                        ? "bg-emerald-100 text-emerald-700"
                        : projections?.runwayProjection?.runwayTrend === 'declining'
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    )}>
                      {projections?.runwayProjection?.runwayTrend === 'improving' ? 'Mejorando' :
                       projections?.runwayProjection?.runwayTrend === 'declining' ? 'Declinando' :
                       'Estable'}
                    </Badge>
                  </div>
                  {projections?.runwayProjection?.projectedCashExhaustion && !isProfitableHealth && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Cash se agota:</p>
                      <p className="font-medium text-red-600">
                        {formatDateToBogota(projections.runwayProjection.projectedCashExhaustion, 'MMMM yyyy')}
                      </p>
                    </div>
                  )}
                  {isProfitableHealth && (
                    <div className="pt-3 border-t text-center">
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Empresa Rentable
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Utilidad - Análisis de rentabilidad real */}
        <TabsContent value="utilidad" className="space-y-6">
          {/* Resumen de Utilidad */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Ingresos Operacionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalBusinessIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">Sin aportes de socios</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Gastos Operacionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalBusinessExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">Sin gastos de constitución</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Utilidad del Negocio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-2xl font-bold",
                  totalBusinessProfit >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {formatCurrency(totalBusinessProfit)}
                </p>
                <Badge className={cn(
                  "mt-1",
                  avgBusinessMargin >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  {avgBusinessMargin >= 0 ? '+' : ''}{avgBusinessMargin.toFixed(1)}% margen
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Excluido del Análisis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aportes socios:</span>
                    <span className="font-medium text-amber-600">
                      {formatCurrency(monthlyTrend.reduce((sum, m) => sum + m.partnerContribution, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Constitución:</span>
                    <span className="font-medium text-violet-600">
                      {formatCurrency(totalConstitution)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico principal: Ingresos vs Gastos vs Utilidad */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tendencia de Utilidad del Negocio
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Análisis mensual excluyendo aportes de socios (ingresos) y gastos de constitución (gastos)
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={businessProfitData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`} />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos Op." fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos Op." fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilidad Acumulada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Utilidad Acumulada
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Evolución de la utilidad acumulada del negocio
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cumulativeProfitData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => currency === 'USD' ? `$${(v/1000).toFixed(0)}k` : `$${(v/1000000).toFixed(1)}M`} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value / (currency === 'COP' ? exchangeRate : 1))}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="utilidadAcumulada"
                      name="Utilidad Acumulada"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Bar dataKey="utilidadMes" name="Utilidad Mensual" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabla de detalle mensual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Detalle Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Mes</th>
                        <th className="text-right py-2 font-medium">Ingresos</th>
                        <th className="text-right py-2 font-medium">Gastos</th>
                        <th className="text-right py-2 font-medium">Utilidad</th>
                        <th className="text-right py-2 font-medium">Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessProfitData.map((row, idx) => (
                        <tr key={idx} className="border-b border-dashed">
                          <td className="py-2 font-medium">{row.month}</td>
                          <td className="text-right text-emerald-600">{formatCurrency(row.ingresos / (currency === 'COP' ? exchangeRate : 1))}</td>
                          <td className="text-right text-red-600">{formatCurrency(row.gastos / (currency === 'COP' ? exchangeRate : 1))}</td>
                          <td className={cn(
                            "text-right font-medium",
                            row.utilidad >= 0 ? "text-blue-600" : "text-red-600"
                          )}>
                            {formatCurrency(row.utilidad / (currency === 'COP' ? exchangeRate : 1))}
                          </td>
                          <td className={cn(
                            "text-right",
                            parseFloat(row.margen) >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {row.margen}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-muted/50">
                      <tr className="font-bold">
                        <td className="py-2">Total</td>
                        <td className="text-right text-emerald-600">{formatCurrency(totalBusinessIncome)}</td>
                        <td className="text-right text-red-600">{formatCurrency(totalBusinessExpenses)}</td>
                        <td className={cn(
                          "text-right",
                          totalBusinessProfit >= 0 ? "text-blue-600" : "text-red-600"
                        )}>
                          {formatCurrency(totalBusinessProfit)}
                        </td>
                        <td className={cn(
                          "text-right",
                          avgBusinessMargin >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {avgBusinessMargin.toFixed(1)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nota explicativa */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">¿Qué excluimos de este análisis?</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li><strong>Aportes de socios:</strong> Son inyecciones de capital, no ingresos operacionales del negocio.</li>
                    <li><strong>Gastos de constitución:</strong> Son gastos únicos de inicio, no reflejan la operación recurrente.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Este análisis muestra la verdadera capacidad del negocio para generar utilidad a partir de su operación.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
