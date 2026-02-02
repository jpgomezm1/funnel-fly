import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyWithProjects, CompanyStatus, LeadStage, LossReason, Deal } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { useEmailNotifications } from './useEmailNotifications';

// ── useCompanies: replaces useLeads + useClients ──────────────────────────────

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifyNewLead, notifyStageChange } = useEmailNotifications();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar empresas';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyStage = async (
    companyId: string,
    newStage: LeadStage,
    lossReason?: LossReason,
    lossReasonNotes?: string,
  ) => {
    try {
      const currentCompany = companies.find(c => c.id === companyId);
      const previousStage = currentCompany?.stage;

      const updateData: Record<string, unknown> = {
        stage: newStage,
        last_activity_at: new Date().toISOString(),
      };
      if (newStage === 'CERRADO_PERDIDO' && lossReason) {
        updateData.loss_reason = lossReason;
        updateData.loss_reason_notes = lossReasonNotes || null;
      }
      if (newStage === 'CERRADO_GANADO') {
        updateData.status = 'client';
      }

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(prev =>
        prev.map(c =>
          c.id === companyId
            ? { ...c, stage: newStage, last_activity_at: new Date().toISOString(), ...(updateData as Partial<Company>) }
            : c,
        ),
      );

      if (previousStage && previousStage !== newStage) {
        try {
          await notifyStageChange(currentCompany as any, previousStage as LeadStage, newStage);
        } catch {
          // silent
        }
      }

      toast({ title: 'Exito', description: 'Etapa actualizada correctamente' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar etapa';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const createCompany = async (data: Partial<Company> & { company_name: string }) => {
    try {
      const toInsert = {
        company_name: data.company_name,
        description: data.description || null,
        linkedin_url: data.linkedin_url || null,
        website_url: data.website_url || null,
        contact_name: data.contact_name || null,
        contact_role: data.contact_role || null,
        phone: data.phone || null,
        email: data.email || null,
        channel: data.channel || 'OUTBOUND_APOLLO',
        subchannel: data.subchannel || 'NINGUNO',
        owner_id: data.owner_id || null,
        notes: data.notes || null,
        stage: 'PROSPECTO',
        status: 'prospect' as CompanyStatus,
        product_tag: (data as any).product_tag || null,
      };

      const { data: created, error } = await supabase
        .from('companies')
        .insert(toInsert)
        .select()
        .single();

      if (error) throw error;

      try {
        await notifyNewLead(created as any);
      } catch {
        // silent
      }

      toast({ title: 'Exito', description: 'Empresa creada correctamente' });
      return created as Company;
    } catch (err) {
      console.error('Error creating company:', err);
      const message = err instanceof Error ? err.message : 'Error al crear empresa';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ ...updates, last_activity_at: new Date().toISOString() })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev =>
        prev.map(c => (c.id === companyId ? { ...c, ...data } : c)),
      );

      toast({ title: 'Exito', description: 'Empresa actualizada correctamente' });
      return data as Company;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar empresa';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const softDeleteCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(prev => prev.filter(c => c.id !== companyId));

      toast({ title: 'Exito', description: 'Empresa archivada correctamente' });
    } catch (err) {
      console.error('Error archiving company:', err);
      const message = err instanceof Error ? err.message : 'Error al archivar empresa';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      throw err;
    }
  };

  const addNote = async (companyId: string, note: string) => {
    try {
      const company = companies.find(c => c.id === companyId);
      if (!company) throw new Error('Empresa no encontrada');

      const timestamp = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newNote = `[${timestamp}] ${note}`;
      const updatedNotes = company.notes
        ? `${company.notes}\n\n${newNote}`
        : newNote;

      await updateCompany(companyId, { notes: updatedNotes });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar nota';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchCompanies();

    const channel = supabase
      .channel('companies-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        () => { fetchCompanies(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Convenience filters
  const prospects = useMemo(() => companies.filter(c => c.status === 'prospect'), [companies]);
  const clients = useMemo(() => companies.filter(c => c.status === 'client'), [companies]);

  return {
    companies,
    prospects,
    clients,
    loading,
    error,
    refetch: fetchCompanies,
    updateCompanyStage,
    createCompany,
    updateCompany,
    softDeleteCompany,
    addNote,
  };
}

// ── useCompany: single company with projects ─────────────────────────────────

export function useCompany(companyId?: string) {
  const queryClient = useQueryClient();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      const projectIds = projectsData?.map(p => p.id) || [];

      let dealsData: Deal[] = [];
      if (projectIds.length > 0) {
        const { data } = await supabase
          .from('deals')
          .select('*')
          .in('project_id', projectIds);
        dealsData = data || [];
      }

      const result: CompanyWithProjects = {
        ...companyData,
        projects: projectsData?.map(p => ({
          ...p,
          deal: dealsData.find(d => d.project_id === p.id),
        })) || [],
      };

      return result;
    },
    enabled: !!companyId,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (updates: Partial<Company>) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const refreshCompany = () => {
    queryClient.invalidateQueries({ queryKey: ['company', companyId] });
  };

  return {
    company,
    isLoading,
    error,
    refreshCompany,
    updateCompany: updateCompanyMutation.mutateAsync,
    isUpdating: updateCompanyMutation.isPending,
  };
}

// ── useCompaniesWithProjects: for Empresas listing ───────────────────────────

export function useCompaniesWithProjects() {
  return useQuery({
    queryKey: ['companies-with-projects'],
    queryFn: async () => {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      const companyIds = companiesData.map(c => c.id);
      if (companyIds.length === 0) return [];

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .in('company_id', companyIds);

      const projectIds = projectsData?.map(p => p.id) || [];

      let dealsData: Deal[] = [];
      if (projectIds.length > 0) {
        const { data } = await supabase
          .from('deals')
          .select('*')
          .in('project_id', projectIds);
        dealsData = data || [];
      }

      const result: CompanyWithProjects[] = companiesData.map(company => ({
        ...company,
        projects: projectsData
          ?.filter(p => p.company_id === company.id)
          .map(p => ({ ...p, deal: dealsData.find(d => d.project_id === p.id) })) || [],
      }));

      return result;
    },
  });
}

// ── useArchivedCompaniesCount: for Phase 4 ───────────────────────────────────

export function useArchivedCompaniesCount() {
  return useQuery({
    queryKey: ['archived-companies-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null);

      if (error) throw error;
      return count || 0;
    },
  });
}
