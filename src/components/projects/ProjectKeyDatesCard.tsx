import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Rocket,
  Target,
  CheckCircle2,
  Edit,
  AlertTriangle,
  Clock,
  Loader2,
  Timer,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToBogota } from '@/lib/date-utils';
import { toast } from '@/hooks/use-toast';

interface ProjectKeyDatesCardProps {
  projectId: string;
  kickoffDate?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  onUpdate: () => void;
}

export function ProjectKeyDatesCard({
  projectId,
  kickoffDate,
  estimatedDeliveryDate,
  actualDeliveryDate,
  onUpdate,
}: ProjectKeyDatesCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    kickoff_date: kickoffDate || '',
    estimated_delivery_date: estimatedDeliveryDate || '',
    actual_delivery_date: actualDeliveryDate || '',
  });

  const handleOpenEdit = () => {
    setFormData({
      kickoff_date: kickoffDate || '',
      estimated_delivery_date: estimatedDeliveryDate || '',
      actual_delivery_date: actualDeliveryDate || '',
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          kickoff_date: formData.kickoff_date || null,
          estimated_delivery_date: formData.estimated_delivery_date || null,
          actual_delivery_date: formData.actual_delivery_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Fechas actualizadas',
        description: 'Las fechas del proyecto han sido guardadas',
      });

      setEditModalOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating dates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar las fechas',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate days remaining/overdue for estimated delivery
  const getDeliveryStatus = () => {
    if (!estimatedDeliveryDate) return null;
    if (actualDeliveryDate) return { type: 'delivered', text: 'Entregado', days: 0 };

    const estimated = new Date(estimatedDeliveryDate);
    const now = new Date();
    const diffDays = Math.ceil((estimated.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { type: 'overdue', days: Math.abs(diffDays), text: `${Math.abs(diffDays)} días de retraso` };
    }
    if (diffDays === 0) return { type: 'today', days: 0, text: 'Entrega hoy' };
    if (diffDays <= 7) return { type: 'urgent', days: diffDays, text: `${diffDays} días restantes` };
    if (diffDays <= 14) return { type: 'soon', days: diffDays, text: `${diffDays} días restantes` };
    return { type: 'normal', days: diffDays, text: `${diffDays} días restantes` };
  };

  const deliveryStatus = getDeliveryStatus();

  // Calculate project duration
  const getProjectDuration = () => {
    if (!kickoffDate) return null;
    const start = new Date(kickoffDate);
    const end = actualDeliveryDate ? new Date(actualDeliveryDate) : new Date();
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const projectDuration = getProjectDuration();

  // Calculate progress percentage based on time
  const getTimeProgress = () => {
    if (!kickoffDate || !estimatedDeliveryDate) return null;
    if (actualDeliveryDate) return 100;

    const start = new Date(kickoffDate);
    const estimated = new Date(estimatedDeliveryDate);
    const now = new Date();

    const totalDuration = estimated.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    if (totalDuration <= 0) return 100;
    const percentage = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
    return Math.max(percentage, 0);
  };

  const timeProgress = getTimeProgress();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Fechas Clave
            </div>
            <Button size="sm" variant="outline" onClick={handleOpenEdit}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timeline Visual */}
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="absolute top-[22px] left-[18px] right-[18px] h-1 bg-slate-200 rounded-full" />

            {/* Progress Bar Fill */}
            {timeProgress !== null && (
              <div
                className={cn(
                  'absolute top-[22px] left-[18px] h-1 rounded-full transition-all duration-300',
                  timeProgress >= 100
                    ? actualDeliveryDate
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                    : timeProgress >= 75
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                )}
                style={{ width: `calc(${Math.min(timeProgress, 100)}% - 36px)` }}
              />
            )}

            <div className="flex justify-between items-start relative">
              {/* Kickoff */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center z-10',
                  kickoffDate
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300'
                )}>
                  <Rocket className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium mt-2">Kickoff</p>
                {kickoffDate ? (
                  <p className="text-[10px] text-muted-foreground">
                    {formatDateToBogota(kickoffDate, 'dd MMM')}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No definido</p>
                )}
              </div>

              {/* Estimated Delivery */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center z-10',
                  actualDeliveryDate
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : deliveryStatus?.type === 'overdue'
                    ? 'bg-red-500 text-white shadow-lg animate-pulse'
                    : deliveryStatus?.type === 'urgent' || deliveryStatus?.type === 'today'
                    ? 'bg-amber-500 text-white shadow-lg'
                    : estimatedDeliveryDate
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300'
                )}>
                  {actualDeliveryDate ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Target className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs font-medium mt-2">
                  {actualDeliveryDate ? 'Entregado' : 'Meta'}
                </p>
                {estimatedDeliveryDate ? (
                  <p className={cn(
                    'text-[10px]',
                    deliveryStatus?.type === 'overdue' ? 'text-red-600 font-medium' :
                    deliveryStatus?.type === 'urgent' ? 'text-amber-600 font-medium' :
                    'text-muted-foreground'
                  )}>
                    {formatDateToBogota(estimatedDeliveryDate, 'dd MMM')}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No definido</p>
                )}
              </div>

              {/* Actual Delivery */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center z-10',
                  actualDeliveryDate
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300'
                )}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium mt-2">Entrega</p>
                {actualDeliveryDate ? (
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {formatDateToBogota(actualDeliveryDate, 'dd MMM')}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">Pendiente</p>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge & Duration */}
          <div className="pt-3 border-t flex items-center justify-between gap-4">
            {/* Status */}
            {deliveryStatus && (
              <div className="flex-1">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-3 py-1',
                    deliveryStatus.type === 'delivered' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    deliveryStatus.type === 'overdue' && 'bg-red-100 text-red-700 border-red-200',
                    deliveryStatus.type === 'urgent' && 'bg-amber-100 text-amber-700 border-amber-200',
                    deliveryStatus.type === 'today' && 'bg-amber-100 text-amber-700 border-amber-200',
                    deliveryStatus.type === 'soon' && 'bg-blue-100 text-blue-700 border-blue-200',
                    deliveryStatus.type === 'normal' && 'bg-slate-100 text-slate-700 border-slate-200'
                  )}
                >
                  {deliveryStatus.type === 'delivered' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {deliveryStatus.type === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {(deliveryStatus.type === 'urgent' || deliveryStatus.type === 'today') && <Clock className="h-3 w-3 mr-1" />}
                  {deliveryStatus.text}
                </Badge>
              </div>
            )}

            {/* Duration */}
            {projectDuration !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{projectDuration} días</span>
                {!actualDeliveryDate && (
                  <span className="text-xs text-muted-foreground">(en curso)</span>
                )}
              </div>
            )}
          </div>

          {/* Time Progress Bar */}
          {timeProgress !== null && !actualDeliveryDate && kickoffDate && estimatedDeliveryDate && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tiempo transcurrido</span>
                <span className={cn(
                  'font-medium',
                  timeProgress >= 100 ? 'text-red-600' :
                  timeProgress >= 75 ? 'text-amber-600' :
                  'text-blue-600'
                )}>
                  {timeProgress}%
                </span>
              </div>
              <Progress
                value={timeProgress}
                className={cn(
                  'h-2',
                  timeProgress >= 100 && '[&>div]:bg-red-500',
                  timeProgress >= 75 && timeProgress < 100 && '[&>div]:bg-amber-500'
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Fechas Clave</DialogTitle>
            <DialogDescription>
              Define las fechas importantes del proyecto para seguimiento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kickoff_date" className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-600" />
                Fecha de Kickoff
              </Label>
              <Input
                id="kickoff_date"
                type="date"
                value={formData.kickoff_date}
                onChange={(e) => setFormData({ ...formData, kickoff_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Fecha de inicio del proyecto con el cliente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_delivery_date" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                Entrega Estimada
              </Label>
              <Input
                id="estimated_delivery_date"
                type="date"
                value={formData.estimated_delivery_date}
                onChange={(e) => setFormData({ ...formData, estimated_delivery_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Fecha comprometida de entrega
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_delivery_date" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Entrega Real
              </Label>
              <Input
                id="actual_delivery_date"
                type="date"
                value={formData.actual_delivery_date}
                onChange={(e) => setFormData({ ...formData, actual_delivery_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Fecha en que se entregó el proyecto
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
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
    </>
  );
}
