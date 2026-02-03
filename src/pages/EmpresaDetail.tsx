import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  FileText,
  Edit,
  RefreshCw,
  Plus,
  Briefcase,
  DollarSign,
  ChevronRight,
  User,
  Star,
  Trash2,
  Globe,
  Linkedin,
  ExternalLink,
  LayoutDashboard,
  Users,
  FolderOpen,
  Activity,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  Zap,
  Play,
  Pause,
  MessageSquare,
  Rocket,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeads, useLeadContacts } from '@/hooks/useLeads';
import { useLeadTimeline } from '@/hooks/useLeadTimeline';
import { LeadEditModal } from '@/components/leads/LeadEditModal';
import { ActivityTimeline } from '@/components/leads/ActivityTimeline';
import { LeadActivityLog } from '@/components/leads/LeadActivityLog';
import { ConvertToProjectModal } from '@/components/leads/ConvertToProjectModal';
import { LeadContactModal } from '@/components/leads/LeadContactModal';
import { EditLeadCompanyModal } from '@/components/leads/EditLeadCompanyModal';
import { DeleteCompanyDialog } from '@/components/leads/DeleteCompanyDialog';
import { CompanyDocumentsCard } from '@/components/documents/CompanyDocumentsCard';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  STAGE_LABELS,
  CHANNEL_LABELS,
  SUBCHANNEL_LABELS,
  LEAD_STAGES,
  PROJECT_STAGE_LABELS,
  DEAL_STATUS_LABELS,
  LeadStage,
  Lead,
  LeadContact,
  ProjectStage,
  DealStatus,
  ClientWithProjects,
  LossReason,
  LOSS_REASON_LABELS,
  LOSS_REASON_COLORS,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeamMembers } from '@/hooks/useTeamMembers';

// Hook para obtener el cliente asociado a este lead con sus proyectos
function useClientForLead(leadId?: string) {
  return useQuery({
    queryKey: ['client-for-lead-full', leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('original_lead_id', leadId)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) return null;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch deals for projects
      const projectIds = projectsData?.map(p => p.id) || [];
      let dealsData: any[] = [];
      if (projectIds.length > 0) {
        const { data, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .in('project_id', projectIds);

        if (dealsError) throw dealsError;
        dealsData = data || [];
      }

      const clientWithProjects: ClientWithProjects = {
        ...clientData,
        projects: projectsData?.map(project => ({
          ...project,
          deal: dealsData.find(d => d.project_id === project.id),
        })) || [],
      };

      return clientWithProjects;
    },
    enabled: !!leadId,
  });
}

