import { useState, useEffect } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Deal, DealStatus } from '@/types/database';

export function useDeals(leadId?: string) {
  const queryClient = useQueryClient();

  // Fetch deals for a specific lead
  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: ['deals', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!leadId,
  });

  // Upsert deal mutation
  const upsertDealMutation = useMutation({
    mutationFn: async ({
      leadId,
      dealId,
      dealData,
    }: {
      leadId: string;
      dealId?: string;
      dealData: {
        currency: 'USD' | 'COP';
        mrr_original: number;
        implementation_fee_original: number;
        exchange_rate?: number;
        mrr_usd: number;
        implementation_fee_usd: number;
        start_date: string;
        status: DealStatus;
        notes?: string;
      };
    }) => {
      const payload = {
        currency: dealData.currency,
        mrr_original: dealData.mrr_original,
        implementation_fee_original: dealData.implementation_fee_original,
        exchange_rate: dealData.exchange_rate || null,
        mrr_usd: dealData.mrr_usd,
        implementation_fee_usd: dealData.implementation_fee_usd,
        start_date: dealData.start_date,
        status: dealData.status,
        notes: dealData.notes,
      };

      if (dealId) {
        // Update existing deal
        const { error } = await supabase
          .from('deals')
          .update(payload)
          .eq('id', dealId);

        if (error) throw error;
      } else {
        // Insert new deal
        const { error } = await supabase
          .from('deals')
          .insert({
            lead_id: leadId,
            ...payload,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { leadId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', leadId] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['lead', { id: leadId }] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // Check if lead needs MRR registration
  const needsMrrRegistration = (leadDeals: Deal[]) => {
    if (!leadDeals || leadDeals.length === 0) return true;
    return leadDeals.every(deal => deal.mrr_usd === 0);
  };

  // Get MRR badge info for a lead
  const getMrrBadgeInfo = (leadDeals: Deal[]) => {
    if (!leadDeals || leadDeals.length === 0) {
      return { type: 'pending', text: '⚠ MRR pendiente' };
    }

    const activeDeal = leadDeals.find(deal => deal.status === 'ACTIVE' && deal.mrr_usd > 0);
    if (activeDeal) {
      return { 
        type: 'active', 
        text: `MRR: $${activeDeal.mrr_usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
      };
    }

    const hasOnlyZeroMrr = leadDeals.every(deal => deal.mrr_usd === 0);
    if (hasOnlyZeroMrr) {
      return { type: 'pending', text: '⚠ MRR pendiente' };
    }

    const pausedDeal = leadDeals.find(deal => deal.status === 'ON_HOLD');
    if (pausedDeal) {
      return { type: 'paused', text: 'En pausa' };
    }

    const churnedDeal = leadDeals.find(deal => deal.status === 'CHURNED');
    if (churnedDeal) {
      return { type: 'churned', text: 'Churned' };
    }

    return { type: 'pending', text: '⚠ MRR pendiente' };
  };

  return {
    deals,
    isLoading,
    error,
    upsertDeal: upsertDealMutation.mutate,
    isUpsertingDeal: upsertDealMutation.isPending,
    needsMrrRegistration,
    getMrrBadgeInfo,
  };
}

// Hook to get deals for multiple leads (for Kanban badges)
export function useLeadDeals(leadIds: string[]) {
  const { data: dealsMap = {}, isLoading } = useQuery({
    queryKey: ['deals', 'multiple', leadIds.sort()],
    queryFn: async () => {
      if (leadIds.length === 0) return {};

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .in('lead_id', leadIds);

      if (error) throw error;

      // Group deals by lead_id
      const grouped = (data as Deal[]).reduce((acc, deal) => {
        if (!acc[deal.lead_id]) acc[deal.lead_id] = [];
        acc[deal.lead_id].push(deal);
        return acc;
      }, {} as Record<string, Deal[]>);

      return grouped;
    },
    enabled: leadIds.length > 0,
  });

  return { dealsMap, isLoading };
}