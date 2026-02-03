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
  User,
  Calendar,
  Circle,
  PlayCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePhase0Tasks } from '@/hooks/usePhase0Tasks';
import {
  Phase0Task,
  Phase0TaskStatus,
  Phase0TaskPriority,
  PHASE0_TASK_STATUS_LABELS,
  PHASE0_TASK_STATUS_COLORS,
  PHASE0_TASK_PRIORITY_LABELS,
  PHASE0_TASK_PRIORITY_COLORS,
  PHASE0_TASK_STATUS_ORDER,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';

const STATUS_ICONS: Record<Phase0TaskStatus, React.ElementType> = {
  pending: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
};

interface Phase0TasksTabProps {
  projectId: string;
}

export function Phase0TasksTab({ projectId }: Phase0TasksTabProps) {
  const {
    tasks,
    tasksByStatus,
    isLoading,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
    isCreating,
  } = usePhase0Tasks(projectId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Phase0Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as Phase0TaskStatus,
    priority: 'medium' as Phase0TaskPriority,
    assigned_to: '',
    due_date: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assigned_to: '',
      due_date: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingTask(null);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (task: Phase0Task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
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
      };

      if (editingTask) {
        await updateTask({ taskId: editingTask.id, updates: taskData });
        toast({ title: 'Tarea actualizada', description: 'La tarea ha sido actualizada correctamente' });
      } else {
        await createTask({ ...taskData, phase0_project_id: projectId });
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

  const handleStatusChange = async (taskId: string, newStatus: Phase0TaskStatus) => {
    try {
      await updateStatus({ taskId, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Tareas</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Kanban Board - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PHASE0_TASK_STATUS_ORDER.map((status) => {
          const statusTasks = tasksByStatus[status] || [];
          const StatusIcon = STATUS_ICONS[status];

          return (
            <Card key={status} className="min-h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      status === 'completed' && "text-emerald-600",
                      status === 'in_progress' && "text-amber-600",
                      status === 'pending' && "text-slate-400"
                    )} />
                    {PHASE0_TASK_STATUS_LABELS[status]}
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
                      task.priority === 'high' && "border-l-4 border-l-red-500"
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

                      {/* Description preview */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Priority */}
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", PHASE0_TASK_PRIORITY_COLORS[task.priority])}
                      >
                        {PHASE0_TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>

                      {/* Meta info */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                        {task.assigned_to && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigned_to}
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
                        onValueChange={(v) => handleStatusChange(task.id, v as Phase0TaskStatus)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHASE0_TASK_STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {PHASE0_TASK_STATUS_LABELS[s]}
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
                  onValueChange={(v) => setFormData({ ...formData, status: v as Phase0TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASE0_TASK_STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{PHASE0_TASK_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as Phase0TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Asignado a</Label>
                <Input
                  id="assigned_to"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  placeholder="Nombre del responsable"
                />
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
