import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TechTeamMemberId, TaskStatus } from '@/types/database';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface TeamMemberMetrics {
  id: TechTeamMemberId;
  name: string;
  color: string;
  totalHours: number;
  hoursThisWeek: number;
  hoursThisMonth: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksAssigned: number;
}

interface ProjectMetrics {
  id: string;
  name: string;
  clientName: string;
  totalHours: number;
  tasksTotal: number;
  tasksCompleted: number;
  progressPercentage: number;
}

export function useTechMetrics() {
  const { techMembers } = useTeamMembers();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tech-metrics', techMembers.map(m => m.slug)],
    enabled: techMembers.length > 0,
    queryFn: async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all time logs
      const { data: timeLogs, error: timeLogsError } = await supabase
        .from('project_time_logs')
        .select('*')
        .order('logged_date', { ascending: false });

      if (timeLogsError) throw timeLogsError;

      // Fetch all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .is('parent_task_id', null);

      if (tasksError) throw tasksError;

      // Fetch won projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*, clients(company_name)')
        .eq('stage', 'CERRADO_GANADO');

      if (projectsError) throw projectsError;

      // Calculate team member metrics
      const teamMetrics: TeamMemberMetrics[] = techMembers.map(member => {
        const memberLogs = timeLogs?.filter(l => l.logged_by === member.slug || member.slug.startsWith(l.logged_by)) || [];
        const memberTasks = tasks?.filter(t => t.assigned_to === member.slug || (t.assigned_to && member.slug.startsWith(t.assigned_to))) || [];

        const totalHours = memberLogs.reduce((sum, l) => sum + l.hours, 0);

        const hoursThisWeek = memberLogs
          .filter(l => new Date(l.logged_date) >= startOfWeek)
          .reduce((sum, l) => sum + l.hours, 0);

        const hoursThisMonth = memberLogs
          .filter(l => new Date(l.logged_date) >= startOfMonth)
          .reduce((sum, l) => sum + l.hours, 0);

        return {
          id: member.slug as TechTeamMemberId,
          name: member.name,
          color: member.color,
          totalHours,
          hoursThisWeek,
          hoursThisMonth,
          tasksCompleted: memberTasks.filter(t => t.status === 'done').length,
          tasksInProgress: memberTasks.filter(t => t.status === 'in_progress').length,
          tasksAssigned: memberTasks.length,
        };
      });

      // Calculate project metrics
      const projectMetrics: ProjectMetrics[] = (projects || []).map(project => {
        const projectLogs = timeLogs?.filter(l => l.project_id === project.id) || [];
        const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];

        const totalHours = projectLogs.reduce((sum, l) => sum + l.hours, 0);
        const tasksCompleted = projectTasks.filter(t => t.status === 'done').length;
        const tasksTotal = projectTasks.length;

        return {
          id: project.id,
          name: project.name,
          clientName: project.clients?.company_name || 'Sin cliente',
          totalHours,
          tasksTotal,
          tasksCompleted,
          progressPercentage: tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
        };
      });

      // Calculate hours by day for the last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      const hoursByDay = last30Days.map(date => {
        const dayLogs = timeLogs?.filter(l => l.logged_date === date) || [];
        return {
          date,
          hours: dayLogs.reduce((sum, l) => sum + l.hours, 0),
          byMember: techMembers.reduce((acc, member) => {
            acc[member.slug as TechTeamMemberId] = dayLogs
              .filter(l => l.logged_by === member.slug || member.slug.startsWith(l.logged_by))
              .reduce((sum, l) => sum + l.hours, 0);
            return acc;
          }, {} as Record<TechTeamMemberId, number>),
        };
      });

      // Task status distribution
      const tasksByStatus: Record<TaskStatus, number> = {
        backlog: tasks?.filter(t => t.status === 'backlog').length || 0,
        todo: tasks?.filter(t => t.status === 'todo').length || 0,
        in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        in_review: tasks?.filter(t => t.status === 'in_review').length || 0,
        done: tasks?.filter(t => t.status === 'done').length || 0,
        blocked: tasks?.filter(t => t.status === 'blocked').length || 0,
      };

      // Get project names for recent activity
      const projectMap = (projects || []).reduce((acc, p) => {
        acc[p.id] = { name: p.name, clientName: p.clients?.company_name || 'Sin cliente' };
        return acc;
      }, {} as Record<string, { name: string; clientName: string }>);

      // Recent activity (last 10 time logs)
      const recentActivity = (timeLogs || []).slice(0, 10).map(log => ({
        id: log.id,
        date: log.logged_date,
        hours: log.hours,
        description: log.description,
        teamMember: log.logged_by,
        projectName: projectMap[log.project_id]?.name || 'Unknown',
        clientName: projectMap[log.project_id]?.clientName || 'Unknown',
      }));

      // Summary stats
      const summary = {
        totalProjects: projects?.length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.status === 'done').length || 0,
        blockedTasks: tasks?.filter(t => t.status === 'blocked').length || 0,
        totalHoursLogged: timeLogs?.reduce((sum, l) => sum + l.hours, 0) || 0,
        hoursThisWeek: timeLogs
          ?.filter(l => new Date(l.logged_date) >= startOfWeek)
          .reduce((sum, l) => sum + l.hours, 0) || 0,
        hoursThisMonth: timeLogs
          ?.filter(l => new Date(l.logged_date) >= startOfMonth)
          .reduce((sum, l) => sum + l.hours, 0) || 0,
        avgHoursPerProject: projects?.length
          ? Math.round((timeLogs?.reduce((sum, l) => sum + l.hours, 0) || 0) / projects.length)
          : 0,
      };

      return {
        teamMetrics,
        projectMetrics,
        hoursByDay,
        tasksByStatus,
        recentActivity,
        summary,
      };
    },
  });

  return {
    teamMetrics: data?.teamMetrics || [],
    projectMetrics: data?.projectMetrics || [],
    hoursByDay: data?.hoursByDay || [],
    tasksByStatus: data?.tasksByStatus,
    recentActivity: data?.recentActivity || [],
    summary: data?.summary,
    isLoading,
    error,
  };
}
