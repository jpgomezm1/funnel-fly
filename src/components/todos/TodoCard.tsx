import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageSquare,
  Paperclip,
  ListChecks,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TodoWithRelations,
  TodoStatus,
  TODO_STATUS_LABELS,
  TODO_STATUS_COLORS,
  TODO_PRIORITY_LABELS,
  TODO_PRIORITY_COLORS,
} from '@/types/database';

interface TodoCardProps {
  todo: TodoWithRelations;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
  onClick: (todo: TodoWithRelations) => void;
  compact?: boolean;
}

export function TodoCard({ todo, onStatusChange, onDelete, onClick, compact }: TodoCardProps) {
  const isOverdue = todo.due_date &&
    new Date(todo.due_date) < new Date() &&
    !['completed', 'cancelled'].includes(todo.status);

  const subtasksDone = todo.subtasks?.filter(s => s.status === 'completed').length || 0;
  const subtasksTotal = todo.subtasks?.length || 0;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-sm cursor-pointer",
        todo.status === 'completed' && "opacity-75",
        todo.status === 'cancelled' && "opacity-60",
        isOverdue && "border-red-300"
      )}
      onClick={() => onClick(todo)}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start gap-3">
          {/* Status checkbox */}
          <button
            className="mt-0.5 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (todo.status === 'completed') {
                onStatusChange(todo.id, 'pending');
              } else {
                onStatusChange(todo.id, 'completed');
              }
            }}
          >
            {todo.status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-emerald-500 transition-colors" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-sm",
                  todo.status === 'completed' && "line-through text-muted-foreground"
                )}>
                  {todo.title}
                </h3>

                {!compact && todo.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {todo.description}
                  </p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge className={cn("text-[10px] px-1.5 py-0", TODO_PRIORITY_COLORS[todo.priority])}>
                    {TODO_PRIORITY_LABELS[todo.priority]}
                  </Badge>

                  {!compact && (
                    <Badge className={cn("text-[10px] px-1.5 py-0", TODO_STATUS_COLORS[todo.status])}>
                      {TODO_STATUS_LABELS[todo.status]}
                    </Badge>
                  )}

                  {todo.labels?.map(label => (
                    <Badge
                      key={label.id}
                      className="text-[10px] px-1.5 py-0"
                      style={{ backgroundColor: label.color + '20', color: label.color }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  {todo.due_date && (
                    <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                      {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
                      {new Date(todo.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                  )}

                  {subtasksTotal > 0 && (
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      {subtasksDone}/{subtasksTotal}
                    </span>
                  )}

                  {(todo.comments_count || 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {todo.comments_count}
                    </span>
                  )}

                  {(todo.attachments_count || 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {todo.attachments_count}
                    </span>
                  )}

                  {/* Assignee avatars */}
                  {todo.assignees && todo.assignees.length > 0 && (
                    <div className="flex -space-x-1.5 ml-auto">
                      {todo.assignees.slice(0, 3).map(a => (
                        <div
                          key={a.id}
                          className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center border border-white"
                          title={a.user_display_name || a.user_id}
                        >
                          <span className="text-[8px] font-bold text-white">
                            {(a.user_display_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                      ))}
                      {todo.assignees.length > 3 && (
                        <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center border border-white">
                          <span className="text-[8px] font-bold text-gray-600">+{todo.assignees.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onStatusChange(todo.id, 'pending')}>
                    <Clock className="h-4 w-4 mr-2 text-slate-600" />
                    Pendiente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(todo.id, 'in_progress')}>
                    <PlayCircle className="h-4 w-4 mr-2 text-amber-600" />
                    En Progreso
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(todo.id, 'completed')}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                    Completado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(todo.id, 'cancelled')}>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Cancelado
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(todo.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
