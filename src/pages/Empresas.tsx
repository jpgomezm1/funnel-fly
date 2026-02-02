import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLeads } from '@/hooks/useLeads';
import { useClients } from '@/hooks/useClients';
import {
  LeadChannel,
  LeadSubchannel,
  LeadStage,
  STAGE_LABELS,
  CHANNEL_LABELS,
  SUBCHANNEL_LABELS,
  CHANNEL_SUBCHANNELS,
} from '@/types/database';
import { formatDistanceToBogota } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  ExternalLink,
  Briefcase,
  Building2,
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Phone,
  Mail,
  Activity,
  DollarSign,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { DeleteCompanyDialog } from '@/components/leads/DeleteCompanyDialog';

// Lead stages (early pipeline stages)
const LEAD_STAGES: LeadStage[] = ['PROSPECTO', 'CONTACTADO', 'DESCUBRIMIENTO'];
const PROJECT_STAGES: LeadStage[] = ['DEMOSTRACION', 'PROPUESTA', 'CERRADO_GANADO', 'CERRADO_PERDIDO'];

type ViewMode = 'table' | 'cards';
type SortBy = 'recent' | 'name' | 'activity' | 'stage';

const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; badge: string }> = {
  PROSPECTO: { bg: 'bg-slate-500', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  CONTACTADO: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  DESCUBRIMIENTO: { bg: 'bg-violet-500', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  DEMOSTRACION: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  PROPUESTA: { bg: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  CERRADO_GANADO: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CERRADO_PERDIDO: { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-200' },
};

export default function Empresas() {
  const { leads, loading: leadsLoading, createLead, deleteLead } = useLeads();
  const { clients, isLoading: clientsLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; projectCount: number } | null>(null);
  const [newLead, setNewLead] = useState({
    company_name: '',
    description: '',
    linkedin_url: '',
    website_url: '',
    channel: 'OUTBOUND_APOLLO' as LeadChannel,
    subchannel: 'NINGUNO' as LeadSubchannel,
    owner_id: '',
    notes: '',
  });

  const COMERCIALES_MAP: Record<string, string> = {
    'juan_pablo_gomez': 'Juan Pablo Gomez',
    'agustin_hoyos': 'Agustin Hoyos',
    'sara_garces': 'Sara Garces',
    'pamela_puello': 'Pamela Puello'
  };

  // Create a map of lead_id to client for quick lookup
  const clientsByLeadId = useMemo(() =>
    new Map(clients.filter(c => c.original_lead_id).map(c => [c.original_lead_id, c])),
    [clients]
  );

  // Calculate project counts per lead
  const getProjectInfo = (leadId: string) => {
    const client = clientsByLeadId.get(leadId);
    if (!client || !client.projects) return { count: 0, hasActiveDeals: false, totalMrr: 0 };

    const activeDeals = client.projects.filter(p => p.deal?.status === 'ACTIVE');
    const totalMrr = activeDeals.reduce((sum, p) => sum + (p.deal?.mrr_usd || 0), 0);
    return {
      count: client.projects.length,
      hasActiveDeals: activeDeals.length > 0,
      totalMrr
    };
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const byStage: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    const byOwner: Record<string, number> = {};
    let withProjects = 0;
    let withoutProjects = 0;
    let totalMrrActive = 0;

    leads.forEach(lead => {
      // By stage
      byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
      // By channel
      byChannel[lead.channel] = (byChannel[lead.channel] || 0) + 1;
      // By owner
      if (lead.owner_id) {
        byOwner[lead.owner_id] = (byOwner[lead.owner_id] || 0) + 1;
      }
      // Project info
      const projectInfo = getProjectInfo(lead.id);
      if (projectInfo.count > 0) {
        withProjects++;
        totalMrrActive += projectInfo.totalMrr;
      } else {
        withoutProjects++;
      }
    });

    // Leads in early stages vs project stages
    const earlyStageCount = LEAD_STAGES.reduce((sum, s) => sum + (byStage[s] || 0), 0);
    const projectStageCount = PROJECT_STAGES.reduce((sum, s) => sum + (byStage[s] || 0), 0);
    const wonCount = byStage['CERRADO_GANADO'] || 0;
    const lostCount = byStage['CERRADO_PERDIDO'] || 0;

    // Conversion rates
    const conversionToProject = earlyStageCount > 0 ? (projectStageCount / (earlyStageCount + projectStageCount)) * 100 : 0;
    const winRate = (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = leads.filter(l => new Date(l.last_activity_at) >= sevenDaysAgo).length;

    return {
      total,
      byStage,
      byChannel,
      byOwner,
      withProjects,
      withoutProjects,
      totalMrrActive,
      earlyStageCount,
      projectStageCount,
      wonCount,
      lostCount,
      conversionToProject,
      winRate,
      recentActivity,
    };
  }, [leads, getProjectInfo]);

  const filteredLeads = useMemo(() => {
    let filtered = leads.filter((lead) => {
      const searchMatch =
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const stageMatch = !stageFilter || stageFilter === 'all' || lead.stage === stageFilter;
      const channelMatch = !channelFilter || channelFilter === 'all' || lead.channel === channelFilter;
      const ownerMatch = !ownerFilter || ownerFilter === 'all' || lead.owner_id === ownerFilter;

      // Project filter
      const projectInfo = getProjectInfo(lead.id);
      const projectMatch =
        projectFilter === 'all' ||
        (projectFilter === 'with_project' && projectInfo.count > 0) ||
        (projectFilter === 'without_project' && projectInfo.count === 0);

      return searchMatch && stageMatch && channelMatch && ownerMatch && projectMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return a.company_name.localeCompare(b.company_name);
        case 'activity':
          return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
        case 'stage':
          const stageOrder = [...LEAD_STAGES, ...PROJECT_STAGES];
          return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
        default:
          return 0;
      }
    });

    return filtered;
  }, [leads, searchTerm, stageFilter, channelFilter, ownerFilter, projectFilter, sortBy, getProjectInfo]);

  const handleCreateLead = async () => {
    if (!newLead.company_name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await createLead(newLead);
      setNewLead({
        company_name: '',
        contact_name: '',
        contact_role: '',
        phone: '',
        email: '',
        channel: 'OUTBOUND_APOLLO',
        subchannel: 'NINGUNO',
        owner_id: '',
        notes: '',
      });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    await deleteLead(deleteTarget.id);
  };

  const loading = leadsLoading || clientsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Empresas
            </h1>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Empresas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu pipeline de ventas
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nueva Empresa
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                <Input
                  id="company_name"
                  placeholder="Nombre de la empresa"
                  value={newLead.company_name}
                  onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe a qué se dedica la empresa, industria, tamaño, etc."
                  value={newLead.description}
                  onChange={(e) => setNewLead({ ...newLead, description: e.target.value })}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <Input
                    id="linkedin_url"
                    placeholder="https://linkedin.com/company/..."
                    value={newLead.linkedin_url}
                    onChange={(e) => setNewLead({ ...newLead, linkedin_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">Sitio Web</Label>
                  <Input
                    id="website_url"
                    placeholder="https://ejemplo.com"
                    value={newLead.website_url}
                    onChange={(e) => setNewLead({ ...newLead, website_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channel">Canal</Label>
                  <Select
                    value={newLead.channel}
                    onValueChange={(value) => setNewLead({
                      ...newLead,
                      channel: value as LeadChannel,
                      subchannel: 'NINGUNO' // Reset subchannel when channel changes
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Solo mostrar subcanal si el canal tiene subcanales disponibles */}
                {CHANNEL_SUBCHANNELS[newLead.channel]?.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="subchannel">Subcanal</Label>
                    <Select
                      value={newLead.subchannel}
                      onValueChange={(value) => setNewLead({ ...newLead, subchannel: value as LeadSubchannel })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNEL_SUBCHANNELS[newLead.channel].map((subchannelValue) => (
                          <SelectItem key={subchannelValue} value={subchannelValue}>
                            {SUBCHANNEL_LABELS[subchannelValue]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Propietario</Label>
                <Select
                  value={newLead.owner_id}
                  onValueChange={(value) => setNewLead({ ...newLead, owner_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMERCIALES_MAP).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateLead} disabled={!newLead.company_name.trim() || isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Empresa'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Empresas</span>
            </div>
            <p className="text-2xl font-bold">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.recentActivity} activas esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">En Pipeline</span>
            </div>
            <p className="text-2xl font-bold">{metrics.earlyStageCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Early stage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Con Proyecto</span>
            </div>
            <p className="text-2xl font-bold">{metrics.projectStageCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              En negociacion
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Ganados</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{metrics.wonCount}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
              Win rate: {metrics.winRate.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card className={cn(metrics.lostCount > 0 && "border-red-200 bg-red-50/50 dark:bg-red-900/10")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className={cn("h-4 w-4", metrics.lostCount > 0 ? "text-red-500" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">Perdidos</span>
            </div>
            <p className={cn("text-2xl font-bold", metrics.lostCount > 0 && "text-red-600")}>{metrics.lostCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cerrados perdido
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">MRR Activo</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              ${metrics.totalMrrActive.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              De {metrics.withProjects} empresas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Pipeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {[...LEAD_STAGES, ...PROJECT_STAGES].map((stage) => {
              const count = metrics.byStage[stage] || 0;
              const percentage = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
              const colors = STAGE_COLORS[stage];

              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
                  className={cn(
                    "p-3 rounded-lg border transition-all text-center",
                    stageFilter === stage
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary/50"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full mx-auto mb-2", colors.bg)} />
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {STAGE_LABELS[stage]}
                  </p>
                  <Progress value={percentage} className="h-1 mt-2" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                <SelectItem key={stage} value={stage}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", STAGE_COLORS[stage as LeadStage].bg)} />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los canales</SelectItem>
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Propietario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(COMERCIALES_MAP).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Proyectos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({metrics.total})</SelectItem>
              <SelectItem value="with_project">Con proyecto ({metrics.withProjects})</SelectItem>
              <SelectItem value="without_project">Sin proyecto ({metrics.withoutProjects})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mas reciente</SelectItem>
              <SelectItem value="name">Nombre A-Z</SelectItem>
              <SelectItem value="activity">Ultima actividad</SelectItem>
              <SelectItem value="stage">Por etapa</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredLeads.length} empresa{filteredLeads.length !== 1 ? 's' : ''} encontrada{filteredLeads.length !== 1 ? 's' : ''}
        </span>
        {stageFilter !== 'all' || channelFilter !== 'all' || ownerFilter !== 'all' || projectFilter !== 'all' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStageFilter('all');
              setChannelFilter('all');
              setOwnerFilter('all');
              setProjectFilter('all');
            }}
          >
            Limpiar filtros
          </Button>
        ) : null}
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead>Ultima actividad</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No se encontraron empresas</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const projectInfo = getProjectInfo(lead.id);
                  const stageColors = STAGE_COLORS[lead.stage];

                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-8 rounded-full", stageColors.bg)} />
                          <div>
                            <p className="font-medium">{lead.company_name}</p>
                            {lead.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.contact_name ? (
                          <div>
                            <p className="text-sm">{lead.contact_name}</p>
                            {lead.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CHANNEL_LABELS[lead.channel]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs border-0', stageColors.badge)}
                        >
                          {STAGE_LABELS[lead.stage]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {COMERCIALES_MAP[lead.owner_id as keyof typeof COMERCIALES_MAP] || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {projectInfo.count > 0 ? (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{projectInfo.count}</span>
                            {projectInfo.hasActiveDeals && (
                              <Badge variant="default" className="text-[10px] h-4 ml-1 bg-emerald-500">
                                ${projectInfo.totalMrr.toLocaleString('en-US')}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToBogota(lead.last_activity_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({
                              id: lead.id,
                              name: lead.company_name,
                              projectCount: projectInfo.count,
                            })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to={`/empresas/${lead.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Company Dialog */}
      <DeleteCompanyDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        companyName={deleteTarget?.name || ''}
        hasProjects={(deleteTarget?.projectCount || 0) > 0}
        projectCount={deleteTarget?.projectCount || 0}
        onConfirm={handleDeleteLead}
      />

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No se encontraron empresas</p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const projectInfo = getProjectInfo(lead.id);
              const stageColors = STAGE_COLORS[lead.stage];

              return (
                <Link key={lead.id} to={`/empresas/${lead.id}`} className="block">
                  <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", stageColors.bg)} />
                          <div>
                            <h3 className="font-semibold">{lead.company_name}</h3>
                            {lead.contact_name && (
                              <p className="text-xs text-muted-foreground">{lead.contact_name}</p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-xs border-0', stageColors.badge)}
                        >
                          {STAGE_LABELS[lead.stage]}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        {lead.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {CHANNEL_LABELS[lead.channel]}
                          </Badge>
                          {projectInfo.count > 0 && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {projectInfo.count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToBogota(lead.last_activity_at)}
                        </div>
                      </div>

                      {projectInfo.hasActiveDeals && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">MRR Activo</span>
                            <span className="text-sm font-bold text-emerald-600">
                              ${projectInfo.totalMrr.toLocaleString('en-US')}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
