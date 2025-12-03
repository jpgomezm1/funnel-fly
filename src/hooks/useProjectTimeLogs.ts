import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TechTeamMemberId, TECH_TEAM_MEMBERS } from '@/types/database';

// DB schema has: logged_by (text), logged_date (date), hours (numeric)
interface ProjectTimeLogDB {
  id: string;
  project_id: string;
  task_id?: string;
  logged_by: string; // team member id
  hours: number;
  description?: string;
  logged_date: string;
  created_at: string;
  project_tasks?: { id: string; title: string };
}

export function useProjectTimeLogs(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: timeLogs = [], isLoading, error } = useQuery({
    queryKey: ['project-time-logs', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_time_logs')
        .select('*, project_tasks(id, title)')
        .eq('project_id', projectId)
        .order('logged_date', { ascending: false });

      if (error) throw error;
      return data as ProjectTimeLogDB[];
    },
    enabled: !!projectId,
  });

  // Create time log
  const createLogMutation = useMutation({
    mutationFn: async (logData: {
      project_id: string;
      task_id?: string;
      logged_by: string;
      logged_date: string;
      hours: number;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_time_logs')
        .insert(logData)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectTimeLogDB;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-time-logs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-metrics'] });
    },
  });

  // Update time log
  const updateLogMutation = useMutation({
    mutationFn: async ({ logId, updates }: {
      logId: string;
      updates: Partial<Omit<ProjectTimeLogDB, 'id' | 'project_id' | 'created_at'>>
    }) => {
      const { error } = await supabase
        .from('project_time_logs')
        .update(updates)
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-time-logs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-metrics'] });
    },
  });

  // Delete time log
  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('project_time_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-time-logs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tech-metrics'] });
    },
  });

  // Calculate total hours
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

  // Group by team member (logged_by)
  const hoursByMember = timeLogs.reduce((acc, log) => {
    if (!acc[log.logged_by]) {
      acc[log.logged_by] = 0;
    }
    acc[log.logged_by] += log.hours;
    return acc;
  }, {} as Record<string, number>);

  // Group by date (for charts)
  const hoursByDate = timeLogs.reduce((acc, log) => {
    if (!acc[log.logged_date]) {
      acc[log.logged_date] = 0;
    }
    acc[log.logged_date] += log.hours;
    return acc;
  }, {} as Record<string, number>);

  // Group by week
  const hoursByWeek = timeLogs.reduce((acc, log) => {
    const date = new Date(log.logged_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!acc[weekKey]) {
      acc[weekKey] = 0;
    }
    acc[weekKey] += log.hours;
    return acc;
  }, {} as Record<string, number>);

  return {
    timeLogs,
    totalHours,
    hoursByMember,
    hoursByDate,
    hoursByWeek,
    isLoading,
    error,
    createTimeLog: createLogMutation.mutateAsync,
    updateTimeLog: updateLogMutation.mutateAsync,
    deleteTimeLog: deleteLogMutation.mutateAsync,
    isCreating: createLogMutation.isPending,
    isUpdating: updateLogMutation.isPending,
  };
}

// Hook for fetching all time logs across projects (for metrics)
export function useAllTimeLogs() {
  const { data: timeLogs = [], isLoading, error } = useQuery({
    queryKey: ['all-time-logs'],
    queryFn: async () => {
      // Fetch time logs
      const { data: logsData, error: logsError } = await supabase
        .from('project_time_logs')
        .select('*')
        .order('logged_date', { ascending: false });

      if (logsError) throw logsError;

      // Fetch projects with clients
      const projectIds = [...new Set(logsData?.map(l => l.project_id) || [])];
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, client_id, clients(company_name)')
        .in('id', projectIds);

      // Map projects
      const projectMap = (projectsData || []).reduce((acc, p) => {
        acc[p.id] = { name: p.name, clientName: p.clients?.company_name || 'Sin cliente' };
        return acc;
      }, {} as Record<string, { name: string; clientName: string }>);

      // Combine
      return (logsData || []).map(log => ({
        ...log,
        projectName: projectMap[log.project_id]?.name || 'Unknown',
        clientName: projectMap[log.project_id]?.clientName || 'Unknown',
      }));
    },
  });

  // Calculate total hours by member (all time)
  const totalHoursByMember = timeLogs.reduce((acc, log) => {
    if (!acc[log.logged_by]) {
      acc[log.logged_by] = 0;
    }
    acc[log.logged_by] += log.hours;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total hours by project
  const totalHoursByProject = timeLogs.reduce((acc, log) => {
    if (!acc[log.project_id]) {
      acc[log.project_id] = { hours: 0, name: (log as any).projectName || 'Unknown' };
    }
    acc[log.project_id].hours += log.hours;
    return acc;
  }, {} as Record<string, { hours: number; name: string }>);

  return {
    timeLogs,
    totalHoursByMember,
    totalHoursByProject,
    isLoading,
    error
  };
}
