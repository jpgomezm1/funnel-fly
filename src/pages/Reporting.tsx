import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useReporting, ReportingFilters, ReportingPeriod } from '@/hooks/useReporting';
import { ReportingMetrics } from '@/components/reporting/ReportingMetrics';
import { ReportingCharts } from '@/components/reporting/ReportingCharts';
import { 
  getCurrentWeekRange, 
  getPreviousWeekRange, 
  getCurrentMonthRange, 
  getPreviousMonthRange,
  formatWeekLabel,
  formatMonthLabel
} from '@/lib/date-utils';
import { 
  CHANNEL_LABELS, 
  SUBCHANNEL_LABELS, 
  LeadChannel, 
  LeadSubchannel 
} from '@/types/database';

type PeriodType = 'weekly' | 'monthly' | 'custom';

export default function Reporting() {
  const [activeTab, setActiveTab] = useState<PeriodType>('weekly');
  const [filters, setFilters] = useState<ReportingFilters>({});
  const [customPeriod, setCustomPeriod] = useState<ReportingPeriod>({
    start: getCurrentWeekRange().start,
    end: getCurrentWeekRange().end
  });
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  // Get current period based on tab
  const getCurrentPeriod = (): ReportingPeriod => {
    switch (activeTab) {
      case 'weekly':
        return getCurrentWeekRange();
      case 'monthly':
        return getCurrentMonthRange();
      case 'custom':
        return customPeriod;
      default:
        return getCurrentWeekRange();
    }
  };

  const [currentPeriod, setCurrentPeriod] = useState<ReportingPeriod>(getCurrentPeriod());

  // Update period when tab changes
  useEffect(() => {
    if (activeTab !== 'custom') {
      setCurrentPeriod(getCurrentPeriod());
    }
  }, [activeTab]);

  // Update custom period when dates change
  useEffect(() => {
    if (customStartDate && customEndDate && activeTab === 'custom') {
      const newPeriod = { start: customStartDate, end: customEndDate };
      setCustomPeriod(newPeriod);
      setCurrentPeriod(newPeriod);
    }
  }, [customStartDate, customEndDate, activeTab]);

  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('reporting-filters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('reporting-filters', JSON.stringify(filters));
  }, [filters]);

  const { data: reportingData, isLoading, error, refetch } = useReporting(
    currentPeriod,
    filters,
    activeTab === 'weekly' ? 'weekly' : 'monthly'
  );

  const handlePreviousPeriod = () => {
    if (activeTab === 'weekly') {
      setCurrentPeriod(getPreviousWeekRange());
    } else if (activeTab === 'monthly') {
      setCurrentPeriod(getPreviousMonthRange());
    }
  };

  const handleCurrentPeriod = () => {
    if (activeTab === 'weekly') {
      setCurrentPeriod(getCurrentWeekRange());
    } else if (activeTab === 'monthly') {
      setCurrentPeriod(getCurrentMonthRange());
    }
  };

  const handleExportCSV = () => {
    if (!reportingData) return;

    const csvData = [
      // Headers
      ['Métrica', 'Valor'],
      ['Nuevos Leads', reportingData.newLeads.toString()],
      ['Período', `${format(currentPeriod.start, 'dd/MM/yyyy')} - ${format(currentPeriod.end, 'dd/MM/yyyy')}`],
      [],
      ['Entradas por Etapa', ''],
      ...reportingData.stageMetrics.map(metric => [metric.stage, metric.entries.toString()]),
      [],
      ['Conversiones', ''],
      ...reportingData.conversions.map(conv => [
        `${conv.fromStage} → ${conv.toStage}`,
        `${conv.percentage.toFixed(1)}% (${conv.toCount}/${conv.fromCount})`
      ]),
      [],
      ['Velocidad (días)', ''],
      ...reportingData.velocity.map(vel => [
        vel.label,
        vel.days !== null ? vel.days.toFixed(2) : 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getPeriodLabel = () => {
    if (activeTab === 'weekly') {
      return formatWeekLabel(currentPeriod.start, currentPeriod.end);
    } else if (activeTab === 'monthly') {
      return formatMonthLabel(currentPeriod.start);
    } else {
      return `${format(currentPeriod.start, 'dd/MM/yyyy')} - ${format(currentPeriod.end, 'dd/MM/yyyy')}`;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100/70 dark:from-red-900/30 dark:to-red-950/20 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">Error al cargar el reporte</h1>
              <p className="text-red-600 dark:text-red-400 mt-2">
                {error?.message || 'Error desconocido'}
              </p>
              <Button onClick={() => refetch()} className="mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
      <div className="container mx-auto py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/10 to-purple-500/5 rounded-3xl" />
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-pulse delay-1000" />

          <div className="relative bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-900/90 dark:to-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="relative p-4 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-2xl shadow-xl border border-primary/20">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent leading-tight">
                      Reporting Avanzado
                    </h1>
                    <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                      <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{getPeriodLabel()}</span>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">En tiempo real</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button variant="outline" onClick={() => refetch()} className="h-12 px-6 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Actualizar</span>
                </Button>
                <Button onClick={handleExportCSV} disabled={!reportingData} className="h-12 px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border border-green-400/20">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Exportar CSV</span>
                  <Download className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 backdrop-blur-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-6 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-4 text-xl">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-xl shadow-lg">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
              <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent font-bold">
                Filtros Avanzados
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-500 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                  <Target className="h-4 w-4" />
                  Comercial
                </label>
                <Select
                  value={filters.ownerId || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, ownerId: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg">
                    <SelectValue placeholder="Todos los comerciales" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl">
                    <SelectItem value="all" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">Todos los comerciales</SelectItem>
                    <SelectItem value="unassigned" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">Sin asignar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                  <Zap className="h-4 w-4" />
                  Canal
                </label>
                <Select
                  value={filters.channel || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, channel: value === 'all' ? undefined : value as LeadChannel })}
                >
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg">
                    <SelectValue placeholder="Todos los canales" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl">
                    <SelectItem value="all" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">Todos los canales</SelectItem>
                    {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4" />
                  Subcanal
                </label>
                <Select
                  value={filters.subchannel || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, subchannel: value === 'all' ? undefined : value as LeadSubchannel })}
                >
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg">
                    <SelectValue placeholder="Todos los subcanales" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl">
                    <SelectItem value="all" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">Todos los subcanales</SelectItem>
                    {Object.entries(SUBCHANNEL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enhanced Applied Filters */}
            {(filters.ownerId || filters.channel || filters.subchannel) && (
              <div className="flex flex-wrap items-center gap-3 mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100/70 dark:from-purple-900/30 dark:to-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros activos:
                </span>
                {filters.ownerId && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-md hover:scale-105 transition-transform">
                    Comercial: {filters.ownerId === 'unassigned' ? 'Sin asignar' : filters.ownerId.slice(0, 8)}...
                  </Badge>
                )}
                {filters.channel && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md hover:scale-105 transition-transform">
                    Canal: {CHANNEL_LABELS[filters.channel]}
                  </Badge>
                )}
                {filters.subchannel && (
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md hover:scale-105 transition-transform">
                    Subcanal: {SUBCHANNEL_LABELS[filters.subchannel]}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="h-8 px-3 text-xs bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 border border-purple-200 dark:border-purple-700 rounded-lg font-semibold"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Period Tabs */}
        <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PeriodType)}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Semanal
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Mensual
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200">
                    <Settings className="h-4 w-4 mr-2" />
                    Personalizado
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3">
                  {activeTab !== 'custom' && (
                    <>
                      <Button variant="outline" size="sm" onClick={handlePreviousPeriod} className="h-10 px-4 bg-white/70 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-xl shadow-lg font-semibold">
                        <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                        {activeTab === 'weekly' ? 'Semana anterior' : 'Mes anterior'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCurrentPeriod} className="h-10 px-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/20 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl shadow-lg font-semibold text-blue-700 dark:text-blue-300">
                        <Target className="h-4 w-4 mr-2" />
                        {activeTab === 'weekly' ? 'Semana actual' : 'Mes actual'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <TabsContent value="weekly" className="space-y-8">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-blue-700 dark:text-blue-300 font-semibold">Cargando reporte semanal...</span>
                    </div>
                  </div>
                ) : reportingData ? (
                  <>
                    <ReportingMetrics {...reportingData} />
                    <ReportingCharts {...reportingData} trendType="weekly" />
                  </>
                ) : null}
              </TabsContent>

              <TabsContent value="monthly" className="space-y-8">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                      <RefreshCw className="h-5 w-5 text-green-600 animate-spin" />
                      <span className="text-green-700 dark:text-green-300 font-semibold">Cargando reporte mensual...</span>
                    </div>
                  </div>
                ) : reportingData ? (
                  <>
                    <ReportingMetrics {...reportingData} />
                    <ReportingCharts {...reportingData} trendType="monthly" />
                  </>
                ) : null}
              </TabsContent>

              <TabsContent value="custom" className="space-y-8">
                {/* Enhanced Custom Date Pickers */}
                <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/70 dark:from-purple-900/30 dark:to-purple-950/20">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-6 border-b border-purple-200 dark:border-purple-800">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-lg shadow-md">
                        <CalendarIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-700 to-purple-600 dark:from-purple-300 dark:to-purple-200 bg-clip-text text-transparent font-bold">
                        Seleccionar Período Personalizado
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                          <CalendarIcon className="h-4 w-4" />
                          Fecha Inicio
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 justify-start text-left font-semibold bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg",
                                !customStartDate && "text-purple-400"
                              )}
                            >
                              <CalendarIcon className="mr-3 h-5 w-5" />
                              {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl" align="start">
                            <Calendar
                              mode="single"
                              selected={customStartDate}
                              onSelect={setCustomStartDate}
                              initialFocus
                              className="p-4 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                          <CalendarIcon className="h-4 w-4" />
                          Fecha Fin
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 justify-start text-left font-semibold bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg",
                                !customEndDate && "text-purple-400"
                              )}
                            >
                              <CalendarIcon className="mr-3 h-5 w-5" />
                              {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl" align="start">
                            <Calendar
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              initialFocus
                              className="p-4 pointer-events-auto"
                              disabled={(date) => customStartDate ? date < customStartDate : false}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {customStartDate && customEndDate ? (
                  isLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-100 dark:bg-purple-900/30 rounded-full border border-purple-200 dark:border-purple-800">
                        <RefreshCw className="h-5 w-5 text-purple-600 animate-spin" />
                        <span className="text-purple-700 dark:text-purple-300 font-semibold">Cargando reporte personalizado...</span>
                      </div>
                    </div>
                  ) : reportingData ? (
                    <>
                      <ReportingMetrics {...reportingData} />
                      <ReportingCharts {...reportingData} trendType="monthly" />
                    </>
                  ) : null
                ) : (
                  <div className="text-center py-12">
                    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 max-w-md mx-auto">
                      <CalendarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                        Período Personalizado
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Selecciona las fechas de inicio y fin para generar tu reporte personalizado
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}