import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectUpdate, ProjectUpdateType } from '@/types/database';

interface UseProjectUpdatesOptions {
  projectId?: string;
}

interface CreateUpdateData {
  update_type: ProjectUpdateType;
  content: string;
  created_by?: string;
}

export function useProjectUpdates({ projectId }: UseProjectUpdatesOptions) {
  const queryClient = useQueryClient();

  const { data: updates = [], isLoading, error } = useQuery({
    queryKey: ['project-updates', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectUpdate[];
    },
    enabled: !!projectId,
  });

  // Create update
  const createUpdateMutation = useMutation({
    mutationFn: async (data: CreateUpdateData) => {
      if (!projectId) throw new Error('No project ID provided');

      const { data: result, error } = await supabase
        .from('project_updates')
        .insert({
          project_id: projectId,
          update_type: data.update_type,
          content: data.content,
          created_by: data.created_by || 'Usuario',
          is_resolved: false,
        })
        .select()
        .single();

      if (error) throw error;
      return result as ProjectUpdate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
    },
  });

  // Delete update
  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from('project_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
    },
  });

  // Resolve blocker
  const resolveBlockerMutation = useMutation({
    mutationFn: async ({ updateId, resolved }: { updateId: string; resolved: boolean }) => {
      const { data, error } = await supabase
        .from('project_updates')
        .update({
          is_resolved: resolved,
          resolved_at: resolved ? new Date().toISOString() : null,
          resolved_by: resolved ? 'Usuario' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updateId)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectUpdate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
    },
  });

  // Get stats
  const getStats = () => {
    const allBlockers = updates.filter(u => u.update_type === 'blocker');
    const activeBlockers = allBlockers.filter(u => !u.is_resolved);
    const resolvedBlockers = allBlockers.filter(u => u.is_resolved);
    const progress = updates.filter(u => u.update_type === 'progress').length;
    const decisions = updates.filter(u => u.update_type === 'decision').length;
    const notes = updates.filter(u => u.update_type === 'note').length;

    return {
      blockers: allBlockers.length,
      activeBlockers: activeBlockers.length,
      resolvedBlockers: resolvedBlockers.length,
      progress,
      decisions,
      notes,
      total: updates.length
    };
  };

  // Get active blockers (unresolved)
  const getActiveBlockers = () => {
    return updates.filter(u => u.update_type === 'blocker' && !u.is_resolved);
  };

  return {
    updates,
    isLoading,
    error,
    createUpdate: createUpdateMutation.mutateAsync,
    deleteUpdate: deleteUpdateMutation.mutateAsync,
    resolveBlocker: resolveBlockerMutation.mutateAsync,
    getStats,
    getActiveBlockers,
    isCreating: createUpdateMutation.isPending,
    isDeleting: deleteUpdateMutation.isPending,
    isResolving: resolveBlockerMutation.isPending,
  };
}
