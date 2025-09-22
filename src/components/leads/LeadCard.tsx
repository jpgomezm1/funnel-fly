import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Lead, CHANNEL_LABELS, SUBCHANNEL_LABELS } from '@/types/database';
import { formatDistanceToBogota } from '@/lib/date-utils';
import { cn, formatOwnerName } from '@/lib/utils';
import {
  Building,
  User,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  Calendar,
  DollarSign,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  deals?: any[];
}

export function LeadCard({ lead, isDragging = false, deals = [] }: LeadCardProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { addNote } = useLeads();
  const { getMrrBadgeInfo } = useDeals();
  
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
      <Card className="w-80 bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-dashed border-primary/60 rotate-2 shadow-xl backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm text-primary">{lead.company_name}</span>
              <Sparkles className="h-4 w-4 text-primary ml-auto animate-pulse" />
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
      className={cn(
        "w-full group relative overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing",
        "bg-gradient-to-br from-card via-card to-card/95",
        "border border-border/50 hover:border-primary/30",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent",
        "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
      )}
    >
      <CardContent className="p-4 relative z-10">
        <div className="space-y-4">
          {/* Header con empresa y acciones */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {lead.company_name}
                </h4>
                {lead.contact_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">{lead.contact_name}</span>
                    {lead.contact_role && (
                      <span className="text-xs opacity-70">• {lead.contact_role}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                // Aquí puedes agregar navegación al detalle del lead
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>

          {/* Canal, Subcanal y Tag de Producto */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs font-medium bg-secondary/60 hover:bg-secondary">
              {CHANNEL_LABELS[lead.channel]}
            </Badge>
            {lead.subchannel !== 'NINGUNO' && (
              <Badge variant="outline" className="text-xs bg-background/50 border-primary/20">
                {SUBCHANNEL_LABELS[lead.subchannel]}
              </Badge>
            )}
            <Badge 
              variant="default" 
              className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {lead.product_tag}
            </Badge>
          </div>

          {/* MRR Badge for CERRADO_GANADO */}
          {lead.stage === 'CERRADO_GANADO' && (
            <div className="flex flex-wrap gap-2">
              {(() => {
                const badgeInfo = getMrrBadgeInfo(deals);
                return (
                  <Badge
                    variant={badgeInfo.type === 'active' ? 'default' : 'destructive'}
                    className={cn(
                      "text-xs font-semibold",
                      badgeInfo.type === 'active'
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    )}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    {badgeInfo.text}
                  </Badge>
                );
              })()}
            </div>
          )}

          {/* Información de contacto */}
          {(lead.phone || lead.email) && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/30">
              {lead.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 text-primary" />
                  <span className="truncate font-medium">{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 text-primary" />
                  <span className="truncate font-medium">{lead.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer con metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate">
                {formatOwnerName(lead.owner_id)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="truncate">
                {formatDistanceToBogota(lead.last_activity_at)}
              </span>
            </div>
          </div>

          {/* Botón agregar nota */}
          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full gap-2 h-9 bg-background/50 border-dashed border-primary/30",
                  "hover:bg-primary/5 hover:border-primary/50 transition-all duration-200",
                  "text-muted-foreground hover:text-primary"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-3 w-3" />
                <MessageSquare className="h-3 w-3" />
                Agregar Nota
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