import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Rocket,
  Play,
  Package,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Settings,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Project,
  ProjectExecutionStage,
  PROJECT_EXECUTION_STAGE_LABELS,
  PROJECT_EXECUTION_STAGE_COLORS,
} from '@/types/database';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';

interface ProjectExecutionStageCardProps {
  project: Project;
  onUpdate: () => void;
}

const EXECUTION_STAGES: ProjectExecutionStage[] = [
  'ONBOARDING',
  'IN_PROGRESS',
  'DELIVERED',
  'ACTIVE',
  'CHURNED',
];

const STAGE_ICONS: Record<ProjectExecutionStage, React.ElementType> = {
  ONBOARDING: Rocket,
  IN_PROGRESS: Play,
  DELIVERED: Package,
  ACTIVE: CheckCircle2,
  CHURNED: XCircle,
};

const STAGE_CONFIG: Record<ProjectExecutionStage, {
  bgColor: string;
  textColor: string;
  borderColor: string;
  lightBg: string;
  description: string;
}> = {
  ONBOARDING: {
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    lightBg: 'bg-blue-50',
    description: 'Preparando kickoff y requisitos iniciales',
  },
  IN_PROGRESS: {
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    lightBg: 'bg-amber-50',
    description: 'Desarrollo activo de la implementación',
  },
  DELIVERED: {
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    lightBg: 'bg-purple-50',
    description: 'Proyecto entregado, pendiente activación',
  },
  ACTIVE: {
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    lightBg: 'bg-emerald-50',
    description: 'Cliente operativo y generando valor',
  },
  CHURNED: {
    bgColor: 'bg-red-500',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    lightBg: 'bg-red-50',
    description: 'Cliente canceló el servicio',
  },
};

export function ProjectExecutionStageCard({ project, onUpdate }: ProjectExecutionStageCardProps) {
  const [changeStageModalOpen, setChangeStageModalOpen] = useState(false);
  const [churnModalOpen, setChurnModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProjectExecutionStage>(
    project.execution_stage || 'ONBOARDING'
  );
  const [churnReason, setChurnReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStage = project.execution_stage || 'ONBOARDING';
  const currentStageIndex = EXECUTION_STAGES.indexOf(currentStage);
  const config = STAGE_CONFIG[currentStage];
  const StageIcon = STAGE_ICONS[currentStage];

  const handleChangeStage = async () => {
    if (selectedStage === 'CHURNED') {
      setChangeStageModalOpen(false);
      setChurnModalOpen(true);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          execution_stage: selectedStage,
          execution_stage_entered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;
      onUpdate();
      setChangeStageModalOpen(false);
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error al actualizar la etapa');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChurn = async () => {
    if (!churnReason.trim()) {
      alert('Por favor ingresa la razón del churn');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          execution_stage: 'CHURNED',
          execution_stage_entered_at: new Date().toISOString(),
          churned_at: new Date().toISOString().split('T')[0],
          churn_reason: churnReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;
      onUpdate();
      setChurnModalOpen(false);
      setChurnReason('');
    } catch (error) {
      console.error('Error marking as churned:', error);
      alert('Error al marcar como churned');
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't show for non-won projects
  if (project.stage !== 'CERRADO_GANADO') {
    return null;
  }

  return (
    <>
      <Card className={cn('overflow-hidden', config.lightBg)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Gestión de Estado
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChangeStageModalOpen(true)}
              disabled={currentStage === 'CHURNED'}
              className={cn(
                currentStage !== 'CHURNED' && 'hover:bg-primary hover:text-primary-foreground'
              )}
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1" />
              Avanzar Estado
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Stage Display */}
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center shadow-sm',
              config.bgColor,
              'text-white'
            )}>
              <StageIcon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <Badge className={cn('text-sm px-3 py-1 mb-1', PROJECT_EXECUTION_STAGE_COLORS[currentStage])}>
                {PROJECT_EXECUTION_STAGE_LABELS[currentStage]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
              {project.execution_stage_entered_at && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  En esta etapa desde {formatDateToBogota(project.execution_stage_entered_at, 'dd MMM yyyy')}
                  <span className="text-muted-foreground/70">
                    ({formatDistanceToBogota(project.execution_stage_entered_at)})
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Churn info if churned */}
          {currentStage === 'CHURNED' && project.churned_at && (
            <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Churn registrado el {formatDateToBogota(project.churned_at, 'dd MMM yyyy')}
                  </p>
                  {project.churn_reason && (
                    <p className="text-sm text-red-700 mt-1">{project.churn_reason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stage Progress Pipeline */}
          {currentStage !== 'CHURNED' && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-3">Progreso del proyecto</p>
              <div className="flex items-center justify-between">
                {EXECUTION_STAGES.filter(s => s !== 'CHURNED').map((stage, index) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = stage === currentStage;
                  const isPending = index > currentStageIndex;
                  const stageConfig = STAGE_CONFIG[stage];
                  const Icon = STAGE_ICONS[stage];

                  return (
                    <div key={stage} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm',
                            isCompleted && 'bg-emerald-500 text-white',
                            isCurrent && cn(stageConfig.bgColor, 'text-white ring-2 ring-offset-2', stageConfig.borderColor.replace('border-', 'ring-')),
                            isPending && 'bg-slate-100 text-slate-400'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <span className={cn(
                          'text-[10px] mt-1 text-center max-w-[60px]',
                          isCurrent ? stageConfig.textColor + ' font-medium' : 'text-muted-foreground'
                        )}>
                          {PROJECT_EXECUTION_STAGE_LABELS[stage]}
                        </span>
                      </div>
                      {index < EXECUTION_STAGES.filter(s => s !== 'CHURNED').length - 1 && (
                        <div className={cn(
                          'flex-1 h-1 mx-2 rounded-full',
                          index < currentStageIndex ? 'bg-emerald-500' : 'bg-slate-200'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Stage Modal */}
      <Dialog open={changeStageModalOpen} onOpenChange={setChangeStageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Proyecto</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo estado del proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo Estado</Label>
              <Select
                value={selectedStage}
                onValueChange={(value: ProjectExecutionStage) => setSelectedStage(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXECUTION_STAGES.map((stage) => {
                    const Icon = STAGE_ICONS[stage];
                    return (
                      <SelectItem key={stage} value={stage}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {PROJECT_EXECUTION_STAGE_LABELS[stage]}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className={cn('p-3 rounded-lg', STAGE_CONFIG[selectedStage].lightBg)}>
              <p className="text-sm text-muted-foreground">
                {STAGE_CONFIG[selectedStage].description}
              </p>
            </div>

            {selectedStage === 'CHURNED' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  Al seleccionar "Churned" se te pedirá ingresar la razón del churn.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setChangeStageModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeStage} disabled={isUpdating || selectedStage === currentStage}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : selectedStage === 'CHURNED' ? (
                'Continuar'
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Churn Modal */}
      <Dialog open={churnModalOpen} onOpenChange={setChurnModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Registrar Churn
            </DialogTitle>
            <DialogDescription>
              Por favor indica la razón por la cual el cliente canceló el servicio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="churnReason">Razón del Churn *</Label>
              <Textarea
                id="churnReason"
                value={churnReason}
                onChange={(e) => setChurnReason(e.target.value)}
                placeholder="Ej: No logró suficiente volumen de ventas, cambió a la competencia, problemas de presupuesto..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setChurnModalOpen(false);
              setChurnReason('');
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleChurn}
              disabled={isUpdating || !churnReason.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirmar Churn
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
