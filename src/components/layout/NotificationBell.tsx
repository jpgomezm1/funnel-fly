import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useStaleLeads } from '@/hooks/useStaleLeads';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
  const { data: staleLeads = [] } = useStaleLeads();
  const [open, setOpen] = useState(false);

  const count = staleLeads.length;

  if (count === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0"
          >
            {count > 9 ? '9+' : count}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Leads sin actividad</h4>
          <p className="text-xs text-muted-foreground">
            {count} lead{count !== 1 ? 's' : ''} sin actividad en 5+ dias
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {staleLeads.slice(0, 10).map((lead) => (
            <Link
              key={lead.id}
              to={`/empresas/${lead.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors border-b last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{lead.company_name}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.last_activity_at
                    ? formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true, locale: es })
                    : 'Sin actividad'}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                {lead.stage || 'N/A'}
              </Badge>
            </Link>
          ))}
        </div>
        {count > 10 && (
          <div className="p-2 border-t text-center">
            <p className="text-xs text-muted-foreground">
              +{count - 10} mas
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
