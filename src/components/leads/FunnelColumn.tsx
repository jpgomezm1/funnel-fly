import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeadCard } from './LeadCard';
import { Lead, LeadStage } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  Eye,
  PhoneCall,
  Search,
  Presentation,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

interface FunnelColumnProps {
  stage: LeadStage;
  title: string;
  leads: Lead[];
  count: number;
  dealsMap?: Record<string, any[]>;
}

const getStageIcon = (stage: LeadStage) => {
  const icons = {
    'PROSPECTO': Eye,
    'CONTACTADO': PhoneCall,
    'DESCUBRIMIENTO': Search,
    'DEMOSTRACION': Presentation,
    'PROPUESTA': FileText,
    'CERRADO_GANADO': CheckCircle,
    'CERRADO_PERDIDO': XCircle,
  };
  return icons[stage] || Eye;
};

const getStageGradient = (stage: LeadStage) => {
  const gradients = {
    'PROSPECTO': 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900',
    'CONTACTADO': 'from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950',
    'DESCUBRIMIENTO': 'from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-950',
    'DEMOSTRACION': 'from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-950',
    'PROPUESTA': 'from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-950',
    'CERRADO_GANADO': 'from-green-50 to-green-100 dark:from-green-900 dark:to-green-950',
    'CERRADO_PERDIDO': 'from-red-50 to-red-100 dark:from-red-900 dark:to-red-950',
  };
  return gradients[stage] || gradients['PROSPECTO'];
};

const getStageBorder = (stage: LeadStage) => {
  const borders = {
    'PROSPECTO': 'border-slate-200 dark:border-slate-700',
    'CONTACTADO': 'border-blue-200 dark:border-blue-700',
    'DESCUBRIMIENTO': 'border-purple-200 dark:border-purple-700',
    'DEMOSTRACION': 'border-orange-200 dark:border-orange-700',
    'PROPUESTA': 'border-yellow-200 dark:border-yellow-700',
    'CERRADO_GANADO': 'border-green-200 dark:border-green-700',
    'CERRADO_PERDIDO': 'border-red-200 dark:border-red-700',
  };
  return borders[stage] || borders['PROSPECTO'];
};

const getBadgeColor = (stage: LeadStage) => {
  const colors = {
    'PROSPECTO': 'bg-slate-500 hover:bg-slate-600',
    'CONTACTADO': 'bg-blue-500 hover:bg-blue-600',
    'DESCUBRIMIENTO': 'bg-purple-500 hover:bg-purple-600',
    'DEMOSTRACION': 'bg-orange-500 hover:bg-orange-600',
    'PROPUESTA': 'bg-yellow-500 hover:bg-yellow-600',
    'CERRADO_GANADO': 'bg-green-500 hover:bg-green-600',
    'CERRADO_PERDIDO': 'bg-red-500 hover:bg-red-600',
  };
  return colors[stage] || colors['PROSPECTO'];
};

export function FunnelColumn({ stage, title, leads, count, dealsMap = {} }: FunnelColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const StageIcon = getStageIcon(stage);

  // Calcular valor total de MRR para leads cerrados ganados
  const totalMrr = stage === 'CERRADO_GANADO'
    ? leads.reduce((total, lead) => {
        const leadDeals = dealsMap[lead.id] || [];
        return total + leadDeals
          .filter(deal => deal.status === 'ACTIVE')
          .reduce((dealTotal, deal) => dealTotal + (deal.mrr_usd || 0), 0);
      }, 0)
    : 0;

  return (
    <Card className={cn(
      "h-fit min-w-[320px] max-w-sm transition-all duration-300 hover:shadow-lg border-2",
      "bg-gradient-to-br",
      getStageGradient(stage),
      getStageBorder(stage),
      isOver && "ring-4 ring-primary/30 shadow-xl scale-[1.02] border-primary/50"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg shadow-sm",
            getBadgeColor(stage)
          )}>
            <StageIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base text-foreground mb-1">{title}</h3>
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "text-xs font-semibold text-white border-0 shadow-sm",
                getBadgeColor(stage)
              )}>
                {count} lead{count !== 1 ? 's' : ''}
              </Badge>
              {totalMrr > 0 && (
                <Badge variant="outline" className="text-xs font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  ${totalMrr.toLocaleString()} MRR
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[300px] max-h-[600px] overflow-y-auto space-y-3 p-2 rounded-lg transition-all duration-200",
            isOver && "bg-primary/5 border-2 border-dashed border-primary/30"
          )}
        >
          <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                deals={dealsMap[lead.id] || []}
              />
            ))}
          </SortableContext>

          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
              <StageIcon className="h-8 w-8 mb-2 opacity-40" />
              <span className="font-medium">Arrastra leads aquí</span>
              <span className="text-xs mt-1 opacity-70">O crea un nuevo lead</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}