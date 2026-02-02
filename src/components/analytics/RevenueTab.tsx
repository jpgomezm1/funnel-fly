import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Zap,
  Target,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
} from 'lucide-react';
import type {
  RevenueMetrics,
  ForecastMetrics,
  PipelineStageMetrics,
} from '@/hooks/useAnalytics';

const STAGE_LABELS: Record<string, string> = {
  'PROSPECTO': 'Prospecto',
  'PRIMER_CONTACTO': 'Primer Contacto',
  'CITA_AGENDADA': 'Cita Agendada',
  'PROPUESTA_ENVIADA': 'Propuesta Enviada',
  'NEGOCIACION': 'Negociacion',
  'CERRADO_GANADO': 'Cerrado Ganado',
  'CERRADO_PERDIDO': 'Cerrado Perdido',
};

interface RevenueTabProps {
  revenue: RevenueMetrics;
  forecast: ForecastMetrics;
  pipeline: PipelineStageMetrics[];
  mrrChartData: Array<{ month: string; fullMonth: string; mrr: number; nuevo: number; churn: number }>;
  formatCurrency: (amount: number) => string;
  formatPercent: (value: number) => string;
}

export default function RevenueTab({
  revenue,
  forecast,
  pipeline,
  mrrChartData,
  formatCurrency,
  formatPercent,
}: RevenueTabProps) {
  return (
    <>
      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">MRR Actual</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(revenue.currentMrr)}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              {revenue.mrrGrowthPercentage >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={revenue.mrrGrowthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercent(revenue.mrrGrowthPercentage)} vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">ARR Proyectado</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(revenue.arr)}</p>
            <p className="text-xs text-muted-foreground mt-1">MRR x 12</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">Fees Este Mes</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(revenue.feesMonth)}</p>
            <p className="text-xs text-muted-foreground mt-1">Historico: {formatCurrency(revenue.feesHistorical)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CircleDollarSign className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Avg MRR/Cliente</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(revenue.avgMrr)}</p>
            <p className="text-xs text-muted-foreground mt-1">Fee promedio: {formatCurrency(revenue.avgDealSize)}</p>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolucion MRR (12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mrrChartData}>
                <defs>
                  <linearGradient id="colorMrrBig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis tickFormatter={formatCurrency} fontSize={11} width={70} />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(value as number), name === 'mrr' ? 'MRR Total' : name === 'nuevo' ? 'Nuevo MRR' : 'Churn']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="mrr" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorMrrBig)" name="MRR Total" />
                <Bar dataKey="nuevo" fill="#22c55e" radius={[4, 4, 0, 0]} name="Nuevo MRR" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Forecast */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Forecast 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">{forecast.expectedCloses30Days}</p>
                  <p className="text-xs text-muted-foreground">Cierres esperados</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{formatCurrency(forecast.expectedMrr30Days)}</p>
                  <p className="text-xs text-muted-foreground">MRR esperado</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Mejor caso</span>
                  <span className="font-bold">{formatCurrency(forecast.bestCase)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-600">Caso probable</span>
                  <span className="font-bold">{formatCurrency(forecast.expectedMrr30Days)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Peor caso</span>
                  <span className="font-bold">{formatCurrency(forecast.worstCase)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(forecast.pipelineValue)}</p>
                  <p className="text-xs text-muted-foreground">Pipeline Total</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(forecast.weightedPipeline)}</p>
                  <p className="text-xs text-muted-foreground">Ponderado</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-2">Por etapa</p>
                {pipeline.filter(p => p.stage !== 'CERRADO_GANADO' && p.stage !== 'CERRADO_PERDIDO' && p.value > 0).map(p => (
                  <div key={p.stage} className="flex items-center justify-between py-1 text-sm">
                    <span>{STAGE_LABELS[p.stage]}</span>
                    <span className="font-medium">{formatCurrency(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
