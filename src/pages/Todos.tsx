import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Settings, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useTodos } from '@/hooks/useTodos';
import { useTodoLabels } from '@/hooks/useTodoLabels';
import { useTodoNotifications } from '@/hooks/useTodoNotifications';
import { useUserRole } from '@/hooks/useUserRole';
import { TodoWithRelations, TodoStatus, TodoPriority } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TodoStatsCards } from '@/components/todos/TodoStatsCards';
import { TodoFilters } from '@/components/todos/TodoFilters';
import { TodoCard } from '@/components/todos/TodoCard';
import { TodoKanbanBoard } from '@/components/todos/TodoKanbanBoard';
import { TodoCreateDialog } from '@/components/todos/TodoCreateDialog';
import { TodoDetailSheet } from '@/components/todos/TodoDetailSheet';
import { TodoNotificationSettings } from '@/components/todos/TodoNotificationSettings';
import { Card } from '@/components/ui/card';

export default function Todos() {
  const {
    todos,
    todosByStatus,
    stats,
    isLoading,
    createTodo,
    updateTodo,
    updateStatus,
    deleteTodo,
    isCreating,
    userId,
  } = useTodos();

  const { labels } = useTodoLabels();
  const { notifyAssignment, notifyStatusChange } = useTodoNotifications();
  const { role, displayName } = useUserRole();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoWithRelations | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<TodoWithRelations | null>(null);

  // Fetch team members for assignee filter (same queryKey as TodoCreateDialog for cache dedup)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-users-for-todos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('user_id, display_name, role')
        .neq('role', 'socio');

      if (error) throw error;
      return data as { user_id: string; display_name: string; role: string }[];
    },
  });

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    const matchesSearch =
      todo.title.toLowerCase().includes(search.toLowerCase()) ||
      (todo.description?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'ALL' || todo.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || todo.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || todo.assignees?.some(a => a.user_id === assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Filtered kanban data
  const filteredByStatus = filteredTodos.reduce((acc, todo) => {
    if (!acc[todo.status]) acc[todo.status] = [];
    acc[todo.status].push(todo);
    return acc;
  }, {} as Record<TodoStatus, TodoWithRelations[]>);

  const handleCreate = async (data: {
    title: string;
    description?: string;
    priority: TodoPriority;
    due_date?: string;
    assignee_ids: string[];
    assignee_names: Record<string, string>;
    label_ids: string[];
  }) => {
    try {
      await createTodo(data);
      toast({ title: 'Tarea creada', description: data.title });
      setCreateDialogOpen(false);

      // Notify assignees
      if (data.assignee_ids.length > 0) {
        notifyAssignment(data.assignee_ids, data.title, displayName || 'Usuario');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la tarea', variant: 'destructive' });
    }
  };

  const handleEdit = async (data: {
    title: string;
    description?: string;
    priority: TodoPriority;
    due_date?: string;
    assignee_ids: string[];
    assignee_names: Record<string, string>;
    label_ids: string[];
  }) => {
    if (!editTodo) return;

    try {
      await updateTodo({
        todoId: editTodo.id,
        updates: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          due_date: data.due_date,
        },
        assignee_ids: data.assignee_ids,
        assignee_names: data.assignee_names,
        label_ids: data.label_ids,
      });
      toast({ title: 'Tarea actualizada' });
      setEditTodo(null);

      // Notify new assignees
      const previousIds = editTodo.assignees?.map(a => a.user_id) || [];
      const newAssignees = data.assignee_ids.filter(id => !previousIds.includes(id));
      if (newAssignees.length > 0) {
        notifyAssignment(newAssignees, data.title, displayName || 'Usuario');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la tarea', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (todoId: string, status: TodoStatus) => {
    try {
      await updateStatus({ todoId, status });

      // Notify assignees about status change
      const todo = todos.find(t => t.id === todoId);
      if (todo?.assignees && todo.assignees.length > 0) {
        const assigneeIds = todo.assignees.map(a => a.user_id).filter(id => id !== userId);
        if (assigneeIds.length > 0) {
          notifyStatusChange(assigneeIds, todo.title, status);
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!confirm('Estas seguro de eliminar esta tarea?')) return;

    try {
      await deleteTodo(todoId);
      toast({ title: 'Tarea eliminada' });
      if (selectedTodo?.id === todoId) {
        setDetailSheetOpen(false);
        setSelectedTodo(null);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la tarea', variant: 'destructive' });
    }
  };

  const handleTodoClick = (todo: TodoWithRelations) => {
    setSelectedTodo(todo);
    setDetailSheetOpen(true);
  };

  const handleCreateSubtask = async (data: { title: string; parent_todo_id: string }) => {
    try {
      await createTodo({
        title: data.title,
        parent_todo_id: data.parent_todo_id,
        assignee_ids: [],
        assignee_names: {},
        label_ids: [],
        priority: 'medium',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la subtarea', variant: 'destructive' });
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
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
            <CheckSquare className="h-6 w-6 text-primary" />
            To-Do List
          </h1>
          <p className="text-muted-foreground">
            Gestiona las tareas de tu equipo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setEditTodo(null); setCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Stats */}
      <TodoStatsCards stats={stats} />

      {/* Filters */}
      <TodoFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        teamMembers={teamMembers}
        showAssigneeFilter={role === 'superadmin'}
      />

      {/* Content */}
      {filteredTodos.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay tareas</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL'
              ? 'No se encontraron tareas con los filtros aplicados'
              : 'Crea tu primera tarea para empezar'}
          </p>
          {!search && statusFilter === 'ALL' && priorityFilter === 'ALL' && assigneeFilter === 'ALL' && (
            <Button onClick={() => { setEditTodo(null); setCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          )}
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredTodos.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onClick={handleTodoClick}
            />
          ))}
        </div>
      ) : (
        <TodoKanbanBoard
          todosByStatus={filteredByStatus}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onTodoClick={handleTodoClick}
        />
      )}

      {/* Create/Edit Dialog */}
      <TodoCreateDialog
        open={createDialogOpen || !!editTodo}
        onOpenChange={(o) => {
          if (!o) {
            setCreateDialogOpen(false);
            setEditTodo(null);
          }
        }}
        onSubmit={editTodo ? handleEdit : handleCreate}
        labels={labels}
        isSubmitting={isCreating}
        editTodo={editTodo}
      />

      {/* Detail Sheet */}
      <TodoDetailSheet
        todo={selectedTodo}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onStatusChange={handleStatusChange}
        onCreateSubtask={handleCreateSubtask}
        onEdit={(todo) => {
          setDetailSheetOpen(false);
          setEditTodo(todo);
        }}
        isCreatingSubtask={isCreating}
      />

      {/* Notification Settings */}
      <TodoNotificationSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
