import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ProjectEvent,
  ProjectEventType,
  ChangeRequestStatus,
  ChangeImpact,
  FeedbackSentiment,
} from '@/types/database';

interface UseProjectEventsOptions {
  projectId?: string;
}

interface CreateEventData {
  event_type: ProjectEventType;
  title: string;
  description?: string;
  event_date?: string;
  // Meeting specific
  transcript?: string;
  transcript_summary?: string;
  meeting_attendees?: string[];
  meeting_duration_minutes?: number;
  // Change request specific
  change_request_status?: ChangeRequestStatus;
  change_impact?: ChangeImpact;
  // Feedback specific
  feedback_sentiment?: FeedbackSentiment;
  // General
  created_by?: string;
}

interface UpdateEventData {
  title?: string;
  description?: string;
  event_date?: string;
  transcript?: string;
  transcript_summary?: string;
  meeting_attendees?: string[];
  meeting_duration_minutes?: number;
  change_request_status?: ChangeRequestStatus;
  change_impact?: ChangeImpact;
  feedback_sentiment?: FeedbackSentiment;
}

export function useProjectEvents({ projectId }: UseProjectEventsOptions) {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['project-events', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data as ProjectEvent[];
    },
    enabled: !!projectId,
  });

  // Create event
  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventData) => {
      if (!projectId) throw new Error('No project ID provided');

      const { data: result, error } = await supabase
        .from('project_events')
        .insert({
          project_id: projectId,
          event_type: data.event_type,
          title: data.title,
          description: data.description || null,
          event_date: data.event_date || new Date().toISOString(),
          transcript: data.transcript || null,
          transcript_summary: data.transcript_summary || null,
          meeting_attendees: data.meeting_attendees || null,
          meeting_duration_minutes: data.meeting_duration_minutes || null,
          change_request_status: data.change_request_status || null,
          change_impact: data.change_impact || null,
          feedback_sentiment: data.feedback_sentiment || null,
          created_by: data.created_by || 'Usuario',
        })
        .select()
        .single();

      if (error) throw error;
      return result as ProjectEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });

  // Update event
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: UpdateEventData }) => {
      const { data, error } = await supabase
        .from('project_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });

  // Delete event
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });

  // Update change request status
  const updateChangeRequestStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: ChangeRequestStatus }) => {
      const { data, error } = await supabase
        .from('project_events')
        .update({
          change_request_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });

  // Get stats
  const getStats = () => {
    const meetings = events.filter(e => e.event_type === 'meeting').length;
    const changeRequests = events.filter(e => e.event_type === 'change_request');
    const pendingChangeRequests = changeRequests.filter(e => e.change_request_status === 'pending').length;
    const feedback = events.filter(e => e.event_type === 'feedback');
    const positiveFeedback = feedback.filter(e => e.feedback_sentiment === 'positive').length;
    const negativeFeedback = feedback.filter(e => e.feedback_sentiment === 'negative').length;
    const deliveries = events.filter(e => e.event_type === 'delivery').length;
    const incidents = events.filter(e => e.event_type === 'incident').length;

    return {
      total: events.length,
      meetings,
      changeRequests: changeRequests.length,
      pendingChangeRequests,
      feedback: feedback.length,
      positiveFeedback,
      negativeFeedback,
      deliveries,
      incidents,
    };
  };

  // Get events by type
  const getEventsByType = (type: ProjectEventType) => {
    return events.filter(e => e.event_type === type);
  };

  // Get recent events (last 30 days)
  const getRecentEvents = (days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return events.filter(e => new Date(e.event_date) >= cutoffDate);
  };

  return {
    events,
    isLoading,
    error,
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    updateChangeRequestStatus: updateChangeRequestStatusMutation.mutateAsync,
    getStats,
    getEventsByType,
    getRecentEvents,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
}
