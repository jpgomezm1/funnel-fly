import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Phase0Task, Phase0TaskStatus, Phase0TaskPriority } from '@/types/database';

export function usePhase0Tasks(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['phase0-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('phase0_tasks')
        .select('*')
        .eq('phase0_project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Phase0Task[];
    },
    enabled: !!projectId,
  });

  // Group tasks by status for kanban view
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<Phase0TaskStatus, Phase0Task[]>);

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      phase0_project_id: string;
      title: string;
      description?: string;
      status?: Phase0TaskStatus;
      priority?: Phase0TaskPriority;
      assigned_to?: string;
      due_date?: string;
    }) => {
      // Get max order_index
      const { data: maxOrderData } = await supabase
        .from('phase0_tasks')
        .select('order_index')
        .eq('phase0_project_id', taskData.phase0_project_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = (maxOrderData?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from('phase0_tasks')
        .insert({
          ...taskData,
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          order_index: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Phase0Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: {
      taskId: string;
      updates: Partial<Omit<Phase0Task, 'id' | 'phase0_project_id' | 'created_at'>>
    }) => {
      // If status is being set to completed, add completed_at
      const updateData = { ...updates };
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = 'Usuario';
      } else if (updates.status && updates.status !== 'completed') {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await supabase
        .from('phase0_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Update task status (quick update)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: Phase0TaskStatus }) => {
      const updateData: any = { status };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = 'Usuario';
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await supabase
        .from('phase0_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('phase0_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  return {
    tasks,
    tasksByStatus,
    isLoading,
    error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending || updateStatusMutation.isPending,
  };
}
