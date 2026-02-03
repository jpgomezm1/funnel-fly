import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Wrench,
  UserCheck,
  Calendar,
  Activity,
  Sparkles,
  BarChart3,
  Eye,
  Zap,
  MousePointerClick,
  Search,
  Filter,
  Download,
  Building2,
  Briefcase,
  Phone,
  Clock,
  Target,
  Award,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Play,
  FileText,
  LogIn,
  UserPlus,
  Layers,
  GitCompare,
  Calculator,
  Bot,
  Video,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  Star,
  Flame,
  ThermometerSun,
  Snowflake,
  AlertTriangle,
  Lightbulb,
  Info,
  Copy,
  RefreshCw,
  Percent,
  Hash,
  Crown,
  Medal,
  Trophy,
  UserX,
  UserCog,
  Shield,
  MapPin,
  TrendingUp as Trending,
  MailOpen,
  Send,
  Inbox,
  AtSign,
} from 'lucide-react';
import { useHubAnalytics, useMixPanelAnalytics, HubProfile, NewsletterSubscriber } from '@/hooks/useHubAnalytics';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// Constants
const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  new: { label: 'Nuevo', color: '#6b7280', bgColor: 'bg-gray-100 dark:bg-gray-800', borderColor: 'border-gray-300' },
  contacted: { label: 'Contactado', color: '#3b82f6', bgColor: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-300' },
  qualified: { label: 'Calificado', color: '#8b5cf6', bgColor: 'bg-purple-100 dark:bg-purple-900/30', borderColor: 'border-purple-300' },
  converted: { label: 'Convertido', color: '#22c55e', bgColor: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300' },
  inactive: { label: 'Inactivo', color: '#ef4444', bgColor: 'bg-red-100 dark:bg-red-900/30', borderColor: 'border-red-300' },
};

const PIE_COLORS = ['#8B5CF6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'];

const TOOL_CONFIG: Record<string, { label: string; shortLabel: string; color: string; icon: any }> = {
  stackGenerator: { label: 'Stack Generator', shortLabel: 'Stack', color: '#8b5cf6', icon: Layers },
  toolComparator: { label: 'Tool Comparator', shortLabel: 'Compare', color: '#3b82f6', icon: GitCompare },
  impactAnalyzer: { label: 'Impact Analyzer', shortLabel: 'Impact', color: '#10b981', icon: Calculator },
  aiAssistant: { label: 'AI Assistant', shortLabel: 'AI', color: '#f59e0b', icon: Bot },
};

const POSITION_CATEGORY_CONFIG = {
  cLevel: { label: 'C-Level / Founders', color: '#8b5cf6', icon: Crown },
  director: { label: 'Directores / VPs', color: '#3b82f6', icon: Award },
  manager: { label: 'Managers / Jefes', color: '#10b981', icon: UserCog },
  specialist: { label: 'Especialistas', color: '#f59e0b', icon: Briefcase },
  other: { label: 'Otros', color: '#6b7280', icon: Users },
};

// Helper to get lead score color and label
function getLeadScoreInfo(score: number): { color: string; label: string; icon: any } {
  if (score >= 80) return { color: 'text-green-600 bg-green-100', label: 'MQL', icon: Flame };
  if (score >= 60) return { color: 'text-blue-600 bg-blue-100', label: 'Caliente', icon: ThermometerSun };
  if (score >= 40) return { color: 'text-yellow-600 bg-yellow-100', label: 'Tibio', icon: ThermometerSun };
  if (score >= 20) return { color: 'text-orange-600 bg-orange-100', label: 'Frio', icon: Snowflake };
  return { color: 'text-gray-600 bg-gray-100', label: 'Nuevo', icon: Snowflake };
}

// Helper to calculate engagement level
function getEngagementLevel(user: HubProfile): { level: string; color: string; icon: any } {
  const totalUses = (user.stack_generator_uses || 0) +
                    (user.tool_comparator_uses || 0) +
                    (user.impact_analyzer_uses || 0) +
                    (user.ai_assistant_uses || 0);

  if (totalUses >= 20) return { level: 'Power User', color: 'text-purple-600 bg-purple-100', icon: Crown };
  if (totalUses >= 10) return { level: 'Activo', color: 'text-green-600 bg-green-100', icon: Zap };
  if (totalUses >= 5) return { level: 'Enganchado', color: 'text-blue-600 bg-blue-100', icon: Star };
  if (totalUses >= 1) return { level: 'Explorador', color: 'text-yellow-600 bg-yellow-100', icon: Eye };
  return { level: 'Nuevo', color: 'text-gray-600 bg-gray-100', icon: UserPlus };
}

export default function HubAnalytics() {
  const { data: hubData, isLoading: hubLoading, error: hubError } = useHubAnalytics();
  const { data: mixpanelData, isLoading: mixpanelLoading } = useMixPanelAnalytics(true);

  // State for Users tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [engagementFilter, setEngagementFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [usersPage, setUsersPage] = useState(1);
  const [companiesPage, setCompaniesPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // State for Newsletter tab
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [newsletterSourceFilter, setNewsletterSourceFilter] = useState<string>('all');

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!hubData) return [];
    let users = [...hubData.allUsers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.company?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      users = users.filter(u => u.lead_status === statusFilter);
    }

    if (countryFilter !== 'all') {
      users = users.filter(u => u.country === countryFilter);
    }

    if (engagementFilter !== 'all') {
      users = users.filter(u => {
        const engagement = getEngagementLevel(u);
        return engagement.level.toLowerCase().includes(engagementFilter.toLowerCase());
      });
    }

    switch (sortBy) {
      case 'recent':
        users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'score':
        users.sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
        break;
      case 'activity':
        users.sort((a, b) => {
          const aTotal = (a.stack_generator_uses || 0) + (a.tool_comparator_uses || 0) + (a.impact_analyzer_uses || 0) + (a.ai_assistant_uses || 0);
          const bTotal = (b.stack_generator_uses || 0) + (b.tool_comparator_uses || 0) + (b.impact_analyzer_uses || 0) + (b.ai_assistant_uses || 0);
          return bTotal - aTotal;
        });
        break;
      case 'name':
        users.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        break;
    }

    return users;
  }, [hubData?.allUsers, searchQuery, statusFilter, countryFilter, engagementFilter, sortBy]);

  // Filter newsletter subscribers
  const filteredSubscribers = useMemo(() => {
    if (!hubData) return [];
    let subs = [...hubData.allSubscribers];

    if (newsletterSearch) {
      const query = newsletterSearch.toLowerCase();
      subs = subs.filter(s => s.email?.toLowerCase().includes(query));
    }

    if (newsletterSourceFilter !== 'all') {
      subs = subs.filter(s => s.source === newsletterSourceFilter);
    }

    return subs;
  }, [hubData?.allSubscribers, newsletterSearch, newsletterSourceFilter]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    if (!hubData) return [];
    const countrySet = new Set(hubData.allUsers.map(u => u.country).filter(Boolean));
    return Array.from(countrySet).sort();
  }, [hubData?.allUsers]);

  // Get unique sources for newsletter filter
  const newsletterSources = useMemo(() => {
    if (!hubData) return [];
    const sourceSet = new Set(hubData.allSubscribers.map(s => s.source).filter(Boolean));
    return Array.from(sourceSet).sort();
  }, [hubData?.allSubscribers]);

  // Loading state
  if (hubLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Irrelevant Hub
            </h1>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (hubError || !hubData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Irrelevant Hub
            </h1>
          </div>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive/50" />
            <p className="text-destructive font-medium">Error al cargar datos del Hub</p>
            <p className="text-sm text-muted-foreground mt-2">
              {hubError?.message || 'No se pudieron obtener los datos'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data
  const usersTrendData = hubData.usersTrend.map(item => ({
    date: format(new Date(item.date), 'dd MMM', { locale: es }),
    fullDate: item.date,
    usuarios: item.count,
  }));

  const subscribersTrendData = hubData.subscribersTrend.map(item => ({
    date: format(new Date(item.date), 'dd MMM', { locale: es }),
    fullDate: item.date,
    suscriptores: item.count,
  }));

  const countryData = Object.entries(hubData.usersByCountry)
    .map(([country, count]) => ({ name: country, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const toolUsageData = Object.entries(hubData.toolUsage)
    .map(([tool, count]) => ({
      name: TOOL_CONFIG[tool]?.label || tool,
      shortName: TOOL_CONFIG[tool]?.shortLabel || tool,
      value: count,
      fill: TOOL_CONFIG[tool]?.color || '#6b7280',
    }))
    .sort((a, b) => b.value - a.value);

  const leadStatusData = Object.entries(hubData.usersByLeadStatus)
    .map(([status, count]) => ({
      name: LEAD_STATUS_CONFIG[status]?.label || status,
      value: count,
      fill: LEAD_STATUS_CONFIG[status]?.color || '#6b7280',
    }));

  const positionCategoryData = Object.entries(hubData.positionCategories)
    .map(([key, count]) => ({
      name: POSITION_CATEGORY_CONFIG[key as keyof typeof POSITION_CATEGORY_CONFIG]?.label || key,
      value: count,
      fill: POSITION_CATEGORY_CONFIG[key as keyof typeof POSITION_CATEGORY_CONFIG]?.color || '#6b7280',
    }))
    .filter(d => d.value > 0);

  const sourceData = Object.entries(hubData.subscribersBySource)
    .map(([source, count]) => ({ name: source, value: count }))
    .sort((a, b) => b.value - a.value);

  // Calculate metrics
  const recentWeekUsers = hubData.usersTrend.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const previousWeekUsers = hubData.usersTrend.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
  const userGrowth = previousWeekUsers > 0 ? ((recentWeekUsers - previousWeekUsers) / previousWeekUsers) * 100 : 0;

  const totalToolUsage = Object.values(hubData.toolUsage).reduce((sum, val) => sum + val, 0);
  const avgToolsPerUser = hubData.totalUsers > 0 ? (totalToolUsage / hubData.totalUsers).toFixed(1) : '0';

  // Users with tool usage
  const usersWithToolUsage = hubData.allUsers.filter(u =>
    (u.stack_generator_uses || 0) + (u.tool_comparator_uses || 0) +
    (u.impact_analyzer_uses || 0) + (u.ai_assistant_uses || 0) > 0
  ).length;

  // MixPanel metrics
  const sessions = mixpanelData?.topEvents?.find(e => e.event === 'Session - Started')?.count || 0;
  const signups = mixpanelData?.topEvents?.find(e => e.event === 'Sign Up')?.count || hubData.totalUsers;
  const whatsappClicks = mixpanelData?.topEvents?.find(e => e.event === 'WhatsApp - Clicked')?.count || 0;
  const consultingVisits = mixpanelData?.topEvents?.find(e => e.event === 'Consulting Page - Visited')?.count || 0;

  // Consent and quality rates
  const consentRate = hubData.totalUsers > 0 ? (hubData.usersWithMarketingConsent / hubData.totalUsers * 100) : 0;
  const phoneRate = hubData.totalUsers > 0 ? (hubData.usersWithPhone / hubData.totalUsers * 100) : 0;
  const companyRate = hubData.totalUsers > 0 ? (hubData.usersWithCompany / hubData.totalUsers * 100) : 0;

  // Hot leads count
  const hotLeads = hubData.allUsers.filter(u => (u.lead_score || 0) >= 60).length;
  const mqlLeads = hubData.allUsers.filter(u => (u.lead_score || 0) >= 80).length;

  // Retention rate
  const retentionRate = hubData.totalUsers > 0 ? (hubData.usersActiveLastMonth / hubData.totalUsers * 100) : 0;

  // Generate insights
  const insights: Array<{ type: 'success' | 'warning' | 'info'; title: string; description: string; metric?: string }> = [];

  const conversionRate = sessions > 0 ? (whatsappClicks / sessions * 100) : 0;
  if (conversionRate >= 5) {
    insights.push({
      type: 'success',
      title: 'Excelente conversion a lead',
      description: `${conversionRate.toFixed(1)}% de sesiones terminan en click a WhatsApp.`,
      metric: `${conversionRate.toFixed(1)}%`,
    });
  } else if (conversionRate < 2 && sessions > 100) {
    insights.push({
      type: 'warning',
      title: 'Baja conversion a lead',
      description: 'Menos del 2% de sesiones convierten. Optimiza CTAs.',
      metric: `${conversionRate.toFixed(1)}%`,
    });
  }

  const toolUsageRate = hubData.totalUsers > 0 ? (usersWithToolUsage / hubData.totalUsers * 100) : 0;
  if (toolUsageRate >= 50) {
    insights.push({
      type: 'success',
      title: 'Alto engagement con herramientas',
      description: `${toolUsageRate.toFixed(0)}% de usuarios usaron herramientas IA.`,
      metric: `${toolUsageRate.toFixed(0)}%`,
    });
  } else if (toolUsageRate < 30 && hubData.totalUsers > 50) {
    insights.push({
      type: 'info',
      title: 'Oportunidad de engagement',
      description: 'Muchos usuarios no han probado las herramientas.',
      metric: `${toolUsageRate.toFixed(0)}%`,
    });
  }

  if (hubData.dormantUsers > 10) {
    insights.push({
      type: 'warning',
      title: `${hubData.dormantUsers} usuarios dormidos`,
      description: 'Sin actividad en 90+ dias. Considera campana de reactivacion.',
      metric: `${hubData.dormantUsers}`,
    });
  }

  if (hotLeads > 0) {
    insights.push({
      type: 'info',
      title: `${hotLeads} leads calientes`,
      description: 'Usuarios con score 60+ listos para contactar.',
      metric: `${hotLeads}`,
    });
  }

  if (hubData.positionCategories.cLevel > 5) {
    insights.push({
      type: 'success',
      title: `${hubData.positionCategories.cLevel} C-Level / Founders`,
      description: 'Decision makers en tu base de usuarios.',
      metric: `${hubData.positionCategories.cLevel}`,
    });
  }

  // Copy email helper
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: 'Email copiado', description: email });
  };

  const handleCopyAllEmails = (emails: string[]) => {
    navigator.clipboard.writeText(emails.join(', '));
    toast({
      title: 'Emails copiados',
      description: `${emails.length} emails copiados al portapapeles`,
    });
  };

  // Export users to Excel
  const handleExportUsersToExcel = () => {
    const data = filteredUsers.map(user => {
      const totalUses = (user.stack_generator_uses || 0) +
                        (user.tool_comparator_uses || 0) +
                        (user.impact_analyzer_uses || 0) +
                        (user.ai_assistant_uses || 0);
      const engagement = getEngagementLevel(user);
      return {
        'Nombre': user.full_name || '',
        'Email': user.email || '',
        'Telefono': user.phone || '',
        'Empresa': user.company || '',
        'Cargo': user.position || '',
        'Pais': user.country || '',
        'Score': user.lead_score || 0,
        'Engagement': engagement.level,
        'Total Usos': totalUses,
        'Stack Generator': user.stack_generator_uses || 0,
        'Tool Comparator': user.tool_comparator_uses || 0,
        'Impact Analyzer': user.impact_analyzer_uses || 0,
        'AI Assistant': user.ai_assistant_uses || 0,
        'Marketing Consent': user.marketing_consent ? 'Si' : 'No',
        'Fecha Registro': user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, `hub_usuarios_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: 'Excel descargado', description: `${data.length} usuarios exportados` });
  };

  // Export companies to Excel
  const handleExportCompaniesToExcel = () => {
    if (!hubData) return;
    const data = hubData.topCompanies.map(company => {
      const companyData = hubData.usersByCompany.find(c => c.company === company.company);
      const emails = companyData?.users.map(u => u.email).join(', ') || '';
      return {
        'Empresa': company.company,
        'Usuarios': company.count,
        'Score Promedio': company.avgScore.toFixed(0),
        'Con Telefono': company.hasPhone,
        'Emails': emails,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
    XLSX.writeFile(wb, `hub_empresas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: 'Excel descargado', description: `${data.length} empresas exportadas` });
  };

  // Pagination helpers
  const totalUsersPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);

  const totalCompaniesPages = hubData ? Math.ceil(hubData.topCompanies.length / ITEMS_PER_PAGE) : 0;
  const paginatedCompanies = hubData ? hubData.topCompanies.slice((companiesPage - 1) * ITEMS_PER_PAGE, companiesPage * ITEMS_PER_PAGE) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Irrelevant Hub
          </h1>
          <p className="text-muted-foreground">Analytics completo de tu lead magnet y plataforma de engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            En vivo
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-8">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5 text-xs">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="countries" className="gap-1.5 text-xs">
            <Globe className="h-4 w-4" />
            Paises
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-1.5 text-xs">
            <Wrench className="h-4 w-4" />
            Herramientas
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-1.5 text-xs">
            <Target className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-1.5 text-xs">
            <Activity className="h-4 w-4" />
            Retencion
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="gap-1.5 text-xs">
            <Mail className="h-4 w-4" />
            Newsletter
          </TabsTrigger>
        </TabsList>

        {/* ==================== DASHBOARD TAB ==================== */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* Main KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] text-muted-foreground">Usuarios</span>
                </div>
                <p className="text-xl font-bold">{hubData.totalUsers.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[10px]">
                  {userGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {userGrowth >= 0 ? '+' : ''}{userGrowth.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Mail className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-[10px] text-muted-foreground">Newsletter</span>
                </div>
                <p className="text-xl font-bold">{hubData.totalNewsletterSubscribers}</p>
                <p className="text-[10px] text-muted-foreground">{hubData.activeNewsletterSubscribers} activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wrench className="h-3.5 w-3.5 text-cyan-500" />
                  <span className="text-[10px] text-muted-foreground">Herramientas</span>
                </div>
                <p className="text-xl font-bold">{totalToolUsage.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{avgToolsPerUser} prom/user</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-[10px] text-muted-foreground">WhatsApp</span>
                </div>
                <p className="text-xl font-bold text-green-600">{whatsappClicks}</p>
                <p className="text-[10px] text-green-600">Leads directos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[10px] text-muted-foreground">Score Prom</span>
                </div>
                <p className="text-xl font-bold">{hubData.avgLeadScore.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">{hotLeads} calientes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[10px] text-muted-foreground">Empresas</span>
                </div>
                <p className="text-xl font-bold">{hubData.topCompanies.length}</p>
                <p className="text-[10px] text-muted-foreground">{companyRate.toFixed(0)}% completado</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] text-muted-foreground">C-Level</span>
                </div>
                <p className="text-xl font-bold">{hubData.positionCategories.cLevel}</p>
                <p className="text-[10px] text-muted-foreground">Decision makers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserCheck className="h-3.5 w-3.5 text-teal-500" />
                  <span className="text-[10px] text-muted-foreground">Consent</span>
                </div>
                <p className="text-xl font-bold">{consentRate.toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground">{hubData.usersWithMarketingConsent} users</p>
              </CardContent>
            </Card>
          </div>

          {/* Insights Row */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {insights.slice(0, 5).map((insight, i) => (
                <Card key={i} className={cn(
                  "border-l-4",
                  insight.type === 'success' ? 'border-l-green-500 bg-green-500/5' :
                  insight.type === 'warning' ? 'border-l-amber-500 bg-amber-500/5' :
                  'border-l-blue-500 bg-blue-500/5'
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {insight.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                      {insight.type === 'info' && <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{insight.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{insight.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Users Trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Nuevos Usuarios (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usersTrendData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="usuarios"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="url(#colorUsers)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Resumen Rapido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{hubData.usersToday}</p>
                    <p className="text-[10px] text-muted-foreground">Hoy</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{hubData.usersThisWeek}</p>
                    <p className="text-[10px] text-muted-foreground">Esta semana</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{hubData.usersThisMonth}</p>
                    <p className="text-[10px] text-muted-foreground">Este mes</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{retentionRate.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">Retencion</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Calidad de Datos</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>Con telefono</span>
                      <span className="font-medium">{phoneRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={phoneRate} className="h-1.5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>Con empresa</span>
                      <span className="font-medium">{companyRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={companyRate} className="h-1.5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>Con consent</span>
                      <span className="font-medium">{consentRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={consentRate} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tool Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Uso de Herramientas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(hubData.toolUsage).map(([tool, count]) => {
                    const config = TOOL_CONFIG[tool];
                    const IconComponent = config?.icon || Wrench;
                    const percentage = totalToolUsage > 0 ? (count / totalToolUsage) * 100 : 0;
                    return (
                      <div key={tool} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" style={{ color: config?.color }} />
                            <span>{config?.label}</span>
                          </div>
                          <span className="font-bold">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: config?.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Position Categories */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Cargos / Seniority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={positionCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {positionCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {positionCategoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                      <span className="text-[10px]">{cat.name}: {cat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Paises Top
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {countryData.slice(0, 6).map((country, index) => {
                    const percentage = hubData.totalUsers > 0 ? (country.value / hubData.totalUsers) * 100 : 0;
                    return (
                      <div key={country.name} className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{country.name}</span>
                            <span className="font-medium">{country.value}</span>
                          </div>
                          <Progress value={percentage} className="h-1.5 mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== USERS TAB ==================== */}
        <TabsContent value="users" className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold text-blue-600">{hubData.totalUsers}</p>
                <p className="text-[10px] text-muted-foreground">Total usuarios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold text-green-600">{hubData.usersWithMarketingConsent}</p>
                <p className="text-[10px] text-muted-foreground">Con consent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold text-purple-600">{usersWithToolUsage}</p>
                <p className="text-[10px] text-muted-foreground">Usaron herramienta</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold text-amber-600">{hotLeads}</p>
                <p className="text-[10px] text-muted-foreground">Leads calientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold">{hubData.usersWithPhone}</p>
                <p className="text-[10px] text-muted-foreground">Con telefono</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold">{hubData.usersWithCompany}</p>
                <p className="text-[10px] text-muted-foreground">Con empresa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold">{hubData.usersWithPosition}</p>
                <p className="text-[10px] text-muted-foreground">Con cargo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-lg font-bold">{countries.length}</p>
                <p className="text-[10px] text-muted-foreground">Paises</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o empresa..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setUsersPage(1); }}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setUsersPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setUsersPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Pais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setUsersPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mas recientes</SelectItem>
                    <SelectItem value="score">Mayor score</SelectItem>
                    <SelectItem value="activity">Mayor actividad</SelectItem>
                    <SelectItem value="name">Nombre A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results & Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((usersPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(usersPage * ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuarios
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportUsersToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCopyAllEmails(filteredUsers.map(u => u.email).filter(Boolean))}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar emails ({filteredUsers.length})
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Usuario</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Pais</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="w-[80px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => {
                      const engagement = getEngagementLevel(user);
                      const scoreInfo = getLeadScoreInfo(user.lead_score || 0);
                      const totalUses = (user.stack_generator_uses || 0) +
                                       (user.tool_comparator_uses || 0) +
                                       (user.impact_analyzer_uses || 0) +
                                       (user.ai_assistant_uses || 0);

                      return (
                        <TableRow key={user.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-medium text-sm">
                                {user.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{user.full_name || 'Sin nombre'}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone ? (
                              <a
                                href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-green-600 hover:underline text-sm"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {user.phone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{user.company || '-'}</p>
                              <p className="text-xs text-muted-foreground">{user.position || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{user.country || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("text-xs", engagement.color)}>
                                {engagement.level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">({totalUses})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-xs font-bold", scoreInfo.color)}>
                              {user.lead_score || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(user.created_at), 'dd MMM yy', { locale: es })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyEmail(user.email)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              {user.phone && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" asChild>
                                  <a href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalUsersPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Pagina {usersPage} de {totalUsersPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                  disabled={usersPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalUsersPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalUsersPages <= 5) {
                      pageNum = i + 1;
                    } else if (usersPage <= 3) {
                      pageNum = i + 1;
                    } else if (usersPage >= totalUsersPages - 2) {
                      pageNum = totalUsersPages - 4 + i;
                    } else {
                      pageNum = usersPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={usersPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setUsersPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                  disabled={usersPage === totalUsersPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== COMPANIES TAB ==================== */}
        <TabsContent value="companies" className="mt-6 space-y-6">
          {/* Company Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm text-muted-foreground">Empresas Unicas</span>
                </div>
                <p className="text-3xl font-bold">{hubData.topCompanies.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Con Empresa</span>
                </div>
                <p className="text-3xl font-bold">{hubData.usersWithCompany}</p>
                <p className="text-xs text-muted-foreground">{companyRate.toFixed(0)}% del total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Multi-Usuario</span>
                </div>
                <p className="text-3xl font-bold">{hubData.topCompanies.filter(c => c.count > 1).length}</p>
                <p className="text-xs text-muted-foreground">Empresas con 2+ usuarios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Avg Score</span>
                </div>
                <p className="text-3xl font-bold">
                  {hubData.topCompanies.length > 0
                    ? (hubData.topCompanies.reduce((sum, c) => sum + c.avgScore, 0) / hubData.topCompanies.length).toFixed(0)
                    : 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Results & Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((companiesPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(companiesPage * ITEMS_PER_PAGE, hubData.topCompanies.length)} de {hubData.topCompanies.length} empresas
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCompaniesToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          {/* Top Companies Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Empresas por Usuarios
              </CardTitle>
              <CardDescription>Empresas ordenadas por cantidad de usuarios registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-center">Usuarios</TableHead>
                    <TableHead className="text-center">Score Prom</TableHead>
                    <TableHead className="text-center">Con Telefono</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.map((company, idx) => {
                    const globalIdx = (companiesPage - 1) * ITEMS_PER_PAGE + idx;
                    return (
                    <TableRow key={company.company}>
                      <TableCell>
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                          globalIdx === 0 ? "bg-amber-500 text-white" :
                          globalIdx === 1 ? "bg-gray-400 text-white" :
                          globalIdx === 2 ? "bg-amber-600 text-white" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {globalIdx < 3 ? (globalIdx === 0 ? <Trophy className="h-3.5 w-3.5" /> : globalIdx === 1 ? <Medal className="h-3.5 w-3.5" /> : <Award className="h-3.5 w-3.5" />) : globalIdx + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{company.company}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{company.count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-xs", getLeadScoreInfo(company.avgScore).color)}>
                          {company.avgScore.toFixed(0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {company.hasPhone > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {company.hasPhone}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const companyUsers = hubData.usersByCompany.find(c => c.company === company.company);
                            if (companyUsers) {
                              handleCopyAllEmails(companyUsers.users.map(u => u.email));
                            }
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Emails
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalCompaniesPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Pagina {companiesPage} de {totalCompaniesPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompaniesPage(p => Math.max(1, p - 1))}
                  disabled={companiesPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalCompaniesPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalCompaniesPages <= 5) {
                      pageNum = i + 1;
                    } else if (companiesPage <= 3) {
                      pageNum = i + 1;
                    } else if (companiesPage >= totalCompaniesPages - 2) {
                      pageNum = totalCompaniesPages - 4 + i;
                    } else {
                      pageNum = companiesPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={companiesPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCompaniesPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompaniesPage(p => Math.min(totalCompaniesPages, p + 1))}
                  disabled={companiesPage === totalCompaniesPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* Companies with Multiple Users */}
          {hubData.topCompanies.filter(c => c.count > 1).length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Empresas Multi-Usuario (Oportunidades ABM)
                </CardTitle>
                <CardDescription>Empresas con multiples usuarios - alto interes organizacional</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hubData.topCompanies.filter(c => c.count > 1).slice(0, 9).map((company) => {
                    const companyData = hubData.usersByCompany.find(c => c.company === company.company);
                    return (
                      <Card key={company.company} className="bg-amber-50/50 dark:bg-amber-900/10">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold">{company.company}</p>
                              <p className="text-xs text-muted-foreground">{company.count} usuarios</p>
                            </div>
                            <Badge className={cn("text-xs", getLeadScoreInfo(company.avgScore).color)}>
                              Score: {company.avgScore.toFixed(0)}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {companyData?.users.slice(0, 3).map((user) => (
                              <div key={user.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{user.full_name}</span>
                                <span className="text-xs text-muted-foreground">{user.position || '-'}</span>
                              </div>
                            ))}
                            {(companyData?.users.length || 0) > 3 && (
                              <p className="text-xs text-muted-foreground">+{(companyData?.users.length || 0) - 3} mas...</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== COUNTRIES TAB ==================== */}
        <TabsContent value="countries" className="mt-6 space-y-6">
          {/* Country Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Paises</span>
                </div>
                <p className="text-3xl font-bold">{hubData.countryMetrics.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Top Pais</span>
                </div>
                <p className="text-xl font-bold">{hubData.countryMetrics[0]?.country || '-'}</p>
                <p className="text-xs text-muted-foreground">{hubData.countryMetrics[0]?.users || 0} usuarios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Mejor Score</span>
                </div>
                <p className="text-xl font-bold">
                  {hubData.countryMetrics.length > 0
                    ? [...hubData.countryMetrics].sort((a, b) => b.avgScore - a.avgScore)[0]?.country
                    : '-'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Mas Engagement</span>
                </div>
                <p className="text-xl font-bold">
                  {hubData.countryMetrics.length > 0
                    ? [...hubData.countryMetrics].sort((a, b) => (b.toolUsage / b.users) - (a.toolUsage / a.users))[0]?.country
                    : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Country Distribution Chart */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribucion por Pais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {countryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuarios por Pais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hubData.countryMetrics.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="country" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="users" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Country Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Metricas por Pais
              </CardTitle>
              <CardDescription>Comparativa de calidad y engagement por pais</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pais</TableHead>
                    <TableHead className="text-center">Usuarios</TableHead>
                    <TableHead className="text-center">Score Prom</TableHead>
                    <TableHead className="text-center">Con Telefono</TableHead>
                    <TableHead className="text-center">Con Consent</TableHead>
                    <TableHead className="text-center">Uso Herramientas</TableHead>
                    <TableHead className="text-center">Engagement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hubData.countryMetrics.slice(0, 15).map((country) => {
                    const phoneRate = country.users > 0 ? (country.withPhone / country.users * 100) : 0;
                    const consentRate = country.users > 0 ? (country.withConsent / country.users * 100) : 0;
                    const avgToolUsage = country.users > 0 ? (country.toolUsage / country.users) : 0;
                    return (
                      <TableRow key={country.country}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{country.country}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{country.users}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs", getLeadScoreInfo(country.avgScore).color)}>
                            {country.avgScore.toFixed(0)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={phoneRate >= 50 ? 'text-green-600 font-medium' : ''}>
                            {phoneRate.toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={consentRate >= 70 ? 'text-green-600 font-medium' : ''}>
                            {consentRate.toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{country.toolUsage}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={avgToolUsage >= 2 ? 'bg-green-50 text-green-700' : ''}>
                            {avgToolUsage.toFixed(1)} prom
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TOOLS TAB ==================== */}
        <TabsContent value="tools" className="mt-6 space-y-6">
          {/* Tool Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(hubData.toolUsage).map(([tool, count]) => {
              const config = TOOL_CONFIG[tool];
              const IconComponent = config?.icon || Wrench;
              const usageRate = hubData.totalUsers > 0 ? ((count / hubData.totalUsers) * 100) : 0;
              return (
                <Card key={tool}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{config?.label || tool}</p>
                        <p className="text-3xl font-bold">{count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{usageRate.toFixed(0)}% de usuarios</p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ backgroundColor: `${config?.color}20` }}>
                        <IconComponent className="h-6 w-6" style={{ color: config?.color }} />
                      </div>
                    </div>
                    <Progress value={usageRate} className="h-2 mt-3" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tool Usage Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Distribucion de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={toolUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortName" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {toolUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Power Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Power Users
              </CardTitle>
              <CardDescription>Top 15 usuarios con mayor uso de herramientas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hubData.allUsers
                  .map(user => ({
                    ...user,
                    totalUses: (user.stack_generator_uses || 0) +
                               (user.tool_comparator_uses || 0) +
                               (user.impact_analyzer_uses || 0) +
                               (user.ai_assistant_uses || 0),
                  }))
                  .sort((a, b) => b.totalUses - a.totalUses)
                  .slice(0, 15)
                  .map((user, idx) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                        idx === 0 ? "bg-amber-500 text-white" :
                        idx === 1 ? "bg-gray-400 text-white" :
                        idx === 2 ? "bg-amber-600 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {idx < 3 ? (idx === 0 ? <Trophy className="h-3.5 w-3.5" /> : idx === 1 ? <Medal className="h-3.5 w-3.5" /> : <Award className="h-3.5 w-3.5" />) : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.company || user.email}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {Object.entries(TOOL_CONFIG).map(([key, config]) => {
                          const count = key === 'stackGenerator' ? user.stack_generator_uses :
                                       key === 'toolComparator' ? user.tool_comparator_uses :
                                       key === 'impactAnalyzer' ? user.impact_analyzer_uses :
                                       user.ai_assistant_uses;
                          return (
                            <div key={key} className="text-center w-10">
                              <p className="font-bold" style={{ color: config.color }}>{count || 0}</p>
                              <p className="text-[9px] text-muted-foreground">{config.shortLabel}</p>
                            </div>
                          );
                        })}
                        <Badge variant="secondary" className="ml-2">{user.totalUses}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== LEADS TAB ==================== */}
        <TabsContent value="leads" className="mt-6 space-y-6">
          {/* Lead Score Distribution */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { min: 0, max: 20, label: 'Frios', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Snowflake },
              { min: 21, max: 40, label: 'Tibios', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: ThermometerSun },
              { min: 41, max: 60, label: 'Interesados', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Star },
              { min: 61, max: 80, label: 'Calientes', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Flame },
              { min: 81, max: 100, label: 'MQL', color: 'text-green-600', bgColor: 'bg-green-100', icon: Crown },
            ].map((tier) => {
              const count = hubData.allUsers.filter(u => {
                const score = u.lead_score || 0;
                return score >= tier.min && score <= tier.max;
              }).length;
              const TierIcon = tier.icon;
              return (
                <Card key={tier.label} className={cn("border-l-4", tier.color.replace('text-', 'border-'))}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("p-2 rounded-lg", tier.bgColor)}>
                        <TierIcon className={cn("h-4 w-4", tier.color)} />
                      </div>
                      <span className="text-xs text-muted-foreground">{tier.min}-{tier.max}</span>
                    </div>
                    <p className={cn("text-2xl font-bold", tier.color)}>{count}</p>
                    <p className="text-xs text-muted-foreground">{tier.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lead Status & Pipeline */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Estado de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {leadStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {leadStatusData.map((status) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.fill }} />
                      <span className="text-xs">{status.name}: {status.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pipeline Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leadStatusData.map((status) => {
                  const percentage = hubData.totalUsers > 0 ? (status.value / hubData.totalUsers) * 100 : 0;
                  return (
                    <div key={status.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.fill }} />
                          <span>{status.name}</span>
                        </div>
                        <span className="font-medium">{status.value} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: status.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Hot Leads */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Leads Calientes (Score 60+)
                  </CardTitle>
                  <CardDescription>Leads con mayor potencial de conversion</CardDescription>
                </div>
                {hotLeads > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const emails = hubData.allUsers
                        .filter(u => (u.lead_score || 0) >= 60)
                        .map(u => u.email);
                      handleCopyAllEmails(emails);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar emails ({hotLeads})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hotLeads === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No hay leads con score 60+ todavia</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {hubData.allUsers
                    .filter(u => (u.lead_score || 0) >= 60)
                    .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
                    .slice(0, 20)
                    .map((user) => {
                      const scoreInfo = getLeadScoreInfo(user.lead_score || 0);
                      return (
                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                            scoreInfo.color
                          )}>
                            {user.lead_score}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{user.full_name}</p>
                              {user.marketing_consent && (
                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                  Consent
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <div className="text-right hidden md:block">
                            <p className="text-sm font-medium">{user.company || '-'}</p>
                            <p className="text-xs text-muted-foreground">{user.country}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyEmail(user.email)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            {user.phone && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" asChild>
                                <a href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== RETENTION TAB ==================== */}
        <TabsContent value="retention" className="mt-6 space-y-6">
          {/* Retention KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Activos (30d)</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{hubData.usersActiveLastMonth}</p>
                <p className="text-xs text-green-600">{retentionRate.toFixed(0)}% del total</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Activos (7d)</span>
                </div>
                <p className="text-3xl font-bold">{hubData.usersActiveLastWeek}</p>
                <p className="text-xs text-muted-foreground">
                  {hubData.totalUsers > 0 ? ((hubData.usersActiveLastWeek / hubData.totalUsers) * 100).toFixed(0) : 0}% del total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserX className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Dormidos (90d+)</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{hubData.dormantUsers}</p>
                <p className="text-xs text-amber-600">Oportunidad reactivacion</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Usaron Herramienta</span>
                </div>
                <p className="text-3xl font-bold">{usersWithToolUsage}</p>
                <p className="text-xs text-muted-foreground">
                  {hubData.totalUsers > 0 ? ((usersWithToolUsage / hubData.totalUsers) * 100).toFixed(0) : 0}% del total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Niveles de Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const engagementCounts = {
                    'Power User': 0,
                    'Activo': 0,
                    'Enganchado': 0,
                    'Explorador': 0,
                    'Nuevo': 0,
                  };
                  hubData.allUsers.forEach(u => {
                    const level = getEngagementLevel(u).level;
                    engagementCounts[level as keyof typeof engagementCounts]++;
                  });

                  const engagementData = Object.entries(engagementCounts).map(([level, count]) => ({
                    level,
                    count,
                    percentage: hubData.totalUsers > 0 ? (count / hubData.totalUsers) * 100 : 0,
                  }));

                  const colors: Record<string, string> = {
                    'Power User': '#8b5cf6',
                    'Activo': '#22c55e',
                    'Enganchado': '#3b82f6',
                    'Explorador': '#f59e0b',
                    'Nuevo': '#6b7280',
                  };

                  return (
                    <div className="space-y-4">
                      {engagementData.map((item) => (
                        <div key={item.level} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[item.level] }} />
                              <span className="font-medium">{item.level}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">{item.count}</span>
                              <span className="text-xs text-muted-foreground">({item.percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${item.percentage}%`, backgroundColor: colors[item.level] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Estado de Actividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Activos (7d)', value: hubData.usersActiveLastWeek, fill: '#22c55e' },
                          { name: 'Activos (30d)', value: hubData.usersActiveLastMonth - hubData.usersActiveLastWeek, fill: '#3b82f6' },
                          { name: 'Inactivos', value: hubData.totalUsers - hubData.usersActiveLastMonth - hubData.dormantUsers, fill: '#f59e0b' },
                          { name: 'Dormidos', value: hubData.dormantUsers, fill: '#ef4444' },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dormant Users List */}
          {hubData.dormantUsers > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserX className="h-5 w-5 text-amber-500" />
                      Usuarios Dormidos (90+ dias sin actividad)
                    </CardTitle>
                    <CardDescription>Candidatos para campana de reactivacion</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
                      const dormantEmails = hubData.allUsers
                        .filter(u => {
                          if (!u.last_activity_at) return new Date(u.created_at) < threeMonthsAgo;
                          return new Date(u.last_activity_at) < threeMonthsAgo;
                        })
                        .map(u => u.email);
                      handleCopyAllEmails(dormantEmails);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar emails ({hubData.dormantUsers})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
                    return hubData.allUsers
                      .filter(u => {
                        if (!u.last_activity_at) return new Date(u.created_at) < threeMonthsAgo;
                        return new Date(u.last_activity_at) < threeMonthsAgo;
                      })
                      .slice(0, 15)
                      .map((user) => {
                        const lastActive = user.last_activity_at || user.created_at;
                        const daysSince = differenceInDays(new Date(), new Date(lastActive));
                        return (
                          <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                              <UserX className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-amber-600">{daysSince} dias</p>
                              <p className="text-xs text-muted-foreground">sin actividad</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyEmail(user.email)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== NEWSLETTER TAB ==================== */}
        <TabsContent value="newsletter" className="mt-6 space-y-6">
          {/* Newsletter KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Total Suscriptores</span>
                </div>
                <p className="text-3xl font-bold">{hubData.totalNewsletterSubscribers}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Activos</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{hubData.activeNewsletterSubscribers}</p>
                <p className="text-xs text-green-600">
                  {hubData.totalNewsletterSubscribers > 0
                    ? ((hubData.activeNewsletterSubscribers / hubData.totalNewsletterSubscribers) * 100).toFixed(0)
                    : 0}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Este Mes</span>
                </div>
                <p className="text-3xl font-bold">{hubData.subscribersThisMonth}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Inbox className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Fuentes</span>
                </div>
                <p className="text-3xl font-bold">{Object.keys(hubData.subscribersBySource).length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Newsletter Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Subscribers Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Nuevos Suscriptores (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={subscribersTrendData}>
                      <defs>
                        <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="suscriptores"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="url(#colorSubs)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sources Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Suscriptores por Fuente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sourceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {sourceData.map((source, index) => (
                    <div key={source.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-xs">{source.name}: {source.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email..."
                    value={newsletterSearch}
                    onChange={(e) => setNewsletterSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={newsletterSourceFilter} onValueChange={setNewsletterSourceFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fuentes</SelectItem>
                    {newsletterSources.map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyAllEmails(filteredSubscribers.filter(s => s.is_active).map(s => s.email))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar activos ({filteredSubscribers.filter(s => s.is_active).length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscribers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AtSign className="h-5 w-5" />
                Suscriptores Newsletter
              </CardTitle>
              <CardDescription>
                Mostrando {Math.min(filteredSubscribers.length, 50)} de {filteredSubscribers.length} suscriptores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Suscripcion</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.slice(0, 50).map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{sub.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.source || 'unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        {sub.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(sub.subscribed_at), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyEmail(sub.email)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
