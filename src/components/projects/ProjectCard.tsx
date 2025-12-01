import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  Play,
  Package,
  XCircle,
  Target,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ProjectWithRelations,
  DEAL_STATUS_LABELS,
  ProjectExecutionStage,
  PROJECT_EXECUTION_STAGE_LABELS,
} from '@/types/database';
import { formatDistanceToBogota } from '@/lib/date-utils';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  project: ProjectWithRelations;
  isDragging?: boolean;
}

// Execution stage configuration
const EXECUTION_STAGE_CONFIG: Record<ProjectExecutionStage, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  ONBOARDING: {
    icon: Rocket,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  IN_PROGRESS: {
    icon: Play,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  DELIVERED: {
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  ACTIVE: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  CHURNED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

export function ProjectCard({ project, isDragging = false }: ProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: `project-${project.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  // Calculate time metrics
  const timeMetrics = useMemo(() => {
    const now = new Date();
    const enteredAt = project.stage_entered_at
      ? new Date(project.stage_entered_at)
      : new Date(project.created_at);

    const daysInStage = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));

    // Check estimated delivery
    let deliveryStatus: 'on_track' | 'urgent' | 'overdue' | null = null;
    let daysUntilDelivery = 0;

    if (project.estimated_delivery_date) {
      const deliveryDate = new Date(project.estimated_delivery_date);
      daysUntilDelivery = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDelivery < 0) {
        deliveryStatus = 'overdue';
      } else if (daysUntilDelivery <= 7) {
        deliveryStatus = 'urgent';
      } else {
        deliveryStatus = 'on_track';
      }
    }

    return {
      daysInStage,
      deliveryStatus,
      daysUntilDelivery,
    };
  }, [project.stage_entered_at, project.created_at, project.estimated_delivery_date]);

  // Get execution stage config
  const executionStage = (project.execution_stage as ProjectExecutionStage) || 'ONBOARDING';
  const stageConfig = EXECUTION_STAGE_CONFIG[executionStage];
  const StageIcon = stageConfig.icon;

  // Simulated progress (would come from checklist in real implementation)
  const progressPercentage = useMemo(() => {
    // Map execution stages to approximate progress
    const stageProgress: Record<ProjectExecutionStage, number> = {
      ONBOARDING: 15,
      IN_PROGRESS: 50,
      DELIVERED: 85,
      ACTIVE: 100,
      CHURNED: 0,
    };
    return stageProgress[executionStage] || 0;
  }, [executionStage]);

  // Dragging preview
  if (isBeingDragged) {
    return (
      <Card className="w-72 p-4 bg-primary/10 border-primary/30 border-2 border-dashed rotate-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold text-primary truncate block">
              {project.name}
            </span>
            <span className="text-xs text-primary/70">
              {project.client?.company_name || 'Sin cliente'}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link to={`/projects/${project.id}`}>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "p-3 cursor-grab active:cursor-grabbing transition-all duration-200",
          "hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
          "border-l-4",
          executionStage === 'ACTIVE' && "border-l-emerald-500",
          executionStage === 'IN_PROGRESS' && "border-l-amber-500",
          executionStage === 'ONBOARDING' && "border-l-blue-500",
          executionStage === 'DELIVERED' && "border-l-purple-500",
          executionStage === 'CHURNED' && "border-l-red-500"
        )}
      >
        <div className="space-y-2.5">
          {/* Top row: Client + Execution Stage */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{project.client?.company_name || 'Sin cliente'}</span>
            </div>

            {/* Execution stage badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] h-5 px-1.5 flex-shrink-0",
                stageConfig.bgColor,
                stageConfig.color,
                "border-0"
              )}
            >
              <StageIcon className="h-3 w-3 mr-0.5" />
              {PROJECT_EXECUTION_STAGE_LABELS[executionStage]}
            </Badge>
          </div>

          {/* Project Name */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              stageConfig.bgColor
            )}>
              <Briefcase className={cn("h-4 w-4", stageConfig.color)} />
            </div>
            <h3 className="font-semibold text-sm truncate flex-1">{project.name}</h3>
          </div>

          {/* Progress bar */}
          {executionStage !== 'CHURNED' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Progreso
                </span>
                <span className={cn(
                  "font-medium",
                  progressPercentage >= 80 ? "text-emerald-600" :
                  progressPercentage >= 50 ? "text-blue-600" :
                  "text-amber-600"
                )}>
                  {progressPercentage}%
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-1.5"
              />
            </div>
          )}

          {/* Deal info (MRR + Status) */}
          {project.deal && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">
                  ${project.deal.mrr_usd.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-muted-foreground">/mes</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] h-5 border-0",
                  project.deal.status === 'ACTIVE' && 'bg-emerald-100 text-emerald-700',
                  project.deal.status === 'ON_HOLD' && 'bg-amber-100 text-amber-700',
                  project.deal.status === 'CHURNED' && 'bg-red-100 text-red-700'
                )}
              >
                {DEAL_STATUS_LABELS[project.deal.status]}
              </Badge>
            </div>
          )}

          {/* Delivery date warning */}
          {timeMetrics.deliveryStatus && (
            <div className={cn(
              "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded",
              timeMetrics.deliveryStatus === 'overdue' && "bg-red-50 text-red-600",
              timeMetrics.deliveryStatus === 'urgent' && "bg-amber-50 text-amber-600",
              timeMetrics.deliveryStatus === 'on_track' && "bg-slate-50 text-slate-600"
            )}>
              {timeMetrics.deliveryStatus === 'overdue' ? (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Vencido hace {Math.abs(timeMetrics.daysUntilDelivery)}d</span>
                </>
              ) : timeMetrics.deliveryStatus === 'urgent' ? (
                <>
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{timeMetrics.daysUntilDelivery}d para entrega</span>
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3" />
                  <span>{timeMetrics.daysUntilDelivery}d para entrega</span>
                </>
              )}
            </div>
          )}

          {/* Footer: Time in stage */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeMetrics.daysInStage}d en etapa
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToBogota(project.stage_entered_at)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
