import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, Filter, RefreshCw } from 'lucide-react';
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
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error al cargar el reporte</h1>
          <p className="text-muted-foreground mt-2">
            {error?.message || 'Error desconocido'}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reporting</h1>
          <p className="text-muted-foreground">{getPeriodLabel()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleExportCSV} disabled={!reportingData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Comercial</label>
              <Select 
                value={filters.ownerId || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, ownerId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los comerciales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los comerciales</SelectItem>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Canal</label>
              <Select 
                value={filters.channel || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, channel: value === 'all' ? undefined : value as LeadChannel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los canales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subcanal</label>
              <Select 
                value={filters.subchannel || 'all'} 
                onValueChange={(value) => setFilters({ ...filters, subchannel: value === 'all' ? undefined : value as LeadSubchannel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los subcanales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los subcanales</SelectItem>
                  {Object.entries(SUBCHANNEL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Applied Filters */}
          {(filters.ownerId || filters.channel || filters.subchannel) && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {filters.ownerId && (
                <Badge variant="secondary">
                  Comercial: {filters.ownerId === 'unassigned' ? 'Sin asignar' : filters.ownerId.slice(0, 8)}...
                </Badge>
              )}
              {filters.channel && (
                <Badge variant="secondary">
                  Canal: {CHANNEL_LABELS[filters.channel]}
                </Badge>
              )}
              {filters.subchannel && (
                <Badge variant="secondary">
                  Subcanal: {SUBCHANNEL_LABELS[filters.subchannel]}
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilters({})}
                className="h-6 px-2 text-xs"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Period Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PeriodType)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab !== 'custom' && (
              <>
                <Button variant="outline" size="sm" onClick={handlePreviousPeriod}>
                  {activeTab === 'weekly' ? 'Semana anterior' : 'Mes anterior'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCurrentPeriod}>
                  {activeTab === 'weekly' ? 'Semana actual' : 'Mes actual'}
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="weekly" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Cargando reporte semanal...</div>
            </div>
          ) : reportingData ? (
            <>
              <ReportingMetrics {...reportingData} />
              <ReportingCharts {...reportingData} trendType="weekly" />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Cargando reporte mensual...</div>
            </div>
          ) : reportingData ? (
            <>
              <ReportingMetrics {...reportingData} />
              <ReportingCharts {...reportingData} trendType="monthly" />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          {/* Custom Date Pickers */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Período Personalizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
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
              <div className="text-center py-8">
                <div className="text-muted-foreground">Cargando reporte personalizado...</div>
              </div>
            ) : reportingData ? (
              <>
                <ReportingMetrics {...reportingData} />
                <ReportingCharts {...reportingData} trendType="monthly" />
              </>
            ) : null
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecciona las fechas de inicio y fin para ver el reporte
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}