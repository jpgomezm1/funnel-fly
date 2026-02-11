import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Plus, Loader2, ListChecks } from 'lucide-react';
import { Todo, TodoStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface TodoSubtasksProps {
  parentTodoId: string;
  subtasks: Todo[];
  onCreateSubtask: (data: { title: string; parent_todo_id: string }) => Promise<void>;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  isCreating: boolean;
}

export function TodoSubtasks({ parentTodoId, subtasks, onCreateSubtask, onStatusChange, isCreating }: TodoSubtasksProps) {
  const [newSubtask, setNewSubtask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newSubtask.trim()) return;

    await onCreateSubtask({ title: newSubtask.trim(), parent_todo_id: parentTodoId });
    setNewSubtask('');
    setIsAdding(false);
  };

  const completedCount = subtasks.filter(s => s.status === 'completed').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Subtareas ({completedCount}/{subtasks.length})
        </h4>
        {!isAdding && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks.map(subtask => (
          <div key={subtask.id} className="flex items-center gap-2 py-1">
            <button
              onClick={() => {
                if (subtask.status === 'completed') {
                  onStatusChange(subtask.id, 'pending');
                } else {
                  onStatusChange(subtask.id, 'completed');
                }
              }}
              className="flex-shrink-0"
            >
              {subtask.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 hover:border-emerald-500 transition-colors" />
              )}
            </button>
            <span className={cn(
              "text-sm",
              subtask.status === 'completed' && "line-through text-muted-foreground"
            )}>
              {subtask.title}
            </span>
          </div>
        ))}
      </div>

      {/* Add subtask */}
      {isAdding && (
        <div className="flex gap-2">
          <Input
            placeholder="Nombre de la subtarea..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setNewSubtask(''); }
            }}
            className="text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={isCreating || !newSubtask.trim()}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewSubtask(''); }}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
