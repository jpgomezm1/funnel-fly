import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Call,
  CallTeamMember,
  TEAM_MEMBER_LABELS,
  CALL_RESULT_LABELS,
  CALL_RESULT_COLORS,
  CALL_SOURCE_LABELS,
  CALL_SOURCE_COLORS,
} from '@/types/calls';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Phone,
  User,
  Building2,
  Mail,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Linkedin,
  ExternalLink,
  CalendarClock,
  CheckCircle2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallCardProps {
  call: Call;
  onEdit: (call: Call) => void;
  onDelete: (id: string) => void;
  onClose?: (call: Call) => void;
  onViewDetail?: (call: Call) => void;
}

// Team member colors for avatars
const TEAM_MEMBER_COLORS: Record<CallTeamMember, string> = {
  juan_pablo: 'bg-blue-500',
  sara: 'bg-orange-500',
  agustin: 'bg-emerald-500',
};

// Get initials from team member
const getInitials = (member: CallTeamMember): string => {
  const names = TEAM_MEMBER_LABELS[member].split(' ');
  return names.map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

// Get relative date label
const getDateLabel = (date: Date): { label: string; urgent: boolean } => {
  const now = new Date();
  const hoursUntil = differenceInHours(date, now);

  if (date < now) {
    return { label: 'Pasada', urgent: false };
  }
  if (isToday(date)) {
    if (hoursUntil <= 1) {
      return { label: 'En menos de 1 hora', urgent: true };
    }
    return { label: 'Hoy', urgent: true };
  }
  if (isTomorrow(date)) {
    return { label: 'Mañana', urgent: false };
  }
  return { label: format(date, "EEEE d MMM", { locale: es }), urgent: false };
};

export function CallCard({ call, onEdit, onDelete, onClose, onViewDetail }: CallCardProps) {
  const callDate = new Date(call.scheduled_at);
  const isPast = callDate < new Date();
  const hasQualification = call.qualification && call.call_result;
  const { label: dateLabel, urgent } = getDateLabel(callDate);

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-lg",
      isPast ? "opacity-75 hover:opacity-100" : "",
      urgent && !isPast ? "ring-2 ring-orange-400 ring-offset-2" : ""
    )}>
      <div className="flex">
        {/* Left side - Date/Time column */}
        <div className={cn(
          "w-28 flex-shrink-0 flex flex-col items-center justify-center p-4 text-white",
          isPast
            ? "bg-gradient-to-b from-slate-400 to-slate-500"
            : urgent
              ? "bg-gradient-to-b from-orange-500 to-red-500"
              : "bg-gradient-to-b from-primary to-primary/80"
        )}>
          <span className="text-3xl font-bold">
            {format(callDate, 'd')}
          </span>
          <span className="text-sm font-medium uppercase">
            {format(callDate, 'MMM', { locale: es })}
          </span>
          <div className="mt-2 flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
            <Clock className="h-3 w-3" />
            <span className="text-sm font-semibold">
              {format(callDate, 'HH:mm')}
            </span>
          </div>
          {!isPast && (
            <span className={cn(
              "mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full",
              urgent ? "bg-white/30" : "bg-white/20"
            )}>
              {dateLabel}
            </span>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Company and contact info */}
            <div className="flex-1 min-w-0">
              {/* Company header */}
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                <h3 className="font-bold text-lg truncate">
                  {call.company_name || 'Sin empresa'}
                </h3>
                {call.company_linkedin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={call.company_linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1.5 rounded-md bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Ver empresa en LinkedIn</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Contact details */}
              <div className="space-y-1.5 mb-3">
                {call.contact_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{call.contact_name}</span>
                    {call.contact_linkedin && (
                      <a
                        href={call.contact_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0A66C2] hover:underline flex items-center gap-0.5"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {call.contact_phone && (
                    <a
                      href={`tel:${call.contact_phone}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{call.contact_phone}</span>
                    </a>
                  )}
                  {call.contact_email && (
                    <a
                      href={`mailto:${call.contact_email}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[180px]">{call.contact_email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Notes preview */}
              {call.notes && (
                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="line-clamp-2">{call.notes}</p>
                </div>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mt-3">
                {call.source && (
                  <Badge variant="outline" className={cn("text-xs", CALL_SOURCE_COLORS[call.source])}>
                    {CALL_SOURCE_LABELS[call.source]}
                  </Badge>
                )}
                {isPast && call.call_result && (
                  <Badge className={cn("text-xs", CALL_RESULT_COLORS[call.call_result])}>
                    {CALL_RESULT_LABELS[call.call_result]}
                  </Badge>
                )}
                {call.duration_minutes && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {call.duration_minutes} min
                  </Badge>
                )}
              </div>

              {/* Next Step for closed calls */}
              {isPast && call.call_result && call.next_step && (
                <div className="mt-3 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-primary mb-0.5">Next Step</p>
                      <p className="text-sm text-foreground">{call.next_step}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Team member and actions */}
            <div className="flex flex-col items-end gap-2">
              {/* View detail button for closed calls */}
              {hasQualification && onViewDetail && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-primary"
                  onClick={() => onViewDetail(call)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalle
                </Button>
              )}

              {/* Close call button for past calls without result */}
              {isPast && !call.call_result && onClose && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onClose(call)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Cerrar
                </Button>
              )}

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasQualification && onViewDetail && (
                    <>
                      <DropdownMenuItem onClick={() => onViewDetail(call)}>
                        <Eye className="h-4 w-4 mr-2 text-primary" />
                        Ver Detalle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {isPast && onClose && (
                    <>
                      <DropdownMenuItem onClick={() => onClose(call)}>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                        {call.call_result ? 'Editar Cierre' : 'Cerrar Llamada'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onEdit(call)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(call.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Team member avatar */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md",
                      TEAM_MEMBER_COLORS[call.team_member]
                    )}>
                      {getInitials(call.team_member)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {TEAM_MEMBER_LABELS[call.team_member]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
