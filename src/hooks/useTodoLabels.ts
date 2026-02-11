import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TodoLabel } from '@/types/database';

export function useTodoLabels() {
  const queryClient = useQueryClient();

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['todo-labels'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('todo_labels')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as TodoLabel[];
    },
  });

  const assignLabelMutation = useMutation({
    mutationFn: async ({ todoId, labelId }: { todoId: string; labelId: string }) => {
      const { error } = await (supabase as any)
        .from('todo_label_assignments')
        .insert({ todo_id: todoId, label_id: labelId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const removeLabelMutation = useMutation({
    mutationFn: async ({ todoId, labelId }: { todoId: string; labelId: string }) => {
      const { error } = await (supabase as any)
        .from('todo_label_assignments')
        .delete()
        .eq('todo_id', todoId)
        .eq('label_id', labelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    labels,
    isLoading,
    assignLabel: assignLabelMutation.mutateAsync,
    removeLabel: removeLabelMutation.mutateAsync,
  };
}
