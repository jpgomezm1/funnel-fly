import { useMemo, useState } from 'react';
import {
  format,
  getDay,
  getHours,
  parseISO,
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
  subDays,
  subWeeks,
  subMonths,
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
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallsAnalyticsProps {
  calls: Call[];
  title?: string;
}

// Colors for charts
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

const TEAM_COLORS: Record<CallTeamMember, string> = {
  pamela: '#EC4899',
  juan_pablo: '#3B82F6',
  sara: '#8B5CF6',
  agustin: '#10B981',
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
    if (calls.length === 0) return [];

    const now = new Date();
    let intervals: Date[] = [];
    let formatStr: string;
    let getIntervalStart: (date: Date) => Date;
    let getIntervalEnd: (date: Date) => Date;

    switch (timelineView) {
      case 'day':
        // Last 30 days
        intervals = eachDayOfInterval({
          start: subDays(now, 29),
          end: now,
        });
        formatStr = 'd MMM';
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
        formatStr = 'MMM yyyy';
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

      return {
        date: format(intervalDate, formatStr, { locale: es }),
        fullDate: format(intervalDate, 'PPP', { locale: es }),
        total: intervalCalls.length,
        completadas: completedCalls.length,
        exitosas: successfulCalls.length,
      };
    });
  }, [calls, timelineView]);

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

      {/* Timeline Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Llamadas en el Tiempo
            </CardTitle>
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
                    interval={timelineView === 'day' ? 4 : timelineView === 'week' ? 1 : 0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm mb-2">{data.fullDate}</p>
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
