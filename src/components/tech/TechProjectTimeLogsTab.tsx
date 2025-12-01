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
  Timer,
  User,
  Calendar,
  Loader2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectTimeLogs } from '@/hooks/useProjectTimeLogs';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import {
  TECH_TEAM_MEMBERS,
  TechTeamMemberId,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface TechProjectTimeLogsTabProps {
  projectId: string;
}

interface TimeLogFormData {
  logged_by: string;
  logged_date: string;
  hours: string;
  task_id: string;
  description: string;
}

export function TechProjectTimeLogsTab({ projectId }: TechProjectTimeLogsTabProps) {
  const {
    timeLogs,
    totalHours,
    hoursByMember,
    isLoading,
    createTimeLog,
    updateTimeLog,
    deleteTimeLog,
    isCreating,
  } = useProjectTimeLogs(projectId);

  const { tasks } = useProjectTasks(projectId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [formData, setFormData] = useState<TimeLogFormData>({
    logged_by: '',
    logged_date: new Date().toISOString().split('T')[0],
    hours: '',
    task_id: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      logged_by: '',
      logged_date: new Date().toISOString().split('T')[0],
      hours: '',
      task_id: '',
      description: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingLog(null);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (log: any) => {
    setFormData({
      logged_by: log.logged_by,
      logged_date: log.logged_date,
      hours: log.hours.toString(),
      task_id: log.task_id || '',
      description: log.description || '',
    });
    setEditingLog(log);
    setCreateModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.logged_by || !formData.hours) {
      toast({ title: 'Error', description: 'Miembro y horas son requeridos', variant: 'destructive' });
      return;
    }

    try {
      const logData = {
        logged_by: formData.logged_by,
        logged_date: formData.logged_date,
        hours: parseFloat(formData.hours),
        task_id: formData.task_id || undefined,
        description: formData.description.trim() || undefined,
      };

      if (editingLog) {
        await updateTimeLog({ logId: editingLog.id, updates: logData });
        toast({ title: 'Registro actualizado', description: 'El registro de tiempo ha sido actualizado' });
      } else {
        await createTimeLog({ ...logData, project_id: projectId });
        toast({ title: 'Registro creado', description: 'El registro de tiempo ha sido agregado' });
      }

      setCreateModalOpen(false);
      resetForm();
      setEditingLog(null);
    } catch (error) {
      console.error('Error saving time log:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el registro', variant: 'destructive' });
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await deleteTimeLog(logId);
      toast({ title: 'Registro eliminado', description: 'El registro de tiempo ha sido eliminado' });
    } catch (error) {
      console.error('Error deleting time log:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el registro', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Registro de Tiempo</h2>
          <p className="text-sm text-muted-foreground">
            {totalHours} horas totales registradas
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Tiempo
        </Button>
      </div>

      {/* Stats by member */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {TECH_TEAM_MEMBERS.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                  member.color
                )}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-2xl font-bold">{hoursByMember[member.id] || 0}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time Logs List */}
      {timeLogs.length === 0 ? (
        <Card className="p-12 text-center">
          <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin registros de tiempo</h3>
          <p className="text-muted-foreground mb-4">
            Registra el tiempo dedicado al proyecto
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Tiempo
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historial de Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {timeLogs.map((log) => {
                const member = TECH_TEAM_MEMBERS.find(m => m.id === log.logged_by);
                const task = log.project_tasks;

                return (
                  <div key={log.id} className="flex items-center gap-4 py-3">
                    {/* Member avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0",
                      member?.color || 'bg-slate-500'
                    )}>
                      {member?.name.split(' ').map(n => n[0]).join('') || log.logged_by?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member?.name || log.logged_by || 'Unknown'}</span>
                        <Badge variant="secondary" className="text-xs">
                          {log.hours}h
                        </Badge>
                      </div>
                      {log.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {log.description}
                        </p>
                      )}
                      {task && (
                        <p className="text-xs text-blue-600">
                          Tarea: {task.title}
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                      <Calendar className="h-4 w-4" />
                      {new Date(log.logged_date).toLocaleDateString('es-CO', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(log)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(log.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLog ? 'Editar Registro' : 'Registrar Tiempo'}</DialogTitle>
            <DialogDescription>
              {editingLog ? 'Modifica el registro de tiempo' : 'Registra el tiempo dedicado al proyecto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Miembro del Equipo *</Label>
                <Select
                  value={formData.logged_by}
                  onValueChange={(v) => setFormData({ ...formData, logged_by: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
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
                <Label htmlFor="hours">Horas *</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logged_date">Fecha</Label>
              <Input
                id="logged_date"
                type="date"
                value={formData.logged_date}
                onChange={(e) => setFormData({ ...formData, logged_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tarea (opcional)</Label>
              <Select
                value={formData.task_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, task_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin tarea asociada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tarea asociada</SelectItem>
                  {tasks.filter(t => !t.parent_task_id).map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del trabajo realizado"
                className="min-h-[80px]"
              />
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
