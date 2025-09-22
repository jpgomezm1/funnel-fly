import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStage, LeadStageHistory } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { useEmailNotifications } from './useEmailNotifications';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifyNewLead, notifyStageChange } = useEmailNotifications();

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
      // Encontrar el lead actual para obtener la etapa anterior
      const currentLead = leads.find(lead => lead.id === leadId);
      const previousStage = currentLead?.stage;

      const { error } = await supabase
        .from('leads')
        .update({ 
          stage: newStage,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Actualizar el estado local
      const updatedLead = {
        ...currentLead!,
        stage: newStage, 
        stage_entered_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      };

      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? updatedLead : lead
        )
      );

      // Enviar notificación de email si cambió de etapa
      if (previousStage && previousStage !== newStage) {
        try {
          await notifyStageChange(updatedLead, previousStage, newStage);
        } catch (emailError) {
          console.error('Error sending stage change notification:', emailError);
          // No mostrar error al usuario, es solo una notificación
        }
      }

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
      // Asegurar que los campos obligatorios tengan valores por defecto
      const leadToInsert = {
        company_name: leadData.company_name,
        contact_name: leadData.contact_name || null,
        contact_role: leadData.contact_role || null,
        phone: leadData.phone || null,
        email: leadData.email || null,
        channel: leadData.channel || 'OUTBOUND_APOLLO',
        subchannel: leadData.subchannel || 'NINGUNO',
        owner_id: leadData.owner_id || null,
        notes: leadData.notes || null,
        stage: 'PROSPECTO' as LeadStage,
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(leadToInsert)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setLeads(prevLeads => [data, ...prevLeads]);
      
      // Enviar notificación de email para nuevo lead
      try {
        await notifyNewLead(data);
      } catch (emailError) {
        console.error('Error sending new lead notification:', emailError);
        // No mostrar error al usuario, es solo una notificación
      }
      
      toast({
        title: 'Éxito',
        description: 'Lead creado correctamente',
      });

      return data;
    } catch (err) {
      console.error('Error creating lead:', err);
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