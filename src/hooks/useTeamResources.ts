import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamResource, ResourceTag } from '@/types/resources';

interface ResourceStats {
  total: number;
  links: number;
  files: number;
  byTag: Record<string, number>;
}

export function useTeamResources() {
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading, error } = useQuery({
    queryKey: ['team-resources'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('team_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TeamResource[];
    },
  });

  // Calculate stats
  const stats: ResourceStats = {
    total: resources.length,
    links: resources.filter(r => r.resource_type === 'link').length,
    files: resources.filter(r => r.resource_type === 'file').length,
    byTag: resources.reduce((acc, r) => {
      (r.tags || []).forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
  };

  // Create resource
  const createMutation = useMutation({
    mutationFn: async (resourceData: {
      title: string;
      description?: string;
      resource_type: 'link' | 'file';
      url?: string;
      file_path?: string;
      file_name?: string;
      file_size?: number;
      mime_type?: string;
      tags: ResourceTag[];
      uploaded_by?: string;
      uploaded_by_name?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('team_resources')
        .insert(resourceData)
        .select()
        .single();

      if (error) throw error;
      return data as TeamResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-resources'] });
    },
  });

  // Update resource
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<Omit<TeamResource, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { error } = await (supabase as any)
        .from('team_resources')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-resources'] });
    },
  });

  // Delete resource
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the resource to check if it has a file
      const { data: resource } = await (supabase as any)
        .from('team_resources')
        .select('file_path')
        .eq('id', id)
        .single();

      // If it has a file, delete it from storage
      if (resource?.file_path) {
        await supabase.storage
          .from('team-resources')
          .remove([resource.file_path]);
      }

      const { error } = await (supabase as any)
        .from('team_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-resources'] });
    },
  });

  // Upload file
  const uploadFile = async (file: File): Promise<{ path: string; url: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `resources/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('team-resources')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('team-resources')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  };

  // Get file URL
  const getFileUrl = (filePath: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from('team-resources')
      .getPublicUrl(filePath);
    return publicUrl;
  };

  return {
    resources,
    stats,
    isLoading,
    error,
    createResource: createMutation.mutateAsync,
    updateResource: updateMutation.mutateAsync,
    deleteResource: deleteMutation.mutateAsync,
    uploadFile,
    getFileUrl,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
