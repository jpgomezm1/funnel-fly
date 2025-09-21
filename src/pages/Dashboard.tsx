import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  Briefcase
} from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useMetrics();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando métricas...</div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error al cargar métricas</h1>
          <p className="text-muted-foreground mt-2">
            {error?.message || 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min((metrics.currentMrr / metrics.goalMrr) * 100, 100);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format MRR by owner data for chart
  const mrrByOwnerChart = metrics.mrrByOwner.map((item, index) => ({
    name: item.owner_id ? `Comercial ${item.owner_id.slice(0, 8)}` : 'Sin asignar',
    mrr: item.mrr,
  }));

  // Format MRR trend data for chart
  const mrrTrendChart = metrics.mrrTrend.map(item => ({
    month: new Date(item.month).toLocaleDateString('es-ES', { 
      month: 'short', 
      year: '2-digit' 
    }),
    mrr: item.mrr_total,
  }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Actualizado hace 30s
        </Badge>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MRR Goal Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta MRR Global</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatCurrency(metrics.currentMrr)}
                </span>
                <span className="text-sm text-muted-foreground">
                  de {formatCurrency(metrics.goalMrr)}
                </span>
              </div>
              
              <Progress value={progressPercentage} className="w-full" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {progressPercentage.toFixed(1)}% completado
                </span>
                <span className={`font-medium ${
                  progressPercentage >= 100 ? 'text-green-600' : 
                  progressPercentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {progressPercentage >= 100 ? '🎉 Meta alcanzada!' : 
                   progressPercentage >= 75 ? '🔥 Cerca de la meta' : '📈 En progreso'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Fees (Monthly) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Implementación (Mes)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.feesMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos por implementaciones este mes
            </p>
          </CardContent>
        </Card>

        {/* Implementation Fees (Historical) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Implementación (Total)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.feesHistorical)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos acumulados por implementaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Activos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              Leads en pipeline con contratos
            </p>
          </CardContent>
        </Card>

        {/* New Closes This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Cierres (Semana)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newClosesWeek}</div>
            <p className="text-xs text-muted-foreground">
              Leads cerrados como ganados esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR by Owner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              MRR por Comercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mrrByOwnerChart}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'MRR']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="mrr" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* MRR Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia MRR (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mrrTrendChart}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'MRR Total']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mrr" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}