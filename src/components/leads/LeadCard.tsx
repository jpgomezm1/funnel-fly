import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Lead, CHANNEL_LABELS, SUBCHANNEL_LABELS } from '@/types/database';
import { formatDistanceToBogota } from '@/lib/date-utils';
import { Building, User, Phone, Mail, MessageSquare, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export function LeadCard({ lead, isDragging = false }: LeadCardProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { addNote } = useLeads();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await addNote(lead.id, newNote);
    setNewNote('');
    setNoteDialogOpen(false);
  };

  if (isDragging) {
    return (
      <Card className="w-72 bg-background border-2 border-dashed border-primary/50 rotate-3 shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">{lead.company_name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-full bg-card hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Empresa */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm truncate">{lead.company_name}</span>
          </div>

          {/* Contacto */}
          {lead.contact_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{lead.contact_name}</span>
              {lead.contact_role && (
                <span className="text-xs">({lead.contact_role})</span>
              )}
            </div>
          )}

          {/* Canal y Subcanal */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {CHANNEL_LABELS[lead.channel]}
            </Badge>
            {lead.subchannel !== 'NINGUNO' && (
              <Badge variant="outline" className="text-xs">
                {SUBCHANNEL_LABELS[lead.subchannel]}
              </Badge>
            )}
          </div>

          {/* Información de contacto */}
          <div className="space-y-1">
            {lead.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
          </div>

          {/* Owner y última actividad */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {lead.owner_id ? `Owner: ${lead.owner_id.slice(0, 8)}...` : 'Sin asignar'}
            </span>
            <span className="truncate">
              {formatDistanceToBogota(lead.last_activity_at)}
            </span>
          </div>

          {/* Botón agregar nota */}
          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full gap-2 h-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-3 w-3" />
                <MessageSquare className="h-3 w-3" />
                Nota
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Agregar Nota - {lead.company_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Escribe tu nota aquí..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setNoteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Agregar Nota
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}