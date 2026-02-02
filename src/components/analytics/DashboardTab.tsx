import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
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
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  PieChart as PieChartIcon,
  BarChart3,
  Package,
  Building2,
  Lightbulb,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  RevenueMetrics,
  ForecastMetrics,
  SalesVelocityMetrics,
  ActivityMetrics,
  ClientMetrics,
  ProjectHealthMetrics,
} from '@/hooks/useAnalytics';

const PIE_COLORS = ['#8B5CF6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'];

interface DashboardTabProps {
  revenue: RevenueMetrics;
  forecast: ForecastMetrics;
  salesVelocity: SalesVelocityMetrics;
  activities: ActivityMetrics;
  clients: ClientMetrics;
  projectHealth: ProjectHealthMetrics;
  activeLeads: number;
  leadsThisMonth: number;
  mrrChartData: Array<{ month: string; fullMonth: string; mrr: number; nuevo: number; churn: number }>;
  dealsChartData: Array<{ month: string; ganados: number; perdidos: number; valor: number }>;
  channelChartData: Array<{ name: string; leads: number; mrr: number; conversion: number }>;
  activityChartData: Array<{ name: string; value: number }>;
  productChartData: Array<{ name: string; leads: number; mrr: number; conversion: number }>;
  insights: Array<{ type: 'success' | 'warning' | 'info'; title: string; description: string }>;
  formatCurrency: (amount: number) => string;
  formatPercent: (value: number) => string;
}

export default function DashboardTab({
  revenue,
  forecast,
  salesVelocity,
  activities,
  clients,
  projectHealth,
  activeLeads,
  leadsThisMonth,
  mrrChartData,
  dealsChartData,
  channelChartData,
  activityChartData,
  productChartData,
  insights,
  formatCurrency,
  formatPercent,
}: DashboardTabProps) {
  return (
    <>
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground">MRR</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(revenue.currentMrr)}</p>
            <div className="flex items-center gap-1 text-[10px]">
              {revenue.mrrGrowthPercentage >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={revenue.mrrGrowthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercent(revenue.mrrGrowthPercentage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">ARR</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(revenue.arr)}</p>
            <p className="text-[10px] text-muted-foreground">Proyectado</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-[10px] text-muted-foreground">Pipeline</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(forecast.weightedPipeline)}</p>
            <p className="text-[10px] text-muted-foreground">Ponderado</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] text-muted-foreground">Win Rate</span>
            </div>
            <p className="text-xl font-bold">{salesVelocity.winRate.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">{salesVelocity.closedWonThisMonth}W / {salesVelocity.closedLostThisMonth}L</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-[10px] text-muted-foreground">Leads</span>
            </div>
            <p className="text-xl font-bold">{activeLeads}</p>
            <p className="text-[10px] text-muted-foreground">{leadsThisMonth} este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] text-muted-foreground">Clientes</span>
            </div>
            <p className="text-xl font-bold">{clients.totalClients}</p>
            <p className="text-[10px] text-muted-foreground">{clients.newClientsThisMonth} nuevos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-[10px] text-muted-foreground">Proyectos</span>
            </div>
            <p className="text-xl font-bold">{projectHealth.activeProjects}</p>
            <p className="text-[10px] text-muted-foreground">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-[10px] text-muted-foreground">Ciclo</span>
            </div>
            <p className="text-xl font-bold">{salesVelocity.avgDealCycle.toFixed(0)}d</p>
            <p className="text-[10px] text-muted-foreground">Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Row */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {insights.slice(0, 4).map((insight, i) => (
            <Card key={i} className={cn(
              "border-l-4",
              insight.type === 'success' ? 'border-l-green-500 bg-green-500/5' :
              insight.type === 'warning' ? 'border-l-amber-500 bg-amber-500/5' :
              'border-l-blue-500 bg-blue-500/5'
            )}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  {insight.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                  {insight.type === 'info' && <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{insight.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Goal Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Progreso hacia la Meta MRR
              </p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(revenue.currentMrr)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Meta</p>
              <p className="text-lg font-medium">{formatCurrency(revenue.goalMrr)}</p>
            </div>
          </div>
          <Progress value={Math.min(revenue.goalProgress, 100)} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="font-medium text-primary">{revenue.goalProgress.toFixed(0)}% completado</span>
            {revenue.goalProgress < 100 && (
              <span className="text-muted-foreground">
                Faltan {formatCurrency(revenue.goalMrr - revenue.currentMrr)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendencia MRR (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrChartData}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis tickFormatter={formatCurrency} fontSize={10} width={60} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorMrr)" name="MRR" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Deals Won/Lost */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Cierres por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="ganados" name="Ganados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perdidos" name="Perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Sources Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividades por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activityChartData.slice(0, 5).map((item) => {
                const total = activityChartData.reduce((s, a) => s + a.value, 0);
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-lg font-bold">{activities.activitiesThisMonth}</p>
                <p className="text-[10px] text-muted-foreground">Este mes</p>
              </div>
              <div>
                <p className="text-lg font-bold">{activities.avgActivitiesPerLead.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">Por lead</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Leads por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelChartData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="leads"
                  >
                    {channelChartData.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {channelChartData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                  <span className="text-[10px]">{item.name}: {item.leads}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="h-4 w-4" />
              MRR por Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productChartData.slice(0, 4).map((product, idx) => {
                const maxMrr = Math.max(...productChartData.map(p => p.mrr));
                const pct = maxMrr > 0 ? (product.mrr / maxMrr) * 100 : 0;
                return (
                  <div key={product.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: PIE_COLORS[idx] }}
                        >
                          {product.name.charAt(0)}
                        </div>
                        <span>{product.name}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(product.mrr)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[idx] }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{product.leads} leads</span>
                      <span>{product.conversion.toFixed(0)}% conversion</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
