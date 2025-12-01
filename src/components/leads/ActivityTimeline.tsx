import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, DollarSign, Plus, Edit, FileText, Clock } from 'lucide-react';
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
        return <ArrowRight className="h-3 w-3" />;
      case 'deal_created':
        return <Plus className="h-3 w-3" />;
      case 'deal_updated':
        return <Edit className="h-3 w-3" />;
      case 'lead_created':
        return <Plus className="h-3 w-3" />;
      case 'note_updated':
        return <FileText className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'stage_change':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'deal_created':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'deal_updated':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'lead_created':
        return 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400';
      case 'note_updated':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="p-4">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin actividad registrada
              </p>
            ) : (
              <div className="space-y-3">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-px h-full bg-border mt-1 min-h-[16px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDateToBogota(event.timestamp, 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>

                      <p className="text-sm">{event.description}</p>

                      {/* Stage change details */}
                      {event.type === 'stage_change' && event.details?.from_stage && event.details?.to_stage && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {STAGE_LABELS[event.details.from_stage]}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {STAGE_LABELS[event.details.to_stage]}
                          </Badge>
                        </div>
                      )}

                      {/* Deal details */}
                      {(event.type === 'deal_created' || event.type === 'deal_updated') && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {event.details?.mrr_usd !== undefined && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              MRR: ${event.details.mrr_usd.toLocaleString('en-US')}
                            </span>
                          )}
                          {event.details?.implementation_fee_usd !== undefined && (
                            <span className="flex items-center gap-1">
                              Fee: ${event.details.implementation_fee_usd.toLocaleString('en-US')}
                            </span>
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
