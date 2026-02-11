import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TodoCard } from './TodoCard';
import { TodoWithRelations, TodoStatus, TODO_STATUS_LABELS } from '@/types/database';
import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoKanbanBoardProps {
  todosByStatus: Record<TodoStatus, TodoWithRelations[]>;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
  onTodoClick: (todo: TodoWithRelations) => void;
}

const KANBAN_COLUMNS: { status: TodoStatus; icon: React.ElementType; color: string }[] = [
  { status: 'pending', icon: Clock, color: 'text-slate-600' },
  { status: 'in_progress', icon: PlayCircle, color: 'text-amber-600' },
  { status: 'completed', icon: CheckCircle2, color: 'text-emerald-600' },
];

export function TodoKanbanBoard({ todosByStatus, onStatusChange, onDelete, onTodoClick }: TodoKanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {KANBAN_COLUMNS.map(({ status, icon: Icon, color }) => {
        const todos = todosByStatus[status] || [];

        return (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Icon className={cn("h-4 w-4", color)} />
              <h3 className="text-sm font-semibold">{TODO_STATUS_LABELS[status]}</h3>
              <Badge variant="secondary" className="text-xs ml-auto">
                {todos.length}
              </Badge>
            </div>

            <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
              {todos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Sin tareas
                </p>
              ) : (
                todos.map(todo => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onClick={onTodoClick}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
