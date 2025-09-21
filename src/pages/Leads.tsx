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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLeads } from '@/hooks/useLeads';
import { 
  Lead, 
  LeadChannel, 
  LeadSubchannel, 
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
  Mail
} from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Gestión de Leads</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa *</Label>
                <Input
                  id="company_name"
                  placeholder="Nombre de la empresa"
                  value={newLead.company_name}
                  onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contacto</Label>
                <Input
                  id="contact_name"
                  placeholder="Nombre del contacto"
                  value={newLead.contact_name}
                  onChange={(e) => setNewLead({...newLead, contact_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_role">Cargo</Label>
                <Input
                  id="contact_role"
                  placeholder="Cargo del contacto"
                  value={newLead.contact_role}
                  onChange={(e) => setNewLead({...newLead, contact_role: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 123 4567"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channel">Canal *</Label>
                <Select 
                  value={newLead.channel} 
                  onValueChange={(value) => setNewLead({...newLead, channel: value as LeadChannel})}
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
                  onValueChange={(value) => setNewLead({...newLead, subchannel: value as LeadSubchannel})}
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
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="owner_id">Comercial</Label>
                <Input
                  id="owner_id"
                  placeholder="Nombre del comercial (opcional)"
                  value={newLead.owner_id}
                  onChange={(e) => setNewLead({...newLead, owner_id: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateLead}
                disabled={!newLead.company_name.trim()}
              >
                Crear Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contacto o email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48">
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
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-48">
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
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredLeads.length} de {leads.length} leads
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Canal/Subcanal</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Fecha Ingreso</TableHead>
              <TableHead>Última Actividad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{lead.company_name}</div>
                      {lead.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  {lead.contact_name ? (
                    <div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{lead.contact_name}</span>
                      </div>
                      {lead.contact_role && (
                        <div className="text-xs text-muted-foreground">
                          {lead.contact_role}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin contacto</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="secondary">
                      {CHANNEL_LABELS[lead.channel]}
                    </Badge>
                    {lead.subchannel !== 'NINGUNO' && (
                      <Badge variant="outline" className="text-xs">
                        {SUBCHANNEL_LABELS[lead.subchannel]}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Select 
                    value={lead.stage} 
                    onValueChange={(value) => updateLeadStage(lead.id, value as LeadStage)}
                  >
                    <SelectTrigger className="w-auto h-auto p-0 border-none shadow-none">
                      <Badge variant={getStageColor(lead.stage)}>
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
                
                <TableCell>
                  <div className="text-sm">
                    {formatDateToBogota(lead.created_at, 'dd/MM/yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateToBogota(lead.stage_entered_at, 'dd/MM HH:mm')}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToBogota(lead.last_activity_at)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/leads/${lead.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}