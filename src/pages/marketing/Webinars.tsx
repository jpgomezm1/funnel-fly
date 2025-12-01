import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isFuture, isToday, parseISO, subMonths, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Video,
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Plus,
  Upload,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ExternalLink,
  Play,
  Image as ImageIcon,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  Link as LinkIcon,
  Building2,
  Sparkles,
  PieChart,
  Phone,
  Mail,
  Award,
  Star,
  Copy,
  UsersRound,
  Download,
  Trophy,
  Target,
  Lightbulb,
  AlertTriangle,
  Info,
  Flame,
  Zap,
  UserX,
  CalendarDays,
  ArrowUpRight,
  Percent,
  Grid3X3,
  List,
  LayoutGrid,
  Briefcase,
  Globe,
  MapPin,
  Hash,
  Activity,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  useWebinars,
  useWebinarMutations,
  useImportRegistrants,
  useRepeatAttendees,
  useAllRegistrants,
  useWebinarMetrics,
  useAllWebinarsAnalytics,
  parseLumaCSV,
  Webinar,
  RepeatAttendee,
  AllRegistrant,
} from '@/hooks/useWebinars';

// Status config
const STATUS_CONFIG = {
  planned: {
    label: 'Planificado',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    bgLight: 'bg-blue-500/10',
    icon: Clock,
  },
  completed: {
    label: 'Completado',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    bgLight: 'bg-green-500/10',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    bgLight: 'bg-red-500/10',
    icon: XCircle,
  },
};

const DEFAULT_WEBINAR_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop';

// =====================================================
// ANALYTICS DASHBOARD TAB
// =====================================================

