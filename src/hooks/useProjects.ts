import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectStage, ProjectWithRelations, Deal, DealStatus, DealCurrency, Client } from '@/types/database';

// Hook to fetch all projects for the pipeline (with client info)
export function usePipelineProjects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['pipeline-projects'],
    queryFn: async () => {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('stage_entered_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch clients for all projects
      const clientIds = [...new Set(projectsData.map(p => p.client_id))];

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientIds);

      if (clientsError) throw clientsError;

      // Fetch deals for closed projects
      const projectIds = projectsData.map(p => p.id);

      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .in('project_id', projectIds);

      if (dealsError) throw dealsError;

      // Combine data
      const projectsWithRelations: ProjectWithRelations[] = projectsData.map(project => ({
        ...project,
        client: clientsData?.find(c => c.id === project.client_id),
        deal: dealsData?.find(d => d.project_id === project.id),
      }));

      return projectsWithRelations;
    },
  });

  // Update project stage
  const updateStageMutation = useMutation({
    mutationFn: async ({ projectId, newStage }: { projectId: string; newStage: ProjectStage }) => {
      const { error } = await supabase
        .from('projects')
        .update({
          stage: newStage,
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
  });

  return {
    projects,
    isLoading,
    error,
    updateProjectStage: updateStageMutation.mutateAsync,
  };
}

// Hook to fetch projects for a specific client
export function useProjects(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch deals for projects
      const projectIds = projectsData?.map(p => p.id) || [];

      if (projectIds.length === 0) return projectsData;

      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .in('project_id', projectIds);

      if (dealsError) throw dealsError;

      return projectsData.map(project => ({
        ...project,
        deal: dealsData?.find(d => d.project_id === project.id),
      }));
    },
    enabled: !!clientId,
  });

  // Create new project (for existing client, starts in DEMOSTRACION)
  const createProjectMutation = useMutation({
    mutationFn: async ({ clientId, name }: { clientId: string; name: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          client_id: clientId,
          name,
          stage: 'DEMOSTRACION',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
  });

  // Update project
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: Partial<Project> }) => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
  });

  // Create project with deal (for already closed projects)
  const createProjectWithDealMutation = useMutation({
    mutationFn: async ({
      clientId,
      name,
      deal,
    }: {
      clientId: string;
      name: string;
      deal: {
        currency: DealCurrency;
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
      // Create project in CERRADO_GANADO stage
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: clientId,
          name,
          stage: 'CERRADO_GANADO',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create deal for project
      const { error: dealError } = await supabase
        .from('deals')
        .insert({
          project_id: projectData.id,
          ...deal,
        });

      if (dealError) throw dealError;

      return projectData as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createProjectMutation.mutateAsync,
    createProjectWithDeal: createProjectWithDealMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending || createProjectWithDealMutation.isPending,
  };
}

// Hook to convert a lead to client + project (when reaching DEMOSTRACION)
export function useConvertLeadToProject() {
  const queryClient = useQueryClient();

  const convertMutation = useMutation({
    mutationFn: async ({
      lead,
      projectName,
      projectDescription,
    }: {
      lead: {
        id: string;
        company_name: string;
        contact_name?: string;
        contact_role?: string;
        phone?: string;
        email?: string;
        notes?: string;
        description?: string;
        linkedin_url?: string;
        website_url?: string;
      };
      projectName: string;
      projectDescription?: string;
    }) => {
      // 1. Check if client already exists for this lead
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('original_lead_id', lead.id)
        .maybeSingle();

      let clientId: string;
      let isNewClient = false;

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        isNewClient = true;
        // 2. Create client with all lead data including description, linkedin, website
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_name: lead.company_name,
            contact_name: lead.contact_name,
            contact_role: lead.contact_role,
            phone: lead.phone,
            email: lead.email,
            notes: lead.notes,
            description: lead.description,
            linkedin_url: lead.linkedin_url,
            website_url: lead.website_url,
            original_lead_id: lead.id,
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = clientData.id;

        // 3. Migrate contacts from lead_contacts to client_contacts
        const { data: leadContacts } = await supabase
          .from('lead_contacts')
          .select('name, role, email, phone, description, is_primary')
          .eq('lead_id', lead.id);

        if (leadContacts && leadContacts.length > 0) {
          const clientContacts = leadContacts.map(contact => ({
            client_id: clientId,
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            description: contact.description,
            is_primary: contact.is_primary,
          }));

          await supabase.from('client_contacts').insert(clientContacts);
        }

        // 4. Link existing company_documents to the new client
        await supabase
          .from('company_documents')
          .update({ client_id: clientId })
          .eq('lead_id', lead.id);
      }

      // 5. Create project in DEMOSTRACION stage
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: clientId,
          lead_id: lead.id,
          name: projectName,
          description: projectDescription,
          stage: 'DEMOSTRACION',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 6. Migrate lead activities to project
      await supabase
        .from('lead_activities')
        .update({ project_id: projectData.id })
        .eq('lead_id', lead.id);

      // 7. Mark lead as DEMOSTRACION (so it doesn't appear in early stages)
      await supabase
        .from('leads')
        .update({ stage: 'DEMOSTRACION' })
        .eq('id', lead.id);

      return { clientId, project: projectData, isNewClient };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['company-documents'] });
    },
  });

  return {
    convertLeadToProject: convertMutation.mutateAsync,
    isConverting: convertMutation.isPending,
  };
}

// Hook to create deal when project closes (CERRADO_GANADO)
export function useCreateDealForProject() {
  const queryClient = useQueryClient();

  const createDealMutation = useMutation({
    mutationFn: async ({
      projectId,
      leadId,
      proposalId,
      dealData,
    }: {
      projectId: string;
      leadId: string;
      proposalId?: string;
      dealData: {
        currency: DealCurrency;
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
      // 1. Create the deal with proposal_id
      const { data, error } = await supabase
        .from('deals')
        .insert({
          project_id: projectId,
          lead_id: leadId,
          proposal_id: proposalId,
          ...dealData,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Update project stage to CERRADO_GANADO
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          stage: 'CERRADO_GANADO',
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // 3. Update lead stage to CERRADO_GANADO
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          stage: 'CERRADO_GANADO',
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (leadError) throw leadError;

      // 4. Mark the selected proposal as final (if one was selected)
      if (proposalId) {
        // First unset all proposals for this project
        await supabase
          .from('proposals')
          .update({ is_final: false })
          .eq('project_id', projectId);

        // Then set the selected one as final
        await supabase
          .from('proposals')
          .update({ is_final: true })
          .eq('id', proposalId);
      }

      return data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  return {
    createDeal: createDealMutation.mutateAsync,
    isCreating: createDealMutation.isPending,
  };
}
