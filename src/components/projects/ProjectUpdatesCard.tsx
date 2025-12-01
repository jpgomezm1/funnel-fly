import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Plus,
  MoreVertical,
  Trash2,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  StickyNote,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import {
  ProjectUpdateType,
  PROJECT_UPDATE_TYPE_LABELS,
  PROJECT_UPDATE_TYPE_COLORS,
} from '@/types/database';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';

interface ProjectUpdatesCardProps {
  projectId: string;
}

const UPDATE_TYPE_ICONS: Record<ProjectUpdateType, React.ReactNode> = {
  progress: <TrendingUp className="h-4 w-4" />,
  blocker: <AlertTriangle className="h-4 w-4" />,
  decision: <Lightbulb className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
};

export function ProjectUpdatesCard({ projectId }: ProjectUpdatesCardProps) {
  const {
    updates,
    isLoading,
    createUpdate,
    deleteUpdate,
    resolveBlocker,
    getStats,
    isCreating,
    isResolving,
  } = useProjectUpdates({ projectId });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateType, setUpdateType] = useState<ProjectUpdateType>('progress');
  const [content, setContent] = useState('');

  const stats = getStats();

  const handleCreate = async () => {
    if (!content.trim()) return;

    try {
      await createUpdate({
        update_type: updateType,
        content: content.trim(),
      });
      setAddModalOpen(false);
      setContent('');
      setUpdateType('progress');
    } catch (error) {
      console.error('Error creating update:', error);
      alert('Error al crear el update');
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!confirm('¿Estás seguro de eliminar este update?')) return;

    try {
      await deleteUpdate(updateId);
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Error al eliminar el update');
    }
  };

  const handleToggleResolve = async (updateId: string, currentlyResolved: boolean) => {
    try {
      await resolveBlocker({ updateId, resolved: !currentlyResolved });
    } catch (error) {
      console.error('Error toggling blocker resolution:', error);
      alert('Error al actualizar el bloqueo');
    }
  };

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
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Updates del Proyecto
              {updates.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {updates.length}
                </Badge>
              )}
              {stats.activeBlockers > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.activeBlockers} Bloqueo{stats.activeBlockers > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nuevo Update
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay updates registrados</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar primer update
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => {
                const isBlocker = update.update_type === 'blocker';
                const isResolved = isBlocker && update.is_resolved;

                return (
                  <div
                    key={update.id}
                    className={cn(
                      'relative pl-6 pb-4 border-l-2 last:pb-0',
                      isResolved ? 'border-emerald-200' : 'border-muted'
                    )}
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center',
                        isResolved
                          ? 'bg-emerald-100 text-emerald-600'
                          : PROJECT_UPDATE_TYPE_COLORS[update.update_type]
                      )}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>

                    <div className={cn(
                      'flex items-start justify-between gap-2 p-2 rounded-lg -ml-2',
                      isBlocker && !isResolved && 'bg-red-50 border border-red-200',
                      isResolved && 'bg-emerald-50/50'
                    )}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] border-0',
                              isResolved
                                ? 'bg-emerald-100 text-emerald-700'
                                : PROJECT_UPDATE_TYPE_COLORS[update.update_type]
                            )}
                          >
                            {isResolved ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              UPDATE_TYPE_ICONS[update.update_type]
                            )}
                            <span className="ml-1">
                              {isResolved ? 'Resuelto' : PROJECT_UPDATE_TYPE_LABELS[update.update_type]}
                            </span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToBogota(update.created_at)}
                          </span>
                          {isResolved && update.resolved_at && (
                            <span className="text-xs text-emerald-600">
                              · Resuelto {formatDistanceToBogota(update.resolved_at)}
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          'text-sm whitespace-pre-wrap',
                          isResolved && 'line-through text-muted-foreground'
                        )}>
                          {update.content}
                        </p>
                        {update.created_by && (
                          <p className="text-xs text-muted-foreground mt-1">
                            — {update.created_by}
                            {isResolved && update.resolved_by && update.resolved_by !== update.created_by && (
                              <span> · Resuelto por {update.resolved_by}</span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Resolve/Unresolve button for blockers */}
                        {isBlocker && (
                          <Button
                            variant={isResolved ? 'outline' : 'default'}
                            size="sm"
                            className={cn(
                              'h-7 text-xs',
                              isResolved
                                ? 'text-amber-600 hover:text-amber-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            )}
                            onClick={() => handleToggleResolve(update.id, !!isResolved)}
                            disabled={isResolving}
                          >
                            {isResolved ? (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Reabrir
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolver
                              </>
                            )}
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDelete(update.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Update</DialogTitle>
            <DialogDescription>
              Registra un avance, bloqueo, decisión o nota del proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Update</Label>
              <Select value={updateType} onValueChange={(v: ProjectUpdateType) => setUpdateType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Avance
                    </div>
                  </SelectItem>
                  <SelectItem value="blocker">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Bloqueo
                    </div>
                  </SelectItem>
                  <SelectItem value="decision">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      Decisión
                    </div>
                  </SelectItem>
                  <SelectItem value="note">
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-slate-600" />
                      Nota
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  updateType === 'progress'
                    ? 'Describe el avance realizado...'
                    : updateType === 'blocker'
                    ? 'Describe el bloqueo y qué se necesita...'
                    : updateType === 'decision'
                    ? 'Describe la decisión tomada...'
                    : 'Escribe tu nota...'
                }
                className="min-h-[120px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !content.trim()}>
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
    </>
  );
}
