import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStage, LeadStageHistory } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar leads';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: LeadStage) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          stage: newStage,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Actualizar el estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { 
                ...lead, 
                stage: newStage, 
                stage_entered_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString()
              }
            : lead
        )
      );

      toast({
        title: 'Éxito',
        description: 'Etapa actualizada correctamente',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar etapa';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const createLead = async (leadData: Partial<Lead> & { company_name: string }) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          stage: 'PROSPECTO' as LeadStage,
        })
        .select()
        .single();

      if (error) throw error;

      setLeads(prevLeads => [data, ...prevLeads]);
      
      toast({
        title: 'Éxito',
        description: 'Lead creado correctamente',
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear lead';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          ...updates,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...lead, ...data } : lead
        )
      );

      toast({
        title: 'Éxito',
        description: 'Lead actualizado correctamente',
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar lead';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const addNote = async (leadId: string, note: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) throw new Error('Lead no encontrado');

      const timestamp = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newNote = `[${timestamp}] ${note}`;
      const updatedNotes = lead.notes 
        ? `${lead.notes}\n\n${newNote}`
        : newNote;

      await updateLead(leadId, { notes: updatedNotes });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar nota';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchLeads();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    updateLeadStage,
    createLead,
    updateLead,
    addNote,
  };
};

export const useLeadHistory = (leadId: string) => {
  const [history, setHistory] = useState<LeadStageHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!leadId) return;

      try {
        const { data, error } = await supabase
          .from('lead_stage_history')
          .select('*')
          .eq('lead_id', leadId)
          .order('changed_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Error al cargar historial:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [leadId]);

  return { history, loading };
};