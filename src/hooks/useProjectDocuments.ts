import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectDocument, ProjectDocumentType } from '@/types/database';

interface UseProjectDocumentsOptions {
  projectId?: string;
}

const BUCKET_NAME = 'company-documents';

export function useProjectDocuments({ projectId }: UseProjectDocumentsOptions) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectDocument[];
    },
    enabled: !!projectId,
  });

  // Upload document
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      file,
      documentType,
      name,
      notes,
    }: {
      file: File;
      documentType: ProjectDocumentType;
      name: string;
      notes?: string;
    }) => {
      if (!projectId) throw new Error('No project ID provided');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `project-documents/${projectId}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { data: result, error: dbError } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          name: name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          notes: notes || null,
          uploaded_by: 'Usuario',
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return result as ProjectDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: ProjectDocument) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([document.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue anyway to delete the record
      }

      // Delete record
      const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
    },
  });

  // Get signed URL for viewing/downloading
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
    uploadDocument: uploadDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    getSignedUrl,
    isUploading: uploadDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
