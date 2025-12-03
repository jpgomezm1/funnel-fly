import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  CalendarDays,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  Plus,
  Clock,
  RefreshCw,
  TrendingUp,
  Edit,
  FolderOpen,
  ListChecks,
  Settings,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import {
  ProjectStage,
  PROJECT_STAGE_LABELS,
  Proposal,
  ProjectExecutionStage,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { CreateDealModal } from '@/components/projects/CreateDealModal';
import { SetBookedValuesModal } from '@/components/projects/SetBookedValuesModal';
import { EditDealModal } from '@/components/projects/EditDealModal';
import { useProposals } from '@/hooks/useProposals';
import { ProjectHeroCard } from '@/components/projects/ProjectHeroCard';
import { ProjectTabGeneral } from '@/components/projects/tabs/ProjectTabGeneral';
import { ProjectTabExecution } from '@/components/projects/tabs/ProjectTabExecution';
import { ProjectTabFinancial } from '@/components/projects/tabs/ProjectTabFinancial';
import { ProjectTabDocuments } from '@/components/projects/tabs/ProjectTabDocuments';
import { ProjectTabEvents } from '@/components/projects/tabs/ProjectTabEvents';
import { NegotiationChecklistCard } from '@/components/projects/NegotiationChecklistCard';
import { ProposalManagementCard } from '@/components/projects/ProposalManagementCard';

const getProjectStageColor = (stage: ProjectStage) => {
  const colors: Record<ProjectStage, string> = {
    'DEMOSTRACION': 'bg-amber-500',
    'PROPUESTA': 'bg-orange-500',
    'CERRADO_GANADO': 'bg-emerald-500',
    'CERRADO_PERDIDO': 'bg-red-500',
  };
  return colors[stage];
};

const ACTIVITY_TYPES = {
  call: { label: 'Llamada', icon: Phone, color: 'bg-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'bg-green-500' },
  meeting: { label: 'Reunión', icon: Calendar, color: 'bg-purple-500' },
  note: { label: 'Nota', icon: MessageSquare, color: 'bg-slate-500' },
  quote: { label: 'Cotización', icon: FileText, color: 'bg-orange-500' },
  follow_up: { label: 'Seguimiento', icon: Clock, color: 'bg-amber-500' }
} as const;

type ActivityType = keyof typeof ACTIVITY_TYPES;

interface Activity {
  id: string;
  project_id: string;
  lead_id: string;
  type: ActivityType;
  description: string;
  details?: string;
  created_at: string;
  created_by?: string;
}

// Hook to get project with all relations
function useProjectDetail(projectId?: string) {
  return useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', project.client_id)
        .single();

      if (clientError) throw clientError;

      // Get lead - prefer project.lead_id, fallback to client.original_lead_id
      let lead = null;
      const leadId = project.lead_id || client.original_lead_id;
      if (leadId) {
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();
        lead = leadData;
      }

      // Get deal if exists
      const { data: deal } = await supabase
        .from('deals')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      // Get activities for this project
      const { data: activities } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // Get proposals for this project
      const { data: proposals } = await supabase
        .from('proposals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      return {
        ...project,
        lead_id: leadId, // Ensure lead_id is available for deal creation
        client,
        lead,
        deal,
        activities: activities || [],
        proposals: proposals || [],
      };
    },
    enabled: !!projectId,
  });
}

