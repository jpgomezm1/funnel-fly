import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompanyContact } from '@/types/database';

export function useCompanyContacts(companyId?: string) {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['company-contacts', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CompanyContact[];
    },
    enabled: !!companyId,
  });

  const createContactMutation = useMutation({
    mutationFn: async (contactData: Omit<CompanyContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-contacts', companyId] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: string; updates: Partial<CompanyContact> }) => {
      const { error } = await supabase
        .from('company_contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-contacts', companyId] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('company_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-contacts', companyId] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await supabase
        .from('company_contacts')
        .update({ is_primary: false })
        .eq('company_id', companyId);

      const { error } = await supabase
        .from('company_contacts')
        .update({ is_primary: true })
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-contacts', companyId] });
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
