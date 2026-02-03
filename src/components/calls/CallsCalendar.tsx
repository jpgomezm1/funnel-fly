import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Call,
  CallTeamMember,
  TEAM_MEMBER_LABELS,
  CALL_RESULT_LABELS,
  CALL_RESULT_COLORS,
} from '@/types/calls';
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  User,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallsCalendarProps {
  calls: Call[];
  onCallClick?: (call: Call) => void;
  onEditCall?: (call: Call) => void;
  onCloseCall?: (call: Call) => void;
  onViewDetail?: (call: Call) => void;
}

// Team member colors
const TEAM_COLORS: Record<CallTeamMember, string> = {
  juan_pablo: 'bg-blue-500',
  sara: 'bg-purple-500',
  agustin: 'bg-emerald-500',
};

const TEAM_COLORS_LIGHT: Record<CallTeamMember, string> = {
  juan_pablo: 'bg-blue-100 border-blue-300 text-blue-800',
  sara: 'bg-purple-100 border-purple-300 text-purple-800',
  agustin: 'bg-emerald-100 border-emerald-300 text-emerald-800',
};

export function CallsCalendar({
  calls,
  onCallClick,
  onEditCall,
  onCloseCall,
  onViewDetail,
}: CallsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Group calls by date
  const callsByDate = useMemo(() => {
    const grouped: Record<string, Call[]> = {};
    calls.forEach((call) => {
      const dateKey = format(new Date(call.scheduled_at), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(call);
    });
    // Sort calls within each day by time
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    });
    return grouped;
  }, [calls]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <Card className="p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize ml-2">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoy
        </Button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayCalls = callsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                'min-h-[100px] p-1 border rounded-lg transition-colors',
                isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                isDayToday && 'ring-2 ring-primary ring-offset-1'
              )}
            >
              {/* Day Number */}
              <div
                className={cn(
                  'text-sm font-medium mb-1 text-center rounded-full w-7 h-7 flex items-center justify-center mx-auto',
                  isDayToday && 'bg-primary text-primary-foreground',
                  !isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {format(day, 'd')}
              </div>

              {/* Calls for this day */}
              <div className="space-y-1">
                {dayCalls.slice(0, 3).map((call) => (
                  <CallDayItem
                    key={call.id}
                    call={call}
                    onClick={() => onCallClick?.(call)}
                    onEdit={() => onEditCall?.(call)}
                    onClose={() => onCloseCall?.(call)}
                    onViewDetail={() => onViewDetail?.(call)}
                  />
                ))}
                {dayCalls.length > 3 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full text-xs text-center text-muted-foreground hover:text-primary transition-colors py-0.5">
                        +{dayCalls.length - 3} más
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2" align="start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium mb-2">
                          {format(day, "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        {dayCalls.map((call) => (
                          <CallDayItem
                            key={call.id}
                            call={call}
                            expanded
                            onClick={() => onCallClick?.(call)}
                            onEdit={() => onEditCall?.(call)}
                            onClose={() => onCloseCall?.(call)}
                            onViewDetail={() => onViewDetail?.(call)}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
        <span className="text-xs text-muted-foreground">Equipo:</span>
        {Object.entries(TEAM_MEMBER_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                TEAM_COLORS[key as CallTeamMember]
              )}
            />
            <span className="text-xs text-muted-foreground">
              {label.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface CallDayItemProps {
  call: Call;
  expanded?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onClose?: () => void;
  onViewDetail?: () => void;
}

function CallDayItem({
  call,
  expanded,
  onClick,
  onEdit,
  onClose,
  onViewDetail,
}: CallDayItemProps) {
  const isPast = new Date(call.scheduled_at) < new Date();
  const hasResult = !!call.call_result;
  const hasQualification = call.qualification && call.call_result;

  const content = (
    <div
      className={cn(
        'text-xs p-1.5 rounded border cursor-pointer transition-all hover:shadow-sm',
        TEAM_COLORS_LIGHT[call.team_member],
        isPast && !hasResult && 'opacity-60',
        hasResult && call.call_result === 'lead_pasa_fase_0' && 'border-green-400',
        hasResult && call.call_result === 'lead_no_califica' && 'border-red-400'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="font-medium">
          {format(new Date(call.scheduled_at), 'HH:mm')}
        </span>
        {hasResult && (
          call.call_result === 'lead_pasa_fase_0' ? (
            <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
          ) : (
            <XCircle className="h-3 w-3 text-red-600 ml-auto" />
          )
        )}
      </div>
      {expanded && (
        <>
          <div className="flex items-center gap-1 mt-1">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{call.company_name || 'Sin empresa'}</span>
          </div>
          {call.contact_name && (
            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{call.contact_name}</span>
            </div>
          )}
          <div className="flex gap-1 mt-2">
            {isPast && !hasResult && onClose && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                Cerrar
              </Button>
            )}
            {hasQualification && onViewDetail && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail();
                }}
              >
                Detalle
              </Button>
            )}
          </div>
        </>
      )}
      {!expanded && (
        <p className="truncate mt-0.5">{call.company_name || 'Sin empresa'}</p>
      )}
    </div>
  );

  if (expanded) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{call.company_name || 'Sin empresa'}</p>
            {call.contact_name && (
              <p className="text-sm text-muted-foreground">{call.contact_name}</p>
            )}
            <p className="text-sm">
              {format(new Date(call.scheduled_at), "HH:mm 'hrs'")}
            </p>
            <p className="text-sm text-muted-foreground">
              {TEAM_MEMBER_LABELS[call.team_member]}
            </p>
            {hasResult && (
              <Badge
                className={cn('text-xs', CALL_RESULT_COLORS[call.call_result!])}
              >
                {CALL_RESULT_LABELS[call.call_result!]}
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
