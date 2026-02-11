import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { TodoNotificationSettings as Settings } from '@/types/database';

interface TodoNotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodoNotificationSettings({ open, onOpenChange }: TodoNotificationSettingsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notify_on_assignment: true,
    notify_on_comment: true,
    notify_on_due_date: true,
    notify_on_status_change: true,
    due_date_reminder_hours: 24,
  });

  useEffect(() => {
    if (open && user?.id) {
      loadSettings();
    }
  }, [open, user?.id]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('todo_notification_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (data) {
        setSettings({
          notify_on_assignment: data.notify_on_assignment,
          notify_on_comment: data.notify_on_comment,
          notify_on_due_date: data.notify_on_due_date,
          notify_on_status_change: data.notify_on_status_change,
          due_date_reminder_hours: data.due_date_reminder_hours,
        });
      }
    } catch {
      // No settings yet, use defaults
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('todo_notification_settings')
        .upsert({
          user_id: user!.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast({ title: 'Configuracion guardada' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar la configuracion', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </DialogTitle>
          <DialogDescription>
            Configura cuando quieres recibir notificaciones por email
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Asignacion de tareas</Label>
                <p className="text-xs text-muted-foreground">Cuando te asignan una tarea</p>
              </div>
              <Switch
                checked={settings.notify_on_assignment}
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_on_assignment: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Comentarios</Label>
                <p className="text-xs text-muted-foreground">Cuando comentan en tus tareas</p>
              </div>
              <Switch
                checked={settings.notify_on_comment}
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_on_comment: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Fecha limite</Label>
                <p className="text-xs text-muted-foreground">Recordatorio antes del vencimiento</p>
              </div>
              <Switch
                checked={settings.notify_on_due_date}
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_on_due_date: v }))}
              />
            </div>

            {settings.notify_on_due_date && (
              <div className="ml-4 flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Recordar</Label>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={settings.due_date_reminder_hours}
                  onChange={(e) => setSettings(s => ({ ...s, due_date_reminder_hours: parseInt(e.target.value) || 24 }))}
                  className="w-20 h-8 text-sm"
                />
                <Label className="text-xs text-muted-foreground whitespace-nowrap">horas antes</Label>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Cambios de estado</Label>
                <p className="text-xs text-muted-foreground">Cuando cambia el estado de tus tareas</p>
              </div>
              <Switch
                checked={settings.notify_on_status_change}
                onCheckedChange={(v) => setSettings(s => ({ ...s, notify_on_status_change: v }))}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
