import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectChecklistItem, ChecklistCategory, CHECKLIST_CATEGORY_ORDER } from '@/types/database';

interface UseProjectChecklistOptions {
  projectId?: string;
}

interface CreateChecklistItemData {
  title: string;
  description?: string;
  due_date?: string;
  notes?: string;
  category?: ChecklistCategory;
  is_required?: boolean;
  weight?: number;
}

interface UpdateChecklistItemData {
  title?: string;
  description?: string;
  due_date?: string;
  notes?: string;
  order_index?: number;
  category?: ChecklistCategory;
  is_required?: boolean;
  weight?: number;
}

export function useProjectChecklist({ projectId }: UseProjectChecklistOptions) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['project-checklist', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_checklist_items')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ProjectChecklistItem[];
    },
    enabled: !!projectId,
  });

  // Create item
  const createItemMutation = useMutation({
    mutationFn: async (data: CreateChecklistItemData) => {
      if (!projectId) throw new Error('No project ID provided');

      // Get max order_index for the category
      const categoryItems = items.filter(i => i.category === (data.category || 'general'));
      const maxIndex = categoryItems.length > 0
        ? Math.max(...categoryItems.map(i => i.order_index))
        : -1;

      const { data: result, error } = await supabase
        .from('project_checklist_items')
        .insert({
          project_id: projectId,
          title: data.title,
          description: data.description || null,
          due_date: data.due_date || null,
          notes: data.notes || null,
          category: data.category || 'general',
          is_required: data.is_required ?? true,
          weight: data.weight ?? 1,
          order_index: maxIndex + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return result as ProjectChecklistItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklist', projectId] });
    },
  });

  // Update item
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: UpdateChecklistItemData }) => {
      const { data, error } = await supabase
        .from('project_checklist_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectChecklistItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklist', projectId] });
    },
  });

  // Toggle completed
  const toggleCompletedMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('project_checklist_items')
        .update({
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? 'Usuario' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectChecklistItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklist', projectId] });
    },
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('project_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklist', projectId] });
    },
  });

  // Reorder items
  const reorderItemsMutation = useMutation({
    mutationFn: async (reorderedItems: { id: string; order_index: number }[]) => {
      const promises = reorderedItems.map(item =>
        supabase
          .from('project_checklist_items')
          .update({ order_index: item.order_index, updated_at: new Date().toISOString() })
          .eq('id', item.id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklist', projectId] });
    },
  });

  // Get overall progress stats
  const getProgress = () => {
    const total = items.length;
    const completed = items.filter(i => i.completed_at).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  };

  // Get weighted progress (considering weight of each item)
  const getWeightedProgress = () => {
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1), 0);
    const completedWeight = items
      .filter(i => i.completed_at)
      .reduce((sum, i) => sum + (i.weight || 1), 0);
    const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    return { totalWeight, completedWeight, percentage };
  };

  // Get progress by category
  const getProgressByCategory = () => {
    const progressByCategory: Record<ChecklistCategory, {
      total: number;
      completed: number;
      percentage: number;
      totalWeight: number;
      completedWeight: number;
    }> = {} as any;

    CHECKLIST_CATEGORY_ORDER.forEach(category => {
      const categoryItems = items.filter(i => i.category === category);
      const total = categoryItems.length;
      const completed = categoryItems.filter(i => i.completed_at).length;
      const totalWeight = categoryItems.reduce((sum, i) => sum + (i.weight || 1), 0);
      const completedWeight = categoryItems
        .filter(i => i.completed_at)
        .reduce((sum, i) => sum + (i.weight || 1), 0);

      progressByCategory[category] = {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        totalWeight,
        completedWeight,
      };
    });

    return progressByCategory;
  };

  // Get items grouped by category
  const getItemsByCategory = () => {
    const grouped: Record<ChecklistCategory, ProjectChecklistItem[]> = {
      kickoff: [],
      development: [],
      testing: [],
      delivery: [],
      general: [],
    };

    items.forEach(item => {
      const category = item.category || 'general';
      if (grouped[category]) {
        grouped[category].push(item);
      }
    });

    return grouped;
  };

  // Get pending items (not completed, sorted by due date)
  const getPendingItems = (limit?: number) => {
    const pending = items
      .filter(i => !i.completed_at)
      .sort((a, b) => {
        // Items with due dates first, sorted by date
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        // Then by category order
        const aIndex = CHECKLIST_CATEGORY_ORDER.indexOf(a.category || 'general');
        const bIndex = CHECKLIST_CATEGORY_ORDER.indexOf(b.category || 'general');
        return aIndex - bIndex;
      });

    return limit ? pending.slice(0, limit) : pending;
  };

  // Get overdue items
  const getOverdueItems = () => {
    const now = new Date();
    return items.filter(i =>
      !i.completed_at &&
      i.due_date &&
      new Date(i.due_date) < now
    );
  };

  return {
    items,
    isLoading,
    error,
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    toggleCompleted: toggleCompletedMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    reorderItems: reorderItemsMutation.mutateAsync,
    getProgress,
    getWeightedProgress,
    getProgressByCategory,
    getItemsByCategory,
    getPendingItems,
    getOverdueItems,
    isCreating: createItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
  };
}
