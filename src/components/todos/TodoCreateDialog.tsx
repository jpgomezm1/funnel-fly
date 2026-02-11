import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, X } from 'lucide-react';
import { TodoPriority, TodoLabel, TodoWithRelations } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UserRoleItem {
  user_id: string;
  display_name: string;
  role: string;
}

interface TodoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    priority: TodoPriority;
    due_date?: string;
    assignee_ids: string[];
    assignee_names: Record<string, string>;
    label_ids: string[];
  }) => Promise<void>;
  labels: TodoLabel[];
  isSubmitting: boolean;
  editTodo?: TodoWithRelations | null;
}

export function TodoCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  labels,
  isSubmitting,
  editTodo,
}: TodoCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  // Fetch team members (excluding socios)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-users-for-todos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('user_id, display_name, role')
        .neq('role', 'socio');

      if (error) throw error;
      return data as UserRoleItem[];
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editTodo) {
      setTitle(editTodo.title);
      setDescription(editTodo.description || '');
      setPriority(editTodo.priority);
      setDueDate(editTodo.due_date ? editTodo.due_date.split('T')[0] : '');
      setSelectedAssignees(editTodo.assignees?.map(a => a.user_id) || []);
      setSelectedLabels(editTodo.labels?.map(l => l.id) || []);
    } else {
      resetForm();
    }
  }, [editTodo, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setSelectedAssignees([]);
    setSelectedLabels([]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const assigneeNames: Record<string, string> = {};
    selectedAssignees.forEach(uid => {
      const member = teamMembers.find(m => m.user_id === uid);
      if (member) assigneeNames[uid] = member.display_name;
    });

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : undefined,
      assignee_ids: selectedAssignees,
      assignee_names: assigneeNames,
      label_ids: selectedLabels,
    });

    resetForm();
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTodo ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          <DialogDescription>
            {editTodo ? 'Modifica los detalles de la tarea' : 'Crea una nueva tarea para ti o tu equipo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="todo-title">Titulo *</Label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Preparar presentacion para cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TodoPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="todo-due">Fecha limite</Label>
              <Input
                id="todo-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="todo-desc">Descripcion</Label>
            <Textarea
              id="todo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los detalles de la tarea..."
              className="min-h-[80px]"
            />
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Asignar a</Label>
            <div className="flex flex-wrap gap-1.5">
              {teamMembers.map(member => (
                <Badge
                  key={member.user_id}
                  variant={selectedAssignees.includes(member.user_id) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleAssignee(member.user_id)}
                >
                  {member.display_name}
                  {selectedAssignees.includes(member.user_id) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map(label => (
                <Badge
                  key={label.id}
                  variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  style={selectedLabels.includes(label.id) ? {
                    backgroundColor: label.color,
                    borderColor: label.color,
                    color: 'white',
                  } : {
                    borderColor: label.color,
                    color: label.color,
                  }}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.name}
                  {selectedLabels.includes(label.id) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editTodo ? 'Guardando...' : 'Creando...'}
              </>
            ) : (
              editTodo ? 'Guardar Cambios' : 'Crear Tarea'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
