import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  DollarSign,
  Plus,
  Briefcase,
  ExternalLink,
  Edit,
  User,
  Star,
  Trash2,
  Globe,
  Linkedin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  Users,
  LayoutDashboard,
  FolderOpen,
  Zap,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Award,
  RefreshCw,
  CreditCard,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClient, useClientContacts } from '@/hooks/useClients';
import { useClientInvoices } from '@/hooks/useClientInvoices';
import { NewProjectModal } from '@/components/clients/NewProjectModal';
import { ContactModal } from '@/components/clients/ContactModal';
import { EditCompanyModal } from '@/components/clients/EditCompanyModal';
import { CompanyDocumentsCard } from '@/components/documents/CompanyDocumentsCard';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PROJECT_STAGE_LABELS,
  DEAL_STATUS_LABELS,
  ProjectStage,
  DealStatus,
  ClientContact,
  ProjectExecutionStage,
} from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const getProjectStageColor = (stage: ProjectStage) => {
  const colors: Record<ProjectStage, string> = {
    DEMOSTRACION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    PROPUESTA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    CERRADO_GANADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CERRADO_PERDIDO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[stage];
};

const getDealStatusColor = (status: DealStatus) => {
  const colors: Record<DealStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ON_HOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    CHURNED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status];
};

const getDealStatusIcon = (status: DealStatus) => {
  const icons: Record<DealStatus, typeof CheckCircle2> = {
    ACTIVE: Play,
    ON_HOLD: Pause,
    CHURNED: XCircle,
  };
  return icons[status];
};

