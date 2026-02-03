import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Rocket,
  Search,
  Filter,
  Plus,
  Building2,
  FileText,
  ListTodo,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
  ArrowRight,
  MoreVertical,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePhase0Projects } from '@/hooks/usePhase0Projects';
import { useAnalyzePhase0Link } from '@/hooks/useAnalyzePhase0Link';
import { supabase } from '@/integrations/supabase/client';
import {
  Phase0ProjectStatus,
  PHASE0_PROJECT_STATUS_LABELS,
  PHASE0_PROJECT_STATUS_COLORS,
} from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const STATUS_ICONS: Record<Phase0ProjectStatus, React.ElementType> = {
  active: CheckCircle2,
  on_hold: Pause,
  converted: ArrowRight,
  cancelled: XCircle,
};

export default function TechPhase0Projects() {
  const {
    projects,
    stats,
    isLoading,
    createProject,
    updateStatus,
    deleteProject,
    isCreating,
  } = usePhase0Projects();

  const { analyzeLink, isAnalyzing } = useAnalyzePhase0Link();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Phase0ProjectStatus | 'ALL'>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [phase0Link, setPhase0Link] = useState('');
  const [formData, setFormData] = useState({
    client_name: '',
    project_name: '',
    description: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      client_name: '',
      project_name: '',
      description: '',
      notes: '',
    });
    setPhase0Link('');
  };

  const handleAnalyzeLink = async () => {
    if (!phase0Link.trim()) {
      toast({ title: 'Error', description: 'Ingresa un link de Fase 0', variant: 'destructive' });
      return;
    }

    try {
      const analysis = await analyzeLink(phase0Link.trim());
      if (analysis) {
        setFormData({
          client_name: analysis.client_name || formData.client_name,
          project_name: analysis.project_name || formData.project_name,
          description: analysis.description || formData.description,
          notes: formData.notes,
        });
        toast({ title: 'Analisis completado', description: 'Los campos han sido auto-completados con AI' });
      } else {
        toast({ title: 'Error', description: 'No se pudo analizar el link', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error analyzing link:', error);
      toast({ title: 'Error', description: 'Error al analizar el link', variant: 'destructive' });
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.client_name.toLowerCase().includes(search.toLowerCase()) ||
      project.project_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!formData.client_name.trim() || !formData.project_name.trim()) {
      toast({ title: 'Error', description: 'Cliente y nombre de proyecto son requeridos', variant: 'destructive' });
      return;
    }

    try {
      const newProject = await createProject({
        client_name: formData.client_name.trim(),
        project_name: formData.project_name.trim(),
        description: formData.description.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        phase0_link: phase0Link.trim() || undefined,
      });

      // If we have a link, save it as the first document
      if (phase0Link.trim() && newProject?.id) {
        try {
          await supabase
            .from('phase0_documents')
            .insert({
              phase0_project_id: newProject.id,
              name: 'Propuesta Fase 0',
              document_type: 'link',
              url: phase0Link.trim(),
              notes: 'Link de propuesta Fase 0 - agregado automáticamente al crear el proyecto',
              uploaded_by: 'Sistema',
            });
        } catch (docError) {
          console.error('Error creating document:', docError);
          // Don't fail the whole operation if document creation fails
        }
      }

      toast({ title: 'Proyecto creado', description: 'El proyecto Fase 0 ha sido creado' });
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({ title: 'Error', description: 'No se pudo crear el proyecto', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (projectId: string, status: Phase0ProjectStatus) => {
    try {
      await updateStatus({ projectId, status });
      toast({ title: 'Estado actualizado', description: 'El estado del proyecto ha sido actualizado' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán todos los documentos y tareas asociados.')) return;

    try {
      await deleteProject(projectId);
      toast({ title: 'Proyecto eliminado', description: 'El proyecto ha sido eliminado' });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el proyecto', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
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
            <Rocket className="h-6 w-6 text-primary" />
            Fase 0 - Pre-deals
          </h1>
          <p className="text-muted-foreground">
            Proyectos en fase de estructuración y negociación
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Activos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Pause className="h-4 w-4" />
              <span className="text-xs font-medium">En Pausa</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.onHold}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <ArrowRight className="h-4 w-4" />
              <span className="text-xs font-medium">Convertidos</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.converted}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Cancelados</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Phase0ProjectStatus | 'ALL')}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="on_hold">En Pausa</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay proyectos</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== 'ALL'
              ? 'No se encontraron proyectos con los filtros aplicados'
              : 'Crea un nuevo proyecto Fase 0 para comenzar'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const StatusIcon = STATUS_ICONS[project.status];

            return (
              <Link key={project.id} to={`/tech/phase0/${project.id}`}>
                <Card className={cn(
                  "hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full",
                  "border-l-4",
                  project.status === 'active' && "border-l-emerald-500",
                  project.status === 'on_hold' && "border-l-amber-500",
                  project.status === 'converted' && "border-l-blue-500",
                  project.status === 'cancelled' && "border-l-red-500"
                )}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{project.project_name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{project.client_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={cn("text-xs", PHASE0_PROJECT_STATUS_COLORS[project.status])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {PHASE0_PROJECT_STATUS_LABELS[project.status]}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); handleStatusChange(project.id, 'active'); }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                              Marcar Activo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); handleStatusChange(project.id, 'on_hold'); }}
                            >
                              <Pause className="h-4 w-4 mr-2 text-amber-600" />
                              En Pausa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); handleStatusChange(project.id, 'converted'); }}
                            >
                              <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                              Convertido
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); handleStatusChange(project.id, 'cancelled'); }}
                            >
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              Cancelado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); handleDelete(project.id); }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-medium">{project.documentsCount}</p>
                        <p className="text-[10px] text-muted-foreground">Documentos</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                          <ListTodo className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-medium">
                          {project.completedTasksCount}/{project.tasksCount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Tareas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={(open) => {
        setCreateModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Proyecto Fase 0</DialogTitle>
            <DialogDescription>
              Crea un nuevo proyecto en fase de estructuración
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Link Fase 0 with AI Analyze */}
            <div className="space-y-2">
              <Label htmlFor="phase0_link" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link Fase 0
              </Label>
              <div className="flex gap-2">
                <Input
                  id="phase0_link"
                  value={phase0Link}
                  onChange={(e) => setPhase0Link(e.target.value)}
                  placeholder="https://fasecero-cliente.netlify.app/"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAnalyzeLink}
                  disabled={isAnalyzing || !phase0Link.trim()}
                  className="shrink-0"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pega el link de la página Fase 0 y usa AI para auto-completar los campos
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  o completar manual
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Nombre del Cliente *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Ej: Empresa ABC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_name">Nombre del Proyecto *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="Ej: Implementación CRM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del proyecto..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                className="min-h-[60px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || isAnalyzing}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Proyecto'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
