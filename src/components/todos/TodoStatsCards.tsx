import { Card, CardContent } from '@/components/ui/card';
import { Clock, PlayCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TodoStatsCardsProps {
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

export function TodoStatsCards({ stats }: TodoStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pendientes</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">{stats.pending}</p>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <PlayCircle className="h-4 w-4" />
            <span className="text-xs font-medium">En Progreso</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Completados</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
        </CardContent>
      </Card>

      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Vencidas</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
        </CardContent>
      </Card>
    </div>
  );
}