const EXECUTION_STAGES: { value: ProjectExecutionStage; label: string; color: string }[] = [
  { value: 'ONBOARDING', label: 'Onboarding', color: 'bg-blue-500' },
  { value: 'KICKOFF', label: 'Kickoff', color: 'bg-indigo-500' },
  { value: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-amber-500' },
  { value: 'REVIEW', label: 'Revision', color: 'bg-purple-500' },
  { value: 'DELIVERED', label: 'Entregado', color: 'bg-emerald-500' },
];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, isLoading, refreshClient, updateClient, isUpdating } = useClient(id);
  const {
    contacts,
    createContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    isCreating: isCreatingContact,
    isUpdating: isUpdatingContact,
  } = useClientContacts(id);
  const { getSummary: getInvoiceSummary } = useClientInvoices({ clientId: id });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | undefined>();
  const [deletingContact, setDeletingContact] = useState<ClientContact | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/clients/${id}/proyectos/${projectId}`);
  };

  const handleSaveContact = async (data: {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    description?: string;
  }) => {
    if (editingContact) {
      await updateContact({
        contactId: editingContact.id,
        updates: data,
      });
    } else {
      await createContact({
        client_id: id!,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        description: data.description,
        is_primary: contacts.length === 0,
      });
    }
    setEditingContact(undefined);
    refreshClient();
  };

  const handleEditContact = (contact: ClientContact) => {
    setEditingContact(contact);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async () => {
    if (deletingContact) {
      await deleteContact(deletingContact.id);
      setDeletingContact(null);
      refreshClient();
    }
  };

  const handleSetPrimary = async (contact: ClientContact) => {
    await setPrimaryContact(contact.id);
    refreshClient();
  };

  const handleSaveCompany = async (data: {
    company_name: string;
    description?: string;
    linkedin_url?: string;
    website_url?: string;
    notes?: string;
  }) => {
    await updateClient(data);
    refreshClient();
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!client) return null;

    const projects = client.projects || [];
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.stage === 'CERRADO_GANADO' && p.deal?.status === 'ACTIVE').length;
    const inProgressProjects = projects.filter(p => p.stage === 'DEMOSTRACION' || p.stage === 'PROPUESTA').length;
    const lostProjects = projects.filter(p => p.stage === 'CERRADO_PERDIDO').length;

    // MRR calculation
    const totalMrr = projects.reduce((total, project) => {
      if (project.deal && project.deal.status === 'ACTIVE') {
        return total + project.deal.mrr_usd;
      }
      return total;
    }, 0);

    // Total implementation fees (from all deals)
    const totalFees = projects.reduce((total, project) => {
      if (project.deal) {
        return total + project.deal.implementation_fee_usd;
      }
      return total;
    }, 0);

    // Lifetime value (all MRR ever + fees)
    const lifetimeValue = projects.reduce((total, project) => {
      if (project.deal) {
        const monthsActive = differenceInMonths(
          project.deal.status === 'CHURNED' && project.churned_at
            ? new Date(project.churned_at)
            : new Date(),
          new Date(project.deal.start_date)
        );
        return total + (project.deal.mrr_usd * Math.max(monthsActive, 1)) + project.deal.implementation_fee_usd;
      }
      return total;
    }, 0);

    // Client tenure
    const tenure = differenceInMonths(new Date(), new Date(client.created_at));

    // Deal health
    const atRiskDeals = projects.filter(p => p.deal?.status === 'ON_HOLD').length;
    const churnedDeals = projects.filter(p => p.deal?.status === 'CHURNED').length;

    // Project execution stages
    const executionStages = projects
      .filter(p => p.stage === 'CERRADO_GANADO' && p.deal?.status === 'ACTIVE')
      .reduce((acc, p) => {
        const stage = (p.execution_stage as ProjectExecutionStage) || 'ONBOARDING';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalProjects,
      activeProjects,
      inProgressProjects,
      lostProjects,
      totalMrr,
      totalFees,
      lifetimeValue,
      tenure,
      atRiskDeals,
      churnedDeals,
      executionStages,
      isActive: activeProjects > 0,
      isAtRisk: atRiskDeals > 0,
    };
  }, [client]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Cliente no encontrado</h1>
        </div>
      </div>
    );
  }

  const invoiceSummary = getInvoiceSummary();
  const primaryContact = contacts.find(c => c.is_primary);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{client.company_name}</h1>
              {metrics?.tenure && metrics.tenure >= 12 && (
                <Badge variant="outline" className="gap-1 border-amber-300 text-amber-600">
                  <Star className="h-3 w-3 fill-amber-400" />
                  Cliente {metrics.tenure} meses
                </Badge>
              )}
              {metrics?.isAtRisk && (
                <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 bg-amber-50">
                  <AlertTriangle className="h-3 w-3" />
                  En riesgo
                </Badge>
              )}
              {metrics?.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {primaryContact ? (
                <span className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {primaryContact.name}
                  {primaryContact.role && <span className="text-muted-foreground">· {primaryContact.role}</span>}
                </span>
              ) : (
                'Sin contacto principal'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-12 lg:ml-0">
          <Button variant="outline" size="sm" onClick={() => setEditCompanyModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button onClick={() => setNewProjectModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">MRR Activo</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(metrics?.totalMrr || 0)}</p>
            <p className="text-xs text-muted-foreground">
              ARR: {formatCurrency((metrics?.totalMrr || 0) * 12)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Proyectos</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics?.activeProjects}
              <span className="text-sm text-muted-foreground font-normal">/{metrics?.totalProjects}</span>
            </p>
            <p className="text-xs text-muted-foreground">activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Fees</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.totalFees || 0)}</p>
            <p className="text-xs text-muted-foreground">implementacion</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Lifetime Value</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.lifetimeValue || 0)}</p>
            <p className="text-xs text-muted-foreground">total historico</p>
          </CardContent>
        </Card>

        <Card className={cn(
          invoiceSummary.overdueInvoices.length > 0 && "border-red-500/50 bg-red-50/50 dark:bg-red-900/10"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className={cn(
                "h-4 w-4",
                invoiceSummary.overdueInvoices.length > 0 ? "text-red-500" : "text-green-500"
              )} />
              <span className="text-xs text-muted-foreground">Por Cobrar</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              invoiceSummary.overdueInvoices.length > 0 ? "text-red-600" : ""
            )}>
              {formatCurrency(invoiceSummary.totalInvoiced)}
            </p>
            <p className="text-xs text-muted-foreground">
              {invoiceSummary.overdueInvoices.length > 0
                ? `${invoiceSummary.overdueInvoices.length} vencidas`
                : 'al dia'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Cobrado</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(invoiceSummary.totalPaid)}</p>
            <p className="text-xs text-muted-foreground">total recibido</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Proyectos</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Contactos</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Company Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Informacion de la Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descripcion</p>
                      <p className="text-sm">{client.description}</p>
                    </div>
                  )}

                  {(client.linkedin_url || client.website_url) && (
                    <div className="flex flex-wrap gap-2">
                      {client.website_url && (
                        <a
                          href={client.website_url.startsWith('http') ? client.website_url : `https://${client.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border hover:bg-muted transition-colors text-sm"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {client.linkedin_url && (
                        <a
                          href={client.linkedin_url.startsWith('http') ? client.linkedin_url : `https://${client.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border hover:bg-muted transition-colors text-sm"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                          LinkedIn
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {client.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Notas internas</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{client.notes}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cliente desde</p>
                      <p className="text-sm font-medium">{format(new Date(client.created_at), 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Antiguedad</p>
                      <p className="text-sm font-medium">{metrics?.tenure} meses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Primary Contact Card */}
              {primaryContact && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      Contacto Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{primaryContact.name}</p>
                        {primaryContact.role && (
                          <p className="text-sm text-muted-foreground">{primaryContact.role}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {primaryContact.email && (
                            <a
                              href={`mailto:${primaryContact.email}`}
                              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {primaryContact.email}
                            </a>
                          )}
                          {primaryContact.phone && (
                            <a
                              href={`tel:${primaryContact.phone}`}
                              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {primaryContact.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              {/* Project Status Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Estado de Proyectos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs text-emerald-600 font-medium">Activos</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{metrics?.activeProjects}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">En Pipeline</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{metrics?.inProgressProjects}</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg border",
                      (metrics?.atRiskDeals || 0) > 0
                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                        : "bg-muted/50 border-muted"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={cn("h-4 w-4", (metrics?.atRiskDeals || 0) > 0 ? "text-amber-600" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-medium", (metrics?.atRiskDeals || 0) > 0 ? "text-amber-600" : "text-muted-foreground")}>On-Hold</span>
                      </div>
                      <p className={cn("text-2xl font-bold", (metrics?.atRiskDeals || 0) > 0 ? "text-amber-700" : "")}>{metrics?.atRiskDeals}</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg border",
                      (metrics?.churnedDeals || 0) > 0
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-muted/50 border-muted"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className={cn("h-4 w-4", (metrics?.churnedDeals || 0) > 0 ? "text-red-600" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-medium", (metrics?.churnedDeals || 0) > 0 ? "text-red-600" : "text-muted-foreground")}>Churned</span>
                      </div>
                      <p className={cn("text-2xl font-bold", (metrics?.churnedDeals || 0) > 0 ? "text-red-700" : "")}>{metrics?.churnedDeals}</p>
                    </div>
                  </div>

                  {/* Execution stages */}
                  {metrics?.activeProjects && metrics.activeProjects > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-3">Etapas de Ejecucion</p>
                      <div className="space-y-2">
                        {EXECUTION_STAGES.map(stage => {
                          const count = metrics?.executionStages?.[stage.value] || 0;
                          const percentage = metrics?.activeProjects ? (count / metrics.activeProjects) * 100 : 0;
                          return (
                            <div key={stage.value} className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                              <span className="text-xs flex-1">{stage.label}</span>
                              <span className="text-xs font-medium">{count}</span>
                              <div className="w-20">
                                <Progress value={percentage} className="h-1.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    Resumen de Facturacion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Facturado</p>
                      <p className="text-lg font-bold">{formatCurrency(invoiceSummary.totalInvoiced + invoiceSummary.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recaudado</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(invoiceSummary.totalPaid)}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Tasa de cobro</span>
                      <span className="text-sm font-medium">
                        {invoiceSummary.totalInvoiced + invoiceSummary.totalPaid > 0
                          ? ((invoiceSummary.totalPaid / (invoiceSummary.totalInvoiced + invoiceSummary.totalPaid)) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                    <Progress
                      value={invoiceSummary.totalInvoiced + invoiceSummary.totalPaid > 0
                        ? (invoiceSummary.totalPaid / (invoiceSummary.totalInvoiced + invoiceSummary.totalPaid)) * 100
                        : 0}
                      className="h-2"
                    />
                  </div>

                  {invoiceSummary.overdueInvoices.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-red-600 flex items-center gap-1 mb-2">
                        <AlertTriangle className="h-3 w-3" />
                        {invoiceSummary.overdueInvoices.length} Facturas Vencidas
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(invoiceSummary.overdueInvoices.reduce((sum, inv) => sum + (inv.total_usd || 0), 0))}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Recent Projects */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Proyectos Recientes
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('projects')}>
                      Ver todos
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {client.projects && client.projects.length > 0 ? (
                    <div className="space-y-3">
                      {client.projects.slice(0, 4).map((project) => {
                        const StatusIcon = project.deal ? getDealStatusIcon(project.deal.status) : Clock;
                        return (
                          <div
                            key={project.id}
                            className="p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                            onClick={() => handleViewProject(project.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                  {project.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className={cn('text-[10px] h-5 border-0', getProjectStageColor(project.stage))}
                                  >
                                    {PROJECT_STAGE_LABELS[project.stage]}
                                  </Badge>
                                  {project.deal && (
                                    <Badge
                                      variant="outline"
                                      className={cn('text-[10px] h-5 border-0', getDealStatusColor(project.deal.status))}
                                    >
                                      <StatusIcon className="h-3 w-3 mr-0.5" />
                                      {DEAL_STATUS_LABELS[project.deal.status]}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {project.deal && (
                                <p className="text-sm font-bold text-primary ml-2">
                                  {formatCurrency(project.deal.mrr_usd)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Sin proyectos</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setNewProjectModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Crear proyecto
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Metricas Clave
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-medium">
                      {metrics?.totalProjects && metrics.totalProjects > 0
                        ? (((metrics.activeProjects || 0) / metrics.totalProjects) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">MRR por Proyecto</span>
                    <span className="font-medium">
                      {formatCurrency(metrics?.activeProjects ? (metrics.totalMrr / metrics.activeProjects) : 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contactos</span>
                    <span className="font-medium">{contacts.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Todos los Proyectos ({client.projects?.length || 0})
                </CardTitle>
                <Button size="sm" onClick={() => setNewProjectModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Proyecto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {client.projects && client.projects.length > 0 ? (
                <div className="space-y-4">
                  {client.projects.map((project) => {
                    const StatusIcon = project.deal ? getDealStatusIcon(project.deal.status) : Clock;
                    return (
                      <div
                        key={project.id}
                        className="p-4 border rounded-lg hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => handleViewProject(project.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium flex items-center gap-2">
                              {project.name}
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Creado {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('border-0', getProjectStageColor(project.stage))}
                          >
                            {PROJECT_STAGE_LABELS[project.stage]}
                          </Badge>
                        </div>

                        {project.deal ? (
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">Contrato</span>
                              <Badge
                                variant="outline"
                                className={cn('border-0 text-xs', getDealStatusColor(project.deal.status))}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {DEAL_STATUS_LABELS[project.deal.status]}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">MRR</p>
                                <p className="text-lg font-semibold">
                                  {project.deal.currency === 'COP' ? (
                                    <>
                                      {new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0,
                                      }).format(project.deal.mrr_original)}
                                      <span className="text-xs text-muted-foreground font-normal ml-1">
                                        ({formatCurrency(project.deal.mrr_usd)})
                                      </span>
                                    </>
                                  ) : (
                                    formatCurrency(project.deal.mrr_usd)
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Fee</p>
                                <p className="text-lg font-semibold">
                                  {project.deal.currency === 'COP' ? (
                                    <>
                                      {new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0,
                                      }).format(project.deal.implementation_fee_original)}
                                      <span className="text-xs text-muted-foreground font-normal ml-1">
                                        ({formatCurrency(project.deal.implementation_fee_usd)})
                                      </span>
                                    </>
                                  ) : (
                                    formatCurrency(project.deal.implementation_fee_usd)
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>Inicio: {format(new Date(project.deal.start_date), 'dd/MM/yyyy')}</span>
                              {project.deal.currency === 'COP' && project.deal.exchange_rate && (
                                <span>Tasa: {project.deal.exchange_rate.toLocaleString('es-CO')} COP/USD</span>
                              )}
                            </div>
                          </div>
                        ) : (project.stage === 'DEMOSTRACION' || project.stage === 'PROPUESTA') ? (
                          <div className="pt-3 border-t">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              En negociacion
                            </p>
                          </div>
                        ) : project.stage === 'CERRADO_PERDIDO' ? (
                          <div className="pt-3 border-t">
                            <p className="text-sm text-red-600 flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              Proyecto perdido
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Sin proyectos</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setNewProjectModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Crear primer proyecto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Contactos ({contacts.length})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingContact(undefined);
                    setContactModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={cn(
                        "p-4 border rounded-lg hover:bg-muted/50 transition-colors",
                        contact.is_primary && "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center",
                            contact.is_primary ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                          )}>
                            {contact.is_primary ? (
                              <Star className="h-4 w-4 text-amber-600 fill-amber-400" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            {contact.role && (
                              <p className="text-xs text-muted-foreground">{contact.role}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!contact.is_primary && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSetPrimary(contact)}
                              title="Marcar como principal"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditContact(contact)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeletingContact(contact)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {(contact.email || contact.phone) && (
                        <div className="space-y-1.5 pt-3 border-t">
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {contact.phone}
                            </a>
                          )}
                        </div>
                      )}

                      {contact.description && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                          {contact.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Sin contactos</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingContact(undefined);
                      setContactModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar contacto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <CompanyDocumentsCard clientId={id} fullWidth />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewProjectModal
        open={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        client={client}
        onSuccess={refreshClient}
      />

      <ContactModal
        open={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setEditingContact(undefined);
        }}
        onSave={handleSaveContact}
        contact={editingContact}
        saving={isCreatingContact || isUpdatingContact}
      />

      <EditCompanyModal
        open={editCompanyModalOpen}
        onClose={() => setEditCompanyModalOpen(false)}
        onSave={handleSaveCompany}
        client={client}
        saving={isUpdating}
      />

      {/* Delete Contact Confirmation */}
      <AlertDialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Contacto</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar a {deletingContact?.name}? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
