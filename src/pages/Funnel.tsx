import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LeadCard } from '@/components/leads/LeadCard';
import { FunnelColumn } from '@/components/leads/FunnelColumn';
import { FunnelFilters } from '@/components/leads/FunnelFilters';
import { DealModal } from '@/components/deals/DealModal';
import { LeadCreateModal } from '@/components/leads/LeadCreateModal';
import { useLeads } from '@/hooks/useLeads';
import { useDeals, useLeadDeals } from '@/hooks/useDeals';
import { Lead, LeadStage, STAGE_ORDER, STAGE_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, TrendingUp, Users, Target } from 'lucide-react';

export default function Funnel() {
  const { leads, loading, updateLeadStage, createLead } = useLeads();
  const { needsMrrRegistration, upsertDeal } = useDeals();
  const { dealsMap } = useLeadDeals(leads.map(lead => lead.id));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [createLeadModalOpen, setCreateLeadModalOpen] = useState(false);
  const [pendingLeadForDeal, setPendingLeadForDeal] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    dateRange: null as { from: Date; to: Date } | null,
    channel: null as string | null,
    subchannel: null as string | null,
    owner: null as string | null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar leads
  const filteredLeads = leads.filter((lead) => {
    if (filters.dateRange) {
      const stageDate = new Date(lead.stage_entered_at);
      if (stageDate < filters.dateRange.from || stageDate > filters.dateRange.to) {
        return false;
      }
    }
    if (filters.channel && lead.channel !== filters.channel) return false;
    if (filters.subchannel && lead.subchannel !== filters.subchannel) return false;
    if (filters.owner && lead.owner_id !== filters.owner) return false;
    
    return true;
  });

  // Agrupar leads por etapa
  const leadsByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = filteredLeads.filter(lead => lead.stage === stage);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStage = over.id as LeadStage;
      const lead = leads.find(l => l.id === leadId);
      
      // Verificar si es una etapa válida
      if (STAGE_ORDER.includes(newStage) && lead) {
        // Update lead stage first
        await updateLeadStage(leadId, newStage);
        
        // Check if moving to CERRADO_GANADO and needs MRR registration
        if (newStage === 'CERRADO_GANADO') {
          const leadDeals = dealsMap[leadId] || [];
          if (needsMrrRegistration(leadDeals)) {
            setPendingLeadForDeal(lead);
            setDealModalOpen(true);
          }
        }
      }
    }
    
    setActiveId(null);
  };

  const handleSaveDeal = async (dealData: any) => {
    if (!pendingLeadForDeal) return;
    
    await upsertDeal({
      leadId: pendingLeadForDeal.id,
      dealData,
    });
    
    setDealModalOpen(false);
    setPendingLeadForDeal(null);
  };

  const handleCloseDealModal = () => {
    setDealModalOpen(false);
    setPendingLeadForDeal(null);
  };

  const handleCreateLead = async (leadData: any) => {
    try {
      await createLead(leadData);
      setCreateLeadModalOpen(false);
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const activeLead = activeId ? leads.find(lead => lead.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando funnel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Funnel Comercial
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Gestiona y monitorea el progreso de tus leads a través del proceso de ventas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              className="gap-2" 
              size="lg"
              onClick={() => setCreateLeadModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nuevo Lead
            </Button>
            <FunnelFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Leads</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{filteredLeads.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/30 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Cerrados Ganados</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {leadsByStage['CERRADO_GANADO']?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Tasa Conversión</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {filteredLeads.length > 0
                    ? Math.round(((leadsByStage['CERRADO_GANADO']?.length || 0) / filteredLeads.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-fr">
          {STAGE_ORDER.map((stage) => (
            <SortableContext
              key={stage}
              items={leadsByStage[stage]?.map(lead => lead.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <FunnelColumn
                stage={stage}
                title={STAGE_LABELS[stage]}
                leads={leadsByStage[stage] || []}
                count={leadsByStage[stage]?.length || 0}
                dealsMap={dealsMap}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Deal Registration Modal */}
      <DealModal
        open={dealModalOpen}
        onClose={handleCloseDealModal}
        onSave={handleSaveDeal}
        leadCompanyName={pendingLeadForDeal?.company_name}
      />

      {/* Lead Creation Modal */}
      <LeadCreateModal
        open={createLeadModalOpen}
        onClose={() => setCreateLeadModalOpen(false)}
        onSave={handleCreateLead}
      />
    </div>
  );
}