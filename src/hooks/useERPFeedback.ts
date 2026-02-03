import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ERPFeedback, ERPFeedbackCategory, ERPFeedbackPriority, ERPFeedbackStatus } from '@/types/database';

interface ERPFeedbackStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
}

export function useERPFeedback() {
  const queryClient = useQueryClient();

  const { data: feedbackItems = [], isLoading, error } = useQuery({
    queryKey: ['erp-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ERPFeedback[];
    },
  });

  // Calculate stats
  const stats: ERPFeedbackStats = {
    total: feedbackItems.length,
    pending: feedbackItems.filter(f => f.status === 'pending').length,
    inProgress: feedbackItems.filter(f => f.status === 'in_progress').length,
    completed: feedbackItems.filter(f => f.status === 'completed').length,
    rejected: feedbackItems.filter(f => f.status === 'rejected').length,
  };

  // Create feedback
  const createFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: {
      title: string;
      description?: string;
      category: ERPFeedbackCategory;
      priority: ERPFeedbackPriority;
      created_by: string;
      created_by_name?: string;
    }) => {
      const { data, error } = await supabase
        .from('erp_feedback')
        .insert({
          ...feedbackData,
          status: 'pending',
          votes: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ERPFeedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-feedback'] });
    },
  });

  // Update feedback status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, completed_by, rejected_reason }: {
      id: string;
      status: ERPFeedbackStatus;
      completed_by?: string;
      rejected_reason?: string;
    }) => {
      const updates: Partial<ERPFeedback> = { status };

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = completed_by;
      }

      if (status === 'rejected' && rejected_reason) {
        updates.rejected_reason = rejected_reason;
      }

      const { error } = await supabase
        .from('erp_feedback')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-feedback'] });
    },
  });

  // Update feedback
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<Pick<ERPFeedback, 'title' | 'description' | 'category' | 'priority'>>;
    }) => {
      const { error } = await supabase
        .from('erp_feedback')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-feedback'] });
    },
  });

  // Vote for feedback
  const voteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get current votes
      const { data: current } = await supabase
        .from('erp_feedback')
        .select('votes')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('erp_feedback')
        .update({ votes: (current?.votes || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-feedback'] });
    },
  });

  // Delete feedback
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('erp_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-feedback'] });
    },
  });

  return {
    feedbackItems,
    stats,
    isLoading,
    error,
    createFeedback: createFeedbackMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    updateFeedback: updateFeedbackMutation.mutateAsync,
    vote: voteMutation.mutateAsync,
    deleteFeedback: deleteFeedbackMutation.mutateAsync,
    isCreating: createFeedbackMutation.isPending,
    isUpdating: updateStatusMutation.isPending || updateFeedbackMutation.isPending,
  };
}
