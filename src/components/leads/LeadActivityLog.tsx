import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Phone, 
  Calendar, 
  Mail, 
  FileText, 
  MessageSquare, 
  Upload,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  lead_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'quote' | 'follow_up';
  description: string;
  details?: string;
  created_at: string;
  created_by?: string;
}

interface LeadActivityLogProps {
  leadId: string;
  onActivityAdded?: () => void;
}

const ACTIVITY_TYPES = {
  call: { label: 'Llamada', icon: Phone, color: 'bg-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'bg-green-500' },
  meeting: { label: 'Reunión', icon: Calendar, color: 'bg-purple-500' },
  note: { label: 'Nota', icon: MessageSquare, color: 'bg-gray-500' },
  quote: { label: 'Cotización', icon: FileText, color: 'bg-orange-500' },
  follow_up: { label: 'Seguimiento', icon: Clock, color: 'bg-yellow-500' }
};

const QUICK_TEMPLATES = {
  call: [
    'Llamé pero no respondió - dejar mensaje de voz',
    'Conversación telefónica - interesado en el producto',
    'Llamé pero está ocupado - reagendar llamada',
    'Llamada exitosa - enviar información adicional'
  ],
  email: [
    'Envié información del producto vía email',
    'Email de seguimiento enviado',
    'Respondió email - interesado en demo',
    'Email rebotó - verificar dirección'
  ],
  meeting: [
    'Reunión agendada para [fecha]',
    'Presentación del producto completada',
    'Reunión de seguimiento programada',
    'Demo técnica realizada'
  ],
  follow_up: [
    'Programar seguimiento en 1 semana',
    'Esperando decisión del cliente',
    'Contactar después de [fecha específica]',
    'Cliente pidió tiempo para evaluar'
  ]
};

export function LeadActivityLog({ leadId, onActivityAdded }: LeadActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'call' as keyof typeof ACTIVITY_TYPES,
    description: '',
    details: ''
  });

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      // En una implementación real, esto vendría de una tabla de actividades
      // Por ahora simulamos datos vacíos
      setActivities([]);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const handleSaveActivity = async () => {
    if (!newActivity.description.trim()) {
      toast({
        title: 'Error',
        description: 'La descripción es requerida',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Simular guardado de actividad
      // En implementación real, esto se guardaría en una tabla lead_activities
      const mockActivity: ActivityLog = {
        id: Date.now().toString(),
        lead_id: leadId,
        type: newActivity.type,
        description: newActivity.description,
        details: newActivity.details || undefined,
        created_at: new Date().toISOString(),
      };

      setActivities(prev => [mockActivity, ...prev]);
      
      // Limpiar formulario
      setNewActivity({
        type: 'call',
        description: '',
        details: ''
      });
      setShowForm(false);

      toast({
        title: 'Actividad registrada',
        description: 'La actividad se ha guardado correctamente',
      });

      onActivityAdded?.();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar la actividad',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setNewActivity(prev => ({ ...prev, description: template }));
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Log de Actividades
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "secondary" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Cancelar' : 'Agregar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form for new activity */}
        {showForm && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Actividad</label>
                <Select 
                  value={newActivity.type} 
                  onValueChange={(value: keyof typeof ACTIVITY_TYPES) => 
                    setNewActivity(prev => ({ ...prev, type: value, description: '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Templates Rápidos</label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar template" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUICK_TEMPLATES[newActivity.type]?.map((template, index) => (
                      <SelectItem key={index} value={template}>
                        <span className="text-sm">{template}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descripción *</label>
              <Textarea
                placeholder="Describe la actividad realizada..."
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Detalles Adicionales</label>
              <Textarea
                placeholder="Información adicional, próximos pasos, etc..."
                value={newActivity.details}
                onChange={(e) => setNewActivity(prev => ({ ...prev, details: e.target.value }))}
                className="min-h-[60px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveActivity} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Actividad'}
              </Button>
            </div>
          </div>
        )}

        {/* Activities list */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando actividades...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay actividades registradas</p>
              <p className="text-sm">Comienza agregando la primera actividad</p>
            </div>
          ) : (
            activities.map((activity) => {
              const ActivityIcon = ACTIVITY_TYPES[activity.type].icon;
              const colorClass = ACTIVITY_TYPES[activity.type].color;
              
              return (
                <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <ActivityIcon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {ACTIVITY_TYPES[activity.type].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium mb-1">{activity.description}</p>
                    
                    {activity.details && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick action buttons */}
        {!showForm && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setNewActivity({
                  type: 'call',
                  description: 'Llamé pero no respondió - dejar mensaje de voz',
                  details: ''
                });
                setShowForm(true);
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              No respondió
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setNewActivity({
                  type: 'meeting',
                  description: 'Reunión agendada para [fecha]',
                  details: ''
                });
                setShowForm(true);
              }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Agendar reunión
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setNewActivity({
                  type: 'quote',
                  description: 'Cotización enviada al cliente',
                  details: ''
                });
                setShowForm(true);
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Envié cotización
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}