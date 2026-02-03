import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectDependency } from '@/types/database';

export function useProjectDependencies(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: dependencies = [], isLoading, error } = useQuery({
    queryKey: ['project-dependencies', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_dependencies')
        .select('*, project_repositories(name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as (ProjectDependency & { project_repositories?: { name: string } | null })[];
    },
    enabled: !!projectId,
  });

  const createDependencyMutation = useMutation({
    mutationFn: async (depData: {
      project_id: string;
      dependency_type: ProjectDependency['dependency_type'];
      name: string;
      version?: string;
      is_dev_dependency?: boolean;
      repository_id?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_dependencies')
        .insert(depData)
        .select('*, project_repositories(name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-dependencies', projectId] });
    },
  });

  const updateDependencyMutation = useMutation({
    mutationFn: async ({ depId, updates }: {
      depId: string;
      updates: Partial<Omit<ProjectDependency, 'id' | 'project_id' | 'created_at'>>
    }) => {
      const { error } = await supabase
        .from('project_dependencies')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', depId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-dependencies', projectId] });
    },
  });

  const deleteDependencyMutation = useMutation({
    mutationFn: async (depId: string) => {
      const { error } = await supabase
        .from('project_dependencies')
        .delete()
        .eq('id', depId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-dependencies', projectId] });
    },
  });

  const getDependenciesByType = (type: ProjectDependency['dependency_type']) => {
    return dependencies.filter(d => d.dependency_type === type);
  };

  const getStats = () => {
    return {
      total: dependencies.length,
      npm: dependencies.filter(d => d.dependency_type === 'NPM').length,
      pip: dependencies.filter(d => d.dependency_type === 'PIP').length,
      composer: dependencies.filter(d => d.dependency_type === 'COMPOSER').length,
      other: dependencies.filter(d => d.dependency_type === 'OTHER').length,
      dev: dependencies.filter(d => d.is_dev_dependency).length,
      prod: dependencies.filter(d => !d.is_dev_dependency).length,
    };
  };

  return {
    dependencies,
    isLoading,
    error,
    createDependency: createDependencyMutation.mutateAsync,
    updateDependency: updateDependencyMutation.mutateAsync,
    deleteDependency: deleteDependencyMutation.mutateAsync,
    getDependenciesByType,
    getStats,
    isCreating: createDependencyMutation.isPending,
    isUpdating: updateDependencyMutation.isPending,
  };
}
