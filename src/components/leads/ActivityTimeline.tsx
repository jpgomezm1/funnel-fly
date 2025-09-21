import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  DollarSign, 
  Plus, 
  Edit, 
  FileText,
  Clock
} from 'lucide-react';
import { TimelineEvent } from '@/hooks/useLeadTimeline';
import { formatDateToBogota } from '@/lib/date-utils';
import { STAGE_LABELS } from '@/types/database';

interface ActivityTimelineProps {
  timeline: TimelineEvent[];
  isLoading: boolean;
}

export function ActivityTimeline({ timeline, isLoading }: ActivityTimelineProps) {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'stage_change':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      case 'deal_created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'deal_updated':
        return <Edit className="h-4 w-4 text-orange-600" />;
      case 'lead_created':
        return <Plus className="h-4 w-4 text-purple-600" />;
      case 'note_updated':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEventBadge = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'stage_change':
        return <Badge variant="default" className="text-xs">Etapa</Badge>;
      case 'deal_created':
        return <Badge variant="default" className="text-xs bg-green-600">Contrato</Badge>;
      case 'deal_updated':
        return <Badge variant="default" className="text-xs bg-orange-600">Contrato</Badge>;
      case 'lead_created':
        return <Badge variant="secondary" className="text-xs">Lead</Badge>;
      case 'note_updated':
        return <Badge variant="outline" className="text-xs">Nota</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando timeline...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline de Actividad
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-6">
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay actividad registrada
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4 pb-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border">
                        {getEventIcon(event.type)}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventBadge(event.type)}
                        <span className="text-sm text-muted-foreground">
                          {formatDateToBogota(event.timestamp, 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-foreground mb-1">
                        {event.description}
                      </p>

                      {/* Additional details */}
                      {event.details && (
                        <div className="text-xs text-muted-foreground">
                          {event.details.changed_by && (
                            <span>por {event.details.changed_by.slice(0, 8)}...</span>
                          )}
                          {event.type === 'stage_change' && event.details.from_stage && event.details.to_stage && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {STAGE_LABELS[event.details.from_stage]}
                              </Badge>
                              <ArrowRight className="h-3 w-3" />
                              <Badge variant="outline" className="text-xs">
                                {STAGE_LABELS[event.details.to_stage]}
                              </Badge>
                            </div>
                          )}
                          {(event.type === 'deal_created' || event.type === 'deal_updated') && (
                            <div className="flex items-center gap-4 mt-1">
                              {event.details.mrr_usd !== undefined && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  MRR: ${event.details.mrr_usd.toLocaleString('en-US')}
                                </span>
                              )}
                              {event.details.implementation_fee_usd !== undefined && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  Fee: ${event.details.implementation_fee_usd.toLocaleString('en-US')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}