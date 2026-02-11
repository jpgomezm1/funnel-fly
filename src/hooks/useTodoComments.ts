import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TodoComment } from '@/types/database';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export function useTodoComments(todoId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { displayName } = useUserRole();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['todo-comments', todoId],
    queryFn: async () => {
      if (!todoId) return [];

      const { data, error } = await (supabase as any)
        .from('todo_comments')
        .select('*')
        .eq('todo_id', todoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TodoComment[];
    },
    enabled: !!todoId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!todoId) throw new Error('Todo ID required');

      const { data, error } = await (supabase as any)
        .from('todo_comments')
        .insert({
          todo_id: todoId,
          content,
          author_id: user?.id || 'unknown',
          author_name: displayName || 'Usuario',
        })
        .select()
        .single();

      if (error) throw error;
      return data as TodoComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-comments', todoId] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await (supabase as any)
        .from('todo_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-comments', todoId] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    comments,
    isLoading,
    createComment: createCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    isCreating: createCommentMutation.isPending,
  };
}
