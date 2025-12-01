import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectMilestone } from '@/types/database';

interface UseProjectMilestonesOptions {
  projectId?: string;
}

interface CreateMilestoneData {
  name: string;
  expected_date?: string;
  actual_date?: string;
  notes?: string;
}

interface UpdateMilestoneData {
  name?: string;
  expected_date?: string;
  actual_date?: string;
  notes?: string;
  order_index?: number;
}

export function useProjectMilestones({ projectId }: UseProjectMilestonesOptions) {
  const queryClient = useQueryClient();

  const { data: milestones = [], isLoading, error } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ProjectMilestone[];
    },
    enabled: !!projectId,
  });

  // Create milestone
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: CreateMilestoneData) => {
      if (!projectId) throw new Error('No project ID provided');

      // Get max order_index
      const maxIndex = milestones.length > 0
        ? Math.max(...milestones.map(m => m.order_index))
        : -1;

      const { data: result, error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: projectId,
          name: data.name,
          expected_date: data.expected_date || null,
          actual_date: data.actual_date || null,
          notes: data.notes || null,
          order_index: maxIndex + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return result as ProjectMilestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    },
  });

  // Update milestone
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, updates }: { milestoneId: string; updates: UpdateMilestoneData }) => {
      const { data, error } = await supabase
        .from('project_milestones')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMilestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    },
  });

  // Delete milestone
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    },
  });

  // Reorder milestones
  const reorderMilestonesMutation = useMutation({
    mutationFn: async (reorderedMilestones: { id: string; order_index: number }[]) => {
      const promises = reorderedMilestones.map(milestone =>
        supabase
          .from('project_milestones')
          .update({ order_index: milestone.order_index, updated_at: new Date().toISOString() })
          .eq('id', milestone.id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    },
  });

  // Get next upcoming milestone
  const getNextMilestone = () => {
    const now = new Date();
    const upcoming = milestones
      .filter(m => !m.actual_date && m.expected_date)
      .sort((a, b) => new Date(a.expected_date!).getTime() - new Date(b.expected_date!).getTime());

    return upcoming[0] || null;
  };

  // Get overdue milestones
  const getOverdueMilestones = () => {
    const now = new Date();
    return milestones.filter(m =>
      !m.actual_date &&
      m.expected_date &&
      new Date(m.expected_date) < now
    );
  };

  return {
    milestones,
    isLoading,
    error,
    createMilestone: createMilestoneMutation.mutateAsync,
    updateMilestone: updateMilestoneMutation.mutateAsync,
    deleteMilestone: deleteMilestoneMutation.mutateAsync,
    reorderMilestones: reorderMilestonesMutation.mutateAsync,
    getNextMilestone,
    getOverdueMilestones,
    isCreating: createMilestoneMutation.isPending,
    isUpdating: updateMilestoneMutation.isPending,
    isDeleting: deleteMilestoneMutation.isPending,
  };
}
