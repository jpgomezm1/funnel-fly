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
  ChevronDown,
  Sparkles,
  Target,
  Activity,
  Clock,
  Zap,
  Star,
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

// Comerciales disponibles
const COMERCIALES_MAP = {
  'juan_pablo_gomez': 'Juan Pablo Gomez',
  'agustin_hoyos': 'Agustin Hoyos', 
  'sara_garces': 'Sara Garces',
  'pamela_puello': 'Pamela Puello'
} as const;

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

  const handleNotesBlur = useCallback(async () => {
    if (!id || !lead || notesValue === (lead?.notes || '')) return;
    
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

  // This hook was moved above the conditional return

  const getStageColor = (stage: LeadStage) => {
    const colors = {
      'PROSPECTO': 'from-slate-500 to-slate-600',
      'CONTACTADO': 'from-blue-500 to-blue-600',
      'DESCUBRIMIENTO': 'from-purple-500 to-purple-600',
      'DEMOSTRACION': 'from-orange-500 to-orange-600',
      'PROPUESTA': 'from-yellow-500 to-yellow-600',
      'CERRADO_GANADO': 'from-green-500 to-green-600',
      'CERRADO_PERDIDO': 'from-red-500 to-red-600',
    };
    return colors[stage] || colors['PROSPECTO'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
      <div className="container mx-auto py-8 space-y-8">
        {/* Enhanced Header with more dynamic styling */}
        <div className="relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/10 to-purple-500/5 rounded-3xl" />
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-pulse delay-1000" />

          <div className="relative bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-900/90 dark:to-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate('/leads')}
                  className="shrink-0 h-12 w-12 p-0 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-primary/10 hover:to-primary/20 border border-slate-200 dark:border-slate-600 hover:border-primary/30 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="relative p-3 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-2xl shadow-lg border border-primary/20">
                        <Building className="h-7 w-7 text-primary" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                      </div>
                      <div className="flex-1">
                        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent leading-tight">
                          {lead.company_name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Lead activo</span>
                        </div>
                      </div>
                      <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        className={cn(
                          "px-4 py-2.5 text-sm font-semibold text-white border-0 shadow-lg bg-gradient-to-r transform hover:scale-105 transition-all duration-200",
                          getStageColor(lead.stage)
                        )}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {STAGE_LABELS[lead.stage]}
                      </Badge>

                      <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm backdrop-blur-sm">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {formatDistanceToBogota(lead.last_activity_at)}
                        </span>
                      </div>

                      {lead.owner_id && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-full border border-primary/20 shadow-sm">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">
                            {COMERCIALES_MAP[lead.owner_id as keyof typeof COMERCIALES_MAP] || 'Sin asignar'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Quick Stats with better spacing and effects */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-950/40 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-200">
                          <Activity className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Canal</span>
                      </div>
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {CHANNEL_LABELS[lead.channel]}
                      </p>
                    </div>

                    <div className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-950/40 p-4 rounded-2xl border border-green-200/50 dark:border-green-800/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-200">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Subcanal</span>
                      </div>
                      <p className="text-sm font-bold text-green-700 dark:text-green-300">
                        {SUBCHANNEL_LABELS[lead.subchannel]}
                      </p>
                    </div>

                    <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-950/40 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-200">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Creado</span>
                      </div>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                        {formatDateToBogota(lead.created_at, 'dd/MM/yyyy')}
                      </p>
                    </div>

                    <div className="group bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-950/40 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-200">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Contratos</span>
                      </div>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                        {deals?.length || 0} activos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions with better styling */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Select value={lead.stage} onValueChange={handleStageChange}>
                  <SelectTrigger className="w-full sm:w-56 h-12 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-600 hover:border-primary/40 transition-all duration-200 rounded-xl shadow-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl">
                    {STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage} className="hover:bg-primary/10 rounded-lg m-1">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full bg-gradient-to-r shadow-sm", getStageColor(stage))} />
                          <span className="font-medium">{STAGE_LABELS[stage]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setLeadEditModalOpen(true)}
                  className="h-12 px-6 bg-gradient-to-r from-primary via-primary to-blue-600 hover:from-primary/90 hover:via-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border border-primary/20"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Editar Lead</span>
                  <Star className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Enhanced Lead Information Card */}
            <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/5 p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                <CardTitle className="flex items-center gap-4 text-xl">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-xl shadow-lg border border-primary/20">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent font-bold">
                    Información del Lead
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Activo</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Company and Contact Section */}
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Empresa</label>
                        </div>
                        <p className="font-bold text-xl text-slate-800 dark:text-white">{lead.company_name}</p>
                      </div>

                      {lead.contact_name && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contacto</label>
                          </div>
                          <div className="space-y-2">
                            <p className="font-bold text-lg text-slate-800 dark:text-white">{lead.contact_name}</p>
                            {lead.contact_role && (
                              <span className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                                <Target className="h-3 w-3" />
                                {lead.contact_role}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  {(lead.phone || lead.email) && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/30 dark:to-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
                      <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        Información de Contacto
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lead.phone && (
                          <div className="group flex items-center gap-4 p-4 bg-white/80 dark:bg-slate-800/50 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                              <Phone className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Teléfono</p>
                              <p className="font-bold text-slate-800 dark:text-white text-lg">{lead.phone}</p>
                            </div>
                          </div>
                        )}

                        {lead.email && (
                          <div className="group flex items-center gap-4 p-4 bg-white/80 dark:bg-slate-800/50 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                              <Mail className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Email</p>
                              <p className="font-bold text-slate-800 dark:text-white text-lg break-all">{lead.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Enhanced Notes Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-lg shadow-md">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <label className="text-lg font-bold text-slate-800 dark:text-white">
                        Notas del Lead
                      </label>
                    </div>
                    {savingNotes && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                        <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-600 font-semibold">Guardando...</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Textarea
                      placeholder="✨ Agregar notas detalladas sobre este lead, observaciones, próximos pasos, historial de interacciones..."
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      onBlur={handleNotesBlur}
                      className={cn(
                        "min-h-[140px] resize-none bg-white/70 dark:bg-slate-800/70 border-2 border-dashed transition-all duration-200 rounded-xl text-base",
                        "focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                        "border-slate-300 dark:border-slate-600 shadow-lg backdrop-blur-sm",
                        savingNotes && "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                      )}
                      disabled={savingNotes}
                    />
                    <div className="absolute bottom-4 right-4 opacity-40 pointer-events-none">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Las notas se guardan automáticamente al hacer clic fuera del campo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Contracts (Deals) Card */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent p-6 border-b border-border/30">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-lg shadow-sm">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent font-bold">
                      Contratos & Deals
                    </span>
                  </div>
                  <Button
                    onClick={() => handleEditDeal()}
                    disabled={dealsLoading}
                    className={cn(
                      "h-10 px-4 transition-all duration-300 hover:scale-105 shadow-lg",
                      deals && deals.length > 0
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    )}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {deals && deals.length > 0 ? 'Editar' : 'Registrar'}
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {dealsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <p className="text-muted-foreground font-medium">Cargando contratos...</p>
                  </div>
                ) : deals && deals.length > 0 ? (
                  <div className="space-y-6">
                    {deals.map((deal, index) => (
                      <div
                        key={deal.id}
                        className="group relative overflow-hidden p-6 bg-gradient-to-br from-background/60 to-muted/20 rounded-2xl border-2 border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        {/* Deal Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/30 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground">Contrato #{index + 1}</h4>
                              <Badge
                                variant={deal.status === 'ACTIVE' ? 'default' : deal.status === 'ON_HOLD' ? 'secondary' : 'destructive'}
                                className={cn(
                                  "text-xs font-semibold",
                                  deal.status === 'ACTIVE' && "bg-green-500 hover:bg-green-600",
                                  deal.status === 'ON_HOLD' && "bg-yellow-500 hover:bg-yellow-600",
                                  deal.status === 'CANCELLED' && "bg-red-500 hover:bg-red-600"
                                )}
                              >
                                {DEAL_STATUS_LABELS[deal.status]}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDeal(deal)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 p-0 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Deal Metrics */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-950/10 rounded-xl border border-green-200/50 dark:border-green-800/30">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">MRR (USD)</span>
                            </div>
                            <p className="text-xl font-bold text-green-700 dark:text-green-300">
                              ${deal.mrr_usd.toLocaleString('en-US')}
                            </p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-950/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Setup Fee</span>
                            </div>
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                              ${deal.implementation_fee_usd.toLocaleString('en-US')}
                            </p>
                          </div>
                        </div>

                        {/* Deal Details */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Fecha inicio:</span>
                            <span className="font-semibold text-foreground">
                              {formatDateToBogota(deal.start_date, 'dd/MM/yyyy')}
                            </span>
                          </div>

                          {deal.notes && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Notas:</span>
                              </div>
                              <div className="p-3 bg-muted/40 rounded-lg border border-border/30">
                                <p className="text-sm text-foreground">{deal.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-6">
                    <div className="relative">
                      <div className="p-6 bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl border-2 border-dashed border-muted-foreground/20 mx-auto w-fit">
                        <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto" />
                      </div>
                      <div className="absolute -top-2 -right-2 p-2 bg-primary/20 rounded-full">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-lg text-foreground">Sin contratos aún</p>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Registra el primer contrato para comenzar a trackear el revenue de este lead
                      </p>
                    </div>
                    <Button
                      onClick={() => handleEditDeal()}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Contrato
                      <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Timeline and Log */}
          <div className="space-y-8">
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