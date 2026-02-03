import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Building2,
  Rocket,
  FileText,
  ListTodo,
  CheckCircle2,
  Pause,
  ArrowRight,
  XCircle,
  Calendar,
  Loader2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePhase0Project, usePhase0Projects } from '@/hooks/usePhase0Projects';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { usePhase0Documents } from '@/hooks/usePhase0Documents';
import { usePhase0Tasks } from '@/hooks/usePhase0Tasks';
import {
  Phase0ProjectStatus,
  PHASE0_PROJECT_STATUS_LABELS,
  PHASE0_PROJECT_STATUS_COLORS,
} from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// Tab Components
import { Phase0DocumentsTab } from '@/components/tech/Phase0DocumentsTab';
import { Phase0TasksTab } from '@/components/tech/Phase0TasksTab';

const STATUS_ICONS: Record<Phase0ProjectStatus, React.ElementType> = {
  active: CheckCircle2,
  on_hold: Pause,
  converted: ArrowRight,
  cancelled: XCircle,
};

export default function TechPhase0ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, isLoading, refetch } = usePhase0Project(projectId);
  const { updateStatus, updateProject } = usePhase0Projects();
  const { documents } = usePhase0Documents({ projectId });
  const { tasks } = usePhase0Tasks(projectId);
  const { salesMembers, getMemberName, getMemberColorHex } = useTeamMembers();
  const [activeTab, setActiveTab] = useState('documents');

  const handleStatusChange = async (status: Phase0ProjectStatus) => {
    if (!projectId) return;

    try {
      await updateStatus({ projectId, status });
      toast({ title: 'Estado actualizado', description: 'El estado del proyecto ha sido actualizado' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  const handleCommercialChange = async (commercial: string) => {
    if (!projectId) return;

    try {
      await updateProject({
        projectId,
        updates: { assigned_commercial: commercial || undefined }
      });
      refetch();
      toast({ title: 'Comercial actualizado', description: 'El comercial encargado ha sido actualizado' });
    } catch (error) {
      console.error('Error updating commercial:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el comercial', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">Proyecto no encontrado</h2>
        <Link to="/tech/phase0">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a proyectos
          </Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[project.status];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/tech/phase0">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{project.project_name}</h1>
            <Badge className={cn("text-xs", PHASE0_PROJECT_STATUS_COLORS[project.status])}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {PHASE0_PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>{project.client_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Creado {new Date(project.created_at).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            {project.assigned_commercial && (
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getMemberColorHex(project.assigned_commercial) }}
                />
                <User className="h-4 w-4" />
                <span>{getMemberName(project.assigned_commercial)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Commercial Selector */}
        <Select
          value={project.assigned_commercial || '__none__'}
          onValueChange={(value) => handleCommercialChange(value === '__none__' ? '' : value)}
        >
          <SelectTrigger className="w-[160px]">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Comercial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="text-muted-foreground">Sin asignar</span>
            </SelectItem>
            {salesMembers.map((member) => (
              <SelectItem key={member.slug} value={member.slug}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: member.color_hex }}
                  />
                  {member.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Selector */}
        <Select value={project.status} onValueChange={(v) => handleStatusChange(v as Phase0ProjectStatus)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Activo
              </div>
            </SelectItem>
            <SelectItem value="on_hold">
              <div className="flex items-center gap-2">
                <Pause className="h-4 w-4 text-amber-600" />
                En Pausa
              </div>
            </SelectItem>
            <SelectItem value="converted">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                Convertido
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Cancelado
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Descripción</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-xs text-muted-foreground">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
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
                <p className="text-2xl font-bold">{completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length - completedTasks}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {project.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Notas</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {project.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Documentos
            <Badge variant="secondary" className="ml-1 text-xs">
              {documents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1.5">
            <ListTodo className="h-4 w-4" />
            Tareas
            <Badge variant="secondary" className="ml-1 text-xs">
              {tasks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <Phase0DocumentsTab projectId={projectId!} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Phase0TasksTab projectId={projectId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
