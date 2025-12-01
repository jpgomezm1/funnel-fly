import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Building2,
  Briefcase,
  Phone,
  Mail,
  Edit,
  Calendar,
  Clock,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  type: string;
  description: string;
  details?: string;
  created_at: string;
}

const ACTIVITY_TYPES = {
  call: { label: 'Llamada', icon: Phone, color: 'bg-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'bg-green-500' },
  meeting: { label: 'Reunión', icon: Calendar, color: 'bg-purple-500' },
  note: { label: 'Nota', icon: MessageSquare, color: 'bg-slate-500' },
  quote: { label: 'Cotización', icon: Briefcase, color: 'bg-orange-500' },
  follow_up: { label: 'Seguimiento', icon: Clock, color: 'bg-amber-500' }
} as const;

interface ProjectTabGeneralProps {
  project: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    stage_entered_at: string;
    client: {
      company_name: string;
      contact_name?: string;
      phone?: string;
      email?: string;
    };
    activities: Activity[];
  };
  onRefetch: () => void;
}

export function ProjectTabGeneral({ project, onRefetch }: ProjectTabGeneralProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(project.description || '');
  const [savingDescription, setSavingDescription] = useState(false);

  const handleSaveDescription = async () => {
    setSavingDescription(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: descriptionValue.trim() || null })
        .eq('id', project.id);

      if (error) throw error;

      setEditingDescription(false);
      onRefetch();
      toast({
        title: 'Descripción actualizada',
      });
    } catch (error) {
      console.error('Error saving description:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar la descripción',
        variant: 'destructive',
      });
    } finally {
      setSavingDescription(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Project Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Información del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nombre</p>
            <p className="font-medium">{project.name}</p>
          </div>

          {/* Description - editable */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Descripción</p>
              {!editingDescription && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setDescriptionValue(project.description || '');
                    setEditingDescription(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  placeholder="Describe el alcance, objetivos o detalles del proyecto..."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDescription(false)}
                    disabled={savingDescription}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={savingDescription}
                  >
                    {savingDescription ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            ) : project.description ? (
              <p className="text-sm whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin descripción</p>
            )}
          </div>

          <div className="pt-3 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Creado</p>
              <p className="text-sm">{formatDateToBogota(project.created_at, 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cerrado</p>
              <p className="text-sm">{formatDateToBogota(project.stage_entered_at, 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium text-lg">{project.client.company_name}</p>
            {project.client.contact_name && (
              <p className="text-sm text-muted-foreground">{project.client.contact_name}</p>
            )}
          </div>

          {(project.client.phone || project.client.email) && (
            <div className="pt-3 border-t space-y-2">
              {project.client.phone && (
                <a
                  href={`tel:${project.client.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {project.client.phone}
                </a>
              )}
              {project.client.email && (
                <a
                  href={`mailto:${project.client.email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {project.client.email}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-sale History - Collapsible, spans full width */}
      {project.activities.length > 0 && (
        <div className="lg:col-span-2">
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Historial Pre-Venta
                      <Badge variant="secondary" className="text-xs">
                        {project.activities.length} actividades
                      </Badge>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      historyOpen && "rotate-180"
                    )} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {project.activities.map((activity) => {
                      const config = ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES] || ACTIVITY_TYPES.note;
                      const ActivityIcon = config.icon;

                      return (
                        <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                          <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                            <ActivityIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-[10px] h-5">
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToBogota(activity.created_at)}
                              </span>
                            </div>

                            <p className="text-sm">{activity.description}</p>

                            {activity.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.details}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