function AnalyticsDashboard() {
  const { analytics, isLoading } = useAllWebinarsAnalytics();
  const { metrics, webinars, repeatAttendees } = useWebinarMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Generate insights
  const insights: Array<{ type: 'success' | 'warning' | 'info'; title: string; description: string; metric?: string }> = [];

  if (analytics.bestPerformingWebinar) {
    insights.push({
      type: 'success',
      title: 'Mejor Webinar',
      description: `"${analytics.bestPerformingWebinar.name.substring(0, 40)}..." tuvo la mejor tasa de asistencia.`,
      metric: `${analytics.bestPerformingWebinar.rate.toFixed(1)}%`,
    });
  }

  if (analytics.repeatRate > 20) {
    insights.push({
      type: 'success',
      title: 'Alta retencion de audiencia',
      description: `El ${analytics.repeatRate.toFixed(1)}% de tus asistentes vuelven a webinars futuros. Esto indica contenido de alta calidad.`,
      metric: `${analytics.repeatRate.toFixed(1)}%`,
    });
  } else if (analytics.repeatRate < 10 && analytics.repeatAttendeesCount > 0) {
    insights.push({
      type: 'warning',
      title: 'Baja retencion',
      description: 'Pocos asistentes regresan. Considera mejorar el seguimiento post-webinar o la calidad del contenido.',
      metric: `${analytics.repeatRate.toFixed(1)}%`,
    });
  }

  if (metrics.avgAttendanceRate < 40) {
    insights.push({
      type: 'warning',
      title: 'Tasa de asistencia baja',
      description: 'Menos del 40% de registrados asisten. Prueba enviar recordatorios multiples antes del evento.',
      metric: `${metrics.avgAttendanceRate.toFixed(1)}%`,
    });
  } else if (metrics.avgAttendanceRate >= 50) {
    insights.push({
      type: 'success',
      title: 'Excelente asistencia',
      description: 'Tu tasa de asistencia esta por encima del promedio de la industria (40-50%).',
      metric: `${metrics.avgAttendanceRate.toFixed(1)}%`,
    });
  }

  if (analytics.topCompaniesOverall.length > 0) {
    const topCompany = analytics.topCompaniesOverall[0];
    insights.push({
      type: 'info',
      title: 'Empresa mas comprometida',
      description: `${topCompany.company} ha registrado ${topCompany.totalRegistrations} personas en tus webinars.`,
      metric: `${topCompany.totalRegistrations} registros`,
    });
  }

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Prepare attendance rate trend data for chart
  const attendanceTrendData = analytics.attendanceRateTrend.slice(-10).map((item, index) => ({
    name: item.webinarName.substring(0, 15) + (item.webinarName.length > 15 ? '...' : ''),
    fullName: item.webinarName,
    rate: item.rate,
    date: item.date,
  }));

  // Prepare monthly data
  const monthlyData = analytics.webinarsByMonth.slice(-6);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Video className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Total Webinars</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalWebinars}</p>
            <p className="text-xs text-muted-foreground">{metrics.completedWebinars} completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Registrados</span>
            </div>
            <p className="text-2xl font-bold">{analytics.totalRegistrantsAllTime.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Asistentes</span>
            </div>
            <p className="text-2xl font-bold">{analytics.totalAttendeesFromCSV.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tasa Promedio</span>
            </div>
            <p className={`text-2xl font-bold ${
              analytics.overallAttendanceRate >= 50 ? 'text-green-600' :
              analytics.overallAttendanceRate >= 35 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {analytics.overallAttendanceRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Asistentes Recurrentes</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{analytics.repeatAttendeesCount}</p>
            <p className="text-xs text-muted-foreground">{analytics.repeatRate.toFixed(1)}% del total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Avg por Webinar</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(analytics.avgRegistrantsPerWebinar)}</p>
            <p className="text-xs text-muted-foreground">registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Asistencia
            </CardTitle>
            <CardDescription>Tasa de asistencia por webinar (ultimos 10)</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceTrendData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm">{data.fullName}</p>
                              <p className="text-xs text-muted-foreground">{data.date}</p>
                              <p className="text-lg font-bold text-primary">{data.rate.toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#colorRate)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No hay datos suficientes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Resumen Mensual
            </CardTitle>
            <CardDescription>Webinars, registrados y asistentes por mes</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(v) => {
                      const [year, month] = v.split('-');
                      return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM', { locale: es });
                    }} />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'registrants' ? 'Registrados' :
                        name === 'attendees' ? 'Asistentes' : 'Webinars'
                      ]}
                    />
                    <Legend
                      formatter={(value) =>
                        value === 'registrants' ? 'Registrados' :
                        value === 'attendees' ? 'Asistentes' : 'Webinars'
                      }
                    />
                    <Bar dataKey="registrants" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendees" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No hay datos suficientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Insights
            </CardTitle>
            <CardDescription>Recomendaciones basadas en tus datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">Necesitas mas datos para generar insights</p>
            ) : (
              insights.slice(0, 4).map((insight, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                    insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
                    {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                    {insight.type === 'info' && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                    {insight.metric && (
                      <Badge variant="secondary" className="ml-2 shrink-0">{insight.metric}</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Best & Worst Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Webinars
            </CardTitle>
            <CardDescription>Por tasa de asistencia (min. 10 registrados)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Best */}
              {analytics.bestPerformingWebinar && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-green-600">Mejor</span>
                  </div>
                  <p className="text-sm font-medium truncate">{analytics.bestPerformingWebinar.name}</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.bestPerformingWebinar.rate.toFixed(1)}%</p>
                </div>
              )}
              {/* Worst */}
              {analytics.worstPerformingWebinar && analytics.bestPerformingWebinar?.name !== analytics.worstPerformingWebinar.name && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium text-red-600">Menor</span>
                  </div>
                  <p className="text-sm font-medium truncate">{analytics.worstPerformingWebinar.name}</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.worstPerformingWebinar.rate.toFixed(1)}%</p>
                </div>
              )}
              {/* Average */}
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Promedio General</span>
                </div>
                <p className="text-2xl font-bold">{analytics.overallAttendanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              Top Empresas
            </CardTitle>
            <CardDescription>Mas registros en todos los webinars</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topCompaniesOverall.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay datos de empresas</p>
            ) : (
              <div className="space-y-2">
                {analytics.topCompaniesOverall.slice(0, 6).map((company, index) => (
                  <div key={company.company} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{company.company}</p>
                      <p className="text-xs text-muted-foreground">{company.webinarsAttended} webinars</p>
                    </div>
                    <Badge variant="secondary">{company.totalRegistrations}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Embudo de Retencion
            </CardTitle>
            <CardDescription>De registro a asistente recurrente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step 1: Registered */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Registrados
                  </span>
                  <span className="font-bold">{analytics.totalRegistrantsAllTime.toLocaleString()}</span>
                </div>
                <Progress value={100} className="h-3" />
              </div>
              {/* Step 2: Attended */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    Asistieron
                  </span>
                  <span className="font-bold">{analytics.totalAttendeesFromCSV.toLocaleString()} ({analytics.overallAttendanceRate.toFixed(1)}%)</span>
                </div>
                <Progress value={analytics.overallAttendanceRate} className="h-3" />
              </div>
              {/* Step 3: Repeat */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Recurrentes
                  </span>
                  <span className="font-bold">{analytics.repeatAttendeesCount} ({analytics.repeatRate.toFixed(1)}%)</span>
                </div>
                <Progress value={analytics.repeatRate} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audience Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Composicion de Audiencia
            </CardTitle>
            <CardDescription>Asistentes unicos vs recurrentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Primera vez', value: analytics.singleTimeAttendeesCount, color: '#3B82F6' },
                        { name: 'Recurrentes', value: analytics.repeatAttendeesCount, color: '#F59E0B' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Primera vez</p>
                    <p className="text-2xl font-bold">{analytics.singleTimeAttendeesCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recurrentes</p>
                    <p className="text-2xl font-bold">{analytics.repeatAttendeesCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =====================================================
// WEBINAR CARD COMPONENT - IMPROVED
// =====================================================

function WebinarCard({ webinar, onEdit, onImport, onDelete, viewMode }: {
  webinar: Webinar;
  onEdit: () => void;
  onImport: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}) {
  const status = STATUS_CONFIG[webinar.status];
  const StatusIcon = status.icon;
  const attendanceRate = webinar.total_registrants > 0
    ? (webinar.attended_count / webinar.total_registrants * 100)
    : 0;
  const eventDate = new Date(webinar.event_date);
  const isUpcoming = isFuture(eventDate);
  const isEventToday = isToday(eventDate);
  const daysUntil = differenceInDays(eventDate, new Date());

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0">
            <img
              src={webinar.image_url || DEFAULT_WEBINAR_IMAGE}
              alt={webinar.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            <Badge className={`absolute top-1 left-1 text-[10px] ${status.bgLight} ${status.textColor} border-0`}>
              <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
              {status.label}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {webinar.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(eventDate, "d MMM yyyy", { locale: es })}
                  </span>
                  {isUpcoming && daysUntil <= 7 && daysUntil > 0 && (
                    <Badge variant="outline" className="text-xs">
                      en {daysUntil} dias
                    </Badge>
                  )}
                  {isEventToday && (
                    <Badge className="bg-amber-500 text-white border-0 text-xs animate-pulse">
                      HOY
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-lg font-bold">{webinar.total_registrants}</p>
              <p className="text-xs text-muted-foreground">Registrados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{webinar.attended_count}</p>
              <p className="text-xs text-muted-foreground">Asistentes</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${
                attendanceRate >= 50 ? 'text-green-600' :
                attendanceRate >= 35 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {attendanceRate.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Tasa</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/marketing/webinars/${webinar.id}`}>
              <Button variant="outline" size="sm">
                Ver
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </DropdownMenuItem>
                {webinar.luma_url && (
                  <DropdownMenuItem asChild>
                    <a href={webinar.luma_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Luma
                    </a>
                  </DropdownMenuItem>
                )}
                {webinar.recording_url && (
                  <DropdownMenuItem asChild>
                    <a href={webinar.recording_url} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4 mr-2" />
                      Ver grabacion
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50">
      <div className="relative h-44 overflow-hidden">
        <img
          src={webinar.image_url || DEFAULT_WEBINAR_IMAGE}
          alt={webinar.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className={`${status.bgLight} ${status.textColor} border-0 font-medium`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        {isEventToday && (
          <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 animate-pulse">
            HOY
          </Badge>
        )}
        {isUpcoming && !isEventToday && daysUntil <= 7 && (
          <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0">
            en {daysUntil}d
          </Badge>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg line-clamp-2 mb-1">
            {webinar.name}
          </h3>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            {format(eventDate, "d 'de' MMMM, yyyy", { locale: es })}
          </div>
        </div>

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEventToday && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </DropdownMenuItem>
                {webinar.luma_url && (
                  <DropdownMenuItem asChild>
                    <a href={webinar.luma_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Luma
                    </a>
                  </DropdownMenuItem>
                )}
                {webinar.recording_url && (
                  <DropdownMenuItem asChild>
                    <a href={webinar.recording_url} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4 mr-2" />
                      Ver grabacion
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Performance Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Conversion</span>
              <span className={`font-medium ${
                attendanceRate >= 50 ? 'text-green-600' :
                attendanceRate >= 35 ? 'text-amber-600' : 'text-red-600'
              }`}>{attendanceRate.toFixed(1)}%</span>
            </div>
            <Progress value={attendanceRate} className="h-2" />
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            attendanceRate >= 50 ? 'bg-green-500/10' :
            attendanceRate >= 35 ? 'bg-amber-500/10' : 'bg-red-500/10'
          }`}>
            {attendanceRate >= 50 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : attendanceRate >= 35 ? (
              <Activity className="h-5 w-5 text-amber-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{webinar.total_registrants}</p>
            <p className="text-[10px] text-muted-foreground">Registrados</p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
            <UserCheck className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{webinar.attended_count}</p>
            <p className="text-[10px] text-muted-foreground">Asistentes</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
            <UserX className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-lg font-bold">{webinar.total_registrants - webinar.attended_count}</p>
            <p className="text-[10px] text-muted-foreground">Ausentes</p>
          </div>
        </div>

        {webinar.tags && webinar.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {webinar.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {webinar.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{webinar.tags.length - 3}</Badge>
            )}
          </div>
        )}

        <Link to={`/marketing/webinars/${webinar.id}`}>
          <Button variant="outline" className="w-full group/btn">
            Ver Detalles
            <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// =====================================================
// CREATE/EDIT WEBINAR DIALOG
// =====================================================

function WebinarFormDialog({
  open,
  onOpenChange,
  webinar,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webinar?: Webinar | null;
  onSubmit: (data: Partial<Webinar>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: webinar?.name || '',
    description: webinar?.description || '',
    event_date: webinar?.event_date ? webinar.event_date.split('T')[0] : '',
    status: webinar?.status || 'planned',
    attended_count: webinar?.attended_count || 0,
    image_url: webinar?.image_url || '',
    luma_url: webinar?.luma_url || '',
    recording_url: webinar?.recording_url || '',
    tags: webinar?.tags?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description || null,
      event_date: new Date(formData.event_date).toISOString(),
      status: formData.status as Webinar['status'],
      attended_count: formData.attended_count,
      image_url: formData.image_url || null,
      luma_url: formData.luma_url || null,
      recording_url: formData.recording_url || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {webinar ? 'Editar Webinar' : 'Nuevo Webinar'}
          </DialogTitle>
          <DialogDescription>
            {webinar ? 'Actualiza la informacion del webinar' : 'Crea un nuevo webinar para tu comunidad'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Webinar *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Build Off Riff x Irrelevant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el contenido del webinar..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Fecha del Evento *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planificado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Multimedia y Enlaces
            </h4>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL de Imagen</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="h-24 w-full object-cover rounded-lg mt-2"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="luma_url">URL de Luma</Label>
                <Input
                  id="luma_url"
                  type="url"
                  value={formData.luma_url}
                  onChange={(e) => setFormData({ ...formData, luma_url: e.target.value })}
                  placeholder="https://lu.ma/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recording_url">URL de Grabacion</Label>
                <Input
                  id="recording_url"
                  type="url"
                  value={formData.recording_url}
                  onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separados por coma)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="IA, No-Code, Automatizacion"
              />
            </div>

            {webinar && (
              <div className="space-y-2">
                <Label htmlFor="attended_count">Numero de Asistentes</Label>
                <Input
                  id="attended_count"
                  type="number"
                  min="0"
                  value={formData.attended_count}
                  onChange={(e) => setFormData({ ...formData, attended_count: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Registrados: {webinar.total_registrants} | Tasa: {webinar.total_registrants > 0 ? ((formData.attended_count / webinar.total_registrants) * 100).toFixed(1) : 0}%
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : webinar ? 'Guardar Cambios' : 'Crear Webinar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// IMPORT CSV DIALOG
// =====================================================

function ImportCSVDialog({
  open,
  onOpenChange,
  webinarId,
  webinarName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webinarId: string;
  webinarName: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ total: number; sample: string[] } | null>(null);
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseLumaCSV> | null>(null);

  const importMutation = useImportRegistrants();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseLumaCSV(content);
      setParsedData(parsed);
      setPreview({
        total: parsed.length,
        sample: parsed.slice(0, 5).map(r => r.email),
      });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData) return;

    await importMutation.mutateAsync({
      webinarId,
      registrants: parsedData,
    });

    onOpenChange(false);
    setPreview(null);
    setParsedData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Registrados
          </DialogTitle>
          <DialogDescription>
            Importar registrados de Luma para: <strong>{webinarName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Arrastra un archivo CSV o haz clic para seleccionar
            </p>
            <Button type="button" variant="outline" size="sm">
              Seleccionar CSV
            </Button>
          </div>

          {preview && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Registrados encontrados:</span>
                <Badge variant="secondary" className="text-lg px-3">{preview.total}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Vista previa de emails:</p>
                {preview.sample.map((email, i) => (
                  <p key={i} className="truncate">{email}</p>
                ))}
                {preview.total > 5 && (
                  <p className="text-primary">... y {preview.total - 5} mas</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importando...' : `Importar ${preview?.total || 0} registrados`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// REPEAT ATTENDEES DIALOG
// =====================================================

function RepeatAttendeesDialog({
  open,
  onOpenChange,
  attendees,
  webinars,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendees: RepeatAttendee[];
  webinars: Webinar[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'webinars' | 'name' | 'company'>('webinars');

  const filteredAttendees = useMemo(() => {
    let filtered = attendees.filter(a =>
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'webinars') {
        return b.webinars_attended - a.webinars_attended;
      } else if (sortBy === 'name') {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email;
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email;
        return nameA.localeCompare(nameB);
      } else {
        return (a.company || '').localeCompare(b.company || '');
      }
    });

    return filtered;
  }, [attendees, searchQuery, sortBy]);

  const getWebinarNames = (webinarIds: string[]) => {
    return webinarIds
      .map(id => webinars.find(w => w.id === id)?.name || 'Webinar')
      .slice(0, 3);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: 'Email copiado', description: email });
  };

  const handleCopyAllEmails = () => {
    const emails = filteredAttendees.map(a => a.email).join(', ');
    navigator.clipboard.writeText(emails);
    toast({
      title: 'Emails copiados',
      description: `${filteredAttendees.length} emails copiados al portapapeles`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Asistentes Recurrentes
            <Badge variant="secondary" className="ml-2">{attendees.length}</Badge>
          </DialogTitle>
          <DialogDescription>
            Personas que han asistido a mas de un webinar
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 py-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webinars">Mas webinars</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="company">Empresa</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleCopyAllEmails}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar todos
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <p className="text-2xl font-bold text-primary">{attendees.length}</p>
            <p className="text-xs text-muted-foreground">Total recurrentes</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10">
            <p className="text-2xl font-bold text-amber-600">
              {attendees.filter(a => a.webinars_attended >= 3).length}
            </p>
            <p className="text-xs text-muted-foreground">Super fans (3+)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-600">
              {attendees.filter(a => a.phone_number).length}
            </p>
            <p className="text-xs text-muted-foreground">Con telefono</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-center">Webinars</TableHead>
                <TableHead>Asistio a</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendees.map((attendee, index) => {
                const fullName = `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim();
                const webinarNames = getWebinarNames(attendee.webinar_ids);
                const isSuperFan = attendee.webinars_attended >= 3;

                return (
                  <TableRow key={attendee.email}>
                    <TableCell>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        isSuperFan ? 'bg-amber-500/20 text-amber-600' : 'bg-muted'
                      }`}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSuperFan ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-primary/10'
                        }`}>
                          {isSuperFan ? (
                            <Star className="h-4 w-4" />
                          ) : (
                            (fullName || attendee.email).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            {fullName || 'Sin nombre'}
                            {isSuperFan && (
                              <Badge className="bg-amber-500/20 text-amber-600 border-0 text-xs ml-1">
                                Super fan
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{attendee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendee.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{attendee.company}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={isSuperFan ? 'default' : 'secondary'}
                        className={isSuperFan ? 'bg-amber-500' : ''}
                      >
                        {attendee.webinars_attended}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webinarNames.map((name, i) => (
                          <Badge key={i} variant="outline" className="text-xs truncate max-w-[120px]">
                            {name.length > 15 ? name.substring(0, 15) + '...' : name}
                          </Badge>
                        ))}
                        {attendee.webinar_ids.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{attendee.webinar_ids.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyEmail(attendee.email)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {attendee.phone_number && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            asChild
                          >
                            <a
                              href={`https://wa.me/${attendee.phone_number.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a href={`mailto:${attendee.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredAttendees.length === 0 && (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No se encontraron resultados</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <p className="text-sm text-muted-foreground flex-1">
            Mostrando {filteredAttendees.length} de {attendees.length} asistentes recurrentes
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// REGISTRANTS TAB - IMPROVED
// =====================================================

function RegistrantsTab({ webinars }: { webinars: Webinar[] }) {
  const { data: allRegistrants = [], isLoading } = useAllRegistrants();
  const [searchQuery, setSearchQuery] = useState('');
  const [webinarFilter, setWebinarFilter] = useState<string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [repeatFilter, setRepeatFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  const filteredRegistrants = useMemo(() => {
    return allRegistrants.filter(r => {
      const matchesSearch = !searchQuery ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWebinar = webinarFilter === 'all' || r.webinar_id === webinarFilter;

      const matchesAttendance = attendanceFilter === 'all' ||
        (attendanceFilter === 'attended' && r.has_joined_event) ||
        (attendanceFilter === 'absent' && !r.has_joined_event);

      const matchesRepeat = repeatFilter === 'all' ||
        (repeatFilter === 'repeat' && r.webinars_count > 1) ||
        (repeatFilter === 'single' && r.webinars_count === 1);

      const matchesCompany = companyFilter === 'all' ||
        (companyFilter === 'with' && r.company) ||
        (companyFilter === 'without' && !r.company);

      return matchesSearch && matchesWebinar && matchesAttendance && matchesRepeat && matchesCompany;
    });
  }, [allRegistrants, searchQuery, webinarFilter, attendanceFilter, repeatFilter, companyFilter]);

  const stats = useMemo(() => {
    const uniqueEmails = new Set(allRegistrants.map(r => r.email));
    const repeatEmails = new Set(allRegistrants.filter(r => r.webinars_count > 1).map(r => r.email));
    const withPhone = new Set(allRegistrants.filter(r => r.phone_number).map(r => r.email));
    const withCompany = new Set(allRegistrants.filter(r => r.company).map(r => r.email));
    const attended = allRegistrants.filter(r => r.has_joined_event).length;
    const uniqueCompanies = new Set(allRegistrants.filter(r => r.company).map(r => r.company));

    return {
      totalRegistrations: allRegistrants.length,
      uniqueContacts: uniqueEmails.size,
      repeatContacts: repeatEmails.size,
      withPhone: withPhone.size,
      withCompany: withCompany.size,
      uniqueCompanies: uniqueCompanies.size,
      attendedCount: attended,
      attendanceRate: allRegistrants.length > 0 ? (attended / allRegistrants.length * 100) : 0,
    };
  }, [allRegistrants]);

  // Top companies analysis
  const topCompanies = useMemo(() => {
    const companyMap = new Map<string, { count: number; attended: number }>();
    allRegistrants.forEach(r => {
      if (r.company) {
        const existing = companyMap.get(r.company) || { count: 0, attended: 0 };
        existing.count++;
        if (r.has_joined_event) existing.attended++;
        companyMap.set(r.company, existing);
      }
    });
    return Array.from(companyMap.entries())
      .map(([company, data]) => ({ company, ...data, rate: data.count > 0 ? (data.attended / data.count * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allRegistrants]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: 'Email copiado', description: email });
  };

  const handleCopyAllEmails = () => {
    const uniqueEmails = [...new Set(filteredRegistrants.map(r => r.email))];
    navigator.clipboard.writeText(uniqueEmails.join(', '));
    toast({
      title: 'Emails copiados',
      description: `${uniqueEmails.length} emails unicos copiados al portapapeles`,
    });
  };

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Email', 'Empresa', 'Cargo', 'Telefono', 'Webinar', 'Fecha', 'Asistio', '# Webinars'];
    const rows = filteredRegistrants.map(r => [
      r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || '',
      r.email,
      r.company || '',
      r.role || '',
      r.phone_number || '',
      r.webinar_name,
      r.webinar_date ? format(new Date(r.webinar_date), 'dd/MM/yyyy') : '',
      r.has_joined_event ? 'Si' : 'No',
      r.webinars_count.toString(),
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-registrados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Hash className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRegistrations.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total registros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold text-blue-600">{stats.uniqueContacts.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Contactos unicos</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-4">
            <p className="text-xl font-bold text-amber-600">{stats.repeatContacts}</p>
            <p className="text-xs text-muted-foreground">Reiterantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold text-green-600">{stats.attendedCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Asistieron</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold">{stats.attendanceRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Tasa asistencia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold text-purple-600">{stats.uniqueCompanies}</p>
            <p className="text-xs text-muted-foreground">Empresas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold text-cyan-600">{stats.withPhone}</p>
            <p className="text-xs text-muted-foreground">Con telefono</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Top Companies Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              Top 10 Empresas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay datos</p>
            ) : (
              topCompanies.map((company, i) => (
                <div
                  key={company.company}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSearchQuery(company.company)}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? 'bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{company.company}</p>
                    <p className="text-xs text-muted-foreground">{company.rate.toFixed(0)}% asistencia</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{company.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                Todos los Registrados
                <Badge variant="secondary">{filteredRegistrants.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAllEmails}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar emails
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={webinarFilter} onValueChange={setWebinarFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Webinar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los webinars</SelectItem>
                  {webinars.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name.length > 25 ? w.name.substring(0, 25) + '...' : w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Asistencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="attended">Asistieron</SelectItem>
                  <SelectItem value="absent">No asistieron</SelectItem>
                </SelectContent>
              </Select>
              <Select value={repeatFilter} onValueChange={setRepeatFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="repeat">Reiterantes</SelectItem>
                  <SelectItem value="single">Primera vez</SelectItem>
                </SelectContent>
              </Select>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="with">Con empresa</SelectItem>
                  <SelectItem value="without">Sin empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Contacto</TableHead>
                    <TableHead>Empresa / Cargo</TableHead>
                    <TableHead>Webinar</TableHead>
                    <TableHead className="text-center w-[80px]">Asistio</TableHead>
                    <TableHead className="text-center w-[80px]"># Total</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrants.slice(0, 50).map((registrant) => {
                    const fullName = registrant.full_name ||
                      `${registrant.first_name || ''} ${registrant.last_name || ''}`.trim() ||
                      'Sin nombre';
                    const isRepeat = registrant.webinars_count > 1;

                    return (
                      <TableRow key={registrant.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                              isRepeat ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/10'
                            }`}>
                              {isRepeat ? (
                                <Star className="h-4 w-4" />
                              ) : (
                                fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium flex items-center gap-2 truncate">
                                {fullName}
                                {isRepeat && (
                                  <Badge className="bg-amber-500/20 text-amber-600 border-0 text-[10px] shrink-0">
                                    x{registrant.webinars_count}
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{registrant.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {registrant.company ? (
                            <div>
                              <p className="text-sm font-medium truncate">{registrant.company}</p>
                              {registrant.role && (
                                <p className="text-xs text-muted-foreground truncate">{registrant.role}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm truncate max-w-[180px]">{registrant.webinar_name}</p>
                            {registrant.webinar_date && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(registrant.webinar_date), 'dd MMM yyyy', { locale: es })}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {registrant.has_joined_event ? (
                            <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                              <UserCheck className="h-4 w-4 text-green-500" />
                            </div>
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                              <UserX className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isRepeat ? 'default' : 'secondary'} className={isRepeat ? 'bg-amber-500' : ''}>
                            {registrant.webinars_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyEmail(registrant.email)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            {registrant.phone_number && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" asChild>
                                <a href={`https://wa.me/${registrant.phone_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={`mailto:${registrant.email}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredRegistrants.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No se encontraron resultados</p>
                </div>
              )}
            </div>

            {filteredRegistrants.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 50 de {filteredRegistrants.length} registros. Usa los filtros para refinar la busqueda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =====================================================
// WEBINARS TAB - IMPROVED
// =====================================================

function WebinarsTab({
  webinars,
  onEdit,
  onImport,
  onDelete,
  onNew,
}: {
  webinars: Webinar[];
  onEdit: (webinar: Webinar) => void;
  onImport: (webinar: Webinar) => void;
  onDelete: (webinar: Webinar) => void;
  onNew: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'registrants' | 'rate'>('date');
  const { metrics, repeatAttendees } = useWebinarMetrics();

  const [showRepeatAttendeesDialog, setShowRepeatAttendeesDialog] = useState(false);

  const filteredWebinars = useMemo(() => {
    let filtered = webinars.filter(w => {
      const matchesSearch = !searchQuery ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      } else if (sortBy === 'registrants') {
        return b.total_registrants - a.total_registrants;
      } else {
        const rateA = a.total_registrants > 0 ? (a.attended_count / a.total_registrants * 100) : 0;
        const rateB = b.total_registrants > 0 ? (b.attended_count / b.total_registrants * 100) : 0;
        return rateB - rateA;
      }
    });

    return filtered;
  }, [webinars, searchQuery, statusFilter, sortBy]);

  // Group by status
  const upcomingWebinars = filteredWebinars.filter(w => w.status === 'planned' && isFuture(new Date(w.event_date)));
  const completedWebinars = filteredWebinars.filter(w => w.status === 'completed' || (w.status === 'planned' && isPast(new Date(w.event_date))));

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalWebinars}</p>
                <p className="text-xs text-muted-foreground">Total Webinars</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalRegistrants.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Registrados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalAttendees.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Asistentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  metrics.avgAttendanceRate >= 50 ? 'text-green-600' :
                  metrics.avgAttendanceRate >= 35 ? 'text-amber-600' : 'text-red-600'
                }`}>{metrics.avgAttendanceRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Tasa Promedio</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setShowRepeatAttendeesDialog(true)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{metrics.repeatAttendees}</p>
                <p className="text-xs text-primary flex items-center gap-1">
                  Recurrentes <ArrowUpRight className="h-3 w-3" />
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar webinars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="planned">Planificados</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Por fecha</SelectItem>
              <SelectItem value="registrants">Por registrados</SelectItem>
              <SelectItem value="rate">Por tasa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Webinar
          </Button>
        </div>
      </div>

      {/* Webinars Content */}
      {filteredWebinars.length === 0 ? (
        <div className="text-center py-16">
          <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">No hay webinars</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'No se encontraron webinars con los filtros aplicados'
              : 'Crea tu primer webinar para empezar a construir tu comunidad'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button onClick={onNew}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Webinar
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Webinars */}
          {upcomingWebinars.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Proximos Webinars</h3>
                <Badge variant="secondary">{upcomingWebinars.length}</Badge>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {upcomingWebinars.map((webinar) => (
                    <WebinarCard
                      key={webinar.id}
                      webinar={webinar}
                      viewMode={viewMode}
                      onEdit={() => onEdit(webinar)}
                      onImport={() => onImport(webinar)}
                      onDelete={() => onDelete(webinar)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingWebinars.map((webinar) => (
                    <WebinarCard
                      key={webinar.id}
                      webinar={webinar}
                      viewMode={viewMode}
                      onEdit={() => onEdit(webinar)}
                      onImport={() => onImport(webinar)}
                      onDelete={() => onDelete(webinar)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Webinars */}
          {completedWebinars.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Webinars Completados</h3>
                <Badge variant="secondary">{completedWebinars.length}</Badge>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {completedWebinars.map((webinar) => (
                    <WebinarCard
                      key={webinar.id}
                      webinar={webinar}
                      viewMode={viewMode}
                      onEdit={() => onEdit(webinar)}
                      onImport={() => onImport(webinar)}
                      onDelete={() => onDelete(webinar)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {completedWebinars.map((webinar) => (
                    <WebinarCard
                      key={webinar.id}
                      webinar={webinar}
                      viewMode={viewMode}
                      onEdit={() => onEdit(webinar)}
                      onImport={() => onImport(webinar)}
                      onDelete={() => onDelete(webinar)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Repeat Attendees Dialog */}
      <RepeatAttendeesDialog
        open={showRepeatAttendeesDialog}
        onOpenChange={setShowRepeatAttendeesDialog}
        attendees={repeatAttendees}
        webinars={webinars}
      />
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function Webinars() {
  const { data: webinars = [], isLoading } = useWebinars();
  const mutations = useWebinarMutations();

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);

  const handleCreateWebinar = async (data: Partial<Webinar>) => {
    await mutations.createWebinar(data as any);
    setShowFormDialog(false);
    setSelectedWebinar(null);
  };

  const handleUpdateWebinar = async (data: Partial<Webinar>) => {
    if (!selectedWebinar) return;
    await mutations.updateWebinar({ id: selectedWebinar.id, ...data });
    setShowFormDialog(false);
    setSelectedWebinar(null);
  };

  const handleDeleteWebinar = async () => {
    if (!selectedWebinar) return;
    await mutations.deleteWebinar(selectedWebinar.id);
    setShowDeleteConfirm(false);
    setSelectedWebinar(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Webinars
          </h1>
          <p className="text-muted-foreground">Gestiona, analiza y optimiza tus webinars</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="webinars" className="gap-2">
            <Video className="h-4 w-4" />
            Webinars
          </TabsTrigger>
          <TabsTrigger value="registrants" className="gap-2">
            <UsersRound className="h-4 w-4" />
            Registrados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="webinars" className="mt-6">
          <WebinarsTab
            webinars={webinars}
            onEdit={(w) => { setSelectedWebinar(w); setShowFormDialog(true); }}
            onImport={(w) => { setSelectedWebinar(w); setShowImportDialog(true); }}
            onDelete={(w) => { setSelectedWebinar(w); setShowDeleteConfirm(true); }}
            onNew={() => { setSelectedWebinar(null); setShowFormDialog(true); }}
          />
        </TabsContent>

        <TabsContent value="registrants" className="mt-6">
          <RegistrantsTab webinars={webinars} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <WebinarFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        webinar={selectedWebinar}
        onSubmit={selectedWebinar ? handleUpdateWebinar : handleCreateWebinar}
        isLoading={mutations.isCreating || mutations.isUpdating}
      />

      {/* Import Dialog */}
      {selectedWebinar && (
        <ImportCSVDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          webinarId={selectedWebinar.id}
          webinarName={selectedWebinar.name}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar Webinar
            </DialogTitle>
            <DialogDescription>
              Estas seguro de eliminar <strong>"{selectedWebinar?.name}"</strong>?
              Esta accion eliminara todos los registrados asociados y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteWebinar} disabled={mutations.isDeleting}>
              {mutations.isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
