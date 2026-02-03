import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Target,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Timer,
  UserCheck,
  Package,
  Building2,
  FileText,
  Receipt,
  CreditCard,
  AlertCircle,
  Lightbulb,
  XCircle,
  Phone,
  Globe,
  Linkedin,
  Trophy,
  Medal,
  Award,
  RefreshCw,
  Megaphone,
  Hash,
  ArrowRight,
  ChevronRight,
  Percent,
  Wallet,
  TrendingDown as TrendDown,
  CircleDollarSign,
  CalendarClock,
  ClipboardCheck,
  Flag,
  Rocket,
  Box,
  Settings,
  Play,
  CheckCircle,
  XOctagon,
  Info,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardTab from '@/components/analytics/DashboardTab';
import RevenueTab from '@/components/analytics/RevenueTab';
import PipelineTab from '@/components/analytics/PipelineTab';

// Labels and Colors
const STAGE_LABELS: Record<string, string> = {
  'PROSPECTO': 'Prospecto',
  'PRIMER_CONTACTO': 'Primer Contacto',
  'CITA_AGENDADA': 'Cita Agendada',
  'PROPUESTA_ENVIADA': 'Propuesta Enviada',
  'NEGOCIACION': 'Negociacion',
  'CERRADO_GANADO': 'Cerrado Ganado',
  'CERRADO_PERDIDO': 'Cerrado Perdido',
};

const STAGE_COLORS: Record<string, string> = {
  'PROSPECTO': '#6b7280',
  'PRIMER_CONTACTO': '#06b6d4',
  'CITA_AGENDADA': '#3b82f6',
  'PROPUESTA_ENVIADA': '#f59e0b',
  'NEGOCIACION': '#8b5cf6',
  'CERRADO_GANADO': '#22c55e',
  'CERRADO_PERDIDO': '#ef4444',
};

const EXECUTION_STAGE_LABELS: Record<string, string> = {
  'ONBOARDING': 'Onboarding',
  'EN_DESARROLLO': 'En Desarrollo',
  'EN_REVISION': 'En Revision',
  'ENTREGADO': 'Entregado',
  'EN_SOPORTE': 'En Soporte',
};

const EXECUTION_STAGE_COLORS: Record<string, string> = {
  'ONBOARDING': '#06b6d4',
  'EN_DESARROLLO': '#3b82f6',
  'EN_REVISION': '#f59e0b',
  'ENTREGADO': '#22c55e',
  'EN_SOPORTE': '#8b5cf6',
};

const ACTIVITY_LABELS: Record<string, string> = {
  'call': 'Llamadas',
  'email': 'Emails',
  'meeting': 'Reuniones',
  'note': 'Notas',
  'quote': 'Cotizaciones',
  'follow_up': 'Seguimientos',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  'PENDING': 'Pendiente',
  'PAID': 'Pagada',
  'OVERDUE': 'Vencida',
  'CANCELLED': 'Cancelada',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  'PENDING': '#f59e0b',
  'PAID': '#22c55e',
  'OVERDUE': '#ef4444',
  'CANCELLED': '#6b7280',
};

const PIE_COLORS = ['#8B5CF6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'];

