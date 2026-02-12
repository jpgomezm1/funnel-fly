import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, LayoutList, Columns3, User } from 'lucide-react';
import { TodoStatus, TodoPriority } from '@/types/database';

interface TeamMember {
  user_id: string;
  display_name: string;
  role: string;
}

interface TodoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TodoStatus | 'ALL';
  onStatusFilterChange: (value: TodoStatus | 'ALL') => void;
  priorityFilter: TodoPriority | 'ALL';
  onPriorityFilterChange: (value: TodoPriority | 'ALL') => void;
  viewMode: 'list' | 'kanban';
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  assigneeFilter?: string;
  onAssigneeFilterChange?: (value: string) => void;
  teamMembers?: TeamMember[];
  showAssigneeFilter?: boolean;
}

export function TodoFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  viewMode,
  onViewModeChange,
  assigneeFilter,
  onAssigneeFilterChange,
  teamMembers = [],
  showAssigneeFilter = false,
}: TodoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as TodoStatus | 'ALL')}>
        <SelectTrigger className="w-[160px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="in_progress">En Progreso</SelectItem>
          <SelectItem value="completed">Completado</SelectItem>
          <SelectItem value="cancelled">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={(v) => onPriorityFilterChange(v as TodoPriority | 'ALL')}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas</SelectItem>
          <SelectItem value="low">Baja</SelectItem>
          <SelectItem value="medium">Media</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="urgent">Urgente</SelectItem>
        </SelectContent>
      </Select>

      {showAssigneeFilter && onAssigneeFilterChange && (
        <Select value={assigneeFilter || 'ALL'} onValueChange={onAssigneeFilterChange}>
          <SelectTrigger className="w-[180px]">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Persona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las personas</SelectItem>
            {teamMembers.map(member => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex border rounded-md">
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="rounded-r-none"
        >
          <LayoutList className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('kanban')}
          className="rounded-l-none"
        >
          <Columns3 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
