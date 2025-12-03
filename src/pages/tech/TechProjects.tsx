import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Code2,
  Search,
  Filter,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  ListTodo,
  Timer,
  Rocket,
  Play,
  Package,
  XCircle,
  ExternalLink,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTechProjects } from '@/hooks/useTechProjects';
import {
  ProjectExecutionStage,
  PROJECT_EXECUTION_STAGE_LABELS,
  PROJECT_EXECUTION_STAGE_COLORS,
} from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

const EXECUTION_STAGE_ICONS: Record<ProjectExecutionStage, React.ElementType> = {
  ONBOARDING: Rocket,
  IN_PROGRESS: Play,
  DELIVERED: Package,
  ACTIVE: CheckCircle2,
  CHURNED: XCircle,
};

type ViewMode = 'grid' | 'list';

export default function TechProjects() {
  const { projects, stats, isLoading } = useTechProjects();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<ProjectExecutionStage | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.client?.company_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStage =
      stageFilter === 'ALL' ||
      (project.execution_stage || 'ONBOARDING') === stageFilter;

    return matchesSearch && matchesStage;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Tech Projects
          </h1>
          <p className="text-muted-foreground">
            Gestión técnica de proyectos ganados
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Rocket className="h-4 w-4" />
              <span className="text-xs font-medium">Onboarding</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.onboarding}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Play className="h-4 w-4" />
              <span className="text-xs font-medium">En Progreso</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium">Entregados</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{stats.delivered}</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Activos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-xs font-medium">Horas Totales</span>
            </div>
            <p className="text-2xl font-bold text-slate-700">{stats.totalHours}h</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Bloqueados</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.blockedTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por proyecto o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as ProjectExecutionStage | 'ALL')}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="ONBOARDING">Onboarding</SelectItem>
            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
            <SelectItem value="DELIVERED">Entregado</SelectItem>
            <SelectItem value="ACTIVE">Activo</SelectItem>
            <SelectItem value="CHURNED">Churned</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay proyectos</h3>
          <p className="text-muted-foreground">
            {search || stageFilter !== 'ALL'
              ? 'No se encontraron proyectos con los filtros aplicados'
              : 'Los proyectos ganados aparecerán aquí'}
          </p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const stage = (project.execution_stage as ProjectExecutionStage) || 'ONBOARDING';
            const StageIcon = EXECUTION_STAGE_ICONS[stage];

            return (
              <Link key={project.id} to={`/tech/projects/${project.id}`}>
                <Card className={cn(
                  "hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full",
                  "border-l-4",
                  stage === 'ONBOARDING' && "border-l-blue-500",
                  stage === 'IN_PROGRESS' && "border-l-amber-500",
                  stage === 'DELIVERED' && "border-l-purple-500",
                  stage === 'ACTIVE' && "border-l-emerald-500",
                  stage === 'CHURNED' && "border-l-red-500"
                )}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{project.client?.company_name || 'Sin cliente'}</span>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", PROJECT_EXECUTION_STAGE_COLORS[stage])}>
                        <StageIcon className="h-3 w-3 mr-1" />
                        {PROJECT_EXECUTION_STAGE_LABELS[stage]}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <ListTodo className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-medium">{project.taskStats.total}</p>
                        <p className="text-[10px] text-muted-foreground">Tareas</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <Timer className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-medium">{project.totalHours}h</p>
                        <p className="text-[10px] text-muted-foreground">Horas</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <GitBranch className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-medium">{project.repositories?.length || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Repos</p>
                      </div>
                    </div>

                    {/* Blocked warning */}
                    {project.taskStats.blocked > 0 && (
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-red-50 text-red-600 rounded text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{project.taskStats.blocked} tareas bloqueadas</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredProjects.map((project) => {
              const stage = (project.execution_stage as ProjectExecutionStage) || 'ONBOARDING';
              const StageIcon = EXECUTION_STAGE_ICONS[stage];

              return (
                <Link
                  key={project.id}
                  to={`/tech/projects/${project.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    stage === 'ONBOARDING' && "bg-blue-100 text-blue-600",
                    stage === 'IN_PROGRESS' && "bg-amber-100 text-amber-600",
                    stage === 'DELIVERED' && "bg-purple-100 text-purple-600",
                    stage === 'ACTIVE' && "bg-emerald-100 text-emerald-600",
                    stage === 'CHURNED' && "bg-red-100 text-red-600"
                  )}>
                    <StageIcon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.client?.company_name || 'Sin cliente'}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ListTodo className="h-4 w-4" />
                        <span>{project.taskStats.total}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>{project.totalHours}h</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GitBranch className="h-4 w-4" />
                        <span>{project.repositories?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {project.taskStats.blocked > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {project.taskStats.blocked}
                    </Badge>
                  )}

                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
