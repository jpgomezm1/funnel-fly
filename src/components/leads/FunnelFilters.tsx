import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  LeadChannel,
  LeadSubchannel,
  CHANNEL_LABELS,
  SUBCHANNEL_LABELS
} from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  User,
  Globe,
  Users,
  Megaphone,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Linkedin,
  Mail,
  MonitorPlay,
  Handshake,
  HelpCircle,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamMembers } from '@/hooks/useTeamMembers';

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

interface FunnelFiltersProps {
  filters: {
    dateRange: { from: Date; to: Date } | null;
    channel: string | null;
    subchannel: string | null;
    owner: string | null;
  };
  onFiltersChange: (filters: any) => void;
}

export function FunnelFilters({ filters, onFiltersChange }: FunnelFiltersProps) {
  const { salesMembers, getMemberName } = useTeamMembers();
  const [showFilters, setShowFilters] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilter = (key: string) => {
    updateFilter(key, null);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: null,
      channel: null,
      subchannel: null,
      owner: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== null);
  const activeFilterCount = Object.values(filters).filter(value => value !== null).length;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!filters.dateRange) {
      updateFilter('dateRange', { from: date, to: date });
    } else if (filters.dateRange.from && !filters.dateRange.to) {
      if (date >= filters.dateRange.from) {
        updateFilter('dateRange', { ...filters.dateRange, to: date });
      } else {
        updateFilter('dateRange', { from: date, to: filters.dateRange.from });
      }
      setCalendarOpen(false);
    } else {
      updateFilter('dateRange', { from: date, to: date });
    }
  };

  // Quick date range presets
  const applyPreset = (preset: 'today' | 'week' | 'month' | 'quarter') => {
    const now = new Date();
    let from: Date;
    const to = now;

    switch (preset) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        from = new Date(now);
        from.setDate(from.getDate() - 7);
        break;
      case 'month':
        from = new Date(now);
        from.setMonth(from.getMonth() - 1);
        break;
      case 'quarter':
        from = new Date(now);
        from.setMonth(from.getMonth() - 3);
        break;
    }

    updateFilter('dateRange', { from, to: new Date() });
    setCalendarOpen(false);
  };

  // Get selected channel icon
  const SelectedChannelIcon = filters.channel
    ? CHANNEL_ICONS[filters.channel as LeadChannel]
    : null;

  return (
    <div className="space-y-3">
      {/* Main filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Toggle filters button */}
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "gap-2 transition-all",
            showFilters && "bg-primary text-primary-foreground"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "ml-1",
                showFilters && "bg-white/20 text-white"
              )}
            >
              {activeFilterCount}
            </Badge>
          )}
          {showFilters ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>

        {/* Quick channel filters */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-muted rounded-lg">
          {Object.entries(CHANNEL_LABELS).slice(0, 4).map(([value, label]) => {
            const Icon = CHANNEL_ICONS[value as LeadChannel];
            const isSelected = filters.channel === value;
            return (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 gap-1",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => updateFilter('channel', isSelected ? null : value)}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs hidden lg:inline">{label}</span>
              </Button>
            );
          })}
        </div>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Active filters display - badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-2 py-1 px-3 bg-blue-100 text-blue-700 hover:bg-blue-200">
              <CalendarIcon className="h-3 w-3" />
              {formatDateToBogota(filters.dateRange.from, 'dd/MM')} - {formatDateToBogota(filters.dateRange.to, 'dd/MM')}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                onClick={() => clearFilter('dateRange')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.channel && (
            <Badge variant="secondary" className="gap-2 py-1 px-3 bg-purple-100 text-purple-700 hover:bg-purple-200">
              {SelectedChannelIcon && <SelectedChannelIcon className="h-3 w-3" />}
              {CHANNEL_LABELS[filters.channel as LeadChannel]}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                onClick={() => clearFilter('channel')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.subchannel && (
            <Badge variant="secondary" className="gap-2 py-1 px-3 bg-amber-100 text-amber-700 hover:bg-amber-200">
              {SUBCHANNEL_LABELS[filters.subchannel as LeadSubchannel]}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                onClick={() => clearFilter('subchannel')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.owner && (
            <Badge variant="secondary" className="gap-2 py-1 px-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
              <User className="h-3 w-3" />
              {filters.owner === 'sin-asignar' ? 'Sin asignar' : getMemberName(filters.owner)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                onClick={() => clearFilter('owner')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Expanded filters panel */}
      {showFilters && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  Rango de Fechas
                </label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange && "text-muted-foreground",
                        filters.dateRange && "border-blue-300 bg-blue-50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange ? (
                        `${formatDateToBogota(filters.dateRange.from, 'dd/MM')} - ${formatDateToBogota(filters.dateRange.to, 'dd/MM')}`
                      ) : (
                        'Seleccionar fechas'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 border-b flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => applyPreset('today')} className="text-xs">
                        Hoy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => applyPreset('week')} className="text-xs">
                        7 días
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => applyPreset('month')} className="text-xs">
                        30 días
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => applyPreset('quarter')} className="text-xs">
                        90 días
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.from}
                      onSelect={handleDateSelect}
                      className="rounded-md border-0 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Channel */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  Canal
                </label>
                <Select
                  value={filters.channel || 'all'}
                  onValueChange={(value) => updateFilter('channel', value === 'all' ? null : value)}
                >
                  <SelectTrigger className={cn(
                    filters.channel && "border-purple-300 bg-purple-50"
                  )}>
                    <SelectValue placeholder="Todos los canales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Todos los canales
                      </span>
                    </SelectItem>
                    {Object.entries(CHANNEL_LABELS).map(([value, label]) => {
                      const Icon = CHANNEL_ICONS[value as LeadChannel];
                      return (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Subchannel */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Subcanal
                </label>
                <Select
                  value={filters.subchannel || 'all'}
                  onValueChange={(value) => updateFilter('subchannel', value === 'all' ? null : value)}
                >
                  <SelectTrigger className={cn(
                    filters.subchannel && "border-amber-300 bg-amber-50"
                  )}>
                    <SelectValue placeholder="Todos los subcanales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los subcanales</SelectItem>
                    {Object.entries(SUBCHANNEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner / Comercial */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" />
                  Comercial
                </label>
                <Select
                  value={filters.owner || 'all'}
                  onValueChange={(value) => updateFilter('owner', value === 'all' ? null : value)}
                >
                  <SelectTrigger className={cn(
                    filters.owner && "border-emerald-300 bg-emerald-50"
                  )}>
                    <SelectValue placeholder="Todos los comerciales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Todos los comerciales
                      </span>
                    </SelectItem>
                    <SelectItem value="sin-asignar">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        Sin asignar
                      </span>
                    </SelectItem>
                    {salesMembers.map((m) => (
                      <SelectItem key={m.slug} value={m.slug}>
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-500" />
                          {m.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {activeFilterCount > 0 ? (
                  <>{activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} activo{activeFilterCount > 1 ? 's' : ''}</>
                ) : (
                  'Sin filtros aplicados'
                )}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restablecer todo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
