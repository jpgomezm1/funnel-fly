import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnvironmentType } from '@/types/database';

// DB schema: has 'variables' (text) instead of key/value pairs
// environment is lowercase in DB: 'production', 'staging', 'development'
interface ProjectEnvVariableDB {
  id: string;
  project_id: string;
  repository_id?: string;
  environment: string; // lowercase in DB
  variables?: string; // text content with all variables
  notes?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export function useProjectEnvVariables(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: envVariables = [], isLoading, error } = useQuery({
    queryKey: ['project-env-variables', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_env_variables')
        .select('*')
        .eq('project_id', projectId)
        .order('environment', { ascending: true });

      if (error) throw error;
      return data as ProjectEnvVariableDB[];
    },
    enabled: !!projectId,
  });

  // Group by environment
  const envByEnvironment = envVariables.reduce((acc, env) => {
    const envKey = env.environment.toUpperCase() as EnvironmentType;
    if (!acc[envKey]) {
      acc[envKey] = [];
    }
    acc[envKey].push(env);
    return acc;
  }, {} as Record<EnvironmentType, ProjectEnvVariableDB[]>);

  // Create or update env variables for an environment
  const saveEnvMutation = useMutation({
    mutationFn: async (envData: {
      project_id: string;
      repository_id?: string;
      environment: string;
      variables: string;
      notes?: string;
    }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from('project_env_variables')
        .select('id')
        .eq('project_id', envData.project_id)
        .eq('environment', envData.environment.toLowerCase())
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('project_env_variables')
          .update({
            variables: envData.variables,
            notes: envData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('project_env_variables')
          .insert({
            ...envData,
            environment: envData.environment.toLowerCase(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-env-variables', projectId] });
    },
  });

  // Delete env variable record
  const deleteEnvMutation = useMutation({
    mutationFn: async (envId: string) => {
      const { error } = await supabase
        .from('project_env_variables')
        .delete()
        .eq('id', envId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-env-variables', projectId] });
    },
  });

  // Get variables content for an environment
  const getEnvContent = (environment: EnvironmentType): string => {
    const envRecord = envByEnvironment[environment]?.[0];
    return envRecord?.variables || '';
  };

  return {
    envVariables,
    envByEnvironment,
    isLoading,
    error,
    saveEnvVariables: saveEnvMutation.mutateAsync,
    deleteEnvVariable: deleteEnvMutation.mutateAsync,
    getEnvContent,
    isSaving: saveEnvMutation.isPending,
  };
}
