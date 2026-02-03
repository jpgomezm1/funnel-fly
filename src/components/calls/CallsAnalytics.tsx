import { useMemo, useState } from 'react';
import {
  format,
  getDay,
  getHours,
  startOfDay,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
  subWeeks,
  subMonths,
  getWeek,
  isSameWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Call,
  CallTeamMember,
  CallSource,
  CallResult,
  TEAM_MEMBER_LABELS,
  CALL_SOURCE_LABELS,
  CALL_RESULT_LABELS,
} from '@/types/calls';
import {
  Phone,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  CalendarClock,
  BarChart3,
  Trophy,
  Flame,
  Award,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallsAnalyticsProps {
  calls: Call[];
  title?: string;
}

// Weekly goal per person
const WEEKLY_GOAL = 10;

// Colors for charts
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

const TEAM_COLORS: Record<CallTeamMember, string> = {
  juan_pablo: '#3B82F6',  // Blue
  sara: '#F97316',        // Orange - clearly distinct from blue
  agustin: '#10B981',     // Green
};

const TEAM_COLORS_LIGHT: Record<CallTeamMember, string> = {
  juan_pablo: 'bg-blue-100 text-blue-700 border-blue-200',
  sara: 'bg-orange-100 text-orange-700 border-orange-200',
  agustin: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const RESULT_COLORS: Record<CallResult, string> = {
  lead_no_califica: '#EF4444',
  lead_pasa_fase_0: '#10B981',
  lead_quiere_reunion_adicional: '#F59E0B',
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

type TimelineView = 'day' | 'week' | 'month';

export function CallsAnalytics({ calls, title = 'Analytics de Llamadas' }: CallsAnalyticsProps) {
  const [timelineView, setTimelineView] = useState<TimelineView>('day');

  // Timeline data based on view
  const timelineData = useMemo(() => {
    const now = new Date();
    let intervals: Date[] = [];
    let formatStr: string;
    let getIntervalStart: (date: Date) => Date;
    let getIntervalEnd: (date: Date) => Date;

    switch (timelineView) {
      case 'day':
        // All days of current month
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        intervals = eachDayOfInterval({
          start: monthStart,
          end: monthEnd,
        });
        formatStr = 'd';
        getIntervalStart = startOfDay;
        getIntervalEnd = endOfDay;
        break;
      case 'week':
        // Last 12 weeks
        intervals = eachWeekOfInterval(
          {
            start: subWeeks(now, 11),
            end: now,
          },
          { weekStartsOn: 1 }
        );
        formatStr = "'Sem' w";
        getIntervalStart = (d) => startOfWeek(d, { weekStartsOn: 1 });
        getIntervalEnd = (d) => endOfWeek(d, { weekStartsOn: 1 });
        break;
      case 'month':
        // Last 12 months
        intervals = eachMonthOfInterval({
          start: subMonths(now, 11),
          end: now,
        });
        formatStr = 'MMM';
        getIntervalStart = startOfMonth;
        getIntervalEnd = endOfMonth;
        break;
    }

    return intervals.map((intervalDate) => {
      const start = getIntervalStart(intervalDate);
      const end = getIntervalEnd(intervalDate);

      const intervalCalls = calls.filter((c) => {
        const callDate = new Date(c.scheduled_at);
        return isWithinInterval(callDate, { start, end });
      });

      const completedCalls = intervalCalls.filter((c) => c.call_result);
      const successfulCalls = intervalCalls.filter((c) => c.call_result === 'lead_pasa_fase_0');
      const isCurrentPeriod = isWithinInterval(now, { start, end });

      return {
        date: format(intervalDate, formatStr, { locale: es }),
        fullDate: format(intervalDate, timelineView === 'day' ? "EEEE d 'de' MMMM" : 'PPP', { locale: es }),
        total: intervalCalls.length,
        completadas: completedCalls.length,
        exitosas: successfulCalls.length,
        isCurrent: isCurrentPeriod,
      };
    });
  }, [calls, timelineView]);

  // Weekly goals tracking - current week and last 8 weeks
  const weeklyGoalsData = useMemo(() => {
    const now = new Date();
    const teamMembers = Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[];

    // Generate 8 weeks manually to ensure we get all of them
    const weeks: Array<{ start: Date; end: Date }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekDate = subWeeks(now, i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
      weeks.push({ start: weekStart, end: weekEnd });
    }

    return weeks.map(({ start: weekStart, end: weekEnd }) => {
      const isCurrentWeek = isSameWeek(weekStart, now, { weekStartsOn: 1 });
      const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

      const byMember: Record<string, number> = {};
      teamMembers.forEach((member) => {
        const memberCalls = calls.filter((c) => {
          const callDate = new Date(c.scheduled_at);
          return (
            c.team_member === member &&
            isWithinInterval(callDate, { start: weekStart, end: weekEnd })
          );
        });
        byMember[member] = memberCalls.length;
      });

      const totalCalls = Object.values(byMember).reduce((sum, count) => sum + count, 0);
      const teamGoal = teamMembers.length * WEEKLY_GOAL;

      return {
        weekStart,
        weekEnd,
        weekNumber,
        weekLabel: isCurrentWeek
          ? 'Esta Semana'
          : `Sem ${weekNumber}`,
        fullLabel: `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM", { locale: es })}`,
        isCurrentWeek,
        byMember,
        totalCalls,
        teamGoal,
        teamProgress: Math.round((totalCalls / teamGoal) * 100),
      };
    });
  }, [calls]);

  // Current week data for individual progress
  const currentWeekData = useMemo(() => {
    const currentWeek = weeklyGoalsData.find((w) => w.isCurrentWeek);
    if (!currentWeek) return [];

    return (Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => {
      const count = currentWeek.byMember[member] || 0;
      const progress = Math.round((count / WEEKLY_GOAL) * 100);
      const isOnTrack = progress >= 50; // At least 50% by mid-week
      const isComplete = count >= WEEKLY_GOAL;

      return {
        member,
        name: TEAM_MEMBER_LABELS[member].split(' ')[0],
        fullName: TEAM_MEMBER_LABELS[member],
        count,
        goal: WEEKLY_GOAL,
        progress: Math.min(progress, 100),
        remaining: Math.max(WEEKLY_GOAL - count, 0),
        isOnTrack,
        isComplete,
        color: TEAM_COLORS[member],
      };
    });
  }, [weeklyGoalsData]);

  const analytics = useMemo(() => {
    const now = new Date();
    const pastCalls = calls.filter(c => new Date(c.scheduled_at) < now);
    const upcomingCalls = calls.filter(c => new Date(c.scheduled_at) >= now);

    // By team member
    const byTeamMember = Object.keys(TEAM_MEMBER_LABELS).map(member => {
      const memberCalls = calls.filter(c => c.team_member === member);
      const completed = pastCalls.filter(c => c.team_member === member && c.call_result);
      const pasaFase0 = completed.filter(c => c.call_result === 'lead_pasa_fase_0');
      return {
        name: TEAM_MEMBER_LABELS[member as CallTeamMember].split(' ')[0],
        fullName: TEAM_MEMBER_LABELS[member as CallTeamMember],
        total: memberCalls.length,
        completadas: completed.length,
        exitosas: pasaFase0.length,
        color: TEAM_COLORS[member as CallTeamMember],
      };
    }).filter(m => m.total > 0);

    // By source
    const sourceCount: Record<string, number> = {};
    calls.forEach(c => {
      const source = c.source || 'sin_especificar';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });
    const bySource = Object.entries(sourceCount).map(([source, count], index) => ({
      name: source === 'sin_especificar' ? 'Sin especificar' : CALL_SOURCE_LABELS[source as CallSource] || source,
      value: count,
      color: COLORS[index % COLORS.length],
    }));

    // By result (only past calls with results)
    const resultCount: Record<string, number> = {};
    pastCalls.forEach(c => {
      if (c.call_result) {
        resultCount[c.call_result] = (resultCount[c.call_result] || 0) + 1;
      }
    });
    const byResult = Object.entries(resultCount).map(([result, count]) => ({
      name: CALL_RESULT_LABELS[result as CallResult],
      value: count,
      color: RESULT_COLORS[result as CallResult],
    }));

    // By day of week
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    calls.forEach(c => {
      const day = getDay(new Date(c.scheduled_at));
      dayCount[day]++;
    });
    const byDayOfWeek = DAY_NAMES.map((name, index) => ({
      name,
      llamadas: dayCount[index],
    }));

    // By hour
    const hourCount: Record<number, number> = {};
    calls.forEach(c => {
      const hour = getHours(new Date(c.scheduled_at));
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    const byHour = Object.entries(hourCount)
      .map(([hour, count]) => ({
        name: `${hour}:00`,
        hour: parseInt(hour),
        llamadas: count,
      }))
      .sort((a, b) => a.hour - b.hour);

    // Conversion rate
    const totalWithResult = pastCalls.filter(c => c.call_result).length;
    const successfulCalls = pastCalls.filter(c => c.call_result === 'lead_pasa_fase_0').length;
    const conversionRate = totalWithResult > 0 ? (successfulCalls / totalWithResult) * 100 : 0;

    // Average duration
    const callsWithDuration = calls.filter(c => c.duration_minutes);
    const avgDuration = callsWithDuration.length > 0
      ? callsWithDuration.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / callsWithDuration.length
      : 0;

    return {
      total: calls.length,
      upcoming: upcomingCalls.length,
      completed: pastCalls.length,
      withResult: totalWithResult,
      successful: successfulCalls,
      conversionRate,
      avgDuration,
      byTeamMember,
      bySource,
      byResult,
      byDayOfWeek,
      byHour,
    };
  }, [calls]);

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Llamadas</span>
            </div>
            <p className="text-2xl font-bold">{analytics.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Proximas</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{analytics.upcoming}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Completadas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{analytics.withResult}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Pasan Fase 0</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{analytics.successful}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tasa Conversion</span>
            </div>
            <p className={`text-2xl font-bold ${
              analytics.conversionRate >= 50 ? 'text-green-600' :
              analytics.conversionRate >= 30 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {analytics.conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Duracion Prom.</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(analytics.avgDuration)} min</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goals Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Metas Semanales por Persona
              </CardTitle>
              <CardDescription>
                Meta: {WEEKLY_GOAL} reuniones por persona / semana
              </CardDescription>
            </div>
            {weeklyGoalsData.find(w => w.isCurrentWeek) && (
              <Badge variant="outline" className="text-sm">
                {weeklyGoalsData.find(w => w.isCurrentWeek)?.fullLabel}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Current Week Progress Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {currentWeekData.map((person) => (
              <Card
                key={person.member}
                className={cn(
                  "relative overflow-hidden",
                  person.isComplete && "ring-2 ring-green-400"
                )}
              >
                <CardContent className="p-4">
                  {person.isComplete && (
                    <div className="absolute top-2 right-2">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.count} / {person.goal}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={person.progress}
                    className="h-2 mb-2"
                  />
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      "text-xs font-medium",
                      person.isComplete ? "text-green-600" :
                      person.progress >= 70 ? "text-blue-600" :
                      person.progress >= 40 ? "text-amber-600" : "text-red-600"
                    )}>
                      {person.progress}%
                    </span>
                    {!person.isComplete && (
                      <span className="text-xs text-muted-foreground">
                        Faltan {person.remaining}
                      </span>
                    )}
                    {person.isComplete && (
                      <Badge className="text-xs bg-green-100 text-green-700">
                        Meta cumplida
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Historical Weekly Performance Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Historial de Semanas (Reuniones por Persona)
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyGoalsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm mb-2">{data.fullLabel}</p>
                            <div className="space-y-1.5">
                              {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => {
                                const count = data.byMember[member] || 0;
                                const achieved = count >= WEEKLY_GOAL;
                                return (
                                  <div key={member} className="flex items-center justify-between gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: TEAM_COLORS[member] }}
                                      />
                                      <span>{TEAM_MEMBER_LABELS[member].split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className={cn(
                                        "font-medium",
                                        achieved ? "text-green-600" : ""
                                      )}>
                                        {count}
                                      </span>
                                      <span className="text-muted-foreground">/ {WEEKLY_GOAL}</span>
                                      {achieved && <CheckCircle className="h-3 w-3 text-green-600" />}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="pt-2 mt-2 border-t">
                                <div className="flex justify-between text-sm font-medium">
                                  <span>Total Equipo</span>
                                  <span>{data.totalCalls} / {data.teamGoal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={WEEKLY_GOAL} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Meta', position: 'right', fontSize: 10 }} />
                  {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => (
                    <Bar
                      key={member}
                      dataKey={`byMember.${member}`}
                      name={TEAM_MEMBER_LABELS[member].split(' ')[0]}
                      fill={TEAM_COLORS[member]}
                      radius={[2, 2, 0, 0]}
                      stackId="a"
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Team Legend */}
            <div className="flex items-center justify-center gap-4 mt-3">
              {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => (
                <div key={member} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: TEAM_COLORS[member] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {TEAM_MEMBER_LABELS[member].split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Evolution Line Chart */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Evolución Individual (Tendencia Semanal)
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyGoalsData}>
                  <defs>
                    {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => (
                      <linearGradient key={member} id={`color${member}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAM_COLORS[member]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={TEAM_COLORS[member]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm mb-2">{data.fullLabel}</p>
                            <div className="space-y-1.5">
                              {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => {
                                const count = data.byMember[member] || 0;
                                const achieved = count >= WEEKLY_GOAL;
                                return (
                                  <div key={member} className="flex items-center justify-between gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: TEAM_COLORS[member] }}
                                      />
                                      <span>{TEAM_MEMBER_LABELS[member].split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className={cn(
                                        "font-medium",
                                        achieved ? "text-green-600" : ""
                                      )}>
                                        {count}
                                      </span>
                                      {achieved && <CheckCircle className="h-3 w-3 text-green-600" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={WEEKLY_GOAL} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Meta', position: 'right', fontSize: 10 }} />
                  {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => (
                    <Area
                      key={member}
                      type="monotone"
                      dataKey={`byMember.${member}`}
                      name={TEAM_MEMBER_LABELS[member].split(' ')[0]}
                      stroke={TEAM_COLORS[member]}
                      strokeWidth={2}
                      fill={`url(#color${member})`}
                      dot={{ r: 4, fill: TEAM_COLORS[member] }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend for line chart */}
            <div className="flex items-center justify-center gap-4 mt-3">
              {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => (
                <div key={member} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TEAM_COLORS[member] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {TEAM_MEMBER_LABELS[member].split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Performance Summary Table */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Resumen Semanal Detallado
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Semana</th>
                    {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => (
                      <th key={member} className="text-center py-2 px-2 font-medium">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: TEAM_COLORS[member] }}
                          />
                          {TEAM_MEMBER_LABELS[member].split(' ')[0]}
                        </div>
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 font-medium">Total</th>
                    <th className="text-center py-2 px-2 font-medium">% Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyGoalsData.map((week, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        "border-b",
                        week.isCurrentWeek && "bg-primary/5 font-medium"
                      )}
                    >
                      <td className="py-2 px-2">
                        <div>
                          <span className={week.isCurrentWeek ? "text-primary" : ""}>
                            {week.weekLabel}
                          </span>
                          <p className="text-xs text-muted-foreground">{week.fullLabel}</p>
                        </div>
                      </td>
                      {(Object.keys(TEAM_MEMBER_LABELS) as CallTeamMember[]).map((member) => {
                        const count = week.byMember[member] || 0;
                        const achieved = count >= WEEKLY_GOAL;
                        return (
                          <td key={member} className="text-center py-2 px-2">
                            <span className={cn(
                              achieved && "text-green-600 font-semibold"
                            )}>
                              {count}
                              {achieved && <CheckCircle className="inline-block h-3 w-3 ml-1" />}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-center py-2 px-2 font-medium">
                        {week.totalCalls}
                      </td>
                      <td className="text-center py-2 px-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            week.teamProgress >= 100 && "bg-green-100 text-green-700",
                            week.teamProgress >= 70 && week.teamProgress < 100 && "bg-blue-100 text-blue-700",
                            week.teamProgress >= 40 && week.teamProgress < 70 && "bg-amber-100 text-amber-700",
                            week.teamProgress < 40 && "bg-red-100 text-red-700"
                          )}
                        >
                          {week.teamProgress}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Llamadas en el Tiempo
              </CardTitle>
              {timelineView === 'day' && (
                <CardDescription>
                  {format(new Date(), "MMMM yyyy", { locale: es })}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={timelineView}
                onValueChange={(value) => value && setTimelineView(value as TimelineView)}
                className="bg-muted rounded-lg p-1"
              >
                <ToggleGroupItem
                  value="day"
                  className={cn(
                    "px-3 py-1 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm",
                  )}
                >
                  Diario
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="week"
                  className={cn(
                    "px-3 py-1 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm",
                  )}
                >
                  Semanal
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="month"
                  className={cn(
                    "px-3 py-1 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm",
                  )}
                >
                  Mensual
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExitosas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={timelineView === 'day' ? 2 : timelineView === 'week' ? 1 : 0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm mb-2 capitalize">{data.fullDate}</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-medium">{data.total}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                                <span className="text-muted-foreground">Exitosas:</span>
                                <span className="font-medium text-green-600">{data.exitosas}</span>
                              </div>
                            </div>
                            {data.isCurrent && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                Hoy
                              </Badge>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#colorTotal)"
                    name="Total Llamadas"
                  />
                  <Area
                    type="monotone"
                    dataKey="exitosas"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#colorExitosas)"
                    name="Pasan Fase 0"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos para mostrar
            </div>
          )}
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
              <span className="text-sm text-muted-foreground">Total Llamadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10B981]" />
              <span className="text-sm text-muted-foreground">Pasan Fase 0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Team Member */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Llamadas por Comercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byTeamMember.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byTeamMember} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-sm">Total: {data.total}</p>
                              <p className="text-sm text-green-600">Exitosas: {data.exitosas}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Source */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5" />
              Llamadas por Origen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.bySource.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.bySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {analytics.bySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Result */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byResult.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.byResult}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ value }) => value}
                    >
                      {analytics.byResult.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sin resultados aun
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Day of Week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Por Dia de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="llamadas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Hour */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Por Hora del Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byHour.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byHour}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="llamadas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No hay datos
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