export default function ProjectDetail() {
  const { empresaId, clientId, projectId } = useParams<{ empresaId?: string; clientId?: string; projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Determine back URL based on where user came from
  const backUrl = clientId ? `/clients/${clientId}` : `/empresas/${empresaId}`;

  const { data: project, isLoading, refetch } = useProjectDetail(projectId);
  const { proposals } = useProposals(projectId);

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);
  const [createDealModalOpen, setCreateDealModalOpen] = useState(false);
  const [editDealModalOpen, setEditDealModalOpen] = useState(false);
  const [setBookedValuesModalOpen, setSetBookedValuesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('execution');
  const [newActivity, setNewActivity] = useState({
    type: 'call' as ActivityType,
    description: '',
  });

  // Determine if project is closed (won or lost)
  const isProjectClosed = project?.stage === 'CERRADO_GANADO' || project?.stage === 'CERRADO_PERDIDO';
  const isProjectWon = project?.stage === 'CERRADO_GANADO';

  // Get final proposal if exists
  const finalProposal = project?.proposals?.find((p: Proposal) => p.is_final);

  const handleStageChange = async (newStage: ProjectStage) => {
    if (!projectId || !project) return;

    // If changing to PROPUESTA and no booked values, show booked values modal
    if (newStage === 'PROPUESTA' && project.stage === 'DEMOSTRACION') {
      setSetBookedValuesModalOpen(true);
      return;
    }

    // If changing to CERRADO_GANADO and no deal exists, show deal modal
    if (newStage === 'CERRADO_GANADO' && !project.deal) {
      setCreateDealModalOpen(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          stage: newStage,
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      // Also update lead stage if linked
      if (project.lead?.id) {
        await supabase
          .from('leads')
          .update({
            stage: newStage,
            stage_entered_at: new Date().toISOString(),
          })
          .eq('id', project.lead.id);
      }

      refetch();
      queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      toast({
        title: 'Etapa actualizada',
        description: `El proyecto ahora está en ${PROJECT_STAGE_LABELS[newStage]}`,
      });
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la etapa',
        variant: 'destructive',
      });
    }
  };

  const handleBookedValuesSuccess = () => {
    setSetBookedValuesModalOpen(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });

    if (project?.lead?.id) {
      supabase
        .from('leads')
        .update({
          stage: 'PROPUESTA',
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', project.lead.id);
    }

    toast({
      title: 'Proyecto en Propuesta',
      description: 'Los valores esperados han sido guardados',
    });
  };


  const handleSaveActivity = async () => {
    if (!newActivity.description.trim() || !projectId || !project?.lead?.id) {
      toast({
        title: 'Error',
        description: 'La descripción es requerida',
        variant: 'destructive',
      });
      return;
    }

    setSavingActivity(true);
    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: project.lead.id,
          project_id: projectId,
          type: newActivity.type,
          description: newActivity.description,
        });

      if (error) throw error;

      await supabase
        .from('leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', project.lead.id);

      setNewActivity({ type: 'call', description: '' });
      setShowActivityForm(false);
      refetch();

      toast({
        title: 'Actividad registrada',
        description: 'La actividad se ha guardado correctamente',
      });
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar la actividad',
        variant: 'destructive',
      });
    } finally {
      setSavingActivity(false);
    }
  };

  const handleDealCreated = () => {
    setCreateDealModalOpen(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['pipeline-projects'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Proyecto no encontrado</h1>
        </div>
      </div>
    );
  }

  const canChangeStage = project.stage !== 'CERRADO_GANADO' && project.stage !== 'CERRADO_PERDIDO';

  // ============================================
  // RENDER FOR WON PROJECTS (CERRADO_GANADO)
  // ============================================
  if (isProjectWon && project.deal) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project.client.company_name}
            </p>
          </div>
        </div>

        {/* Hero Card - Quick Status Overview */}
        <ProjectHeroCard
          projectId={projectId!}
          executionStage={(project.execution_stage as ProjectExecutionStage) || 'ONBOARDING'}
          mrrUsd={project.deal.mrr_usd}
          feeUsd={project.deal.implementation_fee_usd}
          currency={project.deal.currency}
          estimatedDeliveryDate={project.estimated_delivery_date}
          kickoffDate={project.kickoff_date}
          actualDeliveryDate={project.actual_delivery_date}
          clientName={project.client?.company_name}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="execution" className="gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Ejecución</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Financiero</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="execution" className="mt-6">
            <ProjectTabExecution
              project={project}
              onRefetch={refetch}
            />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <ProjectTabEvents projectId={projectId!} />
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <ProjectTabFinancial
              projectId={projectId!}
              deal={project.deal}
              bookedMrrUsd={project.booked_mrr_usd}
              bookedFeeUsd={project.booked_fee_usd}
              finalProposal={finalProposal}
              onEditDeal={() => setEditDealModalOpen(true)}
              onRefetch={refetch}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <ProjectTabDocuments projectId={projectId!} />
          </TabsContent>

          <TabsContent value="general" className="mt-6">
            <ProjectTabGeneral
              project={project}
              onRefetch={refetch}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Deal Modal */}
        {project.deal && (
          <EditDealModal
            open={editDealModalOpen}
            onClose={() => setEditDealModalOpen(false)}
            deal={project.deal}
            onSuccess={() => {
              setEditDealModalOpen(false);
              refetch();
            }}
          />
        )}
      </div>
    );
  }

  // ============================================
  // RENDER FOR PROJECTS IN NEGOTIATION
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <Badge className={cn("text-white", getProjectStageColor(project.stage))}>
                {PROJECT_STAGE_LABELS[project.stage]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">{project.client.company_name}</span>
              {' · '}
              En etapa actual {formatDistanceToBogota(project.stage_entered_at)}
            </p>
          </div>
        </div>

        {canChangeStage && (
          <Select value={project.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['DEMOSTRACION', 'PROPUESTA', 'CERRADO_GANADO', 'CERRADO_PERDIDO'] as ProjectStage[]).map((stage) => (
                <SelectItem key={stage} value={stage}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getProjectStageColor(stage))} />
                    {PROJECT_STAGE_LABELS[stage]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Project Info */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                <p className="font-medium">{project.name}</p>
              </div>
              {project.description && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Descripcion</p>
                  <p className="text-sm">{project.description}</p>
                </div>
              )}
              <div className="pt-3 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Creado</p>
                  <p className="text-sm">{formatDateToBogota(project.created_at, 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">En etapa actual</p>
                  <p className="text-sm">{formatDateToBogota(project.stage_entered_at, 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{project.client.company_name}</p>
                {project.client.contact_name && (
                  <p className="text-sm text-muted-foreground">{project.client.contact_name}</p>
                )}
              </div>
              {(project.client.phone || project.client.email) && (
                <div className="pt-3 border-t space-y-2">
                  {project.client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {project.client.phone}
                    </div>
                  )}
                  {project.client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {project.client.email}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booked Values */}
          {(project.stage === 'PROPUESTA' || project.booked_mrr_usd !== undefined) && !project.deal && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Valores Esperados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">MRR</p>
                    <p className="text-lg font-semibold text-amber-600">
                      ${(project.booked_mrr_usd || 0).toLocaleString('en-US')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fee</p>
                    <p className="text-lg font-semibold">
                      ${(project.booked_fee_usd || 0).toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Negotiation Checklist */}
          {(project.stage === 'PROPUESTA' || project.stage === 'DEMOSTRACION') && !project.deal && (
            <NegotiationChecklistCard projectId={projectId!} />
          )}

          {/* Proposals */}
          {(project.stage === 'PROPUESTA' || project.stage === 'DEMOSTRACION') && !project.deal && (
            <ProposalManagementCard
              projectId={projectId!}
              proposals={project.proposals || []}
              onRefetch={refetch}
            />
          )}

          {/* Deal CTA */}
          {!project.deal && (project.stage === 'DEMOSTRACION' || project.stage === 'PROPUESTA') && (
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Sin contrato aun</p>
                  <Button size="sm" onClick={() => setCreateDealModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Cerrar como Ganado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Actividades
                </div>
                <Button
                  size="sm"
                  variant={showActivityForm ? "secondary" : "default"}
                  onClick={() => setShowActivityForm(!showActivityForm)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showActivityForm ? 'Cancelar' : 'Agregar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Activity Form */}
              {showActivityForm && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Tipo
                    </label>
                    <Select
                      value={newActivity.type}
                      onValueChange={(value: ActivityType) =>
                        setNewActivity(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-3 w-3" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Descripcion
                    </label>
                    <Textarea
                      placeholder="Describe la actividad..."
                      value={newActivity.description}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowActivityForm(false)} disabled={savingActivity}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveActivity} disabled={savingActivity}>
                      {savingActivity ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {!showActivityForm && (
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setNewActivity({ type: 'call', description: '' });
                      setShowActivityForm(true);
                    }}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Llamada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setNewActivity({ type: 'meeting', description: '' });
                      setShowActivityForm(true);
                    }}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Reunion
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setNewActivity({ type: 'quote', description: '' });
                      setShowActivityForm(true);
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Cotizacion
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setNewActivity({ type: 'email', description: '' });
                      setShowActivityForm(true);
                    }}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                </div>
              )}

              {/* Activities List */}
              <div className="space-y-3">
                {project.activities.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Sin actividades registradas</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Las actividades de este proyecto apareceran aqui
                    </p>
                  </div>
                ) : (
                  project.activities.map((activity: Activity) => {
                    const config = ACTIVITY_TYPES[activity.type];
                    const ActivityIcon = config.icon;

                    return (
                      <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                        <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                          <ActivityIcon className="h-4 w-4 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToBogota(activity.created_at)}
                            </span>
                          </div>

                          <p className="text-sm">{activity.description}</p>

                          {activity.details && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.details}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {project && project.lead_id && (
        <CreateDealModal
          open={createDealModalOpen}
          onClose={() => setCreateDealModalOpen(false)}
          project={{
            id: project.id,
            client_id: project.client_id,
            lead_id: project.lead_id,
            name: project.name,
            stage: project.stage,
            stage_entered_at: project.stage_entered_at,
            created_at: project.created_at,
            updated_at: project.updated_at,
            client: project.client,
          }}
          proposals={project.proposals || []}
          onSuccess={handleDealCreated}
        />
      )}

      {projectId && project && (
        <SetBookedValuesModal
          open={setBookedValuesModalOpen}
          onClose={() => setSetBookedValuesModalOpen(false)}
          projectId={projectId}
          projectName={project.name}
          onSuccess={handleBookedValuesSuccess}
        />
      )}
    </div>
  );
}
