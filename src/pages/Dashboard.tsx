import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  LeadStage, 
  LeadChannel, 
  STAGE_LABELS, 
  CHANNEL_LABELS,
  STAGE_ORDER 
} from '@/types/database';
import {
  getCurrentWeekRange,
  getPreviousWeekRange,
  getCurrentMonthRange,
  getPreviousMonthRange,
  formatWeekLabel,
  formatMonthLabel
} from '@/lib/date-utils';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface MetricData {
  stage: LeadStage;
  count: number;
  previousCount: number;
  conversionRate?: number;
}

interface ChannelData {
  channel: LeadChannel;
  count: number;
  percentage: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [weeklyMetrics, setWeeklyMetrics] = useState<MetricData[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MetricData[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Rangos de fechas
      const currentWeek = getCurrentWeekRange();
      const previousWeek = getPreviousWeekRange();
      const currentMonth = getCurrentMonthRange();
      const previousMonth = getPreviousMonthRange();

      // Métricas semanales
      const weeklyData = await Promise.all(
        STAGE_ORDER.map(async (stage) => {
          // Leads que entraron a esta etapa esta semana
          const { count: currentCount } = await supabase
            .from('lead_stage_history')
            .select('*', { count: 'exact', head: true })
            .eq('to_stage', stage)
            .gte('changed_at', currentWeek.start.toISOString())
            .lt('changed_at', currentWeek.end.toISOString());

          // Leads que entraron a esta etapa la semana pasada
          const { count: previousCount } = await supabase
            .from('lead_stage_history')
            .select('*', { count: 'exact', head: true })
            .eq('to_stage', stage)
            .gte('changed_at', previousWeek.start.toISOString())
            .lt('changed_at', previousWeek.end.toISOString());

          return {
            stage,
            count: currentCount || 0,
            previousCount: previousCount || 0
          };
        })
      );

      // Métricas mensuales
      const monthlyData = await Promise.all(
        STAGE_ORDER.map(async (stage) => {
          const { count: currentCount } = await supabase
            .from('lead_stage_history')
            .select('*', { count: 'exact', head: true })
            .eq('to_stage', stage)
            .gte('changed_at', currentMonth.start.toISOString())
            .lt('changed_at', currentMonth.end.toISOString());

          const { count: previousCount } = await supabase
            .from('lead_stage_history')
            .select('*', { count: 'exact', head: true })
            .eq('to_stage', stage)
            .gte('changed_at', previousMonth.start.toISOString())
            .lt('changed_at', previousMonth.end.toISOString());

          return {
            stage,
            count: currentCount || 0,
            previousCount: previousCount || 0
          };
        })
      );

      // Distribución por canal (periodo activo)
      const rangeToUse = activeTab === 'weekly' ? currentWeek : currentMonth;
      const { data: channelData } = await supabase
        .from('leads')
        .select('channel')
        .gte('created_at', rangeToUse.start.toISOString())
        .lt('created_at', rangeToUse.end.toISOString());

      if (channelData) {
        const channelCounts = channelData.reduce((acc, lead) => {
          acc[lead.channel] = (acc[lead.channel] || 0) + 1;
          return acc;
        }, {} as Record<LeadChannel, number>);

        const total = channelData.length;
        const channelDistrib = Object.entries(channelCounts).map(([channel, count]) => ({
          channel: channel as LeadChannel,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0
        }));

        setChannelDistribution(channelDistrib);
      }

      setWeeklyMetrics(weeklyData);
      setMonthlyMetrics(monthlyData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [activeTab]);

  const currentMetrics = activeTab === 'weekly' ? weeklyMetrics : monthlyMetrics;
  const currentRange = activeTab === 'weekly' ? getCurrentWeekRange() : getCurrentMonthRange();
  const rangeLabel = activeTab === 'weekly' 
    ? formatWeekLabel(currentRange.start, currentRange.end)
    : formatMonthLabel(currentRange.start);

  const getMetricChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const exportData = async () => {
    // Implementar exportación CSV
    console.log('Exportar datos del período:', rangeLabel);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando métricas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Métricas</h1>
          <p className="text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Select value={channelFilter || 'all'} onValueChange={(value) => setChannelFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los canales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={ownerFilter || 'all'} onValueChange={(value) => setOwnerFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los comerciales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los comerciales</SelectItem>
                <SelectItem value="sin-asignar">Sin asignar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly" className="gap-2">
            <Calendar className="h-4 w-4" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <Calendar className="h-4 w-4" />
            Mensual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          <WeeklyDashboard 
            metrics={currentMetrics} 
            channelDistribution={channelDistribution}
            getMetricChange={getMetricChange}
            getChangeColor={getChangeColor}
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <MonthlyDashboard 
            metrics={currentMetrics} 
            channelDistribution={channelDistribution}
            getMetricChange={getMetricChange}
            getChangeColor={getChangeColor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DashboardProps {
  metrics: MetricData[];
  channelDistribution: ChannelData[];
  getMetricChange: (current: number, previous: number) => number;
  getChangeColor: (change: number) => string;
}

function WeeklyDashboard({ metrics, channelDistribution, getMetricChange, getChangeColor }: DashboardProps) {
  return (
    <>
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const change = getMetricChange(metric.count, metric.previousCount);
          return (
            <Card key={metric.stage}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {STAGE_LABELS[metric.stage]}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.count}</div>
                <div className={`text-xs flex items-center gap-1 ${getChangeColor(change)}`}>
                  <TrendingUp className="h-3 w-3" />
                  {change > 0 ? '+' : ''}{change.toFixed(1)}% vs semana anterior
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Channel Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Canal - Esta Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelDistribution.map((item) => (
              <div key={item.channel} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm bg-primary"
                    style={{ opacity: item.percentage / 100 }}
                  />
                  <span className="font-medium">{CHANNEL_LABELS[item.channel]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{item.count}</span>
                  <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function MonthlyDashboard({ metrics, channelDistribution, getMetricChange, getChangeColor }: DashboardProps) {
  return (
    <>
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const change = getMetricChange(metric.count, metric.previousCount);
          return (
            <Card key={metric.stage}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {STAGE_LABELS[metric.stage]}
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.count}</div>
                <div className={`text-xs flex items-center gap-1 ${getChangeColor(change)}`}>
                  <TrendingUp className="h-3 w-3" />
                  {change > 0 ? '+' : ''}{change.toFixed(1)}% vs mes anterior
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Channel Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Canal - Este Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelDistribution.map((item) => (
              <div key={item.channel} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm bg-primary"
                    style={{ opacity: item.percentage / 100 }}
                  />
                  <span className="font-medium">{CHANNEL_LABELS[item.channel]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{item.count}</span>
                  <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}