import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  Edit,
  RefreshCw,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeads } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';
import { useLeadTimeline } from '@/hooks/useLeadTimeline';
import { DealModal } from '@/components/deals/DealModal';
import { LeadEditModal } from '@/components/leads/LeadEditModal';
import { ActivityTimeline } from '@/components/leads/ActivityTimeline';
import { LeadActivityLog } from '@/components/leads/LeadActivityLog';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { supabase } from '@/integrations/supabase/client';
import {
  STAGE_LABELS,
  CHANNEL_LABELS,
  SUBCHANNEL_LABELS,
  DEAL_STATUS_LABELS,
  STAGE_ORDER,
  LeadStage,
  Lead
} from '@/types/database';
import { useTeamMembers } from '@/hooks/useTeamMembers';

// Hook para verificar si existe un cliente asociado a este lead
function useClientForLead(leadId?: string) {
  return useQuery({
    queryKey: ['client-for-lead', leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('original_lead_id', leadId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });
}

const getStageColor = (stage: LeadStage) => {
  const colors: Record<LeadStage, string> = {
    'PROSPECTO': 'bg-slate-500',
    'CONTACTADO': 'bg-blue-500',
    'DESCUBRIMIENTO': 'bg-violet-500',
    'DEMOSTRACION': 'bg-amber-500',
    'PROPUESTA': 'bg-orange-500',
    'CERRADO_GANADO': 'bg-emerald-500',
    'CERRADO_PERDIDO': 'bg-red-500',
  };
  return colors[stage];
};

export default function LeadDetail() {
  const { getMemberName } = useTeamMembers();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { leads, updateLead, updateLeadStage } = useLeads();
  const { deals, isLoading: dealsLoading, upsertDeal } = useDeals(id);
  const { timeline, isLoading: timelineLoading, refreshTimeline } = useLeadTimeline(id);
  const { data: clientForLead, isLoading: clientLoading } = useClientForLead(id);

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [leadEditModalOpen, setLeadEditModalOpen] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const lead = leads.find(l => l.id === id);

  // Redirigir a ClientDetail si este lead tiene un cliente asociado
  useEffect(() => {
    if (clientForLead?.id) {
      navigate(`/clients/${clientForLead.id}`, { replace: true });
    }
  }, [clientForLead, navigate]);

  useEffect(() => {
    if (lead) {
      setNotesValue(lead.notes || '');
    }
  }, [lead]);

  // Mostrar loading mientras verificamos si hay cliente
  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

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

  if (!lead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Lead no encontrado</h1>
        </div>
      </div>
    );
  }

  const handleEditDeal = (deal?: any) => {
    setEditingDeal(deal);
    setDealModalOpen(true);
  };

  const handleSaveDeal = async (dealData: any) => {
    if (!id) return;

    await upsertDeal({
      leadId: id,
      dealId: editingDeal?.id,
      dealData,
    });

    setDealModalOpen(false);
    setEditingDeal(null);
    refreshTimeline();
  };

  const handleEditLead = async (updates: Partial<Lead>) => {
    if (!id) return;

    await updateLead(id, updates);
    setLeadEditModalOpen(false);
  };

  const handleStageChange = async (newStage: LeadStage) => {
    if (!id || !lead) return;

    try {
      await updateLeadStage(id, newStage);
      refreshTimeline();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{lead.company_name}</h1>
              <Badge className={cn("text-white", getStageColor(lead.stage))}>
                {STAGE_LABELS[lead.stage]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lead.contact_name && `${lead.contact_name} · `}
              Última actividad {formatDistanceToBogota(lead.last_activity_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={lead.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getStageColor(stage))} />
                    {STAGE_LABELS[stage]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setLeadEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Información del Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company & Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Empresa</p>
                  <p className="font-medium">{lead.company_name}</p>
                </div>
                {lead.contact_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Contacto</p>
                    <p className="font-medium">{lead.contact_name}</p>
                    {lead.contact_role && (
                      <p className="text-xs text-muted-foreground">{lead.contact_role}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              {(lead.phone || lead.email) && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{lead.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Channel Info */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Canal</p>
                  <Badge variant="secondary" className="text-xs">
                    {CHANNEL_LABELS[lead.channel]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Subcanal</p>
                  <p className="text-sm">{SUBCHANNEL_LABELS[lead.subchannel]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Propietario</p>
                  <p className="text-sm">
                    {getMemberName(lead.owner_id)}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Creado</p>
                  <p className="text-sm">{formatDateToBogota(lead.created_at, 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">En etapa actual</p>
                  <p className="text-sm">{formatDateToBogota(lead.stage_entered_at, 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
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
                placeholder="Agregar notas sobre este lead..."
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={handleNotesBlur}
                disabled={savingNotes}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Las notas se guardan automáticamente
              </p>
            </CardContent>
          </Card>

          {/* Deals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Contratos
                </div>
                <Button size="sm" onClick={() => handleEditDeal()}>
                  <Plus className="h-4 w-4 mr-1" />
                  {deals && deals.length > 0 ? 'Nuevo' : 'Crear'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
              ) : deals && deals.length > 0 ? (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-4 border rounded-lg hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => handleEditDeal(deal)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-0",
                            deal.status === 'ACTIVE' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                            deal.status === 'ON_HOLD' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            deal.status === 'CHURNED' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {DEAL_STATUS_LABELS[deal.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateToBogota(deal.start_date, 'MMM yyyy')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">MRR</p>
                          <p className="text-lg font-semibold">
                            {deal.currency === 'COP' ? (
                              <>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(deal.mrr_original)}
                                <span className="text-xs text-muted-foreground font-normal ml-1">
                                  (${deal.mrr_usd.toLocaleString('en-US')} USD)
                                </span>
                              </>
                            ) : (
                              `$${deal.mrr_usd.toLocaleString('en-US')}`
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fee Implementación</p>
                          <p className="text-lg font-semibold">
                            {deal.currency === 'COP' ? (
                              <>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(deal.implementation_fee_original)}
                                <span className="text-xs text-muted-foreground font-normal ml-1">
                                  (${deal.implementation_fee_usd.toLocaleString('en-US')} USD)
                                </span>
                              </>
                            ) : (
                              `$${deal.implementation_fee_usd.toLocaleString('en-US')}`
                            )}
                          </p>
                        </div>
                      </div>

                      {deal.currency === 'COP' && deal.exchange_rate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Tasa: {deal.exchange_rate.toLocaleString('es-CO')} COP/USD
                        </p>
                      )}

                      {deal.notes && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                          {deal.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin contratos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <LeadActivityLog
            leadId={id!}
            onActivityAdded={refreshTimeline}
          />

          <ActivityTimeline
            timeline={timeline}
            isLoading={timelineLoading}
          />
        </div>
      </div>

      {/* Modals */}
      <DealModal
        open={dealModalOpen}
        onClose={() => {
          setDealModalOpen(false);
          setEditingDeal(null);
        }}
        onSave={handleSaveDeal}
        initial={editingDeal}
        leadCompanyName={lead.company_name}
      />

      <LeadEditModal
        open={leadEditModalOpen}
        onClose={() => setLeadEditModalOpen(false)}
        onSave={handleEditLead}
        lead={lead}
      />
    </div>
  );
}
