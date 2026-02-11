import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Todo, TodoStatus, TodoPriority, TodoWithRelations, TodoAssignee, TodoLabel, TodoLabelAssignment } from '@/types/database';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export function useTodos() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role, displayName } = useUserRole();
  const userId = user?.id;

  const { data: todos = [], isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      // Fetch all todos (non-subtasks)
      let todosQuery = (supabase as any)
        .from('todos')
        .select('*')
        .is('parent_todo_id', null)
        .order('order_index', { ascending: true });

      const { data: todosData, error: todosError } = await todosQuery;
      if (todosError) throw todosError;

      // Fetch all assignees
      const { data: assigneesData } = await (supabase as any)
        .from('todo_assignees')
        .select('*');

      // Fetch all label assignments with label data
      const { data: labelAssignmentsData } = await (supabase as any)
        .from('todo_label_assignments')
        .select('*, todo_labels(*)');

      // Fetch subtask counts
      const { data: subtasksData } = await (supabase as any)
        .from('todos')
        .select('id, parent_todo_id, status')
        .not('parent_todo_id', 'is', null);

      // Fetch comment counts
      const { data: commentsData } = await (supabase as any)
        .from('todo_comments')
        .select('id, todo_id');

      // Fetch attachment counts
      const { data: attachmentsData } = await (supabase as any)
        .from('todo_attachments')
        .select('id, todo_id');

      const assignees = (assigneesData || []) as TodoAssignee[];
      const labelAssignments = (labelAssignmentsData || []) as (TodoLabelAssignment & { todo_labels: TodoLabel })[];
      const subtasks = (subtasksData || []) as Todo[];
      const comments = (commentsData || []) as { id: string; todo_id: string }[];
      const attachments = (attachmentsData || []) as { id: string; todo_id: string }[];

      // Enrich todos with relations
      const enrichedTodos: TodoWithRelations[] = (todosData as Todo[]).map(todo => ({
        ...todo,
        assignees: assignees.filter(a => a.todo_id === todo.id),
        labels: labelAssignments
          .filter(la => la.todo_id === todo.id)
          .map(la => la.todo_labels),
        subtasks: subtasks.filter(s => s.parent_todo_id === todo.id),
        comments_count: comments.filter(c => c.todo_id === todo.id).length,
        attachments_count: attachments.filter(a => a.todo_id === todo.id).length,
      }));

      // Filter by role: superadmin sees all, others see only their own or assigned
      if (role === 'superadmin') {
        return enrichedTodos;
      }

      return enrichedTodos.filter(todo =>
        todo.created_by === userId ||
        todo.assignees?.some(a => a.user_id === userId)
      );
    },
    enabled: !!userId && !!role,
  });

  // Group by status for kanban
  const todosByStatus = todos.reduce((acc, todo) => {
    if (!acc[todo.status]) {
      acc[todo.status] = [];
    }
    acc[todo.status].push(todo);
    return acc;
  }, {} as Record<TodoStatus, TodoWithRelations[]>);

  // Stats
  const stats = {
    pending: todos.filter(t => t.status === 'pending').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    completed: todos.filter(t => t.status === 'completed').length,
    overdue: todos.filter(t =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      !['completed', 'cancelled'].includes(t.status)
    ).length,
  };

  // Create todo
  const createTodoMutation = useMutation({
    mutationFn: async (todoData: {
      title: string;
      description?: string;
      priority?: TodoPriority;
      due_date?: string;
      parent_todo_id?: string;
      assignee_ids?: string[];
      assignee_names?: Record<string, string>;
      label_ids?: string[];
    }) => {
      const { assignee_ids, assignee_names, label_ids, ...rest } = todoData;

      // Get max order_index
      const { data: maxOrderData } = await (supabase as any)
        .from('todos')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = (maxOrderData?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await (supabase as any)
        .from('todos')
        .insert({
          ...rest,
          status: 'pending',
          priority: rest.priority || 'medium',
          order_index: nextOrder,
          created_by: userId,
          created_by_name: displayName || 'Usuario',
        })
        .select()
        .single();

      if (error) throw error;
      const newTodo = data as Todo;

      // Insert assignees
      if (assignee_ids && assignee_ids.length > 0) {
        const assigneeRecords = assignee_ids.map(uid => ({
          todo_id: newTodo.id,
          user_id: uid,
          user_display_name: assignee_names?.[uid] || null,
          assigned_by: userId,
        }));

        await (supabase as any)
          .from('todo_assignees')
          .insert(assigneeRecords);
      }

      // Insert label assignments
      if (label_ids && label_ids.length > 0) {
        const labelRecords = label_ids.map(lid => ({
          todo_id: newTodo.id,
          label_id: lid,
        }));

        await (supabase as any)
          .from('todo_label_assignments')
          .insert(labelRecords);
      }

      return newTodo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // Update todo
  const updateTodoMutation = useMutation({
    mutationFn: async ({ todoId, updates, assignee_ids, assignee_names, label_ids }: {
      todoId: string;
      updates: Partial<Omit<Todo, 'id' | 'created_at' | 'created_by'>>;
      assignee_ids?: string[];
      assignee_names?: Record<string, string>;
      label_ids?: string[];
    }) => {
      const updateData = { ...updates, updated_at: new Date().toISOString() };

      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = displayName || 'Usuario';
      } else if (updates.status && updates.status !== 'completed') {
        updateData.completed_at = undefined;
        updateData.completed_by = undefined;
      }

      const { error } = await (supabase as any)
        .from('todos')
        .update(updateData)
        .eq('id', todoId);

      if (error) throw error;

      // Update assignees if provided
      if (assignee_ids !== undefined) {
        await (supabase as any)
          .from('todo_assignees')
          .delete()
          .eq('todo_id', todoId);

        if (assignee_ids.length > 0) {
          const assigneeRecords = assignee_ids.map(uid => ({
            todo_id: todoId,
            user_id: uid,
            user_display_name: assignee_names?.[uid] || null,
            assigned_by: userId,
          }));

          await (supabase as any)
            .from('todo_assignees')
            .insert(assigneeRecords);
        }
      }

      // Update labels if provided
      if (label_ids !== undefined) {
        await (supabase as any)
          .from('todo_label_assignments')
          .delete()
          .eq('todo_id', todoId);

        if (label_ids.length > 0) {
          const labelRecords = label_ids.map(lid => ({
            todo_id: todoId,
            label_id: lid,
          }));

          await (supabase as any)
            .from('todo_label_assignments')
            .insert(labelRecords);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // Quick status update
  const updateStatusMutation = useMutation({
    mutationFn: async ({ todoId, status }: { todoId: string; status: TodoStatus }) => {
      const updateData: any = { status, updated_at: new Date().toISOString() };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = displayName || 'Usuario';
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await (supabase as any)
        .from('todos')
        .update(updateData)
        .eq('id', todoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // Delete todo
  const deleteTodoMutation = useMutation({
    mutationFn: async (todoId: string) => {
      const { error } = await (supabase as any)
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    todos,
    todosByStatus,
    stats,
    isLoading,
    error,
    userId,
    createTodo: createTodoMutation.mutateAsync,
    updateTodo: updateTodoMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
    isCreating: createTodoMutation.isPending,
    isUpdating: updateTodoMutation.isPending || updateStatusMutation.isPending,
  };
}
