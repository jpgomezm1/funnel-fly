import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Timer,
  ArrowRight,
  XOctagon,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PipelineStageMetrics,
  SalesVelocityMetrics,
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

const STAGE_COLORS: Record<string, string> = {
  'PROSPECTO': '#6b7280',
  'PRIMER_CONTACTO': '#06b6d4',
  'CITA_AGENDADA': '#3b82f6',
  'PROPUESTA_ENVIADA': '#f59e0b',
  'NEGOCIACION': '#8b5cf6',
  'CERRADO_GANADO': '#22c55e',
  'CERRADO_PERDIDO': '#ef4444',
};

interface PipelineTabProps {
  pipeline: PipelineStageMetrics[];
  salesVelocity: SalesVelocityMetrics;
  activeLeads: number;
  leadsThisMonth: number;
  formatCurrency: (amount: number) => string;
}

export default function PipelineTab({
  pipeline,
  salesVelocity,
  activeLeads,
  leadsThisMonth,
  formatCurrency,
}: PipelineTabProps) {
  return (
    <>
      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{activeLeads}</p>
            <p className="text-xs text-muted-foreground">Leads Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{leadsThisMonth}</p>
            <p className="text-xs text-muted-foreground">Nuevos Este Mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{salesVelocity.closedWonThisMonth}</p>
            <p className="text-xs text-muted-foreground">Ganados Mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{salesVelocity.closedLostThisMonth}</p>
            <p className="text-xs text-muted-foreground">Perdidos Mes</p>
          </CardContent>
        </Card>
        <Card className={cn(
          salesVelocity.winRate >= 50 ? 'bg-green-50 dark:bg-green-900/20 border-green-200' :
          salesVelocity.winRate >= 30 ? '' : 'bg-red-50 dark:bg-red-900/20 border-red-200'
        )}>
          <CardContent className="p-4 text-center">
            <p className={cn(
              "text-3xl font-bold",
              salesVelocity.winRate >= 50 ? 'text-green-600' :
              salesVelocity.winRate >= 30 ? '' : 'text-red-600'
            )}>{salesVelocity.winRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Funnel de Conversion
          </CardTitle>
          <CardDescription>Leads por etapa y tasas de conversion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipeline.filter(p => p.stage !== 'CERRADO_GANADO' && p.stage !== 'CERRADO_PERDIDO').map((stage, idx) => {
              const maxCount = Math.max(...pipeline.filter(p => p.stage !== 'CERRADO_GANADO' && p.stage !== 'CERRADO_PERDIDO').map(p => p.count));
              const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

              return (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STAGE_COLORS[stage.stage] }}
                      />
                      <span className="font-medium text-sm">{STAGE_LABELS[stage.stage]}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{stage.avgDaysInStage.toFixed(0)}d avg</span>
                      <Badge variant="outline">{stage.count} leads</Badge>
                      <span className="font-medium">{formatCurrency(stage.value)}</span>
                    </div>
                  </div>
                  <div className="h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all flex items-center justify-end pr-3"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: STAGE_COLORS[stage.stage],
                        minWidth: stage.count > 0 ? '60px' : '0',
                      }}
                    >
                      {stage.conversionRate > 0 && (
                        <span className="text-xs font-medium text-white">{stage.conversionRate.toFixed(0)}% conv</span>
                      )}
                    </div>
                  </div>
                  {idx < pipeline.filter(p => p.stage !== 'CERRADO_GANADO' && p.stage !== 'CERRADO_PERDIDO').length - 1 && (
                    <div className="flex justify-center my-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time by Stage & Loss Reasons */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Tiempo por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(salesVelocity.avgTimeByStage)
                .filter(([stage]) => stage !== 'CERRADO_GANADO' && stage !== 'CERRADO_PERDIDO')
                .map(([stage, days]) => (
                  <div key={stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{STAGE_LABELS[stage]}</span>
                      <span className="font-medium">{days.toFixed(1)} dias</span>
                    </div>
                    <Progress
                      value={Math.min((days / 30) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ciclo Total Promedio</span>
                <Badge variant="secondary" className="text-lg">{salesVelocity.avgDealCycle.toFixed(0)} dias</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <XOctagon className="h-5 w-5 text-red-500" />
              Razones de Perdida
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(salesVelocity.lossReasons).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/30" />
                <p className="text-muted-foreground">Sin perdidas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(salesVelocity.lossReasons)
                  .sort((a, b) => b[1] - a[1])
                  .map(([reason, count]) => {
                    const total = Object.values(salesVelocity.lossReasons).reduce((s, c) => s + c, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={reason} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span>{reason}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{count}</span>
                            <span className="text-muted-foreground">({pct.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
