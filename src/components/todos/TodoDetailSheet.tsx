import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  User,
  Tag,
  AlertTriangle,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TodoWithRelations,
  TodoStatus,
  Todo,
  TODO_STATUS_LABELS,
  TODO_STATUS_COLORS,
  TODO_PRIORITY_LABELS,
  TODO_PRIORITY_COLORS,
} from '@/types/database';
import { TodoComments } from './TodoComments';
import { TodoSubtasks } from './TodoSubtasks';
import { TodoAttachments } from './TodoAttachments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TodoDetailSheetProps {
  todo: TodoWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onCreateSubtask: (data: { title: string; parent_todo_id: string }) => Promise<void>;
  onEdit: (todo: TodoWithRelations) => void;
  isCreatingSubtask: boolean;
}

export function TodoDetailSheet({
  todo,
  open,
  onOpenChange,
  onStatusChange,
  onCreateSubtask,
  onEdit,
  isCreatingSubtask,
}: TodoDetailSheetProps) {
  if (!todo) return null;

  // Fetch subtasks for this todo
  const { data: subtasks = [] } = useQuery({
    queryKey: ['todo-subtasks', todo.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('todos')
        .select('*')
        .eq('parent_todo_id', todo.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Todo[];
    },
    enabled: !!todo.id,
  });

  const isOverdue = todo.due_date &&
    new Date(todo.due_date) < new Date() &&
    !['completed', 'cancelled'].includes(todo.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="text-left pr-8">{todo.title}</SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(todo)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-3">
            <Select
              value={todo.status}
              onValueChange={(v) => onStatusChange(todo.id, v as TodoStatus)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Badge className={cn("text-xs", TODO_PRIORITY_COLORS[todo.priority])}>
              {TODO_PRIORITY_LABELS[todo.priority]}
            </Badge>
          </div>

          {/* Description */}
          {todo.description && (
            <div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{todo.description}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="space-y-2 text-sm">
            {todo.due_date && (
              <div className={cn("flex items-center gap-2", isOverdue && "text-red-600")}>
                {isOverdue ? <AlertTriangle className="h-4 w-4" /> : <CalendarDays className="h-4 w-4 text-muted-foreground" />}
                <span>Vence: {new Date(todo.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Creada por: {todo.created_by_name || 'Usuario'}</span>
              <span className="text-muted-foreground text-xs">
                ({new Date(todo.created_at).toLocaleDateString('es-CO')})
              </span>
            </div>

            {todo.completed_at && (
              <div className="flex items-center gap-2 text-emerald-600">
                <span>Completada por: {todo.completed_by || 'Usuario'}</span>
                <span className="text-xs">
                  ({new Date(todo.completed_at).toLocaleDateString('es-CO')})
                </span>
              </div>
            )}
          </div>

          {/* Assignees */}
          {todo.assignees && todo.assignees.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Asignados
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {todo.assignees.map(a => (
                  <Badge key={a.id} variant="secondary" className="text-xs">
                    {a.user_display_name || a.user_id}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {todo.labels && todo.labels.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Etiquetas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {todo.labels.map(label => (
                  <Badge
                    key={label.id}
                    className="text-xs"
                    style={{ backgroundColor: label.color + '20', color: label.color }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Subtasks */}
          <TodoSubtasks
            parentTodoId={todo.id}
            subtasks={subtasks}
            onCreateSubtask={onCreateSubtask}
            onStatusChange={onStatusChange}
            isCreating={isCreatingSubtask}
          />

          <Separator />

          {/* Comments */}
          <TodoComments todoId={todo.id} />

          <Separator />

          {/* Attachments */}
          <TodoAttachments todoId={todo.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
