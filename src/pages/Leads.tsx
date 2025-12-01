import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLeads } from '@/hooks/useLeads';
import {
  LeadChannel,
  LeadSubchannel,
  LeadStage,
  STAGE_LABELS,
  CHANNEL_LABELS,
  SUBCHANNEL_LABELS,
  STAGE_ORDER
} from '@/types/database';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { Plus, Search, ExternalLink } from 'lucide-react';

export default function Leads() {
  const { leads, loading, createLead, updateLeadStage } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_name: '',
    contact_role: '',
    phone: '',
    email: '',
    channel: 'OUTBOUND_APOLLO' as LeadChannel,
    subchannel: 'NINGUNO' as LeadSubchannel,
    owner_id: '',
    notes: '',
  });

  const filteredLeads = leads.filter((lead) => {
    const searchMatch =
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const stageMatch = !stageFilter || stageFilter === 'all' || lead.stage === stageFilter;
    const channelMatch = !channelFilter || channelFilter === 'all' || lead.channel === channelFilter;

    return searchMatch && stageMatch && channelMatch;
  });

  const handleCreateLead = async () => {
    if (!newLead.company_name.trim()) return;

    try {
      await createLead(newLead);
      setNewLead({
        company_name: '',
        contact_name: '',
        contact_role: '',
        phone: '',
        email: '',
        channel: 'OUTBOUND_APOLLO',
        subchannel: 'NINGUNO',
        owner_id: '',
        notes: '',
      });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const getStageVariant = (stage: LeadStage) => {
    if (stage === 'CERRADO_GANADO') return 'default';
    if (stage === 'CERRADO_PERDIDO') return 'destructive';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredLeads.length} de {leads.length} leads
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Empresa *</Label>
                  <Input
                    id="company_name"
                    placeholder="Nombre de la empresa"
                    value={newLead.company_name}
                    onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contacto</Label>
                  <Input
                    id="contact_name"
                    placeholder="Nombre del contacto"
                    value={newLead.contact_name}
                    onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+57 300 123 4567"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channel">Canal</Label>
                  <Select
                    value={newLead.channel}
                    onValueChange={(value) => setNewLead({ ...newLead, channel: value as LeadChannel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subchannel">Subcanal</Label>
                  <Select
                    value={newLead.subchannel}
                    onValueChange={(value) => setNewLead({ ...newLead, subchannel: value as LeadSubchannel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUBCHANNEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateLead} disabled={!newLead.company_name.trim()}>
                  Crear Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Etapa" />
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
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Canal" />
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
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron leads
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.company_name}</p>
                      {lead.email && (
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.contact_name ? (
                      <div>
                        <p className="text-sm">{lead.contact_name}</p>
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CHANNEL_LABELS[lead.channel]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.stage}
                      onValueChange={(value) => updateLeadStage(lead.id, value as LeadStage)}
                    >
                      <SelectTrigger className="h-7 w-auto border-0 p-0 shadow-none">
                        <Badge variant={getStageVariant(lead.stage)} className="text-xs">
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
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToBogota(lead.last_activity_at)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link to={`/leads/${lead.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
