import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Phone, Calendar, Mail, FileText, MessageSquare, Clock, Upload, X, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog {
  id: string;
  lead_id: string;
  project_id?: string | null;
  type: 'call' | 'email' | 'meeting' | 'note' | 'quote' | 'follow_up';
  description: string;
  details?: string;
  transcript_file_path?: string;
  created_at: string;
  created_by?: string;
}

const ALLOWED_TRANSCRIPT_TYPES = [
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

const TRANSCRIPT_EXTENSIONS = '.txt,.csv,.pdf,.docx,.doc';

interface LeadActivityLogProps {
  leadId: string;
  projectId?: string; // optional - if provided, activities will be linked to this project
  onActivityAdded?: () => void;
}

const ACTIVITY_TYPES = {
  call: { label: 'Llamada', icon: Phone, color: 'bg-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'bg-green-500' },
  meeting: { label: 'Reunión', icon: Calendar, color: 'bg-purple-500' },
  note: { label: 'Nota', icon: MessageSquare, color: 'bg-slate-500' },
  quote: { label: 'Cotización', icon: FileText, color: 'bg-orange-500' },
  follow_up: { label: 'Seguimiento', icon: Clock, color: 'bg-amber-500' }
};

const QUICK_TEMPLATES = {
  call: [
    'Llamé pero no respondió',
    'Conversación telefónica exitosa',
    'Ocupado, reagendar llamada'
  ],
  email: [
    'Envié información del producto',
    'Email de seguimiento',
    'Respondió email'
  ],
  meeting: [
    'Reunión agendada',
    'Presentación completada',
    'Demo realizada'
  ],
  follow_up: [
    'Seguimiento en 1 semana',
    'Esperando decisión',
    'Contactar después'
  ]
};

export function LeadActivityLog({ leadId, projectId, onActivityAdded }: LeadActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'call' as keyof typeof ACTIVITY_TYPES,
    description: '',
    details: ''
  });
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showTranscriptUpload = newActivity.type === 'call' || newActivity.type === 'meeting';

  // Fetch activities for this lead (only those without project_id - lead-level activities)
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // Only fetch activities without project_id (lead-level activities)
        const { data, error } = await supabase
          .from('lead_activities')
          .select('*')
          .eq('lead_id', leadId)
          .is('project_id', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      fetchActivities();
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
      let transcriptPath: string | null = null;

      // Upload transcript file if exists
      if (transcriptFile && showTranscriptUpload) {
        const fileExt = transcriptFile.name.split('.').pop();
        const fileName = `${leadId}/${Date.now()}_${transcriptFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from('activity-transcripts')
          .upload(fileName, transcriptFile);

        if (uploadError) {
          console.error('Error uploading transcript:', uploadError);
          toast({
            title: 'Error',
            description: 'Error al subir el transcript',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        transcriptPath = fileName;
      }

      const { data, error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          project_id: projectId || null, // null = lead-level activity
          type: newActivity.type,
          description: newActivity.description,
          details: newActivity.details || null,
          transcript_file_path: transcriptPath,
        })
        .select()
        .single();

      if (error) throw error;

      // Update lead last_activity_at
      await supabase
        .from('leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', leadId);

      // Only add to local state if it's a lead-level activity
      if (!projectId) {
        setActivities(prev => [data, ...prev]);
      }

      setNewActivity({ type: 'call', description: '', details: '' });
      setTranscriptFile(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_TRANSCRIPT_TYPES.includes(file.type)) {
        toast({
          title: 'Archivo no permitido',
          description: 'Solo se permiten archivos .txt, .csv, .pdf, .doc y .docx',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: 'Archivo muy grande',
          description: 'El archivo no puede superar los 10MB',
          variant: 'destructive',
        });
        return;
      }
      setTranscriptFile(file);
    }
  };

  const handleDownloadTranscript = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('activity-transcripts')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'transcript';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast({
        title: 'Error',
        description: 'Error al descargar el transcript',
        variant: 'destructive',
      });
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
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {projectId ? 'Actividades del Proyecto' : 'Actividades de la Empresa'}
          </div>
          <Button
            size="sm"
            variant={showForm ? "secondary" : "default"}
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {showForm ? 'Cancelar' : 'Agregar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {showForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Tipo
                </label>
                <Select
                  value={newActivity.type}
                  onValueChange={(value: keyof typeof ACTIVITY_TYPES) =>
                    setNewActivity(prev => ({ ...prev, type: value, description: '' }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-3 w-3" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Template
                </label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {QUICK_TEMPLATES[newActivity.type]?.map((template, index) => (
                      <SelectItem key={index} value={template}>
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Descripción
              </label>
              <Textarea
                placeholder="Describe la actividad..."
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[60px] resize-none"
              />
            </div>

            {/* Transcript upload - only for calls and meetings */}
            {showTranscriptUpload && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Transcript (opcional)
                </Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={TRANSCRIPT_EXTENSIONS}
                  className="hidden"
                />
                {transcriptFile ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{transcriptFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setTranscriptFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-9"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Subir transcript (.txt, .csv, .pdf, .docx)
                  </Button>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveActivity} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}

        {/* Activities list */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Cargando...</p>
          ) : activities.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {projectId ? 'Sin actividades en este proyecto' : 'Sin actividades a nivel de empresa'}
              </p>
              {!projectId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Las actividades de proyectos específicos se ven en cada proyecto
                </p>
              )}
            </div>
          ) : (
            activities.map((activity) => {
              const ActivityIcon = ACTIVITY_TYPES[activity.type].icon;
              const colorClass = ACTIVITY_TYPES[activity.type].color;

              return (
                <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                  <div className={`w-7 h-7 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <ActivityIcon className="h-3.5 w-3.5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {ACTIVITY_TYPES[activity.type].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.created_at)}
                      </span>
                    </div>

                    <p className="text-sm">{activity.description}</p>

                    {activity.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.details}
                      </p>
                    )}

                    {activity.transcript_file_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs gap-1 mt-1"
                        onClick={() => handleDownloadTranscript(activity.transcript_file_path!)}
                      >
                        <Download className="h-3 w-3" />
                        Descargar transcript
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick actions */}
        {!showForm && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                setNewActivity({ type: 'call', description: 'No respondió', details: '' });
                setShowForm(true);
              }}
            >
              <Phone className="h-3 w-3 mr-1" />
              No respondió
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                setNewActivity({ type: 'meeting', description: 'Reunión agendada', details: '' });
                setShowForm(true);
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Reunión
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                setNewActivity({ type: 'quote', description: 'Cotización enviada', details: '' });
                setShowForm(true);
              }}
            >
              <FileText className="h-3 w-3 mr-1" />
              Cotización
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
