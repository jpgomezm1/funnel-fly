import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  CalendarDays,
  Users,
  Clock,
  AlertTriangle,
  MessageSquare,
  Truck,
  FileWarning,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectEvents } from '@/hooks/useProjectEvents';
import {
  ProjectEvent,
  ProjectEventType,
  ChangeRequestStatus,
  ChangeImpact,
  FeedbackSentiment,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { formatDateToBogota } from '@/lib/date-utils';

const EVENT_TYPE_CONFIG: Record<ProjectEventType, { label: string; icon: React.ElementType; color: string }> = {
  meeting: { label: 'Reunión', icon: Users, color: 'bg-blue-100 text-blue-600' },
  change_request: { label: 'Change Request', icon: FileWarning, color: 'bg-amber-100 text-amber-600' },
  feedback: { label: 'Feedback', icon: MessageSquare, color: 'bg-purple-100 text-purple-600' },
  delivery: { label: 'Entrega', icon: Truck, color: 'bg-emerald-100 text-emerald-600' },
  incident: { label: 'Incidente', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
};

const CR_STATUS_CONFIG: Record<ChangeRequestStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: HelpCircle },
  approved: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const SENTIMENT_CONFIG: Record<FeedbackSentiment, { label: string; icon: React.ElementType; color: string }> = {
  positive: { label: 'Positivo', icon: ThumbsUp, color: 'text-emerald-600' },
  neutral: { label: 'Neutral', icon: Minus, color: 'text-slate-500' },
  negative: { label: 'Negativo', icon: ThumbsDown, color: 'text-red-600' },
};

interface TechProjectEventsTabProps {
  projectId: string;
}

export function TechProjectEventsTab({ projectId }: TechProjectEventsTabProps) {
  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    updateChangeRequestStatus,
    getStats,
    isCreating,
  } = useProjectEvents({ projectId });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ProjectEvent | null>(null);
  const [formData, setFormData] = useState({
    event_type: 'meeting' as ProjectEventType,
    title: '',
    description: '',
    event_date: new Date().toISOString().slice(0, 16),
    meeting_attendees: '',
    meeting_duration_minutes: '',
    transcript_summary: '',
    change_request_status: 'pending' as ChangeRequestStatus,
    change_impact: 'medium' as ChangeImpact,
    feedback_sentiment: 'neutral' as FeedbackSentiment,
  });

  const stats = getStats();

  const resetForm = () => {
    setFormData({
      event_type: 'meeting',
      title: '',
      description: '',
      event_date: new Date().toISOString().slice(0, 16),
      meeting_attendees: '',
      meeting_duration_minutes: '',
      transcript_summary: '',
      change_request_status: 'pending',
      change_impact: 'medium',
      feedback_sentiment: 'neutral',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (event: ProjectEvent) => {
    setFormData({
      event_type: event.event_type,
      title: event.title,
      description: event.description || '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      meeting_attendees: event.meeting_attendees?.join(', ') || '',
      meeting_duration_minutes: event.meeting_duration_minutes?.toString() || '',
      transcript_summary: event.transcript_summary || '',
      change_request_status: event.change_request_status || 'pending',
      change_impact: event.change_impact || 'medium',
      feedback_sentiment: event.feedback_sentiment || 'neutral',
    });
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'El título es requerido', variant: 'destructive' });
      return;
    }

    try {
      const baseData = {
        event_type: formData.event_type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : undefined,
      };

      const extraFields: Record<string, unknown> = {};
      if (formData.event_type === 'meeting') {
        extraFields.meeting_attendees = formData.meeting_attendees ? formData.meeting_attendees.split(',').map(a => a.trim()).filter(Boolean) : undefined;
        extraFields.meeting_duration_minutes = formData.meeting_duration_minutes ? parseInt(formData.meeting_duration_minutes) : undefined;
        extraFields.transcript_summary = formData.transcript_summary.trim() || undefined;
      } else if (formData.event_type === 'change_request') {
        extraFields.change_request_status = formData.change_request_status;
        extraFields.change_impact = formData.change_impact;
      } else if (formData.event_type === 'feedback') {
        extraFields.feedback_sentiment = formData.feedback_sentiment;
      }

      if (editingEvent) {
        await updateEvent({ eventId: editingEvent.id, updates: { ...baseData, ...extraFields } });
        toast({ title: 'Evento actualizado' });
      } else {
        await createEvent({ ...baseData, ...extraFields } as any);
        toast({ title: 'Evento creado' });
      }

      setModalOpen(false);
      resetForm();
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el evento', variant: 'destructive' });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
      await deleteEvent(eventId);
      toast({ title: 'Evento eliminado' });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el evento', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (eventId: string, status: ChangeRequestStatus) => {
    try {
      await updateChangeRequestStatus({ eventId, status });
      toast({ title: 'Estado actualizado' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Eventos</h2>
          <p className="text-sm text-muted-foreground">
            {events.length} eventos registrados
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Evento
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-lg font-bold">{stats.meetings}</p>
              <p className="text-xs text-muted-foreground">Reuniones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-lg font-bold">{stats.pendingChangeRequests}</p>
              <p className="text-xs text-muted-foreground">CR Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-lg font-bold">{stats.deliveries}</p>
              <p className="text-xs text-muted-foreground">Entregas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-lg font-bold">{stats.incidents}</p>
              <p className="text-xs text-muted-foreground">Incidentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin eventos</h3>
          <p className="text-muted-foreground mb-4">
            Registra reuniones, entregas, incidentes y más
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Evento
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const config = EVENT_TYPE_CONFIG[event.event_type];
            const Icon = config.icon;

            return (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">{config.label}</Badge>

                          {/* Change Request Status */}
                          {event.event_type === 'change_request' && event.change_request_status && (
                            <Badge className={cn("text-xs", CR_STATUS_CONFIG[event.change_request_status].color)}>
                              {CR_STATUS_CONFIG[event.change_request_status].label}
                            </Badge>
                          )}

                          {/* Feedback Sentiment */}
                          {event.event_type === 'feedback' && event.feedback_sentiment && (() => {
                            const s = SENTIMENT_CONFIG[event.feedback_sentiment];
                            const SIcon = s.icon;
                            return <SIcon className={cn("h-4 w-4", s.color)} />;
                          })()}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDateToBogota(event.event_date, 'dd MMM yyyy HH:mm')}
                        </p>

                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                        )}

                        {/* Meeting extras */}
                        {event.event_type === 'meeting' && (
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {event.meeting_attendees && event.meeting_attendees.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.meeting_attendees.join(', ')}
                              </span>
                            )}
                            {event.meeting_duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.meeting_duration_minutes} min
                              </span>
                            )}
                          </div>
                        )}
                        {event.event_type === 'meeting' && event.transcript_summary && (
                          <p className="text-sm bg-muted/50 p-2 rounded mt-2">{event.transcript_summary}</p>
                        )}

                        {/* Change Request impact */}
                        {event.event_type === 'change_request' && event.change_impact && (
                          <Badge variant="outline" className="text-xs mt-2">
                            Impacto: {event.change_impact}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(event)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {event.event_type === 'change_request' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(event.id, 'approved')}>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(event.id, 'rejected')}>
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              Rechazar
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Modifica los detalles del evento' : 'Registra un nuevo evento del proyecto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(v) => setFormData({ ...formData, event_type: v as ProjectEventType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título del evento"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del evento"
                className="min-h-[60px]"
              />
            </div>

            {/* Meeting-specific fields */}
            {formData.event_type === 'meeting' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asistentes (separados por coma)</Label>
                    <Input
                      value={formData.meeting_attendees}
                      onChange={(e) => setFormData({ ...formData, meeting_attendees: e.target.value })}
                      placeholder="Juan, Maria, Pedro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duración (minutos)</Label>
                    <Input
                      type="number"
                      value={formData.meeting_duration_minutes}
                      onChange={(e) => setFormData({ ...formData, meeting_duration_minutes: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Resumen</Label>
                  <Textarea
                    value={formData.transcript_summary}
                    onChange={(e) => setFormData({ ...formData, transcript_summary: e.target.value })}
                    placeholder="Resumen de la reunión"
                    className="min-h-[60px]"
                  />
                </div>
              </>
            )}

            {/* Change Request fields */}
            {formData.event_type === 'change_request' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.change_request_status}
                    onValueChange={(v) => setFormData({ ...formData, change_request_status: v as ChangeRequestStatus })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Impacto</Label>
                  <Select
                    value={formData.change_impact}
                    onValueChange={(v) => setFormData({ ...formData, change_impact: v as ChangeImpact })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bajo</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Feedback fields */}
            {formData.event_type === 'feedback' && (
              <div className="space-y-2">
                <Label>Sentimiento</Label>
                <Select
                  value={formData.feedback_sentiment}
                  onValueChange={(v) => setFormData({ ...formData, feedback_sentiment: v as FeedbackSentiment })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positivo</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
