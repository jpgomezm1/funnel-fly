import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CallTeamMember,
  CallResult,
  CallSource,
  TEAM_MEMBER_LABELS,
  CALL_RESULT_LABELS,
  CALL_SOURCE_LABELS,
} from '@/types/calls';
import { Users, CheckCircle, Calendar, Share2 } from 'lucide-react';

export type DateFilter = 'all' | 'this_week' | 'last_week' | 'this_month' | 'last_month';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const getDateRange = (filter: DateFilter): DateRange => {
  const now = new Date();

  switch (filter) {
    case 'this_week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'last_week':
      const lastWeek = subWeeks(now, 1);
      return {
        start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      };
    case 'this_month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    default:
      return { start: null, end: null };
  }
};

export const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Todo el tiempo',
  this_week: 'Esta semana',
  last_week: 'Semana pasada',
  this_month: 'Este mes',
  last_month: 'Mes pasado',
};

interface CallFiltersProps {
  teamMember: CallTeamMember | 'all';
  onTeamMemberChange: (value: CallTeamMember | 'all') => void;
  showResultFilter?: boolean;
  result?: CallResult | 'all';
  onResultChange?: (value: CallResult | 'all') => void;
  showSourceFilter?: boolean;
  source?: CallSource | 'all';
  onSourceChange?: (value: CallSource | 'all') => void;
  showDateFilter?: boolean;
  dateFilter?: DateFilter;
  onDateFilterChange?: (value: DateFilter) => void;
}

export function CallFilters({
  teamMember,
  onTeamMemberChange,
  showResultFilter = false,
  result = 'all',
  onResultChange,
  showSourceFilter = false,
  source = 'all',
  onSourceChange,
  showDateFilter = false,
  dateFilter = 'all',
  onDateFilterChange,
}: CallFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {showDateFilter && onDateFilterChange && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={dateFilter}
            onValueChange={(value) => onDateFilterChange(value as DateFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_FILTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Select
          value={teamMember}
          onValueChange={(value) => onTeamMemberChange(value as CallTeamMember | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por miembro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(TEAM_MEMBER_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSourceFilter && onSourceChange && (
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={source}
            onValueChange={(value) => onSourceChange(value as CallSource | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los origenes</SelectItem>
              {Object.entries(CALL_SOURCE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showResultFilter && onResultChange && (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          <Select
            value={result}
            onValueChange={(value) => onResultChange(value as CallResult | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los resultados</SelectItem>
              {Object.entries(CALL_RESULT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
