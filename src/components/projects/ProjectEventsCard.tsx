import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CalendarDays,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Video,
  GitPullRequest,
  MessageCircle,
  Package,
  AlertOctagon,
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  Users,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle2,
  XCircle,
  Hourglass,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectEvents } from '@/hooks/useProjectEvents';
import {
  ProjectEvent,
  ProjectEventType,
  ChangeRequestStatus,
  ChangeImpact,
  FeedbackSentiment,
  PROJECT_EVENT_TYPE_LABELS,
  PROJECT_EVENT_TYPE_COLORS,
  CHANGE_REQUEST_STATUS_LABELS,
  CHANGE_REQUEST_STATUS_COLORS,
  CHANGE_IMPACT_LABELS,
  CHANGE_IMPACT_COLORS,
  FEEDBACK_SENTIMENT_LABELS,
  FEEDBACK_SENTIMENT_COLORS,
} from '@/types/database';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { toast } from '@/hooks/use-toast';

interface ProjectEventsCardProps {
  projectId: string;
}

const EVENT_TYPE_ICONS: Record<ProjectEventType, React.ElementType> = {
  meeting: Video,
  change_request: GitPullRequest,
  feedback: MessageCircle,
  delivery: Package,
  incident: AlertOctagon,
  other: FileText,
};

const CHANGE_STATUS_ICONS: Record<ChangeRequestStatus, React.ElementType> = {
  pending: Hourglass,
  approved: CheckCircle2,
  rejected: XCircle,
  implemented: Wrench,
};

const SENTIMENT_ICONS: Record<FeedbackSentiment, React.ElementType> = {
  positive: ThumbsUp,
  neutral: Minus,
  negative: ThumbsDown,
};

type EventFormData = {
  event_type: ProjectEventType;
  title: string;
  description: string;
  event_date: string;
  // Meeting
  transcript: string;
  transcript_summary: string;
  meeting_attendees: string;
  meeting_duration_minutes: string;
  // Change request
  change_request_status: ChangeRequestStatus;
  change_impact: ChangeImpact;
  // Feedback
  feedback_sentiment: FeedbackSentiment;
};

const initialFormData: EventFormData = {
  event_type: 'meeting',
  title: '',
  description: '',
  event_date: new Date().toISOString().split('T')[0],
  transcript: '',
  transcript_summary: '',
  meeting_attendees: '',
  meeting_duration_minutes: '',
  change_request_status: 'pending',
  change_impact: 'medium',
  feedback_sentiment: 'positive',
};

