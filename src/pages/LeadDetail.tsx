import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Building, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  FileText, 
  Edit,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';
import { useLeadTimeline } from '@/hooks/useLeadTimeline';
import { DealModal } from '@/components/deals/DealModal';
import { LeadEditModal } from '@/components/leads/LeadEditModal';
import { ActivityTimeline } from '@/components/leads/ActivityTimeline';
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

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { leads, updateLead, updateLeadStage } = useLeads();
  const { deals, isLoading: dealsLoading, upsertDeal } = useDeals(id);
  const { timeline, isLoading: timelineLoading, refreshTimeline } = useLeadTimeline(id);
  
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [leadEditModalOpen, setLeadEditModalOpen] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const lead = leads.find(l => l.id === id);

  // Initialize notes value when lead loads
  useEffect(() => {
    if (lead) {
      setNotesValue(lead.notes || '');
    }
  }, [lead]);

  if (!lead) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Lead no encontrado</h1>
          <Button onClick={() => navigate('/leads')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Leads
          </Button>
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
      // Update the lead stage
      await updateLeadStage(id, newStage);
      
      // Refresh timeline to show the new stage change
      refreshTimeline();
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error al cambiar la etapa');
    }
  };

  const handleNotesBlur = useCallback(async () => {
    if (!id || notesValue === (lead?.notes || '')) return;
    
    setSavingNotes(true);
    try {
      // Update notes in database
      const { error } = await supabase
        .from('leads')
        .update({ notes: notesValue.trim() || null })
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', { id }] });
      refreshTimeline();
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Error al guardar las notas');
    } finally {
      setSavingNotes(false);
    }
  }, [id, notesValue, lead?.notes, queryClient, refreshTimeline]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.company_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{STAGE_LABELS[lead.stage]}</Badge>
              <span className="text-sm text-muted-foreground">
                Última actividad: {formatDistanceToBogota(lead.last_activity_at)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Select value={lead.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setLeadEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información del Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                  <p className="font-medium">{lead.company_name}</p>
                </div>
                
                {lead.contact_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contacto</label>
                    <p className="font-medium">{lead.contact_name}</p>
                    {lead.contact_role && (
                      <p className="text-sm text-muted-foreground">{lead.contact_role}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {lead.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {lead.phone}
                    </p>
                  </div>
                )}
                
                {lead.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {lead.email}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Canal</label>
                  <p>{CHANNEL_LABELS[lead.channel]}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subcanal</label>
                  <p>{SUBCHANNEL_LABELS[lead.subchannel]}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Owner ID</label>
                  <p className="text-sm font-mono">
                    {lead.owner_id ? lead.owner_id.slice(0, 8) + '...' : 'Sin asignar'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDateToBogota(lead.created_at)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Inline Notes Editing */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Notas {savingNotes && <span className="text-xs text-blue-600">(guardando...)</span>}
                </label>
                <Textarea
                  placeholder="Agregar notas sobre este lead..."
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={handleNotesBlur}
                  className="min-h-[100px]"
                  disabled={savingNotes}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Las notas se guardan automáticamente al hacer clic fuera del campo
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contracts (Deals) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Contratos (Deals)
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleEditDeal()}
                  disabled={dealsLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {deals && deals.length > 0 ? 'Editar' : 'Registrar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealsLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Cargando contratos...
                </div>
              ) : deals && deals.length > 0 ? (
                <div className="space-y-4">
                  {deals.map((deal, index) => (
                    <div key={deal.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Contrato {index + 1}</span>
                          <Badge variant={
                            deal.status === 'ACTIVE' ? 'default' :
                            deal.status === 'ON_HOLD' ? 'secondary' : 'destructive'
                          }>
                            {DEAL_STATUS_LABELS[deal.status]}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditDeal(deal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">MRR (USD):</span>
                          <span className="ml-2 font-medium">
                            ${deal.mrr_usd.toLocaleString('en-US')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fee Implementación:</span>
                          <span className="ml-2 font-medium">
                            ${deal.implementation_fee_usd.toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-muted-foreground">Fecha inicio:</span>
                        <span className="ml-2">{formatDateToBogota(deal.start_date, 'dd/MM/yyyy')}</span>
                      </div>
                      
                      {deal.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notas:</span>
                          <p className="mt-1 text-sm bg-muted p-2 rounded">{deal.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Contrato pendiente</p>
                  <p className="text-sm">Haz clic en "Registrar" para crear un contrato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity Timeline */}
        <div>
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