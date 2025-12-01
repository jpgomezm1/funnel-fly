import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Flag,
  TrendingUp,
  Loader2,
  Package,
  Play,
  Rocket,
  XCircle,
  Calendar,
  Target,
  Zap,
  ArrowRight,
  Timer,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectMilestones } from '@/hooks/useProjectMilestones';
import { useProjectChecklist } from '@/hooks/useProjectChecklist';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import {
  ProjectExecutionStage,
  PROJECT_EXECUTION_STAGE_LABELS,
  CHECKLIST_CATEGORY_LABELS,
  CHECKLIST_CATEGORY_COLORS,
  CHECKLIST_CATEGORY_ORDER,
} from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';

interface ProjectHeroCardProps {
  projectId: string;
  executionStage?: ProjectExecutionStage;
  mrrUsd: number;
  feeUsd: number;
  currency?: string;
  estimatedDeliveryDate?: string;
  kickoffDate?: string;
  actualDeliveryDate?: string;
  clientName?: string;
}

const EXECUTION_STAGES: ProjectExecutionStage[] = [
  'ONBOARDING',
  'IN_PROGRESS',
  'DELIVERED',
  'ACTIVE',
];

const EXECUTION_STAGE_CONFIG: Record<ProjectExecutionStage, {
  icon: React.ElementType;
  bgGradient: string;
  iconBg: string;
  textColor: string;
  badgeClass: string;
  description: string;
}> = {
  ONBOARDING: {
    icon: Rocket,
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-700',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Preparando el proyecto',
  },
  IN_PROGRESS: {
    icon: Play,
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500',
    textColor: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'En desarrollo activo',
  },
  DELIVERED: {
    icon: Package,
    bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    iconBg: 'bg-purple-500',
    textColor: 'text-purple-700',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Entregado al cliente',
  },
  ACTIVE: {
    icon: CheckCircle2,
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Operativo y generando valor',
  },
  CHURNED: {
    icon: XCircle,
    bgGradient: 'from-red-500/10 via-red-500/5 to-transparent',
    iconBg: 'bg-red-500',
    textColor: 'text-red-700',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    description: 'Cliente canceló el servicio',
  },
};

