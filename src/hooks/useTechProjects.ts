import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectWithTechDetails, ProjectExecutionStage } from '@/types/database';

// Hook to fetch won projects for the Tech module
export function useTechProjects() {
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['tech-projects'],
    queryFn: async () => {
      // Fetch only CERRADO_GANADO projects (won projects)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('stage', 'CERRADO_GANADO')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const projectIds = projectsData.map(p => p.id);
      const clientIds = [...new Set(projectsData.map(p => p.client_id))];

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientIds);

      if (clientsError) throw clientsError;

      // Fetch deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .in('project_id', projectIds);

      if (dealsError) throw dealsError;

      // Fetch repositories
      const { data: reposData, error: reposError } = await supabase
        .from('project_repositories')
        .select('*')
        .in('project_id', projectIds);

      if (reposError) throw reposError;

      // Fetch tasks (only main counts for overview)
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('id, project_id, status, priority, assigned_to')
        .in('project_id', projectIds)
        .is('parent_task_id', null);

      if (tasksError) throw tasksError;

      // Fetch time logs (aggregated)
      const { data: timeLogsData, error: timeLogsError } = await supabase
        .from('project_time_logs')
        .select('project_id, hours')
        .in('project_id', projectIds);

      if (timeLogsError) throw timeLogsError;

      // Combine data
      const projectsWithDetails: (ProjectWithTechDetails & {
        taskStats: {
          total: number;
          completed: number;
          inProgress: number;
          blocked: number;
        };
        totalHours: number;
      })[] = projectsData.map(project => {
        const projectTasks = tasksData?.filter(t => t.project_id === project.id) || [];
        const projectHours = timeLogsData?.filter(t => t.project_id === project.id)
          .reduce((sum, t) => sum + t.hours, 0) || 0;

        return {
          ...project,
          client: clientsData?.find(c => c.id === project.client_id),
          deal: dealsData?.find(d => d.project_id === project.id),
          repositories: reposData?.filter(r => r.project_id === project.id) || [],
          taskStats: {
            total: projectTasks.length,
            completed: projectTasks.filter(t => t.status === 'done').length,
            inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
            blocked: projectTasks.filter(t => t.status === 'blocked').length,
          },
          totalHours: projectHours,
        };
      });

      return projectsWithDetails;
    },
  });

  // Filter by execution stage
  const projectsByStage = (stage: ProjectExecutionStage) =>
    projects.filter(p => (p.execution_stage || 'ONBOARDING') === stage);

  // Get active projects (not churned)
  const activeProjects = projects.filter(p => p.execution_stage !== 'CHURNED');

  // Get projects with blocked tasks
  const projectsWithBlockers = projects.filter(p => p.taskStats.blocked > 0);

  // Stats
  const stats = {
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    onboarding: projectsByStage('ONBOARDING').length,
    inProgress: projectsByStage('IN_PROGRESS').length,
    delivered: projectsByStage('DELIVERED').length,
    active: projectsByStage('ACTIVE').length,
    churned: projectsByStage('CHURNED').length,
    totalHours: projects.reduce((sum, p) => sum + p.totalHours, 0),
    totalTasks: projects.reduce((sum, p) => sum + p.taskStats.total, 0),
    completedTasks: projects.reduce((sum, p) => sum + p.taskStats.completed, 0),
    blockedTasks: projects.reduce((sum, p) => sum + p.taskStats.blocked, 0),
  };

  return {
    projects,
    activeProjects,
    projectsWithBlockers,
    projectsByStage,
    stats,
    isLoading,
    error,
  };
}

// Hook for a single tech project with full details
export function useTechProject(projectId?: string) {
  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['tech-project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', projectData.client_id)
        .single();

      // Fetch deal
      const { data: dealData } = await supabase
        .from('deals')
        .select('*')
        .eq('project_id', projectId)
        .single();

      // Fetch repositories
      const { data: reposData } = await supabase
        .from('project_repositories')
        .select('*')
        .eq('project_id', projectId);

      // Fetch tasks count
      const { data: tasksData } = await supabase
        .from('project_tasks')
        .select('id, status')
        .eq('project_id', projectId)
        .is('parent_task_id', null);

      // Fetch total hours
      const { data: timeLogsData } = await supabase
        .from('project_time_logs')
        .select('hours')
        .eq('project_id', projectId);

      const totalHours = timeLogsData?.reduce((sum, t) => sum + t.hours, 0) || 0;
      const tasks = tasksData || [];

      return {
        ...projectData,
        client: clientData,
        deal: dealData,
        repositories: reposData || [],
        taskStats: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'done').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          blocked: tasks.filter(t => t.status === 'blocked').length,
        },
        totalHours,
      } as ProjectWithTechDetails & {
        taskStats: { total: number; completed: number; inProgress: number; blocked: number };
        totalHours: number;
      };
    },
    enabled: !!projectId,
  });

  return {
    project,
    isLoading,
    error,
    refetch,
  };
}
