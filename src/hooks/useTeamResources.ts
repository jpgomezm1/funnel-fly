import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamResource, ResourceTag, ResourceDocument, NewResourceDocument } from '@/types/resources';

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
        .select('*, documents:team_resource_documents(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as any[]).map((r) => ({
        ...r,
        documents: (r.documents || []).sort(
          (a: ResourceDocument, b: ResourceDocument) => a.sort_order - b.sort_order
        ),
      })) as TeamResource[];
    },
  });

  // Calculate stats from documents
  const stats: ResourceStats = {
    total: resources.length,
    links: resources.filter(r =>
      (r.documents || []).some(d => d.document_type === 'link')
    ).length,
    files: resources.filter(r =>
      (r.documents || []).some(d => d.document_type === 'file')
    ).length,
    byTag: resources.reduce((acc, r) => {
      (r.tags || []).forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
  };

  // Upload file to storage
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

  // Create resource with documents
  const createMutation = useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string;
      tags: ResourceTag[];
      uploaded_by?: string;
      uploaded_by_name?: string;
      documents: NewResourceDocument[];
    }) => {
      const { documents, ...resourceData } = params;

      // 1. Create parent resource
      const { data: resource, error: resourceError } = await (supabase as any)
        .from('team_resources')
        .insert(resourceData)
        .select()
        .single();

      if (resourceError) throw resourceError;

      // 2. Upload files and build document rows
      const docRows: Omit<ResourceDocument, 'id' | 'created_at'>[] = [];

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        if (doc.document_type === 'file' && doc.file) {
          const { path } = await uploadFile(doc.file);
          docRows.push({
            resource_id: resource.id,
            document_type: 'file',
            file_path: path,
            file_name: doc.file.name,
            file_size: doc.file.size,
            mime_type: doc.file.type,
            sort_order: i,
          });
        } else if (doc.document_type === 'link' && doc.url) {
          docRows.push({
            resource_id: resource.id,
            document_type: 'link',
            url: doc.url,
            sort_order: i,
          });
        }
      }

      // 3. Insert documents
      if (docRows.length > 0) {
        const { error: docsError } = await (supabase as any)
          .from('team_resource_documents')
          .insert(docRows);

        if (docsError) throw docsError;
      }

      return resource as TeamResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-resources'] });
    },
  });

  // Add documents to existing resource
  const addDocumentsMutation = useMutation({
    mutationFn: async (params: {
      resourceId: string;
      documents: NewResourceDocument[];
    }) => {
      const { resourceId, documents } = params;

      // Get current max sort_order
      const { data: existing } = await (supabase as any)
        .from('team_resource_documents')
        .select('sort_order')
        .eq('resource_id', resourceId)
        .order('sort_order', { ascending: false })
        .limit(1);

      let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const docRows: Omit<ResourceDocument, 'id' | 'created_at'>[] = [];

      for (const doc of documents) {
        if (doc.document_type === 'file' && doc.file) {
          const { path } = await uploadFile(doc.file);
          docRows.push({
            resource_id: resourceId,
            document_type: 'file',
            file_path: path,
            file_name: doc.file.name,
            file_size: doc.file.size,
            mime_type: doc.file.type,
            sort_order: nextOrder++,
          });
        } else if (doc.document_type === 'link' && doc.url) {
          docRows.push({
            resource_id: resourceId,
            document_type: 'link',
            url: doc.url,
            sort_order: nextOrder++,
          });
        }
      }

      if (docRows.length > 0) {
        const { error } = await (supabase as any)
          .from('team_resource_documents')
          .insert(docRows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-resources'] });
    },
  });

  // Delete a single document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (doc: ResourceDocument) => {
      // If it's a file, remove from storage
      if (doc.document_type === 'file' && doc.file_path) {
        await supabase.storage
          .from('team-resources')
          .remove([doc.file_path]);
      }

      const { error } = await (supabase as any)
        .from('team_resource_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-resources'] });
    },
  });

  // Update resource (title, description, tags)
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<Omit<TeamResource, 'id' | 'created_at' | 'updated_at' | 'documents'>>;
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

  // Delete resource – clean up all document files from storage first
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get all file documents for this resource
      const { data: docs } = await (supabase as any)
        .from('team_resource_documents')
        .select('file_path, document_type')
        .eq('resource_id', id);

      // Remove files from storage
      const filePaths = (docs || [])
        .filter((d: any) => d.document_type === 'file' && d.file_path)
        .map((d: any) => d.file_path);

      if (filePaths.length > 0) {
        await supabase.storage
          .from('team-resources')
          .remove(filePaths);
      }

      // Also check legacy file_path on the resource itself
      const { data: resource } = await (supabase as any)
        .from('team_resources')
        .select('file_path')
        .eq('id', id)
        .single();

      if (resource?.file_path) {
        await supabase.storage
          .from('team-resources')
          .remove([resource.file_path]);
      }

      // Delete resource (CASCADE will delete child documents)
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

  return {
    resources,
    stats,
    isLoading,
    error,
    createResource: createMutation.mutateAsync,
    updateResource: updateMutation.mutateAsync,
    deleteResource: deleteMutation.mutateAsync,
    addDocuments: addDocumentsMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    uploadFile,
    getFileUrl,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingDocuments: addDocumentsMutation.isPending,
  };
}
