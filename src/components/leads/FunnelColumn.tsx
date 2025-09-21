import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeadCard } from './LeadCard';
import { Lead, LeadStage } from '@/types/database';
import { cn } from '@/lib/utils';

interface FunnelColumnProps {
  stage: LeadStage;
  title: string;
  leads: Lead[];
  count: number;
}

const getStageColor = (stage: LeadStage) => {
  const colors = {
    'PROSPECTO': 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
    'CONTACTADO': 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    'DESCUBRIMIENTO': 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
    'DEMOSTRACION': 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    'PROPUESTA': 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    'CERRADO_GANADO': 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    'CERRADO_PERDIDO': 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  };
  return colors[stage] || colors['PROSPECTO'];
};

const getBadgeVariant = (stage: LeadStage) => {
  const variants = {
    'PROSPECTO': 'secondary',
    'CONTACTADO': 'default',
    'DESCUBRIMIENTO': 'default',
    'DEMOSTRACION': 'default',
    'PROPUESTA': 'default',
    'CERRADO_GANADO': 'default',
    'CERRADO_PERDIDO': 'destructive',
  } as const;
  return variants[stage] || 'secondary';
};

export function FunnelColumn({ stage, title, leads, count }: FunnelColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <Card className={cn(
      "min-w-[280px] max-w-sm transition-colors",
      getStageColor(stage),
      isOver && "ring-2 ring-primary ring-opacity-50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          <Badge variant={getBadgeVariant(stage)} className="text-xs">
            {count}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div
          ref={setNodeRef}
          className="min-h-[200px] space-y-3"
        >
          <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </SortableContext>
          
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
              Arrastra leads aquí
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}