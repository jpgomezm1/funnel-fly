import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TodoAttachment } from '@/types/database';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export function useTodoAttachments(todoId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { displayName } = useUserRole();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['todo-attachments', todoId],
    queryFn: async () => {
      if (!todoId) return [];

      const { data, error } = await (supabase as any)
        .from('todo_attachments')
        .select('*')
        .eq('todo_id', todoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TodoAttachment[];
    },
    enabled: !!todoId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!todoId) throw new Error('Todo ID required');

      const fileExt = file.name.split('.').pop();
      const filePath = `${todoId}/${Date.now()}_${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase
        .storage
        .from('todo-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create record
      const { data, error } = await (supabase as any)
        .from('todo_attachments')
        .insert({
          todo_id: todoId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
          uploaded_by_name: displayName || 'Usuario',
        })
        .select()
        .single();

      if (error) throw error;
      return data as TodoAttachment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-attachments', todoId] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachment: TodoAttachment) => {
      // Delete from storage
      await supabase
        .storage
        .from('todo-attachments')
        .remove([attachment.file_path]);

      // Delete record
      const { error } = await (supabase as any)
        .from('todo_attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-attachments', todoId] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase
      .storage
      .from('todo-attachments')
      .createSignedUrl(filePath, 3600);

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    attachments,
    isLoading,
    upload: uploadMutation.mutateAsync,
    deleteAttachment: deleteMutation.mutateAsync,
    getSignedUrl,
    isUploading: uploadMutation.isPending,
  };
}
