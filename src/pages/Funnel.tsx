import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LeadCard } from '@/components/leads/LeadCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { FunnelColumn } from '@/components/leads/FunnelColumn';
import { FunnelFilters } from '@/components/leads/FunnelFilters';
import { ConvertToProjectModal } from '@/components/leads/ConvertToProjectModal';
import { CreateDealModal } from '@/components/projects/CreateDealModal';
import { useLeads } from '@/hooks/useLeads';
import { usePipelineProjects } from '@/hooks/useProjects';
import { useLeadDeals } from '@/hooks/useDeals';
import {
  Lead,
  LeadStage,
  ProjectStage,
  ProjectWithRelations,
  STAGE_ORDER,
  STAGE_LABELS,
  LEAD_STAGES,
  PROJECT_STAGES,
} from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  ArrowRight,
  Percent,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

// Union type for items in the pipeline
type PipelineItem =
  | { type: 'lead'; data: Lead }
  | { type: 'project'; data: ProjectWithRelations };

export default function Funnel() {
  const navigate = useNavigate();
  const { leads, loading: leadsLoading, updateLeadStage } = useLeads();
  const { projects, isLoading: projectsLoading, updateProjectStage } = usePipelineProjects();
  const { dealsMap } = useLeadDeals(leads.map(lead => lead.id));

  const [activeItem, setActiveItem] = useState<PipelineItem | null>(null);

  // Modals
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [pendingLeadForConvert, setPendingLeadForConvert] = useState<Lead | null>(null);

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [pendingProjectForDeal, setPendingProjectForDeal] = useState<ProjectWithRelations | null>(null);

  const [filters, setFilters] = useState({
    dateRange: null as { from: Date; to: Date } | null,
    channel: null as string | null,
    subchannel: null as string | null,
    owner: null as string | null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter leads (only show in early stages: PROSPECTO, CONTACTADO, DESCUBRIMIENTO)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Only show leads in early stages
      if (!LEAD_STAGES.includes(lead.stage as any)) return false;

      if (filters.dateRange) {
        const stageDate = new Date(lead.stage_entered_at);
        if (stageDate < filters.dateRange.from || stageDate > filters.dateRange.to) {
          return false;
        }
      }
      if (filters.channel && lead.channel !== filters.channel) return false;
      if (filters.subchannel && lead.subchannel !== filters.subchannel) return false;
      if (filters.owner && lead.owner_id !== filters.owner) return false;
      return true;
    });
  }, [leads, filters]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const allLeadsInPipeline = leads.filter(l => LEAD_STAGES.includes(l.stage as any));
    const totalLeads = allLeadsInPipeline.length;
    const totalProjects = projects.length;
    const totalItems = filteredLeads.length + projects.length;

    // Leads by stage
    const leadsByStage = LEAD_STAGES.reduce((acc, stage) => {
      acc[stage] = filteredLeads.filter(lead => lead.stage === stage).length;
      return acc;
    }, {} as Record<string, number>);

    // Projects by stage
    const projectsByStage = PROJECT_STAGES.reduce((acc, stage) => {
      acc[stage] = projects.filter(project => project.stage === stage).length;
      return acc;
    }, {} as Record<string, number>);

    // Active MRR from won projects
    const wonProjects = projects.filter(p => p.stage === 'CERRADO_GANADO' && p.deal?.status === 'ACTIVE');
    const totalMrrActive = wonProjects.reduce((sum, p) => sum + (p.deal?.mrr_usd || 0), 0);
    const totalFeesWon = wonProjects.reduce((sum, p) => sum + (p.deal?.implementation_fee_usd || 0), 0);

    // Pipeline value (expected MRR from DEMOSTRACION + PROPUESTA)
    const pipelineProjects = projects.filter(p => p.stage === 'DEMOSTRACION' || p.stage === 'PROPUESTA');
    const pipelineValue = pipelineProjects.reduce((sum, p) => {
      // Use booked values if available, otherwise use deal values
      if (p.booked_mrr_usd) return sum + p.booked_mrr_usd;
      if (p.deal?.mrr_usd) return sum + p.deal.mrr_usd;
      return sum;
    }, 0);

    // Win rate
    const closedProjects = projects.filter(p => p.stage === 'CERRADO_GANADO' || p.stage === 'CERRADO_PERDIDO');
    const wonCount = projectsByStage['CERRADO_GANADO'] || 0;
    const lostCount = projectsByStage['CERRADO_PERDIDO'] || 0;
    const winRate = closedProjects.length > 0 ? (wonCount / closedProjects.length) * 100 : 0;

    // Conversion rates
    const leadToProjectRate = totalLeads > 0 ? (totalProjects / (totalLeads + totalProjects)) * 100 : 0;

    // Stale leads (no activity in 7+ days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const staleLeads = allLeadsInPipeline.filter(l => new Date(l.last_activity_at) < sevenDaysAgo).length;

    // Average time in pipeline (days)
    const avgTimeInPipeline = allLeadsInPipeline.length > 0
      ? allLeadsInPipeline.reduce((sum, l) => sum + differenceInDays(new Date(), new Date(l.created_at)), 0) / allLeadsInPipeline.length
      : 0;

    // Projects at risk (ON_HOLD)
    const atRiskProjects = projects.filter(p => p.deal?.status === 'ON_HOLD').length;

    return {
      totalItems,
      totalLeads,
      totalProjects,
      leadsByStage,
      projectsByStage,
      totalMrrActive,
      totalFeesWon,
      pipelineValue,
      winRate,
      wonCount,
      lostCount,
      leadToProjectRate,
      staleLeads,
      avgTimeInPipeline,
      atRiskProjects,
    };
  }, [leads, projects, filteredLeads]);

  // Group leads by stage
  const leadsByStage = LEAD_STAGES.reduce((acc, stage) => {
    acc[stage] = filteredLeads.filter(lead => lead.stage === stage);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Group projects by stage
  const projectsByStage = PROJECT_STAGES.reduce((acc, stage) => {
    acc[stage] = projects.filter(project => project.stage === stage);
    return acc;
  }, {} as Record<string, ProjectWithRelations[]>);

  // Get items for a stage (could be leads or projects)
  const getItemsForStage = (stage: LeadStage): string[] => {
    if (LEAD_STAGES.includes(stage as any)) {
      return leadsByStage[stage]?.map(l => `lead-${l.id}`) || [];
    } else {
      return projectsByStage[stage as ProjectStage]?.map(p => `project-${p.id}`) || [];
    }
  };

  // Get count for a stage
  const getCountForStage = (stage: LeadStage): number => {
    if (LEAD_STAGES.includes(stage as any)) {
      return leadsByStage[stage]?.length || 0;
    } else {
      return projectsByStage[stage as ProjectStage]?.length || 0;
    }
  };

  // Get MRR for a stage (only for won projects)
  const getMrrForStage = (stage: LeadStage): number => {
    if (stage === 'CERRADO_GANADO') {
      return projectsByStage[stage]?.reduce((sum, p) => sum + (p.deal?.mrr_usd || 0), 0) || 0;
    }
    return 0;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;

    if (id.startsWith('lead-')) {
      const leadId = id.replace('lead-', '');
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setActiveItem({ type: 'lead', data: lead });
      }
    } else if (id.startsWith('project-')) {
      const projectId = id.replace('project-', '');
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setActiveItem({ type: 'project', data: project });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !activeItem) {
      setActiveItem(null);
      return;
    }

    const targetStage = over.id as LeadStage;

    if (!STAGE_ORDER.includes(targetStage)) {
      setActiveItem(null);
      return;
    }

    if (activeItem.type === 'lead') {
      const lead = activeItem.data;
      const currentStage = lead.stage;

      // Lead moving to a new stage
      if (currentStage !== targetStage) {
        // If moving to DEMOSTRACION or beyond, need to convert to project
        if (PROJECT_STAGES.includes(targetStage as ProjectStage)) {
          setPendingLeadForConvert(lead);
          setConvertModalOpen(true);
        } else {
          // Normal lead stage update (within early stages)
          await updateLeadStage(lead.id, targetStage);
        }
      }
    } else if (activeItem.type === 'project') {
      const project = activeItem.data;
      const currentStage = project.stage;

      // Project moving to a new stage
      if (currentStage !== targetStage) {
        // Projects can only move within PROJECT_STAGES
        if (PROJECT_STAGES.includes(targetStage as ProjectStage)) {
          // If moving to CERRADO_GANADO and no deal exists, ask for deal info
          if (targetStage === 'CERRADO_GANADO' && !project.deal) {
            setPendingProjectForDeal(project);
            setDealModalOpen(true);
            // Update stage first
            await updateProjectStage({ projectId: project.id, newStage: targetStage as ProjectStage });
          } else {
            await updateProjectStage({ projectId: project.id, newStage: targetStage as ProjectStage });
          }
        }
        // If trying to move project to early stages, ignore
      }
    }

    setActiveItem(null);
  };

  const handleConvertSuccess = () => {
    setConvertModalOpen(false);
    setPendingLeadForConvert(null);
  };

  const handleDealSuccess = () => {
    setDealModalOpen(false);
    setPendingProjectForDeal(null);
  };

  const loading = leadsLoading || projectsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Pipeline
            </h1>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Pipeline
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu flujo de ventas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FunnelFilters filters={filters} onFiltersChange={setFilters} />
          <Button className="gap-2" onClick={() => navigate('/empresas')}>
            <Plus className="h-4 w-4" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Leads</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">
              en early stage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Proyectos</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalProjects}</p>
            <p className="text-xs text-muted-foreground mt-1">
              en negociacion
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">MRR Activo</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ${metrics.totalMrrActive.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
              {metrics.wonCount} ganados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Pipeline</span>
            </div>
            <p className="text-2xl font-bold">${metrics.pipelineValue.toLocaleString('en-US')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              MRR potencial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Win Rate</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              metrics.winRate >= 50 ? "text-green-600" : metrics.winRate >= 30 ? "text-amber-600" : "text-red-600"
            )}>
              {metrics.winRate.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.wonCount}W / {metrics.lostCount}L
            </p>
          </CardContent>
        </Card>

        <Card className={cn(metrics.staleLeads > 0 && "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={cn("h-4 w-4", metrics.staleLeads > 0 ? "text-amber-500" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">Atencion</span>
            </div>
            <p className={cn("text-2xl font-bold", metrics.staleLeads > 0 && "text-amber-600")}>{metrics.staleLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">
              sin actividad 7d+
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Conversion Funnel</span>
          </div>
          <div className="flex items-center gap-2">
            {STAGE_ORDER.map((stage, idx) => {
              const count = getCountForStage(stage);
              const isLeadStage = LEAD_STAGES.includes(stage as any);
              const mrr = getMrrForStage(stage);

              return (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex-1 text-center">
                    <div className={cn(
                      "text-2xl font-bold",
                      stage === 'CERRADO_GANADO' && "text-emerald-600",
                      stage === 'CERRADO_PERDIDO' && "text-red-500"
                    )}>
                      {count}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate px-1">
                      {STAGE_LABELS[stage]}
                    </div>
                    {mrr > 0 && (
                      <div className="text-[10px] font-medium text-emerald-600">
                        ${mrr.toLocaleString('en-US')}
                      </div>
                    )}
                  </div>
                  {idx < STAGE_ORDER.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {STAGE_ORDER.map((stage) => {
            const isLeadStage = LEAD_STAGES.includes(stage as any);
            const items = getItemsForStage(stage);
            const count = getCountForStage(stage);
            const mrr = getMrrForStage(stage);

            return (
              <SortableContext
                key={stage}
                items={items}
                strategy={verticalListSortingStrategy}
              >
                <FunnelColumn
                  stage={stage}
                  title={STAGE_LABELS[stage]}
                  leads={isLeadStage ? leadsByStage[stage] || [] : []}
                  count={count}
                  dealsMap={dealsMap}
                  mrr={mrr}
                >
                  {/* Render projects for advanced stages */}
                  {!isLeadStage && (
                    <div className="space-y-2">
                      {projectsByStage[stage as ProjectStage]?.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  )}
                </FunnelColumn>
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem?.type === 'lead' && (
            <LeadCard lead={activeItem.data} isDragging />
          )}
          {activeItem?.type === 'project' && (
            <ProjectCard project={activeItem.data} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      {/* Convert to Project Modal */}
      {pendingLeadForConvert && (
        <ConvertToProjectModal
          open={convertModalOpen}
          onClose={() => {
            setConvertModalOpen(false);
            setPendingLeadForConvert(null);
          }}
          lead={pendingLeadForConvert}
          onSuccess={handleConvertSuccess}
        />
      )}

      {/* Create Deal Modal */}
      {pendingProjectForDeal && (
        <CreateDealModal
          open={dealModalOpen}
          onClose={() => {
            setDealModalOpen(false);
            setPendingProjectForDeal(null);
          }}
          project={pendingProjectForDeal}
          onSuccess={handleDealSuccess}
        />
      )}
    </div>
  );
}