const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; badge: string }> = {
  PROSPECTO: { bg: 'bg-slate-500', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  CONTACTADO: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  DESCUBRIMIENTO: { bg: 'bg-violet-500', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  DEMOSTRACION: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  PROPUESTA: { bg: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  CERRADO_GANADO: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CERRADO_PERDIDO: { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-200' },
};

const getProjectStageColor = (stage: ProjectStage) => {
  const colors: Record<ProjectStage, string> = {
    'DEMOSTRACION': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'PROPUESTA': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'CERRADO_GANADO': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'CERRADO_PERDIDO': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
  const icons: Record<DealStatus, typeof Play> = {
    ACTIVE: Play,
    ON_HOLD: Pause,
    CHURNED: XCircle,
  };
  return icons[status];
};

export default function EmpresaDetail() {
  const { getMemberName } = useTeamMembers();
  const { empresaId } = useParams<{ empresaId: string }>();
  const id = empresaId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { leads, updateLead, updateLeadStage, deleteLead } = useLeads();
  const { timeline, isLoading: timelineLoading, refreshTimeline } = useLeadTimeline(id);
  const { data: clientWithProjects, isLoading: clientLoading, refetch: refetchClient } = useClientForLead(id);
  const {
    contacts,
    createContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    isCreating: isCreatingContact,
    isUpdating: isUpdatingContact,
  } = useLeadContacts(id);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [leadEditModalOpen, setLeadEditModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<LeadContact | undefined>();
  const [deletingContact, setDeletingContact] = useState<LeadContact | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [phase0LinkModal, setPhase0LinkModal] = useState<{ projectId: string; currentLink?: string } | null>(null);
  const [phase0LinkValue, setPhase0LinkValue] = useState('');
  const [savingPhase0Link, setSavingPhase0Link] = useState(false);

  const lead = leads.find(l => l.id === id);

  useEffect(() => {
    if (lead) {
      setNotesValue(lead.notes || '');
    }
  }, [lead]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!lead) return null;

    const projects = clientWithProjects?.projects || [];
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.deal?.status === 'ACTIVE').length;
    const wonProjects = projects.filter(p => p.stage === 'CERRADO_GANADO').length;

    const totalMrr = projects.reduce((total, project) => {
      if (project.deal && project.deal.status === 'ACTIVE') {
        return total + project.deal.mrr_usd;
      }
      return total;
    }, 0);

    const totalFees = projects.reduce((total, project) => {
      if (project.deal) {
        return total + project.deal.implementation_fee_usd;
      }
      return total;
    }, 0);

    // Days in current stage
    const daysInStage = differenceInDays(new Date(), new Date(lead.stage_entered_at));

    // Days since creation
    const daysSinceCreation = differenceInDays(new Date(), new Date(lead.created_at));

    // Days since last activity
    const daysSinceActivity = differenceInDays(new Date(), new Date(lead.last_activity_at));

    return {
      totalProjects,
      activeProjects,
      wonProjects,
      totalMrr,
      totalFees,
      daysInStage,
      daysSinceCreation,
      daysSinceActivity,
      isStale: daysSinceActivity > 7,
      hasProjects: totalProjects > 0,
    };
  }, [lead, clientWithProjects]);

  const handleNotesBlur = useCallback(async () => {
    if (!id || !lead || notesValue === (lead?.notes || '')) return;

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: notesValue.trim() || null })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      refreshTimeline();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  }, [id, notesValue, lead?.notes, queryClient, refreshTimeline]);

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
        lead_id: id!,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        description: data.description,
        is_primary: contacts.length === 0,
      });
    }
    setEditingContact(undefined);
  };

  const handleEditContact = (contact: LeadContact) => {
    setEditingContact(contact);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async () => {
    if (deletingContact) {
      await deleteContact(deletingContact.id);
      setDeletingContact(null);
    }
  };

  const handleSetPrimary = async (contact: LeadContact) => {
    await setPrimaryContact(contact.id);
  };

  const handleSaveCompany = async (data: {
    company_name: string;
    description?: string;
    linkedin_url?: string;
    website_url?: string;
  }) => {
    setSavingCompany(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!id) return;
    await deleteLead(id);
    navigate('/empresas');
  };

  const handleOpenPhase0LinkModal = (projectId: string, currentLink?: string) => {
    setPhase0LinkValue(currentLink || '');
    setPhase0LinkModal({ projectId, currentLink });
  };

  const handleSavePhase0Link = async () => {
    if (!phase0LinkModal) return;

    setSavingPhase0Link(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ phase0_link: phase0LinkValue.trim() || null })
        .eq('id', phase0LinkModal.projectId);

      if (error) throw error;

      refetchClient();
      setPhase0LinkModal(null);
    } catch (error) {
      console.error('Error saving phase0 link:', error);
    } finally {
      setSavingPhase0Link(false);
    }
  };

  if (!lead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/empresas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Empresa no encontrada</h1>
        </div>
      </div>
    );
  }

  const handleEditLead = async (updates: Partial<Lead>) => {
    if (!id) return;

    await updateLead(id, updates);
    setLeadEditModalOpen(false);
  };

  const handleStageChange = async (newStage: LeadStage) => {
    if (!id || !lead) return;

    // If moving to project stages, show convert modal
    if (!LEAD_STAGES.includes(newStage as any) && !clientWithProjects) {
      setConvertModalOpen(true);
      return;
    }

    try {
      await updateLeadStage(id, newStage);
      refreshTimeline();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const handleConvertSuccess = () => {
    setConvertModalOpen(false);
    refetchClient();
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    refreshTimeline();
  };

  const hasProjects = clientWithProjects && clientWithProjects.projects && clientWithProjects.projects.length > 0;
  const isInEarlyStage = LEAD_STAGES.includes(lead.stage as any);
  const primaryContact = contacts.find(c => c.is_primary);
  const stageColors = STAGE_COLORS[lead.stage];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/empresas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{lead.company_name}</h1>
              <Badge className={cn("text-white border-0", stageColors.bg)}>
                {STAGE_LABELS[lead.stage]}
              </Badge>
              {lead.stage === 'CERRADO_PERDIDO' && lead.loss_reason && (
                <Badge className={cn("border-0", LOSS_REASON_COLORS[lead.loss_reason as LossReason])}>
                  {LOSS_REASON_LABELS[lead.loss_reason as LossReason]}
                </Badge>
              )}
              {hasProjects && (
                <Badge variant="outline" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {clientWithProjects!.projects!.length} proyecto{clientWithProjects!.projects!.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {metrics?.isStale && (
                <Badge variant="outline" className="gap-1 border-amber-300 text-amber-600 bg-amber-50">
                  <AlertTriangle className="h-3 w-3" />
                  Sin actividad {metrics.daysSinceActivity}d
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {primaryContact ? (
                <span className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {primaryContact.name}
                  {primaryContact.role && <span>· {primaryContact.role}</span>}
                </span>
              ) : contacts.length > 0 ? (
                <span className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {contacts[0].name}
                </span>
              ) : (
                'Sin contacto registrado'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-12 lg:ml-0">
          {isInEarlyStage && (
            <Select value={lead.stage} onValueChange={handleStageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", STAGE_COLORS[stage].bg)} />
                      {STAGE_LABELS[stage]}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="DEMOSTRACION">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    {STAGE_LABELS['DEMOSTRACION']} (Crear proyecto)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {!hasProjects && isInEarlyStage && (
            <Button variant="outline" onClick={() => setConvertModalOpen(true)}>
              <Briefcase className="h-4 w-4 mr-2" />
              Crear Proyecto
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setEditCompanyModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <Button onClick={() => setLeadEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Info Lead
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">En Etapa</span>
            </div>
            <p className="text-2xl font-bold">{metrics?.daysInStage || 0}d</p>
            <p className="text-xs text-muted-foreground mt-1">
              {STAGE_LABELS[lead.stage]}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(metrics?.isStale && "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className={cn("h-4 w-4", metrics?.isStale ? "text-amber-500" : "text-green-500")} />
              <span className="text-xs text-muted-foreground">Ultima Actividad</span>
            </div>
            <p className={cn("text-2xl font-bold", metrics?.isStale && "text-amber-600")}>
              {metrics?.daysSinceActivity || 0}d
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.isStale ? 'Requiere atencion' : 'Al dia'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Contactos</span>
            </div>
            <p className="text-2xl font-bold">{contacts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {primaryContact ? 'Con principal' : 'Sin principal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Proyectos</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics?.activeProjects || 0}
              <span className="text-sm text-muted-foreground font-normal">/{metrics?.totalProjects || 0}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">activos</p>
          </CardContent>
        </Card>

        {(metrics?.totalMrr || 0) > 0 && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">MRR Activo</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                ${(metrics?.totalMrr || 0).toLocaleString('en-US')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">mensual</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-muted-foreground">Antiguedad</span>
            </div>
            <p className="text-2xl font-bold">{metrics?.daysSinceCreation || 0}d</p>
            <p className="text-xs text-muted-foreground mt-1">
              desde creacion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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
          <TabsTrigger value="activity" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Actividad</span>
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Informacion de la Empresa
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditCompanyModalOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descripcion</p>
                      <p className="text-sm">{lead.description}</p>
                    </div>
                  )}

                  {(lead.linkedin_url || lead.website_url) && (
                    <div className="flex flex-wrap gap-2">
                      {lead.website_url && (
                        <a
                          href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border hover:bg-muted transition-colors text-sm"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {lead.linkedin_url && (
                        <a
                          href={lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`}
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

                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Canal</p>
                      <Badge variant="secondary" className="text-xs">
                        {CHANNEL_LABELS[lead.channel]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Subcanal</p>
                      <p className="text-sm">{SUBCHANNEL_LABELS[lead.subchannel]}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Propietario</p>
                      <p className="text-sm font-medium">
                        {getMemberName(lead.owner_id)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Creado</p>
                      <p className="text-sm font-medium">{format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">En etapa actual</p>
                      <p className="text-sm font-medium">{format(new Date(lead.stage_entered_at), 'dd MMM yyyy', { locale: es })}</p>
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

              {/* Notes Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Notas
                    </div>
                    {savingNotes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Guardando...
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Agregar notas sobre esta empresa..."
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    onBlur={handleNotesBlur}
                    disabled={savingNotes}
                    className="min-h-[100px] resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              {/* Pipeline Progress */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Progreso en Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...LEAD_STAGES, 'DEMOSTRACION', 'PROPUESTA', 'CERRADO_GANADO'].map((stage, idx) => {
                      const stageOrder = [...LEAD_STAGES, 'DEMOSTRACION', 'PROPUESTA', 'CERRADO_GANADO'];
                      const currentIdx = stageOrder.indexOf(lead.stage);
                      const isCompleted = idx < currentIdx;
                      const isCurrent = stage === lead.stage;
                      const colors = STAGE_COLORS[stage as LeadStage];

                      return (
                        <div key={stage} className="flex items-center gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            isCompleted ? colors.bg + " text-white" :
                            isCurrent ? colors.bg + " text-white ring-2 ring-offset-2 ring-" + colors.bg.replace('bg-', '') :
                            "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                          </div>
                          <span className={cn(
                            "text-sm flex-1",
                            isCurrent ? "font-medium" : isCompleted ? "" : "text-muted-foreground"
                          )}>
                            {STAGE_LABELS[stage as LeadStage]}
                          </span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-[10px]">
                              {metrics?.daysInStage}d
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Acciones Rapidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!hasProjects && isInEarlyStage && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setConvertModalOpen(true)}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Crear Proyecto
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setEditingContact(undefined);
                      setContactModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Contacto
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab('activity')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Registrar Actividad
                  </Button>
                </CardContent>
              </Card>

              {/* MRR Summary (if has deals) */}
              {(metrics?.totalMrr || 0) > 0 && (
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                      Resumen Financiero
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-emerald-600">MRR Total Activo</p>
                      <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                        ${(metrics?.totalMrr || 0).toLocaleString('en-US')}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-emerald-200 dark:border-emerald-700 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-emerald-600">ARR</p>
                        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                          ${((metrics?.totalMrr || 0) * 12).toLocaleString('en-US')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Fees</p>
                        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                          ${(metrics?.totalFees || 0).toLocaleString('en-US')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Projects Preview & Timeline */}
            <div className="space-y-6">
              {/* Projects Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Proyectos
                    </CardTitle>
                    {hasProjects && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('projects')}>
                        Ver todos
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {clientLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : hasProjects ? (
                    <div className="space-y-3">
                      {clientWithProjects!.projects!.slice(0, 3).map((project) => {
                        const StatusIcon = project.deal ? getDealStatusIcon(project.deal.status) : Clock;
                        return (
                          <div
                            key={project.id}
                            className="p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                            onClick={() => navigate(`/empresas/${id}/proyectos/${project.id}`)}
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
                                  ${project.deal.mrr_usd.toLocaleString('en-US')}
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
                      {isInEarlyStage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setConvertModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Crear proyecto
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Timeline Preview */}
              <ActivityTimeline
                timeline={timeline.slice(0, 5)}
                isLoading={timelineLoading}
              />
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
                  Todos los Proyectos ({clientWithProjects?.projects?.length || 0})
                </CardTitle>
                {hasProjects && (
                  <Button size="sm" onClick={() => setConvertModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo Proyecto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {clientLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : hasProjects ? (
                <div className="space-y-4">
                  {clientWithProjects!.projects!.map((project) => {
                    const StatusIcon = project.deal ? getDealStatusIcon(project.deal.status) : Clock;
                    return (
                      <div
                        key={project.id}
                        className="p-4 border rounded-lg hover:border-primary/30 transition-colors"
                      >
                        <div
                          className="flex items-start justify-between mb-3 cursor-pointer"
                          onClick={() => navigate(`/empresas/${id}/proyectos/${project.id}`)}
                        >
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

                        {/* Phase 0 Link Section */}
                        <div className="pt-3 border-t mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Rocket className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">Fase 0</span>
                            </div>
                            {project.phase0_link ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={project.phase0_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  Ver documento
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPhase0LinkModal(project.id, project.phase0_link);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPhase0LinkModal(project.id);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar link
                              </Button>
                            )}
                          </div>
                        </div>

                        {project.deal && (
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
                                <p className="text-lg font-semibold text-primary">
                                  ${project.deal.mrr_usd.toLocaleString('en-US')}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Fee</p>
                                <p className="text-lg font-semibold">
                                  ${project.deal.implementation_fee_usd.toLocaleString('en-US')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Sin proyectos</p>
                  {isInEarlyStage && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setConvertModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Crear primer proyecto
                    </Button>
                  )}
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

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeadActivityLog
              leadId={id!}
              onActivityAdded={refreshTimeline}
            />
            <ActivityTimeline
              timeline={timeline}
              isLoading={timelineLoading}
            />
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <CompanyDocumentsCard leadId={id} fullWidth />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <LeadEditModal
        open={leadEditModalOpen}
        onClose={() => setLeadEditModalOpen(false)}
        onSave={handleEditLead}
        lead={lead}
      />

      {lead && (
        <ConvertToProjectModal
          open={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          lead={lead}
          onSuccess={handleConvertSuccess}
        />
      )}

      <LeadContactModal
        open={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setEditingContact(undefined);
        }}
        onSave={handleSaveContact}
        contact={editingContact}
        saving={isCreatingContact || isUpdatingContact}
      />

      {lead && (
        <EditLeadCompanyModal
          open={editCompanyModalOpen}
          onClose={() => setEditCompanyModalOpen(false)}
          onSave={handleSaveCompany}
          lead={lead}
          saving={savingCompany}
        />
      )}

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

      {/* Delete Company Dialog */}
      <DeleteCompanyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        companyName={lead.company_name}
        hasProjects={hasProjects || false}
        projectCount={clientWithProjects?.projects?.length || 0}
        onConfirm={handleDeleteCompany}
      />

      {/* Phase 0 Link Modal */}
      <Dialog open={!!phase0LinkModal} onOpenChange={() => setPhase0LinkModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              {phase0LinkModal?.currentLink ? 'Editar Link de Fase 0' : 'Agregar Link de Fase 0'}
            </DialogTitle>
            <DialogDescription>
              Ingresa el link al documento interno de Fase 0 para este proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phase0_link">URL del documento</Label>
              <Input
                id="phase0_link"
                type="url"
                placeholder="https://fasecero-ejemplo.netlify.app/"
                value={phase0LinkValue}
                onChange={(e) => setPhase0LinkValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhase0LinkModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePhase0Link} disabled={savingPhase0Link}>
              {savingPhase0Link ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
