import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lead, CHANNEL_LABELS, LeadChannel } from '@/types/database';
import { formatDistanceToBogota } from '@/lib/date-utils';
import {
  Building2,
  User,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  Globe,
  Users,
  Megaphone,
  TrendingUp,
  Linkedin,
  MonitorPlay,
  Handshake,
  HelpCircle,
  Search,
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  deals?: any[];
}

// Channel icons mapping
const CHANNEL_ICONS: Record<LeadChannel, React.ElementType> = {
  'OUTBOUND_APOLLO': Megaphone,
  'OUTBOUND_LINKEDIN': Linkedin,
  'OUTBOUND_EMAIL': Mail,
  'WARM_INTRO': Users,
  'INBOUND_REDES': Globe,
  'INBOUND_WEB': Search,
  'WEBINAR': MonitorPlay,
  'PARTNER': Handshake,
  'OTRO': HelpCircle,
};

// Channel colors for badges
const CHANNEL_COLORS: Record<LeadChannel, string> = {
  'OUTBOUND_APOLLO': 'bg-amber-100 text-amber-700 border-amber-200',
  'OUTBOUND_LINKEDIN': 'bg-sky-100 text-sky-700 border-sky-200',
  'OUTBOUND_EMAIL': 'bg-rose-100 text-rose-700 border-rose-200',
  'WARM_INTRO': 'bg-purple-100 text-purple-700 border-purple-200',
  'INBOUND_REDES': 'bg-blue-100 text-blue-700 border-blue-200',
  'INBOUND_WEB': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'WEBINAR': 'bg-violet-100 text-violet-700 border-violet-200',
  'PARTNER': 'bg-orange-100 text-orange-700 border-orange-200',
  'OTRO': 'bg-slate-100 text-slate-700 border-slate-200',
};

export function LeadCard({ lead, isDragging = false, deals = [] }: LeadCardProps) {
  const { getMrrBadgeInfo } = useDeals();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `lead-${lead.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate time in stage and staleness
  const timeMetrics = useMemo(() => {
    const now = new Date();
    const enteredAt = lead.stage_entered_at
      ? new Date(lead.stage_entered_at)
      : new Date(lead.created_at);
    const lastActivity = lead.last_activity_at
      ? new Date(lead.last_activity_at)
      : enteredAt;

    const daysInStage = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    const isStale = daysInStage > 7;
    const isInactive = daysSinceActivity > 3;
    const isNew = daysInStage <= 1;
    const isHot = daysInStage <= 3 && !isNew;

    return {
      daysInStage,
      daysSinceActivity,
      isStale,
      isInactive,
      isNew,
      isHot,
    };
  }, [lead.stage_entered_at, lead.last_activity_at, lead.created_at]);

  const ChannelIcon = CHANNEL_ICONS[lead.channel] || Globe;
  const mrrInfo = lead.stage === 'CERRADO_GANADO' ? getMrrBadgeInfo(deals) : null;

  // Dragging preview
  if (isDragging) {
    return (
      <Card className="w-72 p-4 bg-primary/10 border-primary/30 border-2 border-dashed rotate-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold text-primary truncate block">
              {lead.company_name}
            </span>
            {lead.contact_name && (
              <span className="text-xs text-primary/70">{lead.contact_name}</span>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link to={`/leads/${lead.id}`}>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "p-3 cursor-grab active:cursor-grabbing transition-all duration-200",
          "hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
          "border-l-4",
          timeMetrics.isStale && "border-l-amber-500 bg-amber-50/30",
          timeMetrics.isNew && "border-l-emerald-500 bg-emerald-50/30",
          timeMetrics.isHot && "border-l-blue-500",
          !timeMetrics.isStale && !timeMetrics.isNew && !timeMetrics.isHot && "border-l-slate-300"
        )}
      >
        <div className="space-y-2.5">
          {/* Top badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* New badge */}
            {timeMetrics.isNew && (
              <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500 text-white">
                NUEVO
              </Badge>
            )}

            {/* Hot badge */}
            {timeMetrics.isHot && (
              <Badge className="text-[9px] h-4 px-1.5 bg-blue-500 text-white">
                <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                HOT
              </Badge>
            )}

            {/* Stale warning */}
            {timeMetrics.isStale && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-amber-400 text-amber-600 bg-amber-50">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                {timeMetrics.daysInStage}d
              </Badge>
            )}

            {/* Channel badge - pushed to right */}
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] h-4 px-1.5 ml-auto",
                CHANNEL_COLORS[lead.channel]
              )}
            >
              <ChannelIcon className="h-2.5 w-2.5 mr-0.5" />
              {CHANNEL_LABELS[lead.channel]}
            </Badge>
          </div>

          {/* Company & Contact */}
          <div className="flex items-start gap-2.5">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
              "bg-slate-100 text-slate-600"
            )}>
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {lead.company_name}
              </p>
              {lead.contact_name && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 flex-shrink-0" />
                  {lead.contact_name}
                </p>
              )}
            </div>
          </div>

          {/* Contact info - compact */}
          {(lead.phone || lead.email) && (
            <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground pl-11">
              {lead.phone && (
                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                  {lead.phone}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 flex-shrink-0 text-blue-500" />
                  {lead.email}
                </span>
              )}
            </div>
          )}

          {/* Footer with metrics */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {/* Time info */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1" title="Tiempo en etapa">
                <Clock className="h-3 w-3" />
                {timeMetrics.daysInStage}d en etapa
              </span>
            </div>

            {/* MRR Badge for won deals */}
            {mrrInfo && (
              <Badge
                className={cn(
                  "text-[10px] h-5 font-semibold",
                  mrrInfo.type === 'active'
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                )}
              >
                <TrendingUp className="h-3 w-3 mr-0.5" />
                {mrrInfo.text}
              </Badge>
            )}

            {/* Last activity for non-won */}
            {!mrrInfo && (
              <span
                className={cn(
                  "text-[10px]",
                  timeMetrics.isInactive ? "text-amber-600 font-medium" : "text-muted-foreground"
                )}
                title="Última actividad"
              >
                {formatDistanceToBogota(lead.last_activity_at)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
