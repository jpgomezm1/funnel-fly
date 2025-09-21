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
import { useLeads } from '@/hooks/useLeads';
import { Lead, LeadStage, STAGE_ORDER, STAGE_LABELS } from '@/types/database';

export default function Funnel() {
  const { leads, loading, updateLeadStage } = useLeads();
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStage = over.id as LeadStage;
      
      // Verificar si es una etapa válida
      if (STAGE_ORDER.includes(newStage)) {
        updateLeadStage(leadId, newStage);
      }
    }
    
    setActiveId(null);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Funnel Comercial</h1>
        <FunnelFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 overflow-x-auto">
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
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}