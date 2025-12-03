import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompanyDocument, DocumentType } from '@/types/database';

const BUCKET_NAME = 'company-documents';

interface UseCompanyDocumentsOptions {
  leadId?: string;
  clientId?: string;
}

export function useCompanyDocuments({ leadId, clientId }: UseCompanyDocumentsOptions) {
  const queryClient = useQueryClient();
  const entityId = leadId || clientId;
  const entityType = leadId ? 'lead' : 'client';

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['company-documents', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];

      if (leadId) {
        // Simple case: fetch by lead_id
        const { data, error } = await supabase
          .from('company_documents')
          .select('*')
          .eq('lead_id', leadId)
          .order('document_type', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as CompanyDocument[];
      } else if (clientId) {
        // For clients, we need to also check documents linked to original lead
        // First, get the client's original_lead_id
        const { data: clientData } = await supabase
          .from('clients')
          .select('original_lead_id')
          .eq('id', clientId)
          .single();

        // Build query - fetch documents for client_id OR original lead_id
        if (clientData?.original_lead_id) {
          // Fetch both client and lead documents
          const { data, error } = await supabase
            .from('company_documents')
            .select('*')
            .or(`client_id.eq.${clientId},lead_id.eq.${clientData.original_lead_id}`)
            .order('document_type', { ascending: true })
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data as CompanyDocument[];
        } else {
          // No original lead, just fetch by client_id
          const { data, error } = await supabase
            .from('company_documents')
            .select('*')
            .eq('client_id', clientId)
            .order('document_type', { ascending: true })
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data as CompanyDocument[];
        }
      }

      return [] as CompanyDocument[];
    },
    enabled: !!entityId,
  });

  // Upload document
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      file,
      documentType,
      notes,
    }: {
      file: File;
      documentType: DocumentType;
      notes?: string;
    }) => {
      if (!entityId) throw new Error('No entity ID provided');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${entityType}/${entityId}/${documentType}_${timestamp}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create document record
      const documentData: Partial<CompanyDocument> = {
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        notes: notes || undefined,
      };

      if (leadId) {
        documentData.lead_id = leadId;
      } else if (clientId) {
        documentData.client_id = clientId;
      }

      const { data, error: dbError } = await supabase
        .from('company_documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) {
        // If DB insert fails, try to delete the uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw dbError;
      }

      return data as CompanyDocument;
    },
    onSuccess: () => {
      // Invalidate all company-documents queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['company-documents'] });
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (document: CompanyDocument) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([document.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue anyway to delete the DB record
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      // Invalidate all company-documents queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['company-documents'] });
    },
  });

  // Get signed URL for viewing/downloading
  const getDocumentUrl = async (document: CompanyDocument): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  // Check if a document type already exists
  const hasDocumentType = (type: DocumentType): boolean => {
    return documents.some(doc => doc.document_type === type);
  };

  // Get document by type
  const getDocumentByType = (type: DocumentType): CompanyDocument | undefined => {
    return documents.find(doc => doc.document_type === type);
  };

  return {
    documents,
    isLoading,
    error,
    uploadDocument: uploadDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    getDocumentUrl,
    hasDocumentType,
    getDocumentByType,
    isUploading: uploadDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
