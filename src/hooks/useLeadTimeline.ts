import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadStage } from '@/types/database';

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'quote' | 'follow_up';

export interface TimelineEvent {
  id: string;
  type: 'stage_change' | 'deal_created' | 'deal_updated' | 'lead_created' | 'note_updated' | 'activity';
  timestamp: string;
  description: string;
  details?: {
    from_stage?: LeadStage;
    to_stage?: LeadStage;
    changed_by?: string;
    mrr_usd?: number;
    implementation_fee_usd?: number;
    amount?: number;
    activity_type?: ActivityType;
    activity_details?: string;
    transcript_file_path?: string;
  };
}

export function useLeadTimeline(leadId?: string) {
  const { data: timeline = [], isLoading, error, refetch } = useQuery({
    queryKey: ['timeline', leadId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!leadId) return [];

      // Fetch lead data
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      if (leadError) throw leadError;

      // Fetch stage history
      const { data: stageHistory, error: stageError } = await supabase
        .from('lead_stage_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('changed_at', { ascending: false });
      if (stageError) throw stageError;

      // Fetch deals history
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (dealsError) throw dealsError;

      // Fetch activities
      const { data: activities, error: activitiesError } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (activitiesError) throw activitiesError;

      const events: TimelineEvent[] = [];

      // Add lead creation event
      events.push({
        id: `lead-created-${leadData.id}`,
        type: 'lead_created',
        timestamp: leadData.created_at,
        description: `Lead creado: ${leadData.company_name}`,
      });

      // Add stage change events
      stageHistory?.forEach((history) => {
        events.push({
          id: `stage-${history.id}`,
          type: 'stage_change',
          timestamp: history.changed_at,
          description: history.from_stage 
            ? `Etapa cambió de ${history.from_stage} → ${history.to_stage}`
            : `Etapa establecida como ${history.to_stage}`,
          details: {
            from_stage: history.from_stage,
            to_stage: history.to_stage,
            changed_by: history.changed_by,
          },
        });
      });

      // Add deal events
      deals?.forEach((deal) => {
        // Deal creation
        events.push({
          id: `deal-created-${deal.id}`,
          type: 'deal_created',
          timestamp: deal.created_at,
          description: `Contrato registrado: MRR $${deal.mrr_usd.toLocaleString('en-US')}, Fee $${deal.implementation_fee_usd.toLocaleString('en-US')}`,
          details: {
            mrr_usd: deal.mrr_usd,
            implementation_fee_usd: deal.implementation_fee_usd,
          },
        });

        // If deal was updated (different from created)
        if (deal.updated_at !== deal.created_at) {
          events.push({
            id: `deal-updated-${deal.id}-${deal.updated_at}`,
            type: 'deal_updated',
            timestamp: deal.updated_at,
            description: `Contrato actualizado: MRR $${deal.mrr_usd.toLocaleString('en-US')}, Fee $${deal.implementation_fee_usd.toLocaleString('en-US')}`,
            details: {
              mrr_usd: deal.mrr_usd,
              implementation_fee_usd: deal.implementation_fee_usd,
            },
          });
        }
      });

      // Add activity events
      const ACTIVITY_LABELS: Record<string, string> = {
        call: 'Llamada',
        email: 'Email',
        meeting: 'Reunión',
        note: 'Nota',
        quote: 'Cotización',
        follow_up: 'Seguimiento',
      };

      activities?.forEach((activity) => {
        events.push({
          id: `activity-${activity.id}`,
          type: 'activity',
          timestamp: activity.created_at,
          description: `${ACTIVITY_LABELS[activity.type] || activity.type}: ${activity.description}`,
          details: {
            activity_type: activity.type as ActivityType,
            activity_details: activity.details || undefined,
            transcript_file_path: activity.transcript_file_path || undefined,
          },
        });
      });

      // Sort all events by timestamp descending
      return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    enabled: !!leadId,
  });

  const refreshTimeline = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    timeline,
    isLoading,
    error,
    refreshTimeline,
  };
}