import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { StageMetrics, ConversionMetric, VelocityMetric } from '@/hooks/useReporting';
import { STAGE_LABELS } from '@/types/database';

interface ReportingMetricsProps {
  newLeads: number;
  stageMetrics: StageMetrics[];
  conversions: ConversionMetric[];
  velocity: VelocityMetric[];
}

export function ReportingMetrics({ 
  newLeads, 
  stageMetrics, 
  conversions, 
  velocity 
}: ReportingMetricsProps) {
  const getConversionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConversionVariant = (percentage: number) => {
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    return 'destructive';
  };

  const wonMetric = stageMetrics.find(m => m.stage === 'CERRADO_GANADO');
  const lostMetric = stageMetrics.find(m => m.stage === 'CERRADO_PERDIDO');

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newLeads}</div>
            <p className="text-xs text-muted-foreground">
              Leads creados en el período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cierres Ganados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {wonMetric?.entries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads cerrados exitosamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cierres Perdidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lostMetric?.entries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads cerrados sin éxito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const won = wonMetric?.entries || 0;
                const lost = lostMetric?.entries || 0;
                const total = won + lost;
                return total > 0 ? Math.round((won / total) * 100) : 0;
              })()}%
            </div>
            <p className="text-xs text-muted-foreground">
              Ganados vs Total cerrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Entradas por Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stageMetrics.map((metric) => (
              <div key={metric.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {STAGE_LABELS[metric.stage]}
                  </span>
                  <Badge variant="outline">
                    {metric.entries}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ 
                      width: `${Math.min((metric.entries / Math.max(...stageMetrics.map(m => m.entries), 1)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Conversiones entre Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversions.map((conversion, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {STAGE_LABELS[conversion.fromStage]}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {STAGE_LABELS[conversion.toStage]}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getConversionColor(conversion.percentage)}`}>
                      {conversion.percentage.toFixed(1)}%
                    </span>
                    <Badge variant={getConversionVariant(conversion.percentage)} className="text-xs">
                      {conversion.percentage >= 80 ? '🎯 Excelente' : 
                       conversion.percentage >= 60 ? '⚠️ Bueno' : '📉 Mejorar'}
                    </Badge>
                  </div>
                  
                  <Progress value={Math.min(conversion.percentage, 100)} className="h-2" />
                  
                  <div className="text-xs text-muted-foreground">
                    {conversion.toCount} de {conversion.fromCount} convertidos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Velocity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Velocidad entre Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {velocity.map((metric, index) => (
              <div key={index} className="text-center space-y-2 p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </div>
                <div className="text-2xl font-bold">
                  {metric.days !== null ? `${metric.days.toFixed(2)}` : '--'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metric.days !== null ? 'días promedio' : 'Sin datos suficientes'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}