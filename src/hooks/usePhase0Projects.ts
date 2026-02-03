import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Phase0Project, Phase0ProjectStatus } from '@/types/database';

interface Phase0ProjectStats {
  total: number;
  active: number;
  onHold: number;
  converted: number;
  cancelled: number;
}

interface Phase0ProjectWithStats extends Phase0Project {
  documentsCount: number;
  tasksCount: number;
  completedTasksCount: number;
}

export function usePhase0Projects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['phase0-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phase0_projects')
        .select(`
          *,
          phase0_documents(count),
          phase0_tasks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get completed tasks count for each project
      const projectsWithStats = await Promise.all(
        (data || []).map(async (project: any) => {
          const { count: completedCount } = await supabase
            .from('phase0_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('phase0_project_id', project.id)
            .eq('status', 'completed');

          return {
            ...project,
            documentsCount: project.phase0_documents?.[0]?.count || 0,
            tasksCount: project.phase0_tasks?.[0]?.count || 0,
            completedTasksCount: completedCount || 0,
          } as Phase0ProjectWithStats;
        })
      );

      return projectsWithStats;
    },
  });

  // Calculate stats
  const stats: Phase0ProjectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
    converted: projects.filter(p => p.status === 'converted').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  };

  // Create project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: {
      client_name: string;
      project_name: string;
      description?: string;
      notes?: string;
      phase0_link?: string;
    }) => {
      const { data, error } = await supabase
        .from('phase0_projects')
        .insert({
          ...projectData,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Phase0Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Update project
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, updates }: {
      projectId: string;
      updates: Partial<Omit<Phase0Project, 'id' | 'created_at' | 'updated_at'>>
    }) => {
      const { error } = await supabase
        .from('phase0_projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Update project status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: Phase0ProjectStatus }) => {
      const { error } = await supabase
        .from('phase0_projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('phase0_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  return {
    projects,
    stats,
    isLoading,
    error,
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending || updateStatusMutation.isPending,
  };
}

// Hook for fetching a single project
export function usePhase0Project(projectId?: string) {
  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['phase0-project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('phase0_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as Phase0Project;
    },
    enabled: !!projectId,
  });

  return { project, isLoading, error, refetch };
}
