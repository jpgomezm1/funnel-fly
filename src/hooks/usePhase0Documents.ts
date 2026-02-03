import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Phase0Document, Phase0DocumentType } from '@/types/database';

interface UsePhase0DocumentsOptions {
  projectId?: string;
}

const BUCKET_NAME = 'company-documents';

export function usePhase0Documents({ projectId }: UsePhase0DocumentsOptions) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['phase0-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('phase0_documents')
        .select('*')
        .eq('phase0_project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Phase0Document[];
    },
    enabled: !!projectId,
  });

  // Add link document
  const addLinkMutation = useMutation({
    mutationFn: async ({
      name,
      url,
      notes,
    }: {
      name: string;
      url: string;
      notes?: string;
    }) => {
      if (!projectId) throw new Error('No project ID provided');

      const { data, error } = await supabase
        .from('phase0_documents')
        .insert({
          phase0_project_id: projectId,
          name,
          document_type: 'link' as Phase0DocumentType,
          url,
          notes: notes || null,
          uploaded_by: 'Usuario',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Phase0Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Upload file document
  const uploadFileMutation = useMutation({
    mutationFn: async ({
      file,
      name,
      notes,
    }: {
      file: File;
      name: string;
      notes?: string;
    }) => {
      if (!projectId) throw new Error('No project ID provided');

      // Upload file to storage
      const timestamp = Date.now();
      const filePath = `phase0-documents/${projectId}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error: dbError } = await supabase
        .from('phase0_documents')
        .insert({
          phase0_project_id: projectId,
          name,
          document_type: 'file' as Phase0DocumentType,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          notes: notes || null,
          uploaded_by: 'Usuario',
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data as Phase0Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: Phase0Document) => {
      // If it's a file, delete from storage first
      if (document.document_type === 'file' && document.file_path) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([document.file_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }

      // Delete record
      const { error: dbError } = await supabase
        .from('phase0_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase0-documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase0-projects'] });
    },
  });

  // Get signed URL for viewing/downloading files
  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents,
    isLoading,
    error,
    addLink: addLinkMutation.mutateAsync,
    uploadFile: uploadFileMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    getSignedUrl,
    isAddingLink: addLinkMutation.isPending,
    isUploading: uploadFileMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