export function ProjectEventsCard({ projectId }: ProjectEventsCardProps) {
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

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewTranscriptModal, setViewTranscriptModal] = useState<ProjectEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ProjectEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const stats = getStats();

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleOpenAdd = (type?: ProjectEventType) => {
    resetForm();
    if (type) {
      setFormData(prev => ({ ...prev, event_type: type }));
    }
    setAddModalOpen(true);
  };

  const handleOpenEdit = (event: ProjectEvent) => {
    setSelectedEvent(event);
    setFormData({
      event_type: event.event_type,
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.split('T')[0],
      transcript: event.transcript || '',
      transcript_summary: event.transcript_summary || '',
      meeting_attendees: event.meeting_attendees?.join(', ') || '',
      meeting_duration_minutes: event.meeting_duration_minutes?.toString() || '',
      change_request_status: event.change_request_status || 'pending',
      change_impact: event.change_impact || 'medium',
      feedback_sentiment: event.feedback_sentiment || 'positive',
    });
    setEditModalOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    try {
      await createEvent({
        event_type: formData.event_type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        event_date: formData.event_date || undefined,
        transcript: formData.transcript.trim() || undefined,
        transcript_summary: formData.transcript_summary.trim() || undefined,
        meeting_attendees: formData.meeting_attendees
          ? formData.meeting_attendees.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        meeting_duration_minutes: formData.meeting_duration_minutes
          ? parseInt(formData.meeting_duration_minutes)
          : undefined,
        change_request_status: formData.event_type === 'change_request'
          ? formData.change_request_status
          : undefined,
        change_impact: formData.event_type === 'change_request'
          ? formData.change_impact
          : undefined,
        feedback_sentiment: formData.event_type === 'feedback'
          ? formData.feedback_sentiment
          : undefined,
      });

      toast({ title: 'Evento creado' });
      setAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el evento',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedEvent || !formData.title.trim()) return;

    try {
      await updateEvent({
        eventId: selectedEvent.id,
        updates: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          event_date: formData.event_date || undefined,
          transcript: formData.transcript.trim() || undefined,
          transcript_summary: formData.transcript_summary.trim() || undefined,
          meeting_attendees: formData.meeting_attendees
            ? formData.meeting_attendees.split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
          meeting_duration_minutes: formData.meeting_duration_minutes
            ? parseInt(formData.meeting_duration_minutes)
            : undefined,
          change_request_status: formData.event_type === 'change_request'
            ? formData.change_request_status
            : undefined,
          change_impact: formData.event_type === 'change_request'
            ? formData.change_impact
            : undefined,
          feedback_sentiment: formData.event_type === 'feedback'
            ? formData.feedback_sentiment
            : undefined,
        },
      });

      toast({ title: 'Evento actualizado' });
      setEditModalOpen(false);
      setSelectedEvent(null);
      resetForm();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el evento',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    try {
      await deleteEvent(eventId);
      toast({ title: 'Evento eliminado' });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el evento',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (eventId: string, status: ChangeRequestStatus) => {
    try {
      await updateChangeRequestStatus({ eventId, status });
      toast({ title: 'Estado actualizado' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const toggleExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Eventos del Proyecto
              {events.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {events.length}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Nuevo Evento
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenAdd('meeting')}>
                  <Video className="h-4 w-4 mr-2 text-blue-600" />
                  Reunión
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenAdd('change_request')}>
                  <GitPullRequest className="h-4 w-4 mr-2 text-amber-600" />
                  Solicitud de Cambio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenAdd('feedback')}>
                  <MessageCircle className="h-4 w-4 mr-2 text-purple-600" />
                  Feedback
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleOpenAdd('delivery')}>
                  <Package className="h-4 w-4 mr-2 text-emerald-600" />
                  Entrega
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenAdd('incident')}>
                  <AlertOctagon className="h-4 w-4 mr-2 text-red-600" />
                  Incidente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenAdd('other')}>
                  <FileText className="h-4 w-4 mr-2 text-slate-600" />
                  Otro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          {events.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
              {stats.meetings > 0 && (
                <Badge variant="outline" className="bg-blue-50">
                  <Video className="h-3 w-3 mr-1" />
                  {stats.meetings} Reunión{stats.meetings > 1 ? 'es' : ''}
                </Badge>
              )}
              {stats.changeRequests > 0 && (
                <Badge variant="outline" className={stats.pendingChangeRequests > 0 ? 'bg-amber-50' : 'bg-slate-50'}>
                  <GitPullRequest className="h-3 w-3 mr-1" />
                  {stats.changeRequests} Cambio{stats.changeRequests > 1 ? 's' : ''}
                  {stats.pendingChangeRequests > 0 && (
                    <span className="ml-1 text-amber-600">({stats.pendingChangeRequests} pendiente{stats.pendingChangeRequests > 1 ? 's' : ''})</span>
                  )}
                </Badge>
              )}
              {stats.feedback > 0 && (
                <Badge variant="outline" className="bg-purple-50">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {stats.feedback} Feedback
                </Badge>
              )}
            </div>
          )}

          {/* Events List */}
          {events.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay eventos registrados</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenAdd()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar primer evento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const EventIcon = EVENT_TYPE_ICONS[event.event_type];
                const isExpanded = expandedEvents.has(event.id);
                const hasExpandableContent = event.description || event.transcript || event.transcript_summary;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'border rounded-lg',
                      event.event_type === 'incident' && 'border-red-200 bg-red-50/50'
                    )}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                          PROJECT_EVENT_TYPE_COLORS[event.event_type]
                        )}>
                          <EventIcon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{event.title}</p>
                                <Badge
                                  variant="outline"
                                  className={cn('text-[10px]', PROJECT_EVENT_TYPE_COLORS[event.event_type])}
                                >
                                  {PROJECT_EVENT_TYPE_LABELS[event.event_type]}
                                </Badge>

                                {/* Change Request Status */}
                                {event.event_type === 'change_request' && event.change_request_status && (
                                  <Badge
                                    variant="outline"
                                    className={cn('text-[10px]', CHANGE_REQUEST_STATUS_COLORS[event.change_request_status])}
                                  >
                                    {CHANGE_REQUEST_STATUS_LABELS[event.change_request_status]}
                                  </Badge>
                                )}

                                {/* Change Impact */}
                                {event.event_type === 'change_request' && event.change_impact && (
                                  <Badge
                                    variant="outline"
                                    className={cn('text-[10px]', CHANGE_IMPACT_COLORS[event.change_impact])}
                                  >
                                    Impacto: {CHANGE_IMPACT_LABELS[event.change_impact]}
                                  </Badge>
                                )}

                                {/* Feedback Sentiment */}
                                {event.event_type === 'feedback' && event.feedback_sentiment && (
                                  <Badge
                                    variant="outline"
                                    className={cn('text-[10px]', FEEDBACK_SENTIMENT_COLORS[event.feedback_sentiment])}
                                  >
                                    {(() => {
                                      const SentimentIcon = SENTIMENT_ICONS[event.feedback_sentiment];
                                      return <SentimentIcon className="h-3 w-3 mr-1" />;
                                    })()}
                                    {FEEDBACK_SENTIMENT_LABELS[event.feedback_sentiment]}
                                  </Badge>
                                )}
                              </div>

                              {/* Meta info */}
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {formatDateToBogota(event.event_date, 'dd MMM yyyy')}
                                </span>
                                {event.meeting_duration_minutes && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.meeting_duration_minutes} min
                                  </span>
                                )}
                                {event.meeting_attendees && event.meeting_attendees.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {event.meeting_attendees.length} asistente{event.meeting_attendees.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {/* Expand button if has content */}
                              {hasExpandableContent && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => toggleExpanded(event.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenEdit(event)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>

                                  {event.transcript && (
                                    <DropdownMenuItem onClick={() => setViewTranscriptModal(event)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Ver Transcript
                                    </DropdownMenuItem>
                                  )}

                                  {event.event_type === 'change_request' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(event.id, 'approved')}
                                        className="text-blue-600"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Aprobar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(event.id, 'rejected')}
                                        className="text-red-600"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rechazar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(event.id, 'implemented')}
                                        className="text-emerald-600"
                                      >
                                        <Wrench className="h-4 w-4 mr-2" />
                                        Marcar Implementado
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(event.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && hasExpandableContent && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          {event.description && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
                              <p className="text-sm whitespace-pre-wrap">{event.description}</p>
                            </div>
                          )}

                          {event.transcript_summary && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Resumen</p>
                              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded">
                                {event.transcript_summary}
                              </p>
                            </div>
                          )}

                          {event.transcript && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setViewTranscriptModal(event)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Ver Transcript Completo
                            </Button>
                          )}

                          {event.meeting_attendees && event.meeting_attendees.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Asistentes</p>
                              <div className="flex flex-wrap gap-1">
                                {event.meeting_attendees.map((attendee, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {attendee}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={addModalOpen || editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setAddModalOpen(false);
          setEditModalOpen(false);
          setSelectedEvent(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editModalOpen ? 'Editar Evento' : 'Nuevo Evento'}
            </DialogTitle>
            <DialogDescription>
              Registra eventos importantes del proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Event Type (only for add) */}
            {!editModalOpen && (
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(v: ProjectEventType) => setFormData(prev => ({ ...prev, event_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-600" />
                        Reunión
                      </div>
                    </SelectItem>
                    <SelectItem value="change_request">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4 text-amber-600" />
                        Solicitud de Cambio
                      </div>
                    </SelectItem>
                    <SelectItem value="feedback">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                        Feedback
                      </div>
                    </SelectItem>
                    <SelectItem value="delivery">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-emerald-600" />
                        Entrega
                      </div>
                    </SelectItem>
                    <SelectItem value="incident">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4 text-red-600" />
                        Incidente
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        Otro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Reunión de kickoff, Solicitud de nuevo módulo..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Fecha</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el evento..."
                className="min-h-[80px]"
              />
            </div>

            {/* Meeting-specific fields */}
            {formData.event_type === 'meeting' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meeting_duration">Duración (minutos)</Label>
                    <Input
                      id="meeting_duration"
                      type="number"
                      value={formData.meeting_duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_duration_minutes: e.target.value }))}
                      placeholder="30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendees">Asistentes</Label>
                    <Input
                      id="attendees"
                      value={formData.meeting_attendees}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_attendees: e.target.value }))}
                      placeholder="Juan, María, Carlos..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transcript">Transcript</Label>
                  <Textarea
                    id="transcript"
                    value={formData.transcript}
                    onChange={(e) => setFormData(prev => ({ ...prev, transcript: e.target.value }))}
                    placeholder="Pega aquí el transcript de la reunión..."
                    className="min-h-[100px] font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Resumen / Puntos Clave</Label>
                  <Textarea
                    id="summary"
                    value={formData.transcript_summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, transcript_summary: e.target.value }))}
                    placeholder="Resumen de los puntos clave discutidos..."
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}

            {/* Change Request-specific fields */}
            {formData.event_type === 'change_request' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.change_request_status}
                    onValueChange={(v: ChangeRequestStatus) => setFormData(prev => ({ ...prev, change_request_status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                      <SelectItem value="implemented">Implementado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Impacto</Label>
                  <Select
                    value={formData.change_impact}
                    onValueChange={(v: ChangeImpact) => setFormData(prev => ({ ...prev, change_impact: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bajo</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Feedback-specific fields */}
            {formData.event_type === 'feedback' && (
              <div className="space-y-2">
                <Label>Sentimiento</Label>
                <Select
                  value={formData.feedback_sentiment}
                  onValueChange={(v: FeedbackSentiment) => setFormData(prev => ({ ...prev, feedback_sentiment: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-emerald-600" />
                        Positivo
                      </div>
                    </SelectItem>
                    <SelectItem value="neutral">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-slate-600" />
                        Neutral
                      </div>
                    </SelectItem>
                    <SelectItem value="negative">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        Negativo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setAddModalOpen(false);
              setEditModalOpen(false);
            }}>
              Cancelar
            </Button>
            <Button
              onClick={editModalOpen ? handleUpdate : handleCreate}
              disabled={isCreating || !formData.title.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editModalOpen ? (
                'Guardar'
              ) : (
                'Crear'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Transcript Modal */}
      <Dialog open={!!viewTranscriptModal} onOpenChange={() => setViewTranscriptModal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Transcript: {viewTranscriptModal?.title}</DialogTitle>
            <DialogDescription>
              {viewTranscriptModal && formatDateToBogota(viewTranscriptModal.event_date, 'dd MMM yyyy')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {viewTranscriptModal?.transcript_summary && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-700 mb-1">Resumen</p>
                <p className="text-sm whitespace-pre-wrap">{viewTranscriptModal.transcript_summary}</p>
              </div>
            )}

            {viewTranscriptModal?.transcript && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Transcript Completo</p>
                <div className="p-3 bg-muted rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {viewTranscriptModal.transcript}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
