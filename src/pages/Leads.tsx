import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadCreateModal } from '@/components/leads/LeadCreateModal';
import { DealModal } from '@/components/deals/DealModal';
import { useLeads } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';
import {
  Lead,
  LeadStage,
  STAGE_LABELS,
  CHANNEL_LABELS,
  SUBCHANNEL_LABELS,
  STAGE_ORDER
} from '@/types/database';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Building,
  User,
  Phone,
  Mail,
  Users,
  TrendingUp,
  Target,
  Activity,
  Filter,
  Download,
  MoreVertical,
  Calendar,
  Clock
} from 'lucide-react';

export default function Leads() {
  const { leads, loading, createLead, updateLeadStage } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [selectedLeadForDeal, setSelectedLeadForDeal] = useState<Lead | null>(null);
  
  const { upsertDeal } = useDeals();

  // Filtrar leads
  const filteredLeads = leads.filter((lead) => {
    const searchMatch =
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const stageMatch = !stageFilter || stageFilter === 'all' || lead.stage === stageFilter;
    const channelMatch = !channelFilter || channelFilter === 'all' || lead.channel === channelFilter;

    return searchMatch && stageMatch && channelMatch;
  });

  const handleCreateLead = async (leadData: any) => {
    try {
      await createLead(leadData);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleStageChange = (lead: Lead, newStage: LeadStage) => {
    if (newStage === 'CERRADO_GANADO') {
      setSelectedLeadForDeal(lead);
      setDealModalOpen(true);
    } else {
      updateLeadStage(lead.id, newStage);
    }
  };

  const handleDealSave = async (dealData: any) => {
    if (!selectedLeadForDeal) return;
    
    try {
      // First update the lead stage to trigger deal creation
      await updateLeadStage(selectedLeadForDeal.id, 'CERRADO_GANADO');
      
      // Then find the created deal and update it with the correct values
      const { data: existingDeals } = await supabase
        .from('deals')
        .select('*')
        .eq('lead_id', selectedLeadForDeal.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const existingDeal = existingDeals?.[0];
      
      if (existingDeal) {
        // Update the existing deal with the new values
        await upsertDeal({
          leadId: selectedLeadForDeal.id,
          dealId: existingDeal.id,
          dealData,
        });
      } else {
        // Fallback: create new deal if none exists
        await upsertDeal({
          leadId: selectedLeadForDeal.id,
          dealData,
        });
      }
      
      setDealModalOpen(false);
      setSelectedLeadForDeal(null);
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleDealModalClose = () => {
    setDealModalOpen(false);
    setSelectedLeadForDeal(null);
  };

  const getStageColor = (stage: LeadStage) => {
    const colors = {
      'PROSPECTO': 'secondary',
      'CONTACTADO': 'default',
      'DESCUBRIMIENTO': 'default',
      'DEMOSTRACION': 'default',
      'PROPUESTA': 'default',
      'CERRADO_GANADO': 'default',
      'CERRADO_PERDIDO': 'destructive',
    } as const;
    return colors[stage] || 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando leads...</div>
      </div>
    );
  }

  // Calcular métricas
  const totalLeads = leads.length;
  const filteredCount = filteredLeads.length;
  const leadsThisMonth = leads.filter(lead => {
    const createdDate = new Date(lead.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  const activeLeads = leads.filter(lead =>
    !['CERRADO_GANADO', 'CERRADO_PERDIDO'].includes(lead.stage)
  ).length;

  const conversionRate = totalLeads > 0
    ? Math.round((leads.filter(lead => lead.stage === 'CERRADO_GANADO').length / totalLeads) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Gestión de Leads
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Administra y da seguimiento a todos tus prospectos comerciales
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button 
              className="gap-2" 
              size="lg"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        {/* Métricas Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Leads</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalLeads}</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Todos los tiempos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Leads Activos</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{activeLeads}</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">En proceso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-950/30 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-xl">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Este Mes</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{leadsThisMonth}</p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70">Nuevos leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Conversión</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{conversionRate}%</p>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Tasa cierre</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters mejorados */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empresa, contacto o email..."
                  className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-48 h-11 bg-background/50">
                    <SelectValue placeholder="Filtrar por etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las etapas</SelectItem>
                    {STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-48 h-11 bg-background/50">
                  <SelectValue placeholder="Filtrar por canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || stageFilter !== 'all' || channelFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStageFilter('all');
                    setChannelFilter('all');
                  }}
                  className="h-11"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count mejorado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {filteredCount} de {totalLeads} leads
          </Badge>
          {filteredCount !== totalLeads && (
            <span className="text-sm text-muted-foreground">
              (filtrados)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Última actualización: hace pocos segundos
        </div>
      </div>

      {/* Table mejorada */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <Table>
          <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
            <TableRow className="border-b-2 border-border/50 hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Empresa
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contacto
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">Canal/Subcanal</TableHead>
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Etapa
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha Ingreso
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Última Actividad
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead, index) => (
              <TableRow
                key={lead.id}
                className="hover:bg-muted/30 transition-colors group cursor-pointer border-b border-border/30"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {lead.company_name}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  {lead.contact_name ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-green-500/10 rounded">
                          <User className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="font-medium text-sm">{lead.contact_name}</span>
                      </div>
                      {lead.contact_role && (
                        <div className="text-xs text-muted-foreground pl-5">
                          {lead.contact_role}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground pl-5">
                          <Phone className="h-3 w-3" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="p-1 bg-muted/50 rounded">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="text-sm">Sin contacto</span>
                    </div>
                  )}
                </TableCell>

                <TableCell className="py-4">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium">
                      {CHANNEL_LABELS[lead.channel]}
                    </Badge>
                    {lead.subchannel !== 'NINGUNO' && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">
                        {SUBCHANNEL_LABELS[lead.subchannel]}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <Select
                    value={lead.stage}
                    onValueChange={(value) => handleStageChange(lead, value as LeadStage)}
                  >
                    <SelectTrigger className="w-auto h-auto p-0 border-none shadow-none bg-transparent">
                      <Badge
                        variant={getStageColor(lead.stage)}
                        className="cursor-pointer hover:scale-105 transition-transform"
                      >
                        {STAGE_LABELS[lead.stage]}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_ORDER.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {STAGE_LABELS[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell className="py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {formatDateToBogota(lead.created_at, 'dd/MM/yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Etapa: {formatDateToBogota(lead.stage_entered_at, 'dd/MM HH:mm')}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm font-medium">
                      {formatDistanceToBogota(lead.last_activity_at)}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:border-primary/30"
                    >
                      <Link to={`/leads/${lead.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 hover:bg-secondary/80"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-muted"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Lead Creation Modal */}
      <LeadCreateModal
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateLead}
      />

      {/* Deal Modal */}
      <DealModal
        open={dealModalOpen}
        onClose={handleDealModalClose}
        onSave={handleDealSave}
        leadCompanyName={selectedLeadForDeal?.company_name || ''}
      />
    </div>
  );
}