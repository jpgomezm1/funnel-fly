import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Call, CallTeamMember, CallResult, CallSource } from '@/types/calls';
import { startOfWeek, endOfWeek } from 'date-fns';

// Function to send email notification for new calls
async function sendCallNotification(callData: Call) {
  try {
    const { error } = await supabase.functions.invoke('send-call-notification', {
      body: {
        callData: {
          id: callData.id,
          scheduled_at: callData.scheduled_at,
          company_name: callData.company_name,
          contact_name: callData.contact_name,
          contact_phone: callData.contact_phone,
          contact_email: callData.contact_email,
          team_member: callData.team_member,
          source: callData.source,
          notes: callData.notes,
        },
      },
    });

    if (error) {
      console.error('Error sending call notification:', error);
    } else {
      console.log('Call notification sent successfully');
    }
  } catch (error) {
    console.error('Error invoking send-call-notification function:', error);
  }
}

interface UseCallsOptions {
  upcoming?: boolean;
  teamMember?: CallTeamMember | 'all';
  result?: CallResult | 'all';
  source?: CallSource | 'all';
  dateStart?: Date | null;
  dateEnd?: Date | null;
}

// Hook for fetching calls with filters
export function useCalls(options: UseCallsOptions = {}) {
  const { upcoming, teamMember, result, source, dateStart, dateEnd } = options;

  return useQuery({
    queryKey: ['calls', { upcoming, teamMember, result, source, dateStart: dateStart?.toISOString(), dateEnd: dateEnd?.toISOString() }],
    queryFn: async (): Promise<Call[]> => {
      let query = supabase
        .from('calls')
        .select('*')
        .order('scheduled_at', { ascending: upcoming ?? true });

      // Filter by date range
      if (dateStart) {
        query = query.gte('scheduled_at', dateStart.toISOString());
      }
      if (dateEnd) {
        query = query.lte('scheduled_at', dateEnd.toISOString());
      }

      // Filter by upcoming/past (only if no date range specified)
      if (!dateStart && !dateEnd) {
        const now = new Date().toISOString();
        if (upcoming === true) {
          query = query.gte('scheduled_at', now);
        } else if (upcoming === false) {
          query = query.lt('scheduled_at', now);
        }
      }

      // Filter by team member
      if (teamMember && teamMember !== 'all') {
        query = query.eq('team_member', teamMember);
      }

      // Filter by result
      if (result && result !== 'all') {
        query = query.eq('call_result', result);
      }

      // Filter by source
      if (source && source !== 'all') {
        query = query.eq('source', source);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching calls:', error);
        throw error;
      }

      return data as Call[];
    },
  });
}

// Hook for fetching all calls (for analytics)
export function useAllCalls() {
  return useQuery({
    queryKey: ['calls-all'],
    queryFn: async (): Promise<Call[]> => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) {
        console.error('Error fetching all calls:', error);
        throw error;
      }

      return data as Call[];
    },
  });
}

// Hook for weekly metrics
export function useCallsWeeklyMetrics() {
  return useQuery({
    queryKey: ['calls-weekly-metrics'],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // Get all calls for this week
      const { data: calls, error } = await supabase
        .from('calls')
        .select('*')
        .gte('scheduled_at', weekStart)
        .lte('scheduled_at', weekEnd);

      if (error) {
        console.error('Error fetching weekly metrics:', error);
        throw error;
      }

      const allCalls = calls as Call[];
      const pastCalls = allCalls.filter(
        (c) => new Date(c.scheduled_at) < now && c.call_result
      );

      return {
        totalCalls: allCalls.length,
        completedCalls: pastCalls.length,
        pasaFase0: pastCalls.filter((c) => c.call_result === 'lead_pasa_fase_0').length,
        noCalifica: pastCalls.filter((c) => c.call_result === 'lead_no_califica').length,
        reunionAdicional: pastCalls.filter(
          (c) => c.call_result === 'lead_quiere_reunion_adicional'
        ).length,
      };
    },
  });
}

// Hook for call mutations
export function useCallMutations() {
  const queryClient = useQueryClient();

  const createCall = useMutation({
    mutationFn: async (
      callData: Omit<Call, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const { data, error } = await supabase
        .from('calls')
        .insert(callData)
        .select()
        .single();

      if (error) throw error;
      return data as Call;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['calls-weekly-metrics'] });
      toast({
        title: 'Exito',
        description: 'Llamada creada correctamente',
      });
      // Send email notification (fire and forget)
      sendCallNotification(data);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al crear llamada: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateCall = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Call> & { id: string }) => {
      const { data, error } = await supabase
        .from('calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Call;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['calls-weekly-metrics'] });
      toast({
        title: 'Exito',
        description: 'Llamada actualizada correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al actualizar llamada: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteCall = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calls').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['calls-weekly-metrics'] });
      toast({
        title: 'Exito',
        description: 'Llamada eliminada correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al eliminar llamada: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    createCall: createCall.mutateAsync,
    updateCall: updateCall.mutateAsync,
    deleteCall: deleteCall.mutateAsync,
    isCreating: createCall.isPending,
    isUpdating: updateCall.isPending,
    isDeleting: deleteCall.isPending,
  };
}
