import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectTask, TaskStatus, TaskPriority, TechTeamMemberId } from '@/types/database';

export function useProjectTasks(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ProjectTask[];
    },
    enabled: !!projectId,
  });

  // Group tasks by parent (for subtasks)
  const tasksWithSubtasks = tasks.filter(t => !t.parent_task_id).map(task => ({
    ...task,
    subtasks: tasks.filter(t => t.parent_task_id === task.id),
  }));

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      project_id: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigned_to?: TechTeamMemberId;
      due_date?: string;
      estimated_hours?: number;
      tags?: string[];
      parent_task_id?: string;
    }) => {
      // Get max order_index
      const { data: maxOrderData } = await supabase
        .from('project_tasks')
        .select('order_index')
        .eq('project_id', taskData.project_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = (maxOrderData?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          ...taskData,
          status: taskData.status || 'backlog',
          priority: taskData.priority || 'medium',
          order_index: nextOrder,
          actual_hours: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-projects'] });
    },
  });

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: {
      taskId: string;
      updates: Partial<Omit<ProjectTask, 'id' | 'project_id' | 'created_at'>>
    }) => {
      const { error } = await supabase
        .from('project_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-projects'] });
    },
  });

  // Update task status (quick update)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from('project_tasks')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-projects'] });
    },
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // First delete subtasks
      await supabase
        .from('project_tasks')
        .delete()
        .eq('parent_task_id', taskId);

      // Then delete the task
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-projects'] });
    },
  });

  // Get tasks by status for kanban view
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!task.parent_task_id) { // Only main tasks
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
    }
    return acc;
  }, {} as Record<TaskStatus, ProjectTask[]>);

  // Get tasks by assignee
  const tasksByAssignee = tasks.reduce((acc, task) => {
    const assignee = task.assigned_to || 'unassigned';
    if (!acc[assignee]) {
      acc[assignee] = [];
    }
    acc[assignee].push(task);
    return acc;
  }, {} as Record<string, ProjectTask[]>);

  return {
    tasks,
    tasksWithSubtasks,
    tasksByStatus,
    tasksByAssignee,
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

// Hook for fetching all tasks across projects (for metrics)
export function useAllTasks() {
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*, projects(id, name, client_id, clients(company_name))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return { tasks, isLoading, error };
}
