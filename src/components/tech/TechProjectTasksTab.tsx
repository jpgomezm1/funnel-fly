import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Loader2,
  Calendar,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import {
  TaskStatus,
  TaskPriority,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_ORDER,
  TECH_TEAM_MEMBERS,
  TechTeamMemberId,
  ProjectTask,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';

const STATUS_ICONS: Record<TaskStatus, React.ElementType> = {
  BACKLOG: Circle,
  TODO: Circle,
  IN_PROGRESS: PlayCircle,
  IN_REVIEW: PauseCircle,
  DONE: CheckCircle2,
  BLOCKED: XCircle,
};

interface TechProjectTasksTabProps {
  projectId: string;
}

export function TechProjectTasksTab({ projectId }: TechProjectTasksTabProps) {
  const {
    tasks,
    tasksByStatus,
    isLoading,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
    isCreating,
  } = useProjectTasks(projectId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'BACKLOG' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assigned_to: '' as TechTeamMemberId | '',
    due_date: '',
    estimated_hours: '',
    tags: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      assigned_to: '',
      due_date: '',
      estimated_hours: '',
      tags: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingTask(null);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (task: ProjectTask) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours?.toString() || '',
      tags: task.tags?.join(', ') || '',
    });
    setEditingTask(task);
    setCreateModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'El título es requerido', variant: 'destructive' });
      return;
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to || undefined,
        due_date: formData.due_date || undefined,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      };

      if (editingTask) {
        await updateTask({ taskId: editingTask.id, updates: taskData });
        toast({ title: 'Tarea actualizada', description: 'La tarea ha sido actualizada correctamente' });
      } else {
        await createTask({ ...taskData, project_id: projectId });
        toast({ title: 'Tarea creada', description: 'La tarea ha sido creada correctamente' });
      }

      setCreateModalOpen(false);
      resetForm();
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la tarea', variant: 'destructive' });
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      await deleteTask(taskId);
      toast({ title: 'Tarea eliminada', description: 'La tarea ha sido eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la tarea', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateStatus({ taskId, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {TASK_STATUS_ORDER.map((status) => (
          <Card key={status} className="min-h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Tareas del Proyecto</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tareas en total
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
        {TASK_STATUS_ORDER.map((status) => {
          const statusTasks = tasksByStatus[status] || [];
          const StatusIcon = STATUS_ICONS[status];

          return (
            <Card key={status} className="min-h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      status === 'DONE' && "text-emerald-600",
                      status === 'IN_PROGRESS' && "text-amber-600",
                      status === 'BLOCKED' && "text-red-600",
                      status === 'IN_REVIEW' && "text-purple-600"
                    )} />
                    {TASK_STATUS_LABELS[status]}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {statusTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {statusTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={cn(
                      "p-3 cursor-pointer hover:shadow-md transition-shadow",
                      task.priority === 'URGENT' && "border-l-4 border-l-red-500",
                      task.priority === 'HIGH' && "border-l-4 border-l-amber-500"
                    )}
                  >
                    <div className="space-y-2">
                      {/* Title and menu */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(task)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(task.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Priority */}
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", TASK_PRIORITY_COLORS[task.priority])}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>

                      {/* Meta info */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                        {task.assigned_to && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {TECH_TEAM_MEMBERS.find(m => m.id === task.assigned_to)?.name || task.assigned_to}
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </div>

                      {/* Quick status change */}
                      <Select
                        value={task.status}
                        onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {TASK_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}

                {statusTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Sin tareas
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Modifica los detalles de la tarea' : 'Crea una nueva tarea para el proyecto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título de la tarea"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción detallada de la tarea"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asignado a</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(v) => setFormData({ ...formData, assigned_to: v as TechTeamMemberId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_TEAM_MEMBERS.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha límite</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Horas estimadas</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separados por coma)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="frontend, bug, feature"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
