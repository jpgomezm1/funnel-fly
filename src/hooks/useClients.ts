import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientWithProjects, ClientContact, Deal } from '@/types/database';

export function useClients() {
  const queryClient = useQueryClient();

  // Fetch all clients with their projects and deals
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch projects for all clients
      const clientIds = clientsData.map(c => c.id);

      if (clientIds.length === 0) return [];

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('client_id', clientIds);

      if (projectsError) throw projectsError;

      // Fetch deals for all projects
      const projectIds = projectsData?.map(p => p.id) || [];

      let dealsData: Deal[] = [];
      if (projectIds.length > 0) {
        const { data, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .in('project_id', projectIds);

        if (dealsError) throw dealsError;
        dealsData = data || [];
      }

      // Combine data
      const clientsWithProjects: ClientWithProjects[] = clientsData.map(client => ({
        ...client,
        projects: projectsData
          ?.filter(p => p.client_id === client.id)
          .map(project => ({
            ...project,
            deal: dealsData.find(d => d.project_id === project.id),
          })) || [],
      }));

      return clientsWithProjects;
    },
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  // Calculate total MRR for a client
  const getClientMrr = (client: ClientWithProjects) => {
    return client.projects?.reduce((total, project) => {
      if (project.deal && project.deal.status === 'ACTIVE') {
        return total + project.deal.mrr_usd;
      }
      return total;
    }, 0) || 0;
  };

  // Get active deals count (projects with active contracts)
  const getActiveProjectsCount = (client: ClientWithProjects) => {
    return client.projects?.filter(p => p.deal?.status === 'ACTIVE').length || 0;
  };

  return {
    clients,
    isLoading,
    error,
    createClient: createClientMutation.mutateAsync,
    updateClient: updateClientMutation.mutate,
    isCreating: createClientMutation.isPending,
    getClientMrr,
    getActiveProjectsCount,
  };
}

// Hook for single client
export function useClient(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch deals for projects
      const projectIds = projectsData?.map(p => p.id) || [];

      let dealsData: Deal[] = [];
      if (projectIds.length > 0) {
        const { data, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .in('project_id', projectIds);

        if (dealsError) throw dealsError;
        dealsData = data || [];
      }

      const clientWithProjects: ClientWithProjects = {
        ...clientData,
        projects: projectsData?.map(project => ({
          ...project,
          deal: dealsData.find(d => d.project_id === project.id),
        })) || [],
      };

      return clientWithProjects;
    },
    enabled: !!clientId,
  });

  // Update client info mutation
  const updateClientMutation = useMutation({
    mutationFn: async (updates: Partial<Client>) => {
      if (!clientId) throw new Error('No client ID');
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const refreshClient = () => {
    queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
  };

  return {
    client,
    isLoading,
    error,
    refreshClient,
    updateClient: updateClientMutation.mutateAsync,
    isUpdating: updateClientMutation.isPending,
  };
}

// Hook for client contacts
export function useClientContacts(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['client-contacts', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ClientContact[];
    },
    enabled: !!clientId,
  });

  // Create contact
  const createContactMutation = useMutation({
    mutationFn: async (contactData: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('client_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return data as ClientContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
    },
  });

  // Update contact
  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: string; updates: Partial<ClientContact> }) => {
      const { error } = await supabase
        .from('client_contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
    },
  });

  // Delete contact
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
    },
  });

  // Set contact as primary
  const setPrimaryMutation = useMutation({
    mutationFn: async (contactId: string) => {
      // First, set all contacts as non-primary
      await supabase
        .from('client_contacts')
        .update({ is_primary: false })
        .eq('client_id', clientId);

      // Then set the selected one as primary
      const { error } = await supabase
        .from('client_contacts')
        .update({ is_primary: true })
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
    },
  });

  return {
    contacts,
    isLoading,
    error,
    createContact: createContactMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteContact: deleteContactMutation.mutateAsync,
    setPrimaryContact: setPrimaryMutation.mutateAsync,
    isCreating: createContactMutation.isPending,
    isUpdating: updateContactMutation.isPending,
    isDeleting: deleteContactMutation.isPending,
  };
}
