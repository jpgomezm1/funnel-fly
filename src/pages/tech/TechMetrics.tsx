import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Timer,
  ListTodo,
  Code2,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTechMetrics } from '@/hooks/useTechMetrics';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@/types/database';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function TechMetrics() {
  const {
    teamMetrics,
    projectMetrics,
    hoursByDay,
    tasksByStatus,
    recentActivity,
    summary,
    isLoading,
  } = useTechMetrics();

  const { techMembers } = useTeamMembers();

  const findMemberByValue = (value: string | null | undefined) => {
    if (!value) return undefined;
    return techMembers.find(m => m.slug === value || m.slug.startsWith(value));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Tech Metrics
        </h1>
        <p className="text-muted-foreground">
          Métricas y rendimiento del equipo de desarrollo
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Code2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.totalProjects || 0}</p>
                <p className="text-xs text-muted-foreground">Proyectos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Timer className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.hoursThisWeek || 0}h</p>
                <p className="text-xs text-muted-foreground">Esta Semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.completedTasks || 0}</p>
                <p className="text-xs text-muted-foreground">Tareas Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                (summary?.blockedTasks || 0) > 0 ? "bg-red-100" : "bg-slate-100"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  (summary?.blockedTasks || 0) > 0 ? "text-red-600" : "text-slate-400"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.blockedTasks || 0}</p>
                <p className="text-xs text-muted-foreground">Bloqueadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Rendimiento del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMetrics.map((member) => (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                      member.color
                    )}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.hoursThisWeek}h esta semana
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{member.totalHours}h</p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-emerald-50 rounded">
                    <p className="text-lg font-bold text-emerald-600">{member.tasksCompleted}</p>
                    <p className="text-[10px] text-emerald-600">Completadas</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded">
                    <p className="text-lg font-bold text-amber-600">{member.tasksInProgress}</p>
                    <p className="text-[10px] text-amber-600">En Progreso</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-lg font-bold text-blue-600">{member.tasksAssigned}</p>
                    <p className="text-[10px] text-blue-600">Asignadas</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Distribución de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus && Object.entries(tasksByStatus).map(([status, count]) => {
              const total = summary?.totalTasks || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Badge className={cn("text-xs", TASK_STATUS_COLORS[status as keyof typeof TASK_STATUS_COLORS])}>
                      {TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS]}
                    </Badge>
                    <span className="font-medium">{count} ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Progreso por Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectMetrics.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/tech/projects/${project.id}`}
                  className="block hover:bg-muted/50 p-2 rounded -mx-2 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{project.clientName}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className={cn(
                          "font-bold text-sm",
                          project.progressPercentage >= 80 ? "text-emerald-600" :
                          project.progressPercentage >= 50 ? "text-blue-600" :
                          "text-amber-600"
                        )}>{project.progressPercentage}%</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={project.progressPercentage} className="h-1.5" />
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{project.tasksCompleted}/{project.tasksTotal} tareas</span>
                    <span>{project.totalHours}h registradas</span>
                  </div>
                </Link>
              ))}

              {projectMetrics.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin proyectos activos
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const member = findMemberByValue(activity.teamMember);

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0",
                      member?.color || 'bg-slate-500'
                    )}>
                      {member?.name.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{member?.name || 'Unknown'}</span>
                        <Badge variant="secondary" className="text-xs">
                          {activity.hours}h
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.projectName}
                        {activity.description && ` - ${activity.description}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(activity.date).toLocaleDateString('es-CO', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin actividad reciente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hours Chart (Simple bar representation) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Horas por Día (Últimos 30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {hoursByDay.map((day, i) => {
              const maxHours = Math.max(...hoursByDay.map(d => d.hours), 1);
              const heightPercentage = (day.hours / maxHours) * 100;
              const isToday = day.date === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end"
                  title={`${day.date}: ${day.hours}h`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      day.hours === 0 ? "bg-slate-100" :
                      isToday ? "bg-primary" : "bg-blue-400"
                    )}
                    style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {new Date(hoursByDay[0]?.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
            </span>
            <span>
              {new Date(hoursByDay[hoursByDay.length - 1]?.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-bold text-foreground">{summary?.totalHoursLogged || 0}h</span> registradas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
