import { useState } from 'react';
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
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.dateRange && (
            <Badge variant="outline" className="gap-2">
              {formatDateToBogota(filters.dateRange.from, 'dd/MM')} - {formatDateToBogota(filters.dateRange.to, 'dd/MM')}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('dateRange')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.channel && (
            <Badge variant="outline" className="gap-2">
              {CHANNEL_LABELS[filters.channel as LeadChannel]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('channel')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.subchannel && (
            <Badge variant="outline" className="gap-2">
              {SUBCHANNEL_LABELS[filters.subchannel as LeadSubchannel]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('subchannel')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rango de Fechas</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !filters.dateRange && "text-muted-foreground"
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
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.from}
                      onSelect={handleDateSelect}
                      className="rounded-md border pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Channel */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Canal</label>
                <Select 
                  value={filters.channel || ''} 
                  onValueChange={(value) => updateFilter('channel', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los canales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los canales</SelectItem>
                    {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subchannel */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcanal</label>
                <Select 
                  value={filters.subchannel || ''} 
                  onValueChange={(value) => updateFilter('subchannel', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los subcanales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los subcanales</SelectItem>
                    {Object.entries(SUBCHANNEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Comercial</label>
                <Select 
                  value={filters.owner || ''} 
                  onValueChange={(value) => updateFilter('owner', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los comerciales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los comerciales</SelectItem>
                    <SelectItem value="sin-asignar">Sin asignar</SelectItem>
                    {/* TODO: Cargar owners reales desde la base de datos */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}