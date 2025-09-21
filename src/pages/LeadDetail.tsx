import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Building, User, Phone, Mail, Calendar, DollarSign, FileText, Edit } from 'lucide-react';
import { useLeads, useLeadHistory } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';
import { DealModal } from '@/components/deals/DealModal';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { 
  STAGE_LABELS, 
  CHANNEL_LABELS, 
  SUBCHANNEL_LABELS, 
  DEAL_STATUS_LABELS 
} from '@/types/database';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads } = useLeads();
  const { history, loading: historyLoading } = useLeadHistory(id);
  const { deals, isLoading: dealsLoading, upsertDeal } = useDeals(id);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);

  const lead = leads.find(l => l.id === id);

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
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/leads')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{lead.company_name}</h1>
        <Badge variant="secondary">{STAGE_LABELS[lead.stage]}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <label className="text-sm font-medium text-muted-foreground">Creado</label>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateToBogota(lead.created_at)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Última actividad</label>
                <p>{formatDistanceToBogota(lead.last_activity_at)}</p>
              </div>
            </div>

            {lead.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notas</label>
                <p className="text-sm bg-muted p-3 rounded-md">{lead.notes}</p>
              </div>
            )}
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
                <p>No hay contratos registrados</p>
                <p className="text-sm">Haz clic en "Registrar" para crear uno</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stage History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Cargando historial...
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-4 pb-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {entry.from_stage && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {STAGE_LABELS[entry.from_stage]}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge className="text-xs">
                        {STAGE_LABELS[entry.to_stage]}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateToBogota(entry.changed_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No hay historial disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deal Modal */}
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
    </div>
  );
}