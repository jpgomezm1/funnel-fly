import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Proposal, DealCurrency } from '@/types/database';

export function useProposals(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading, error } = useQuery({
    queryKey: ['proposals', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!projectId,
  });

  const createProposalMutation = useMutation({
    mutationFn: async (proposalData: {
      project_id: string;
      name: string;
      url?: string;
      currency: DealCurrency;
      mrr_original: number;
      fee_original: number;
      exchange_rate?: number;
      mrr_usd: number;
      fee_usd: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          ...proposalData,
          is_final: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
    },
  });

  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Proposal> }) => {
      const { error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
    },
  });

  const deleteProposalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
    },
  });

  const setFinalProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      // First, unset all proposals as final
      await supabase
        .from('proposals')
        .update({ is_final: false })
        .eq('project_id', projectId);

      // Then set the selected one as final
      const { error } = await supabase
        .from('proposals')
        .update({ is_final: true })
        .eq('id', proposalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
    },
  });

  return {
    proposals,
    isLoading,
    error,
    createProposal: createProposalMutation.mutateAsync,
    updateProposal: updateProposalMutation.mutateAsync,
    deleteProposal: deleteProposalMutation.mutateAsync,
    setFinalProposal: setFinalProposalMutation.mutateAsync,
    isCreating: createProposalMutation.isPending,
  };
}
