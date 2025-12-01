import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Flag,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectMilestones } from '@/hooks/useProjectMilestones';
import { ProjectMilestone } from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';

interface ProjectMilestonesCardProps {
  projectId: string;
}

export function ProjectMilestonesCard({ projectId }: ProjectMilestonesCardProps) {
  const {
    milestones,
    isLoading,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    isCreating,
  } = useProjectMilestones({ projectId });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    expected_date: '',
    actual_date: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({ name: '', expected_date: '', actual_date: '', notes: '' });
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const handleOpenEdit = (milestone: ProjectMilestone) => {
    setSelectedMilestone(milestone);
    setFormData({
      name: milestone.name,
      expected_date: milestone.expected_date || '',
      actual_date: milestone.actual_date || '',
      notes: milestone.notes || '',
    });
    setEditModalOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    try {
      await createMilestone({
        name: formData.name.trim(),
        expected_date: formData.expected_date || undefined,
        actual_date: formData.actual_date || undefined,
        notes: formData.notes.trim() || undefined,
      });
      setAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Error al crear el hito');
    }
  };

  const handleUpdate = async () => {
    if (!selectedMilestone || !formData.name.trim()) return;

    try {
      await updateMilestone({
        milestoneId: selectedMilestone.id,
        updates: {
          name: formData.name.trim(),
          expected_date: formData.expected_date || undefined,
          actual_date: formData.actual_date || undefined,
          notes: formData.notes.trim() || undefined,
        },
      });
      setEditModalOpen(false);
      setSelectedMilestone(null);
      resetForm();
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Error al actualizar el hito');
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('¿Estás seguro de eliminar este hito?')) return;

    try {
      await deleteMilestone(milestoneId);
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Error al eliminar el hito');
    }
  };

  const handleMarkComplete = async (milestone: ProjectMilestone) => {
    try {
      await updateMilestone({
        milestoneId: milestone.id,
        updates: {
          actual_date: new Date().toISOString().split('T')[0],
        },
      });
    } catch (error) {
      console.error('Error marking milestone as complete:', error);
    }
  };

  const getMilestoneStatus = (milestone: ProjectMilestone) => {
    if (milestone.actual_date) {
      return 'completed';
    }
    if (milestone.expected_date) {
      const expected = new Date(milestone.expected_date);
      const now = new Date();
      if (expected < now) {
        return 'overdue';
      }
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (expected <= threeDaysFromNow) {
        return 'upcoming';
      }
    }
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Próximo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  // Calculate progress
  const completedCount = milestones.filter(m => m.actual_date).length;
  const totalCount = milestones.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              Hitos del Proyecto
              {milestones.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalCount}
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay hitos definidos</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={handleOpenAdd}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar primer hito
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Overview */}
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Progreso General</span>
                    <span className="text-sm font-medium">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {milestones.map((milestone, index) => {
                  const status = getMilestoneStatus(milestone);
                  return (
                    <div
                      key={milestone.id}
                      className={cn(
                        'relative pl-8 pb-6 last:pb-0',
                        index < milestones.length - 1 && 'border-l-2 border-muted ml-3'
                      )}
                    >
                      {/* Timeline node */}
                      <div
                        className={cn(
                          'absolute -left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2',
                          status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : status === 'overdue'
                            ? 'bg-red-100 border-red-500'
                            : status === 'upcoming'
                            ? 'bg-amber-100 border-amber-500'
                            : 'bg-white border-muted-foreground/30'
                        )}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Flag className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>

                      <div
                        className={cn(
                          'ml-4 p-3 rounded-lg border transition-colors',
                          status === 'completed'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : status === 'overdue'
                            ? 'bg-red-50/50 border-red-200'
                            : status === 'upcoming'
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={cn(
                                  'font-medium text-sm',
                                  status === 'completed' && 'text-emerald-700'
                                )}
                              >
                                {milestone.name}
                              </h4>
                              {getStatusBadge(status)}
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {milestone.expected_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Esperado: {formatDateToBogota(milestone.expected_date, 'dd/MM/yyyy')}
                                </span>
                              )}
                              {milestone.actual_date && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completado: {formatDateToBogota(milestone.actual_date, 'dd/MM/yyyy')}
                                </span>
                              )}
                            </div>

                            {milestone.notes && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {milestone.notes}
                              </p>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!milestone.actual_date && (
                                <DropdownMenuItem onClick={() => handleMarkComplete(milestone)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Marcar Completado
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleOpenEdit(milestone)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(milestone.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Hito</DialogTitle>
            <DialogDescription>
              Define un hito importante del proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Entrega de primera versión"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_date">Fecha Esperada</Label>
              <Input
                id="expected_date"
                type="date"
                value={formData.expected_date}
                onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_date">Fecha Real (si ya se completó)</Label>
              <Input
                id="actual_date"
                type="date"
                value={formData.actual_date}
                onChange={(e) => setFormData({ ...formData, actual_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre este hito..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !formData.name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Agregar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Hito</DialogTitle>
            <DialogDescription>
              Modifica los detalles del hito.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Entrega de primera versión"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expected_date">Fecha Esperada</Label>
              <Input
                id="edit-expected_date"
                type="date"
                value={formData.expected_date}
                onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-actual_date">Fecha Real</Label>
              <Input
                id="edit-actual_date"
                type="date"
                value={formData.actual_date}
                onChange={(e) => setFormData({ ...formData, actual_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre este hito..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name.trim()}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
