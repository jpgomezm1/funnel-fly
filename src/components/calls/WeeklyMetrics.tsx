import { Card, CardContent } from '@/components/ui/card';
import { useCallsWeeklyMetrics } from '@/hooks/useCalls';
import {
  Phone,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export function WeeklyMetrics() {
  const { data: metrics, isLoading } = useCallsWeeklyMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-center h-20">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Llamadas Semana',
      value: metrics?.totalCalls || 0,
      icon: Phone,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Completadas',
      value: metrics?.completedCalls || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Pasan a Fase 0',
      value: metrics?.pasaFase0 || 0,
      icon: Calendar,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'No Califican',
      value: metrics?.noCalifica || 0,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
