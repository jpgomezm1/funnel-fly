import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Building2,
  Code2,
  GitBranch,
  ListTodo,
  Timer,
  FileKey,
  Rocket,
  Play,
  Package,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Calendar,
  FileText,
  ListChecks,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTechProject } from '@/hooks/useTechProjects';
import {
  ProjectExecutionStage,
  PROJECT_EXECUTION_STAGE_LABELS,
  PROJECT_EXECUTION_STAGE_COLORS,
} from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';

// Tab Components
import { TechProjectTasksTab } from '@/components/tech/TechProjectTasksTab';
import { TechProjectRepositoriesTab } from '@/components/tech/TechProjectRepositoriesTab';
import { TechProjectTimeLogsTab } from '@/components/tech/TechProjectTimeLogsTab';
import { TechProjectEnvTab } from '@/components/tech/TechProjectEnvTab';

// Reuse Sales components for shared functionality
import { ProjectTabExecution } from '@/components/projects/tabs/ProjectTabExecution';
import { ProjectUpdatesCard } from '@/components/projects/ProjectUpdatesCard';

const EXECUTION_STAGE_ICONS: Record<ProjectExecutionStage, React.ElementType> = {
  ONBOARDING: Rocket,
  IN_PROGRESS: Play,
  DELIVERED: Package,
  ACTIVE: CheckCircle2,
  CHURNED: XCircle,
};

export default function TechProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, isLoading, refetch } = useTechProject(projectId);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">Proyecto no encontrado</h2>
        <Link to="/tech/projects">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a proyectos
          </Button>
        </Link>
      </div>
    );
  }

  const stage = (project.execution_stage as ProjectExecutionStage) || 'ONBOARDING';
  const StageIcon = EXECUTION_STAGE_ICONS[stage];
  const progress = project.taskStats.total > 0
    ? Math.round((project.taskStats.completed / project.taskStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/tech/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge className={cn("text-xs", PROJECT_EXECUTION_STAGE_COLORS[stage])}>
              <StageIcon className="h-3 w-3 mr-1" />
              {PROJECT_EXECUTION_STAGE_LABELS[stage]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>{project.client?.company_name || 'Sin cliente'}</span>
            </div>
            {project.deal && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600 font-medium">
                  ${project.deal.mrr_usd.toLocaleString()}/mes
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Descripción del Proyecto</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.taskStats.total}</p>
                <p className="text-xs text-muted-foreground">Tareas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.taskStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Timer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.totalHours}h</p>
                <p className="text-xs text-muted-foreground">Registradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.repositories?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Repositorios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={project.taskStats.blocked > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                project.taskStats.blocked > 0 ? "bg-red-100" : "bg-slate-100"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  project.taskStats.blocked > 0 ? "text-red-600" : "text-slate-400"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.taskStats.blocked}</p>
                <p className="text-xs text-muted-foreground">Bloqueadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progreso del Proyecto</span>
            <span className={cn(
              "text-sm font-bold",
              progress >= 80 ? "text-emerald-600" :
              progress >= 50 ? "text-blue-600" :
              "text-amber-600"
            )}>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{project.taskStats.completed} de {project.taskStats.total} tareas completadas</span>
            <div className="flex items-center gap-4">
              {project.taskStats.inProgress > 0 && (
                <span className="text-amber-600">{project.taskStats.inProgress} en progreso</span>
              )}
              {project.estimated_delivery_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Entrega: {formatDateToBogota(project.estimated_delivery_date, 'dd MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1.5">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Tareas</span>
          </TabsTrigger>
          <TabsTrigger value="repos" className="flex items-center gap-1.5">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Repos</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Tiempo</span>
          </TabsTrigger>
          <TabsTrigger value="env" className="flex items-center gap-1.5">
            <FileKey className="h-4 w-4" />
            <span className="hidden sm:inline">Variables</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Execution info + Updates */}
        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Execution Stage and Key Dates - reusing Sales component */}
            <ProjectTabExecution
              project={{
                id: project.id,
                execution_stage: project.execution_stage,
                execution_stage_entered_at: project.execution_stage_entered_at,
                kickoff_date: project.kickoff_date,
                estimated_delivery_date: project.estimated_delivery_date,
                actual_delivery_date: project.actual_delivery_date,
                stage: project.stage,
              }}
              onRefetch={refetch}
            />

            {/* Engineering Updates Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Updates del Equipo
              </h3>
              <ProjectUpdatesCard projectId={projectId!} />
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <TechProjectTasksTab projectId={projectId!} />
        </TabsContent>

        {/* Repositories Tab */}
        <TabsContent value="repos" className="mt-6">
          <TechProjectRepositoriesTab projectId={projectId!} />
        </TabsContent>

        {/* Time Logs Tab */}
        <TabsContent value="time" className="mt-6">
          <TechProjectTimeLogsTab projectId={projectId!} />
        </TabsContent>

        {/* Environment Variables Tab */}
        <TabsContent value="env" className="mt-6">
          <TechProjectEnvTab projectId={projectId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
