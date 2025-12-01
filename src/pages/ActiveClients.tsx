import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  ExternalLink,
  Building2,
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trophy,
  Medal,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  LayoutGrid,
  List,
  Percent,
  Zap,
  Target,
  Star,
  Phone,
  Mail,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { ClientWithProjects } from '@/types/database';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'inactive' | 'at_risk';
type ViewMode = 'table' | 'cards';
type SortBy = 'mrr' | 'name' | 'created' | 'projects';

export default function ActiveClients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortBy>('mrr');

  const { clients, isLoading, getClientMrr, getActiveProjectsCount } = useClients();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Client has active deal (contract in ACTIVE status)
  const hasActiveDeal = (client: ClientWithProjects) => {
    return client.projects?.some(p => p.deal?.status === 'ACTIVE') || false;
  };

  // Client has at least one deal (closed contract)
  const hasAnyDeal = (client: ClientWithProjects) => {
    return client.projects?.some(p => p.deal) || false;
  };

  // Check if client is at risk (churned or on_hold deals)
  const isAtRisk = (client: ClientWithProjects) => {
    return client.projects?.some(p => p.deal?.status === 'ON_HOLD' || p.deal?.status === 'CHURNED') || false;
  };

  // Get total implementation fees for a client
  const getClientFees = (client: ClientWithProjects) => {
    return client.projects?.reduce((total, project) => {
      if (project.deal) {
        return total + project.deal.implementation_fee_usd;
      }
      return total;
    }, 0) || 0;
  };

  // Get client tenure in months
  const getClientTenure = (client: ClientWithProjects) => {
    const created = new Date(client.created_at);
    const now = new Date();
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    return months;
  };

  // Only show clients that have at least one deal (contract)
  const clientsWithDeals = useMemo(() => clients.filter(hasAnyDeal), [clients]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = clientsWithDeals.length;
    const active = clientsWithDeals.filter(hasActiveDeal).length;
    const atRisk = clientsWithDeals.filter(isAtRisk).length;
    const inactive = total - active;
    const totalMrr = clientsWithDeals.reduce((sum, c) => sum + getClientMrr(c), 0);
    const totalFees = clientsWithDeals.reduce((sum, c) => sum + getClientFees(c), 0);
    const avgMrr = active > 0 ? totalMrr / active : 0;
    const avgTenure = total > 0 ? clientsWithDeals.reduce((sum, c) => sum + getClientTenure(c), 0) / total : 0;

    // Top clients by MRR
    const topClients = [...clientsWithDeals]
      .sort((a, b) => getClientMrr(b) - getClientMrr(a))
      .slice(0, 5);

    // Recent clients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newClientsThisMonth = clientsWithDeals.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length;

    return {
      total,
      active,
      inactive,
      atRisk,
      totalMrr,
      totalFees,
      avgMrr,
      avgTenure,
      topClients,
      newClientsThisMonth,
      retentionRate: total > 0 ? (active / total) * 100 : 0,
    };
  }, [clientsWithDeals, getClientMrr]);

  const filteredClients = useMemo(() => {
    let filtered = clientsWithDeals.filter((client) => {
      const matchesSearch =
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const isActive = hasActiveDeal(client);
      const clientAtRisk = isAtRisk(client);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive && !clientAtRisk) ||
        (statusFilter === 'inactive' && !isActive) ||
        (statusFilter === 'at_risk' && clientAtRisk);

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'mrr':
          return getClientMrr(b) - getClientMrr(a);
        case 'name':
          return a.company_name.localeCompare(b.company_name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'projects':
          return (b.projects?.length || 0) - (a.projects?.length || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clientsWithDeals, searchTerm, statusFilter, sortBy, getClientMrr]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Clientes
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
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes y monitorea el MRR
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {metrics.active} activos
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">MRR Total</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalMrr)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ARR: {formatCurrency(metrics.totalMrr * 12)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Clientes</span>
            </div>
            <p className="text-2xl font-bold">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{metrics.newClientsThisMonth} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Activos</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{metrics.active}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.retentionRate.toFixed(0)}% retencion
            </p>
          </CardContent>
        </Card>

        <Card className={metrics.atRisk > 0 ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn("h-4 w-4", metrics.atRisk > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
              <span className="text-xs text-muted-foreground">En Riesgo</span>
            </div>
            <p className={cn("text-2xl font-bold", metrics.atRisk > 0 ? 'text-amber-600' : '')}>{metrics.atRisk}</p>
            <p className="text-xs text-muted-foreground mt-1">On-hold o churned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">MRR Promedio</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.avgMrr)}</p>
            <p className="text-xs text-muted-foreground mt-1">Por cliente activo</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Fees Totales</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalFees)}</p>
            <p className="text-xs text-muted-foreground mt-1">Implementacion</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Quick View */}
      {metrics.topClients.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top 5 Clientes por MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {metrics.topClients.map((client, idx) => {
                const mrr = getClientMrr(client);
                const isActive = hasActiveDeal(client);
                return (
                  <Link
                    key={client.id}
                    to={`/clients/${client.id}`}
                    className="flex-shrink-0 w-[200px] p-3 border rounded-lg hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                        idx === 0 ? "bg-amber-500" :
                        idx === 1 ? "bg-gray-400" :
                        idx === 2 ? "bg-amber-600" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {idx < 3 ? (idx === 0 ? <Trophy className="h-3.5 w-3.5" /> : idx === 1 ? <Medal className="h-3.5 w-3.5" /> : <Award className="h-3.5 w-3.5" />) : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {client.company_name}
                        </p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(mrr)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] h-4 border-0",
                              isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            )}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {client.projects?.length || 0} proy.
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({metrics.total})</SelectItem>
              <SelectItem value="active">Activos ({metrics.active})</SelectItem>
              <SelectItem value="inactive">Inactivos ({metrics.inactive})</SelectItem>
              <SelectItem value="at_risk">En Riesgo ({metrics.atRisk})</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortBy)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mrr">Mayor MRR</SelectItem>
              <SelectItem value="name">Nombre A-Z</SelectItem>
              <SelectItem value="created">Mas reciente</SelectItem>
              <SelectItem value="projects">Mas proyectos</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
        </span>
        <span>
          MRR filtrado: {formatCurrency(filteredClients.reduce((sum, c) => sum + getClientMrr(c), 0))}
        </span>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-center">Proyectos</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead>Cliente desde</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        {clientsWithDeals.length === 0
                          ? 'No hay clientes con contrato aun'
                          : 'No se encontraron clientes'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client, idx) => {
                  const mrr = getClientMrr(client);
                  const fees = getClientFees(client);
                  const activeProjects = getActiveProjectsCount(client);
                  const totalProjects = client.projects?.length || 0;
                  const isActive = hasActiveDeal(client);
                  const clientAtRisk = isAtRisk(client);
                  const tenure = getClientTenure(client);

                  return (
                    <TableRow
                      key={client.id}
                      className={cn(
                        idx === 0 && sortBy === 'mrr' && 'bg-amber-50/50 dark:bg-amber-900/10',
                        clientAtRisk && 'bg-amber-50/30 dark:bg-amber-900/5'
                      )}
                    >
                      <TableCell>
                        {sortBy === 'mrr' && idx < 3 ? (
                          <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                            idx === 0 ? "bg-amber-500" :
                            idx === 1 ? "bg-gray-400" :
                            "bg-amber-600"
                          )}>
                            {idx === 0 ? <Trophy className="h-3 w-3" /> : idx === 1 ? <Medal className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">{idx + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client.company_name}</span>
                          {tenure >= 12 && (
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" title={`Cliente por ${tenure} meses`} />
                          )}
                        </div>
                        {client.website_url && (
                          <a
                            href={client.website_url.startsWith('http') ? client.website_url : `https://${client.website_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{client.contact_name || '-'}</p>
                          {client.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {activeProjects}
                            <span className="text-muted-foreground font-normal">/{totalProjects}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-bold",
                          mrr > 0 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {formatCurrency(mrr)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(fees)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{format(new Date(client.created_at), 'MMM yyyy', { locale: es })}</p>
                          <p className="text-xs text-muted-foreground">{tenure} meses</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {clientAtRisk ? (
                          <Badge
                            variant="outline"
                            className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            En Riesgo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              'border-0',
                              isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                            )}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/clients/${client.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {clientsWithDeals.length === 0
                  ? 'No hay clientes con contrato aun'
                  : 'No se encontraron clientes'}
              </p>
            </div>
          ) : (
            filteredClients.map((client, idx) => {
              const mrr = getClientMrr(client);
              const fees = getClientFees(client);
              const activeProjects = getActiveProjectsCount(client);
              const totalProjects = client.projects?.length || 0;
              const isActive = hasActiveDeal(client);
              const clientAtRisk = isAtRisk(client);
              const tenure = getClientTenure(client);

              return (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="block"
                >
                  <Card className={cn(
                    "hover:border-primary/50 transition-all hover:shadow-md cursor-pointer h-full",
                    clientAtRisk && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/5"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {sortBy === 'mrr' && idx < 3 && (
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                              idx === 0 ? "bg-amber-500" :
                              idx === 1 ? "bg-gray-400" :
                              "bg-amber-600"
                            )}>
                              {idx === 0 ? <Trophy className="h-3 w-3" /> : idx === 1 ? <Medal className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold flex items-center gap-1">
                              {client.company_name}
                              {tenure >= 12 && (
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              )}
                            </h3>
                            {client.contact_name && (
                              <p className="text-xs text-muted-foreground">{client.contact_name}</p>
                            )}
                          </div>
                        </div>
                        {clientAtRisk ? (
                          <Badge
                            variant="outline"
                            className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 text-xs"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Riesgo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              'border-0 text-xs',
                              isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            )}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground">MRR</p>
                          <p className={cn(
                            "text-lg font-bold",
                            mrr > 0 ? "text-primary" : "text-muted-foreground"
                          )}>
                            {formatCurrency(mrr)}
                          </p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground">Proyectos</p>
                          <p className="text-lg font-bold">
                            {activeProjects}
                            <span className="text-sm text-muted-foreground font-normal">/{totalProjects}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Cliente hace {tenure} meses</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Fees: {formatCurrency(fees)}</span>
                        </div>
                      </div>
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
