import { ReactNode, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LeadCard } from './LeadCard';
import { Lead, LeadStage, LEAD_STAGES } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  Users,
  Phone,
  Search,
  Presentation,
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface FunnelColumnProps {
  stage: LeadStage;
  title: string;
  leads: Lead[];
  count: number;
  dealsMap?: Record<string, any[]>;
  mrr?: number;
  children?: ReactNode;
}

const STAGE_CONFIG: Record<LeadStage, {
  color: string;
  bgColor: string;
  borderColor: string;
  lightBg: string;
  icon: React.ElementType;
  description: string;
}> = {
  'PROSPECTO': {
    color: 'text-slate-600',
    bgColor: 'bg-slate-500',
    borderColor: 'border-slate-300',
    lightBg: 'bg-slate-50',
    icon: Users,
    description: 'Nuevos leads',
  },
  'CONTACTADO': {
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-300',
    lightBg: 'bg-blue-50',
    icon: Phone,
    description: 'En comunicación',
  },
  'DESCUBRIMIENTO': {
    color: 'text-violet-600',
    bgColor: 'bg-violet-500',
    borderColor: 'border-violet-300',
    lightBg: 'bg-violet-50',
    icon: Search,
    description: 'Calificando necesidades',
  },
  'DEMOSTRACION': {
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-300',
    lightBg: 'bg-amber-50',
    icon: Presentation,
    description: 'Mostrando solución',
  },
  'PROPUESTA': {
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-300',
    lightBg: 'bg-orange-50',
    icon: FileText,
    description: 'Negociando términos',
  },
  'CERRADO_GANADO': {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-300',
    lightBg: 'bg-emerald-50',
    icon: CheckCircle2,
    description: 'Proyectos activos',
  },
  'CERRADO_PERDIDO': {
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-300',
    lightBg: 'bg-red-50',
    icon: XCircle,
    description: 'Oportunidades perdidas',
  },
};

export function FunnelColumn({
  stage,
  title,
  leads,
  count,
  dealsMap = {},
  mrr = 0,
  children
}: FunnelColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const isLeadStage = LEAD_STAGES.includes(stage as any);
  const config = STAGE_CONFIG[stage];
  const StageIcon = config.icon;

  // Calculate column metrics for lead stages
  const columnMetrics = useMemo(() => {
    if (!isLeadStage || leads.length === 0) return null;

    const now = new Date();
    let staleCount = 0;
    let totalDaysInStage = 0;
    let oldestDays = 0;

    leads.forEach(lead => {
      const enteredAt = lead.stage_entered_at ? new Date(lead.stage_entered_at) : new Date(lead.created_at);
      const daysInStage = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));

      totalDaysInStage += daysInStage;
      if (daysInStage > oldestDays) oldestDays = daysInStage;
      if (daysInStage > 7) staleCount++;
    });

    const avgDays = Math.round(totalDaysInStage / leads.length);

    return {
      staleCount,
      avgDays,
      oldestDays,
    };
  }, [leads, isLeadStage]);

  // Calculate potential value from leads
  const potentialValue = useMemo(() => {
    if (!isLeadStage) return 0;
    // Each lead represents potential value - estimate based on stage
    const stageMultiplier: Record<string, number> = {
      'PROSPECTO': 0.05,
      'CONTACTADO': 0.1,
      'DESCUBRIMIENTO': 0.25,
    };
    const multiplier = stageMultiplier[stage] || 0.1;
    // Assume average deal value of $500 MRR per lead
    return leads.length * 500 * multiplier;
  }, [leads, stage, isLeadStage]);

  return (
    <div
      className={cn(
        "flex-shrink-0 w-80 flex flex-col rounded-xl border-2 transition-all duration-200",
        config.lightBg,
        config.borderColor,
        isOver && "ring-2 ring-primary ring-offset-2 border-primary scale-[1.02]"
      )}
    >
      {/* Header */}
      <div className={cn(
        "p-4 border-b",
        config.borderColor
      )}>
        {/* Main Header Row */}
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            config.bgColor,
            "text-white shadow-sm"
          )}>
            <StageIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn("font-semibold text-sm", config.color)}>{title}</h3>
              <span className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full",
                config.bgColor,
                "text-white"
              )}>
                {count}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{config.description}</p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
          {/* For won projects - show MRR */}
          {stage === 'CERRADO_GANADO' && mrr > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-600">
                ${mrr.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-muted-foreground">/mes</span>
            </div>
          )}

          {/* For lost projects - show count info */}
          {stage === 'CERRADO_PERDIDO' && count > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">
                {count} perdido{count !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* For lead stages - show metrics */}
          {isLeadStage && columnMetrics && (
            <>
              {/* Potential Value */}
              {potentialValue > 0 && (
                <div className="flex items-center gap-1" title="Valor potencial estimado">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    ~${Math.round(potentialValue).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Average days in stage */}
              <div className="flex items-center gap-1" title="Promedio días en etapa">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {columnMetrics.avgDays}d prom
                </span>
              </div>

              {/* Stale leads indicator */}
              {columnMetrics.staleCount > 0 && (
                <div className="flex items-center gap-1 ml-auto" title="Leads estancados (>7 días)">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-medium text-amber-600">
                    {columnMetrics.staleCount} estancado{columnMetrics.staleCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Empty state metrics */}
          {isLeadStage && !columnMetrics && (
            <span className="text-[10px] text-muted-foreground">Sin actividad</span>
          )}

          {/* Project stages without items */}
          {!isLeadStage && stage !== 'CERRADO_GANADO' && stage !== 'CERRADO_PERDIDO' && count === 0 && (
            <span className="text-[10px] text-muted-foreground">Sin proyectos</span>
          )}
        </div>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-2 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        )}
      >
        {/* Render leads for early stages */}
        {isLeadStage && (
          <>
            <SortableContext items={leads.map(lead => `lead-${lead.id}`)} strategy={verticalListSortingStrategy}>
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  deals={dealsMap[lead.id] || []}
                />
              ))}
            </SortableContext>

            {leads.length === 0 && (
              <div className={cn(
                "flex flex-col items-center justify-center h-32 text-center",
                "border-2 border-dashed rounded-lg p-4",
                config.borderColor
              )}>
                <StageIcon className={cn("h-8 w-8 mb-2 opacity-30", config.color)} />
                <p className="text-xs text-muted-foreground">
                  Sin leads en esta etapa
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Arrastra leads aquí
                </p>
              </div>
            )}
          </>
        )}

        {/* Render projects for advanced stages (passed as children) */}
        {!isLeadStage && (
          <>
            {children}
            {count === 0 && (
              <div className={cn(
                "flex flex-col items-center justify-center h-32 text-center",
                "border-2 border-dashed rounded-lg p-4",
                config.borderColor
              )}>
                <StageIcon className={cn("h-8 w-8 mb-2 opacity-30", config.color)} />
                <p className="text-xs text-muted-foreground">
                  Sin proyectos en esta etapa
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Arrastra proyectos aquí
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with quick stats */}
      {count > 0 && (
        <div className={cn(
          "px-4 py-2 border-t text-center",
          config.borderColor,
          "bg-white/50"
        )}>
          <span className="text-[10px] text-muted-foreground">
            {isLeadStage ? (
              <>
                {count} lead{count !== 1 ? 's' : ''} • {columnMetrics?.avgDays || 0}d promedio
              </>
            ) : stage === 'CERRADO_GANADO' ? (
              <>
                {count} proyecto{count !== 1 ? 's' : ''} activo{count !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                {count} proyecto{count !== 1 ? 's' : ''}
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