export function ProjectHeroCard({
  projectId,
  executionStage = 'ONBOARDING',
  mrrUsd,
  feeUsd,
  currency,
  estimatedDeliveryDate,
  kickoffDate,
  actualDeliveryDate,
  clientName,
}: ProjectHeroCardProps) {
  const { milestones, isLoading: loadingMilestones, getNextMilestone } = useProjectMilestones({ projectId });
  const { items, isLoading: loadingChecklist, getProgress, getProgressByCategory, getWeightedProgress } = useProjectChecklist({ projectId });
  const { updates, isLoading: loadingUpdates, getActiveBlockers, getStats } = useProjectUpdates({ projectId });

  const stageConfig = EXECUTION_STAGE_CONFIG[executionStage];
  const StageIcon = stageConfig.icon;
  const currentStageIndex = EXECUTION_STAGES.indexOf(executionStage);

  const nextMilestone = getNextMilestone();
  const checklistProgress = getProgress();
  const weightedProgress = getWeightedProgress();
  const progressByCategory = getProgressByCategory();
  const activeBlockers = getActiveBlockers();
  const updateStats = getStats();

  const isLoading = loadingMilestones || loadingChecklist || loadingUpdates;

  // Calculate if next milestone is overdue or upcoming
  const getMilestoneStatus = () => {
    if (!nextMilestone?.expected_date) return null;
    const expected = new Date(nextMilestone.expected_date);
    const now = new Date();
    const diffDays = Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { type: 'overdue', text: `Vencido hace ${Math.abs(diffDays)}d` };
    if (diffDays === 0) return { type: 'today', text: 'Hoy' };
    if (diffDays <= 3) return { type: 'soon', text: `En ${diffDays}d` };
    return { type: 'normal', text: `En ${diffDays}d` };
  };

  const milestoneStatus = getMilestoneStatus();

  // Calculate days until estimated delivery
  const getDeliveryStatus = () => {
    if (actualDeliveryDate) return { type: 'delivered', days: 0, text: 'Entregado' };
    if (!estimatedDeliveryDate) return null;
    const estimated = new Date(estimatedDeliveryDate);
    const now = new Date();
    const diffDays = Math.ceil((estimated.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { type: 'overdue', days: Math.abs(diffDays), text: `${Math.abs(diffDays)}d de retraso` };
    if (diffDays === 0) return { type: 'today', days: 0, text: 'Hoy' };
    if (diffDays <= 7) return { type: 'urgent', days: diffDays, text: `${diffDays}d` };
    if (diffDays <= 14) return { type: 'soon', days: diffDays, text: `${diffDays}d` };
    return { type: 'normal', days: diffDays, text: `${diffDays}d` };
  };

  const deliveryStatus = getDeliveryStatus();

  // Calculate project duration
  const projectDuration = useMemo(() => {
    if (!kickoffDate) return null;
    const start = new Date(kickoffDate);
    const end = actualDeliveryDate ? new Date(actualDeliveryDate) : new Date();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [kickoffDate, actualDeliveryDate]);

  // Get categories with items
  const categoriesWithItems = CHECKLIST_CATEGORY_ORDER.filter(
    cat => progressByCategory[cat]?.total > 0
  );

  if (isLoading) {
    return (
      <Card className={cn('p-6', `bg-gradient-to-r ${stageConfig.bgGradient}`)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'overflow-hidden border-2',
      executionStage === 'CHURNED' && 'border-red-200',
      executionStage === 'ACTIVE' && 'border-emerald-200',
      executionStage !== 'CHURNED' && executionStage !== 'ACTIVE' && 'border-transparent'
    )}>
      {/* Top section with gradient */}
      <div className={cn('p-6 bg-gradient-to-r', stageConfig.bgGradient)}>
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left: Stage + Status */}
          <div className="flex items-start gap-4 flex-1">
            {/* Stage Icon */}
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg',
              stageConfig.iconBg,
              'text-white'
            )}>
              <StageIcon className="h-8 w-8" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn('text-sm font-semibold px-3 py-1', stageConfig.badgeClass)}
                >
                  {PROJECT_EXECUTION_STAGE_LABELS[executionStage]}
                </Badge>

                {/* Blockers Alert */}
                {activeBlockers.length > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {activeBlockers.length} Bloqueo{activeBlockers.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {stageConfig.description}
              </p>

              {/* Stage Pipeline - Only show if not churned */}
              {executionStage !== 'CHURNED' && (
                <div className="flex items-center gap-2 mt-4">
                  {EXECUTION_STAGES.map((stage, index) => {
                    const isCompleted = index < currentStageIndex;
                    const isCurrent = stage === executionStage;
                    const isPending = index > currentStageIndex;
                    const config = EXECUTION_STAGE_CONFIG[stage];
                    const Icon = config.icon;

                    return (
                      <div key={stage} className="flex items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                            isCompleted && 'bg-emerald-500 text-white',
                            isCurrent && cn(config.iconBg, 'text-white ring-2 ring-offset-2', `ring-${config.iconBg.replace('bg-', '')}`),
                            isPending && 'bg-slate-100 text-slate-400'
                          )}
                          title={PROJECT_EXECUTION_STAGE_LABELS[stage]}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        {index < EXECUTION_STAGES.length - 1 && (
                          <ArrowRight className={cn(
                            'h-4 w-4 mx-1',
                            index < currentStageIndex ? 'text-emerald-500' : 'text-slate-300'
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
            {/* MRR */}
            <div className="text-center p-3 bg-white/80 rounded-xl border shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-muted-foreground">MRR</span>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                ${mrrUsd.toLocaleString('en-US')}
              </p>
              <p className="text-[10px] text-muted-foreground">/mes</p>
            </div>

            {/* Fee */}
            <div className="text-center p-3 bg-white/80 rounded-xl border shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-medium text-muted-foreground">Fee</span>
              </div>
              <p className="text-xl font-bold text-slate-700">
                ${feeUsd.toLocaleString('en-US')}
              </p>
              <p className="text-[10px] text-muted-foreground">implementación</p>
            </div>

            {/* Progress */}
            <div className="text-center p-3 bg-white/80 rounded-xl border shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">Progreso</span>
              </div>
              <p className={cn(
                'text-xl font-bold',
                weightedProgress.percentage >= 80 ? 'text-emerald-600' :
                weightedProgress.percentage >= 50 ? 'text-blue-600' :
                'text-amber-600'
              )}>
                {weightedProgress.percentage}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                {checklistProgress.completed}/{checklistProgress.total} tareas
              </p>
            </div>

            {/* Delivery */}
            <div className="text-center p-3 bg-white/80 rounded-xl border shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className={cn(
                  'h-4 w-4',
                  deliveryStatus?.type === 'overdue' ? 'text-red-600' :
                  deliveryStatus?.type === 'urgent' || deliveryStatus?.type === 'today' ? 'text-amber-600' :
                  deliveryStatus?.type === 'delivered' ? 'text-emerald-600' :
                  'text-slate-600'
                )} />
                <span className="text-xs font-medium text-muted-foreground">Entrega</span>
              </div>
              {deliveryStatus ? (
                <>
                  <p className={cn(
                    'text-xl font-bold',
                    deliveryStatus.type === 'overdue' ? 'text-red-600' :
                    deliveryStatus.type === 'urgent' || deliveryStatus.type === 'today' ? 'text-amber-600' :
                    deliveryStatus.type === 'delivered' ? 'text-emerald-600' :
                    'text-slate-700'
                  )}>
                    {deliveryStatus.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {deliveryStatus.type === 'delivered' ? 'completado' :
                     deliveryStatus.type === 'overdue' ? 'vencido' : 'restantes'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-slate-400">-</p>
                  <p className="text-[10px] text-muted-foreground">no definido</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Progress by Category + Next Milestone */}
      <div className="p-4 bg-slate-50/50 border-t">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Progress by Category */}
          {categoriesWithItems.length > 0 && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Progreso por área</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CHECKLIST_CATEGORY_ORDER.map(category => {
                  const catProgress = progressByCategory[category];
                  if (!catProgress || catProgress.total === 0) return null;

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded font-medium',
                          CHECKLIST_CATEGORY_COLORS[category]
                        )}>
                          {CHECKLIST_CATEGORY_LABELS[category]}
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {catProgress.percentage}%
                        </span>
                      </div>
                      <Progress
                        value={catProgress.percentage}
                        className="h-1.5"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          {categoriesWithItems.length > 0 && (nextMilestone || projectDuration) && (
            <div className="hidden lg:block w-px h-16 bg-border" />
          )}

          {/* Next Milestone + Duration */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {/* Next Milestone */}
            {nextMilestone && (
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  milestoneStatus?.type === 'overdue' ? 'bg-red-100' :
                  milestoneStatus?.type === 'soon' || milestoneStatus?.type === 'today' ? 'bg-amber-100' :
                  'bg-slate-100'
                )}>
                  <Flag className={cn(
                    'h-5 w-5',
                    milestoneStatus?.type === 'overdue' ? 'text-red-600' :
                    milestoneStatus?.type === 'soon' || milestoneStatus?.type === 'today' ? 'text-amber-600' :
                    'text-slate-600'
                  )} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Próximo hito</p>
                  <p className={cn(
                    'font-medium text-sm',
                    milestoneStatus?.type === 'overdue' ? 'text-red-600' :
                    milestoneStatus?.type === 'soon' || milestoneStatus?.type === 'today' ? 'text-amber-600' :
                    'text-slate-700'
                  )}>
                    {nextMilestone.name}
                  </p>
                  {milestoneStatus && (
                    <p className={cn(
                      'text-xs',
                      milestoneStatus.type === 'overdue' ? 'text-red-500' :
                      milestoneStatus.type === 'soon' || milestoneStatus.type === 'today' ? 'text-amber-500' :
                      'text-muted-foreground'
                    )}>
                      {milestoneStatus.text}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Project Duration */}
            {projectDuration && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duración</p>
                  <p className="font-medium text-sm text-slate-700">
                    {projectDuration} días
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {actualDeliveryDate ? 'total' : 'en curso'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
