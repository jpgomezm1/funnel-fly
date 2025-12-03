import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ListTodo,
  Plus,
  MoreVertical,
  Trash2,
  Calendar,
  Loader2,
  Phone,
  Mail,
  FileText,
  CalendarCheck,
  Send,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectChecklist } from '@/hooks/useProjectChecklist';
import { ProjectChecklistItem } from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';

interface NegotiationChecklistCardProps {
  projectId: string;
}

// Quick tasks for negotiation
const QUICK_TASKS = [
  { title: 'Agendar demo', icon: CalendarCheck },
  { title: 'Realizar demo', icon: Phone },
  { title: 'Enviar propuesta', icon: Send },
  { title: 'Follow-up llamada', icon: Phone },
  { title: 'Follow-up email', icon: Mail },
  { title: 'Revisar propuesta con cliente', icon: FileText },
  { title: 'Negociar términos', icon: UserCheck },
];

export function NegotiationChecklistCard({ projectId }: NegotiationChecklistCardProps) {
  const {
    isLoading,
    createItem,
    toggleCompleted,
    deleteItem,
    getNegotiationItems,
    isCreating,
  } = useProjectChecklist({ projectId });

  const [showInput, setShowInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const negotiationItems = getNegotiationItems();
  const completedCount = negotiationItems.filter(i => i.completed_at).length;
  const totalCount = negotiationItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleQuickAdd = async (title: string) => {
    try {
      await createItem({
        title,
        category: 'negotiation',
        is_required: false,
        weight: 1,
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleAddCustomTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await createItem({
        title: newTaskTitle.trim(),
        category: 'negotiation',
        is_required: false,
        weight: 1,
      });
      setNewTaskTitle('');
      setShowInput(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggle = async (item: ProjectChecklistItem) => {
    try {
      await toggleCompleted({
        itemId: item.id,
        completed: !item.completed_at,
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const isOverdue = (item: ProjectChecklistItem) => {
    if (!item.due_date || item.completed_at) return false;
    return new Date(item.due_date) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-orange-500" />
            Siguientes Pasos
          </div>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1.5">
            <Progress value={progressPercentage} className="h-1.5" />
            <p className="text-xs text-muted-foreground text-right">
              {progressPercentage}% completado
            </p>
          </div>
        )}

        {/* Task list */}
        <div className="space-y-2">
          {negotiationItems.length === 0 ? (
            <div className="text-center py-4">
              <ListTodo className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Sin tareas pendientes
              </p>
            </div>
          ) : (
            negotiationItems
              .sort((a, b) => {
                // Completed items at the bottom
                if (a.completed_at && !b.completed_at) return 1;
                if (!a.completed_at && b.completed_at) return -1;
                // Then by order_index
                return a.order_index - b.order_index;
              })
              .map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border transition-colors group',
                    item.completed_at
                      ? 'bg-muted/30 border-muted'
                      : isOverdue(item)
                      ? 'bg-red-50 border-red-200'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <Checkbox
                    checked={!!item.completed_at}
                    onCheckedChange={() => handleToggle(item)}
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm',
                        item.completed_at && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.title}
                    </p>
                    {item.due_date && !item.completed_at && (
                      <p
                        className={cn(
                          'text-xs flex items-center gap-1 mt-0.5',
                          isOverdue(item) ? 'text-red-600' : 'text-muted-foreground'
                        )}
                      >
                        {isOverdue(item) && <AlertCircle className="h-3 w-3" />}
                        <Calendar className="h-3 w-3" />
                        {formatDateToBogota(item.due_date, 'dd/MM')}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
          )}
        </div>

        {/* Add custom task input */}
        {showInput && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nueva tarea..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustomTask();
                if (e.key === 'Escape') {
                  setShowInput(false);
                  setNewTaskTitle('');
                }
              }}
              autoFocus
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddCustomTask}
              disabled={isCreating || !newTaskTitle.trim()}
              className="h-8"
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Agregar'}
            </Button>
          </div>
        )}

        {/* Quick add buttons */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Agregar tarea rapida:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TASKS.map((task) => {
              const TaskIcon = task.icon;
              // Check if this task already exists and is not completed
              const exists = negotiationItems.some(
                i => i.title === task.title && !i.completed_at
              );

              return (
                <Button
                  key={task.title}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-xs gap-1.5",
                    exists && "opacity-50"
                  )}
                  onClick={() => handleQuickAdd(task.title)}
                  disabled={isCreating || exists}
                >
                  <TaskIcon className="h-3 w-3" />
                  {task.title}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowInput(true)}
            >
              <Plus className="h-3 w-3" />
              Personalizada
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
