import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, Users, Briefcase } from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useMetrics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar datos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = Math.min((metrics.currentMrr / metrics.goalMrr) * 100, 100);
  const remaining = Math.max(metrics.goalMrr - metrics.currentMrr, 0);

  const chartData = metrics.mrrTrend.map(item => ({
    month: new Date(item.month).toLocaleDateString('es-ES', { month: 'short' }),
    mrr: item.mrr_total,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de rendimiento</p>
      </div>

      {/* MRR Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR Actual</p>
                <p className="text-3xl font-semibold">{formatCurrency(metrics.currentMrr)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Meta</p>
                <p className="text-xl font-medium text-muted-foreground">{formatCurrency(metrics.goalMrr)}</p>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {progressPercentage.toFixed(0)}% completado
              </span>
              {remaining > 0 && (
                <span className="text-muted-foreground">
                  Faltan {formatCurrency(remaining)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fees Mes</p>
                <p className="text-lg font-semibold">{formatCurrency(metrics.feesMonth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fees Total</p>
                <p className="text-lg font-semibold">{formatCurrency(metrics.feesHistorical)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clientes Activos</p>
                <p className="text-lg font-semibold">{metrics.activeDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cierres Semana</p>
                <p className="text-lg font-semibold">{metrics.newClosesWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tendencia MRR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'MRR']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Link to Clients */}
      <Link
        to="/clients"
        className="block p-4 border border-dashed rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
      >
        Ver detalle de clientes activos →
      </Link>
    </div>
  );
}
