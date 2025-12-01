import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectRepository } from '@/types/database';

export function useProjectRepositories(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: repositories = [], isLoading, error } = useQuery({
    queryKey: ['project-repositories', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_repositories')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ProjectRepository[];
    },
    enabled: !!projectId,
  });

  // Create repository
  const createRepoMutation = useMutation({
    mutationFn: async (repoData: {
      project_id: string;
      name: string;
      repo_type: ProjectRepository['repo_type'];
      repo_url: string;
      production_url?: string;
      staging_url?: string;
      tech_stack?: string[];
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_repositories')
        .insert(repoData)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectRepository;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-repositories', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-projects'] });
    },
  });

  // Update repository
  const updateRepoMutation = useMutation({
    mutationFn: async ({ repoId, updates }: {
      repoId: string;
      updates: Partial<Omit<ProjectRepository, 'id' | 'project_id' | 'created_at'>>
    }) => {
      const { error } = await supabase
        .from('project_repositories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', repoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-repositories', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-projects'] });
    },
  });

  // Delete repository
  const deleteRepoMutation = useMutation({
    mutationFn: async (repoId: string) => {
      const { error } = await supabase
        .from('project_repositories')
        .delete()
        .eq('id', repoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-repositories', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-projects'] });
    },
  });

  return {
    repositories,
    isLoading,
    error,
    createRepository: createRepoMutation.mutateAsync,
    updateRepository: updateRepoMutation.mutateAsync,
    deleteRepository: deleteRepoMutation.mutateAsync,
    isCreating: createRepoMutation.isPending,
    isUpdating: updateRepoMutation.isPending,
  };
}