export default function Analytics() {
  const { data: analytics, isLoading, error } = useAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Sales Analytics
            </h1>
            <p className="text-muted-foreground">Cargando metricas...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Sales Analytics
          </h1>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive/50" />
            <p className="text-destructive font-medium">Error al cargar datos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    revenue,
    pipeline,
    salesVelocity,
    activities,
    projectHealth,
    ownerPerformance,
    mrrTrend,
    forecast,
    leadsBySource,
    dealsByMonth,
    clients,
    invoices,
    proposals,
    channels,
    products,
    totalLeads,
    activeLeads,
    leadsThisMonth,
    leadGrowth,
  } = analytics;

  // Prepare chart data
  const mrrChartData = mrrTrend.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('es-ES', { month: 'short' }),
    fullMonth: item.month,
    mrr: item.mrrTotal,
    nuevo: item.newMrr,
    churn: item.churnedMrr,
  }));

  const pipelineChartData = pipeline
    .filter(p => p.stage !== 'CERRADO_GANADO' && p.stage !== 'CERRADO_PERDIDO')
    .map(p => ({
      stage: STAGE_LABELS[p.stage] || p.stage,
      count: p.count,
      value: p.value,
      conversion: p.conversionRate,
    }));

  const dealsChartData = dealsByMonth.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('es-ES', { month: 'short' }),
    ganados: item.won,
    perdidos: item.lost,
    valor: item.value,
  }));

  const channelChartData = channels.channelDetails.slice(0, 6).map(c => ({
    name: c.channel.replace('_', ' '),
    leads: c.leads,
    mrr: c.mrr,
    conversion: c.conversionRate,
  }));

  const invoiceRevenueData = invoices.revenueByMonth.slice(-6).map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('es-ES', { month: 'short' }),
    facturado: item.invoiced,
    cobrado: item.collected,
  }));

  const activityChartData = Object.entries(activities.activitiesByType).map(([type, count]) => ({
    name: ACTIVITY_LABELS[type] || type,
    value: count,
  })).sort((a, b) => b.value - a.value);

  const productChartData = Object.entries(products.leadsByProduct).map(([product, count]) => ({
    name: product,
    leads: count,
    mrr: products.mrrByProduct[product] || 0,
    conversion: products.conversionByProduct[product] || 0,
  })).sort((a, b) => b.mrr - a.mrr);

  const executionStageData = Object.entries(projectHealth.projectsByExecutionStage)
    .filter(([stage]) => stage !== 'null')
    .map(([stage, count]) => ({
      name: EXECUTION_STAGE_LABELS[stage] || stage,
      value: count,
      fill: EXECUTION_STAGE_COLORS[stage] || '#6b7280',
    }));

  // Generate insights
  const insights: Array<{ type: 'success' | 'warning' | 'info'; title: string; description: string }> = [];

  if (salesVelocity.winRate >= 50) {
    insights.push({
      type: 'success',
      title: `Win Rate ${salesVelocity.winRate.toFixed(0)}%`,
      description: 'Excelente tasa de conversion, mantener estrategia actual.',
    });
  } else if (salesVelocity.winRate < 30 && salesVelocity.closedWonThisMonth + salesVelocity.closedLostThisMonth > 3) {
    insights.push({
      type: 'warning',
      title: 'Win Rate bajo',
      description: `Solo ${salesVelocity.winRate.toFixed(0)}% de cierres. Revisar proceso de calificacion.`,
    });
  }

  if (invoices.totalOverdue > 0) {
    insights.push({
      type: 'warning',
      title: `${formatCurrency(invoices.totalOverdue)} vencidos`,
      description: `${invoices.overdueInvoices.length} facturas pendientes de cobro.`,
    });
  }

  if (projectHealth.projectsWithBlockers > 0) {
    insights.push({
      type: 'warning',
      title: `${projectHealth.projectsWithBlockers} blocker(s) activos`,
      description: 'Proyectos con blockers sin resolver.',
    });
  }

  if (activities.leadsWithoutActivity > 5) {
    insights.push({
      type: 'info',
      title: `${activities.leadsWithoutActivity} leads sin actividad`,
      description: 'Leads activos sin ninguna actividad registrada.',
    });
  }

  if (revenue.goalProgress >= 100) {
    insights.push({
      type: 'success',
      title: 'Meta cumplida!',
      description: `MRR actual supera la meta en ${(revenue.goalProgress - 100).toFixed(0)}%.`,
    });
  } else if (revenue.goalProgress >= 80) {
    insights.push({
      type: 'info',
      title: `${revenue.goalProgress.toFixed(0)}% hacia la meta`,
      description: `Faltan ${formatCurrency(revenue.goalMrr - revenue.currentMrr)} para alcanzar el objetivo.`,
    });
  }

  const bestChannel = channels.channelDetails[0];
  if (bestChannel && bestChannel.mrr > 0) {
    insights.push({
      type: 'success',
      title: `${bestChannel.channel} es tu mejor canal`,
      description: `${formatCurrency(bestChannel.mrr)} MRR con ${bestChannel.conversionRate.toFixed(0)}% conversion.`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Sales Analytics
          </h1>
          <p className="text-muted-foreground">Tu brujula de negocio - Metricas para tomar decisiones</p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          En vivo
        </Badge>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-8">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5 text-xs">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5 text-xs">
            <Layers className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-1.5 text-xs">
            <Megaphone className="h-4 w-4" />
            Canales
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5 text-xs">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5 text-xs">
            <Building2 className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5 text-xs">
            <Package className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-1.5 text-xs">
            <Receipt className="h-4 w-4" />
            Facturacion
          </TabsTrigger>
        </TabsList>

        {/* ==================== DASHBOARD TAB ==================== */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <DashboardTab
            revenue={revenue}
            forecast={forecast}
            salesVelocity={salesVelocity}
            activities={activities}
            clients={clients}
            projectHealth={projectHealth}
            activeLeads={activeLeads}
            leadsThisMonth={leadsThisMonth}
            mrrChartData={mrrChartData}
            dealsChartData={dealsChartData}
            channelChartData={channelChartData}
            activityChartData={activityChartData}
            productChartData={productChartData}
            insights={insights}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>

        {/* ==================== REVENUE TAB ==================== */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <RevenueTab
            revenue={revenue}
            forecast={forecast}
            pipeline={pipeline}
            mrrChartData={mrrChartData}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>

        {/* ==================== PIPELINE TAB ==================== */}
        <TabsContent value="pipeline" className="mt-6 space-y-6">
          <PipelineTab
            pipeline={pipeline}
            salesVelocity={salesVelocity}
            activeLeads={activeLeads}
            leadsThisMonth={leadsThisMonth}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* ==================== CHANNELS TAB ==================== */}
        <TabsContent value="channels" className="mt-6 space-y-6">
          {/* Channel Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Canales Activos</span>
                </div>
                <p className="text-3xl font-bold">{Object.keys(channels.leadsByChannel).length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Mejor Canal</span>
                </div>
                <p className="text-xl font-bold text-green-600">{channels.bestPerformingChannel.replace('_', ' ')}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(channels.mrrByChannel[channels.bestPerformingChannel] || 0)} MRR</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Total Leads</span>
                </div>
                <p className="text-3xl font-bold">{totalLeads}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">MRR Total</span>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(revenue.currentMrr)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Channel Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Performance por Canal
              </CardTitle>
              <CardDescription>Metricas comparativas de cada canal de adquisicion</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Ganados</TableHead>
                    <TableHead className="text-center">Perdidos</TableHead>
                    <TableHead className="text-center">Conversion</TableHead>
                    <TableHead className="text-center">Ciclo Prom</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.channelDetails.map((channel, idx) => (
                    <TableRow key={channel.channel} className={idx === 0 ? 'bg-green-50/50 dark:bg-green-900/10' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {idx === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                          {idx === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {idx === 2 && <Award className="h-4 w-4 text-amber-600" />}
                          <span className="font-medium">{channel.channel.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{channel.leads}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{channel.won}</TableCell>
                      <TableCell className="text-center text-red-600 font-medium">{channel.lost}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          channel.conversionRate >= 50 ? 'bg-green-100 text-green-700' :
                          channel.conversionRate >= 30 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {channel.conversionRate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{channel.avgCycleTime.toFixed(0)}d</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(channel.mrr)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Channel Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">MRR por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelChartData} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={formatCurrency} />
                      <YAxis type="category" dataKey="name" fontSize={12} />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'MRR']} />
                      <Bar dataKey="mrr" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Leads por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="leads"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {channelChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== TEAM TAB ==================== */}
        <TabsContent value="team" className="mt-6 space-y-6">
          {/* Team Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Vendedores</span>
                </div>
                <p className="text-3xl font-bold">{ownerPerformance.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Actividades/Semana</span>
                </div>
                <p className="text-3xl font-bold">{activities.activitiesThisWeek}</p>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {activities.activitiesGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={activities.activitiesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercent(activities.activitiesGrowth)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Dia Mas Activo</span>
                </div>
                <p className="text-2xl font-bold">{activities.mostActiveDay}</p>
              </CardContent>
            </Card>
            <Card className={activities.leadsWithoutActivity > 5 ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={cn("h-5 w-5", activities.leadsWithoutActivity > 5 ? 'text-amber-500' : 'text-muted-foreground')} />
                  <span className="text-sm text-muted-foreground">Sin Actividad</span>
                </div>
                <p className="text-3xl font-bold">{activities.leadsWithoutActivity}</p>
                <p className="text-xs text-muted-foreground">leads activos</p>
              </CardContent>
            </Card>
          </div>

          {/* Owner Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Performance por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                    <TableHead className="text-center">Deals</TableHead>
                    <TableHead className="text-center">Ganados/Mes</TableHead>
                    <TableHead className="text-right">Pipeline</TableHead>
                    <TableHead className="text-center">Actividades</TableHead>
                    <TableHead className="text-center">Ciclo</TableHead>
                    <TableHead className="text-center">Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownerPerformance.map((owner, idx) => (
                    <TableRow key={owner.ownerId} className={idx === 0 ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {idx === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                          {idx === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {idx === 2 && <Award className="h-4 w-4 text-amber-600" />}
                          <span className="font-medium truncate max-w-[150px]">{owner.ownerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(owner.totalMrr)}</TableCell>
                      <TableCell className="text-center">{owner.activeDeals}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{owner.dealsWonMonth}</TableCell>
                      <TableCell className="text-right">{formatCurrency(owner.pipelineValue)}</TableCell>
                      <TableCell className="text-center">{owner.activitiesCount}</TableCell>
                      <TableCell className="text-center">{owner.avgCycleTime.toFixed(0)}d</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={owner.conversionRate >= 50 ? 'default' : 'secondary'}>
                          {owner.conversionRate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ownerPerformance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay datos de vendedores
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activity by Day */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividades por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(activities.activitiesByDay).map(([day, count]) => {
                  const maxCount = Math.max(...Object.values(activities.activitiesByDay));
                  const intensity = maxCount > 0 ? count / maxCount : 0;
                  return (
                    <div
                      key={day}
                      className="p-4 rounded-lg text-center"
                      style={{ backgroundColor: `rgba(139, 92, 246, ${0.1 + intensity * 0.4})` }}
                    >
                      <p className="text-xs font-medium text-muted-foreground">{day}</p>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CLIENTS TAB ==================== */}
        <TabsContent value="clients" className="mt-6 space-y-6">
          {/* Client KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm text-muted-foreground">Total Clientes</span>
                </div>
                <p className="text-3xl font-bold">{clients.totalClients}</p>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {clients.clientGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={clients.clientGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {clients.newClientsThisMonth} nuevos este mes
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Retencion</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{clients.clientRetentionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Clientes activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Edad Promedio</span>
                </div>
                <p className="text-3xl font-bold">{Math.floor(clients.avgClientAge / 30)}</p>
                <p className="text-xs text-muted-foreground">meses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Contactos/Cliente</span>
                </div>
                <p className="text-3xl font-bold">{clients.avgContactsPerClient.toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top Clientes por MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                    <TableHead className="text-center">Proyectos</TableHead>
                    <TableHead>Cliente Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.topClients.slice(0, 10).map((client, idx) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                          idx === 0 ? "bg-amber-500 text-white" :
                          idx === 1 ? "bg-gray-400 text-white" :
                          idx === 2 ? "bg-amber-600 text-white" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {idx < 3 ? (idx === 0 ? <Trophy className="h-3.5 w-3.5" /> : idx === 1 ? <Medal className="h-3.5 w-3.5" /> : <Award className="h-3.5 w-3.5" />) : idx + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{client.name}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(client.mrr)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{client.projects}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(client.since), 'MMM yyyy', { locale: es })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Client Data Quality */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Calidad de Datos de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Con telefono</span>
                    </div>
                    <span className="font-medium">{clients.clientsWithPhone}</span>
                  </div>
                  <Progress value={clients.totalClients > 0 ? (clients.clientsWithPhone / clients.totalClients) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Con LinkedIn</span>
                    </div>
                    <span className="font-medium">{clients.clientsWithLinkedIn}</span>
                  </div>
                  <Progress value={clients.totalClients > 0 ? (clients.clientsWithLinkedIn / clients.totalClients) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Con website</span>
                    </div>
                    <span className="font-medium">{clients.clientsWithWebsite}</span>
                  </div>
                  <Progress value={clients.totalClients > 0 ? (clients.clientsWithWebsite / clients.totalClients) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== PROJECTS TAB ==================== */}
        <TabsContent value="projects" className="mt-6 space-y-6">
          {/* Project KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <p className="text-3xl font-bold">{projectHealth.totalProjects}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Activos</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{projectHealth.activeProjects}</p>
              </CardContent>
            </Card>

            <Card className={projectHealth.projectsOverdue > 0 ? 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={cn("h-5 w-5", projectHealth.projectsOverdue > 0 ? 'text-red-500' : 'text-muted-foreground')} />
                  <span className="text-sm text-muted-foreground">Atrasados</span>
                </div>
                <p className={cn("text-3xl font-bold", projectHealth.projectsOverdue > 0 ? 'text-red-600' : '')}>{projectHealth.projectsOverdue}</p>
              </CardContent>
            </Card>

            <Card className={projectHealth.projectsWithBlockers > 0 ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XOctagon className={cn("h-5 w-5", projectHealth.projectsWithBlockers > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
                  <span className="text-sm text-muted-foreground">Blockers</span>
                </div>
                <p className={cn("text-3xl font-bold", projectHealth.projectsWithBlockers > 0 ? 'text-amber-600' : '')}>{projectHealth.projectsWithBlockers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarClock className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Entregas (30d)</span>
                </div>
                <p className="text-3xl font-bold">{projectHealth.upcomingDeliveries}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-teal-500" />
                  <span className="text-sm text-muted-foreground">On-Time</span>
                </div>
                <p className="text-3xl font-bold">{projectHealth.onTimeDeliveryRate.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Projects by Execution Stage */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Proyectos por Etapa de Ejecucion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={executionStageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {executionStageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {executionStageData.map((stage) => (
                    <div key={stage.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.fill }} />
                      <span className="text-xs">{stage.name}: {stage.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Milestones & Checklists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Milestones Completados</span>
                      <span className="font-bold">{projectHealth.completedMilestones}/{projectHealth.totalMilestones}</span>
                    </div>
                    <Progress
                      value={projectHealth.totalMilestones > 0 ? (projectHealth.completedMilestones / projectHealth.totalMilestones) * 100 : 0}
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Checklist Promedio</span>
                      <span className="font-bold">{projectHealth.avgChecklistCompletion.toFixed(0)}%</span>
                    </div>
                    <Progress value={projectHealth.avgChecklistCompletion} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{projectHealth.projectsWithMilestones}</p>
                      <p className="text-xs text-muted-foreground">Con milestones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{projectHealth.avgDaysToDelivery.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Dias prom. entrega</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects by Stage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Proyectos por Etapa de Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(projectHealth.projectsByStage).map(([stage, count]) => (
                  <div
                    key={stage}
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${STAGE_COLORS[stage]}15` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: STAGE_COLORS[stage] }}
                    />
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{STAGE_LABELS[stage]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== INVOICING TAB ==================== */}
        <TabsContent value="invoicing" className="mt-6 space-y-6">
          {/* Invoice KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Facturado</span>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(invoices.totalInvoiced)}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Cobrado</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(invoices.totalCollected)}</p>
                <p className="text-xs text-green-600">{invoices.collectionRate.toFixed(0)}% collection rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Pendiente</span>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(invoices.totalPending)}</p>
              </CardContent>
            </Card>

            <Card className={invoices.totalOverdue > 0 ? 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={cn("h-5 w-5", invoices.totalOverdue > 0 ? 'text-red-500' : 'text-muted-foreground')} />
                  <span className="text-sm text-muted-foreground">Vencido</span>
                </div>
                <p className={cn("text-3xl font-bold", invoices.totalOverdue > 0 ? 'text-red-600' : '')}>{formatCurrency(invoices.totalOverdue)}</p>
                {invoices.overdueInvoices.length > 0 && (
                  <p className="text-xs text-red-600">{invoices.overdueInvoices.length} facturas</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Facturacion vs Cobranza (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invoiceRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis tickFormatter={formatCurrency} fontSize={11} width={70} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), '']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="facturado" name="Facturado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cobrado" name="Cobrado" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Overdue & Upcoming */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Overdue Invoices */}
            <Card className={invoices.overdueInvoices.length > 0 ? 'border-red-500/30' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Facturas Vencidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.overdueInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/30" />
                    <p className="text-muted-foreground">No hay facturas vencidas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices.overdueInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                        <div>
                          <p className="font-medium text-sm">{inv.projectName}</p>
                          <p className="text-xs text-red-600">{inv.daysOverdue} dias vencida</p>
                        </div>
                        <span className="font-bold text-red-600">{formatCurrency(inv.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Payments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-blue-500" />
                  Proximos Vencimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.upcomingPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No hay pagos proximos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices.upcomingPayments.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{inv.projectName}</p>
                          <p className="text-xs text-muted-foreground">Vence: {format(new Date(inv.dueDate), 'dd MMM', { locale: es })}</p>
                        </div>
                        <span className="font-bold">{formatCurrency(inv.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Stats */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(invoices.invoicesByStatus).map(([status, count]) => {
                    const total = Object.values(invoices.invoicesByStatus).reduce((s, c) => s + c, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: INVOICE_STATUS_COLORS[status] }}
                            />
                            <span>{INVOICE_STATUS_LABELS[status] || status}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: INVOICE_STATUS_COLORS[status] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(invoices.invoicesByType).map(([type, count], idx) => {
                    const total = Object.values(invoices.invoicesByType).reduce((s, c) => s + c, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span>{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metricas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monto promedio</span>
                    <span className="font-bold">{formatCurrency(invoices.avgInvoiceAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dias para cobrar</span>
                    <span className="font-bold">{invoices.avgDaysToPayment.toFixed(0)} dias</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Este mes</span>
                    <span className="font-bold">{invoices.invoicesThisMonth} facturas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mes anterior</span>
                    <span className="font-bold">{invoices.invoicesLastMonth} facturas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
