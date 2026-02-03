import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquarePlus,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  MoreVertical,
  Trash2,
  ThumbsUp,
  Loader2,
  Lightbulb,
  Bug,
  Sparkles,
  HelpCircle,
  User,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useERPFeedback } from '@/hooks/useERPFeedback';
import { useUserRole } from '@/hooks/useUserRole';
import {
  ERPFeedbackCategory,
  ERPFeedbackPriority,
  ERPFeedbackStatus,
  ERP_FEEDBACK_CATEGORY_LABELS,
  ERP_FEEDBACK_CATEGORY_COLORS,
  ERP_FEEDBACK_PRIORITY_LABELS,
  ERP_FEEDBACK_PRIORITY_COLORS,
  ERP_FEEDBACK_STATUS_LABELS,
  ERP_FEEDBACK_STATUS_COLORS,
} from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const CATEGORY_ICONS: Record<ERPFeedbackCategory, React.ElementType> = {
  feature: Lightbulb,
  bug: Bug,
  improvement: Sparkles,
  question: HelpCircle,
};

const STATUS_ICONS: Record<ERPFeedbackStatus, React.ElementType> = {
  pending: Clock,
  in_progress: PlayCircle,
  completed: CheckCircle2,
  rejected: XCircle,
};

export default function ERPFeedback() {
  const {
    feedbackItems,
    stats,
    isLoading,
    createFeedback,
    updateStatus,
    vote,
    deleteFeedback,
    isCreating,
  } = useERPFeedback();

  const { displayName, userId, role } = useUserRole();
  const isSuperAdmin = role === 'superadmin';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ERPFeedbackStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<ERPFeedbackCategory | 'ALL'>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'improvement' as ERPFeedbackCategory,
    priority: 'medium' as ERPFeedbackPriority,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'improvement',
      priority: 'medium',
    });
  };

  const filteredItems = feedbackItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'El título es requerido', variant: 'destructive' });
      return;
    }

    try {
      await createFeedback({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        priority: formData.priority,
        created_by: userId || 'unknown',
        created_by_name: displayName || 'Usuario',
      });
      toast({ title: 'Feedback creado', description: 'Tu feedback ha sido registrado' });
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating feedback:', error);
      toast({ title: 'Error', description: 'No se pudo crear el feedback', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, status: ERPFeedbackStatus) => {
    try {
      await updateStatus({
        id,
        status,
        completed_by: status === 'completed' ? displayName || undefined : undefined,
      });
      toast({ title: 'Estado actualizado', description: `Feedback marcado como ${ERP_FEEDBACK_STATUS_LABELS[status]}` });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  const handleVote = async (id: string) => {
    try {
      await vote(id);
      toast({ title: 'Voto registrado', description: 'Tu voto ha sido contado' });
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: 'Error', description: 'No se pudo registrar tu voto', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este feedback?')) return;

    try {
      await deleteFeedback(id);
      toast({ title: 'Feedback eliminado', description: 'El feedback ha sido eliminado' });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el feedback', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquarePlus className="h-6 w-6 text-primary" />
            Feedback
          </h1>
          <p className="text-muted-foreground">
            Sugiere mejoras, reporta bugs o haz preguntas sobre el sistema
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Feedback
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-slate-700">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <PlayCircle className="h-4 w-4" />
              <span className="text-xs font-medium">En Progreso</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Completados</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Rechazados</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ERPFeedbackStatus | 'ALL')}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ERPFeedbackCategory | 'ALL')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las categorías</SelectItem>
            <SelectItem value="feature">Nueva Funcionalidad</SelectItem>
            <SelectItem value="bug">Bug / Error</SelectItem>
            <SelectItem value="improvement">Mejora</SelectItem>
            <SelectItem value="question">Pregunta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquarePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay feedback</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No se encontró feedback con los filtros aplicados'
              : 'Sé el primero en sugerir una mejora'}
          </p>
          {!search && statusFilter === 'ALL' && categoryFilter === 'ALL' && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Feedback
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const CategoryIcon = CATEGORY_ICONS[item.category];
            const StatusIcon = STATUS_ICONS[item.status];

            return (
              <Card key={item.id} className={cn(
                "transition-all hover:shadow-sm",
                item.status === 'completed' && "opacity-75",
                item.status === 'rejected' && "opacity-60"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Vote button */}
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleVote(item.id)}
                        disabled={item.status === 'completed' || item.status === 'rejected'}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium text-muted-foreground">{item.votes}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={cn(
                              "font-semibold",
                              item.status === 'completed' && "line-through text-muted-foreground"
                            )}>
                              {item.title}
                            </h3>
                            <Badge className={cn("text-xs", ERP_FEEDBACK_CATEGORY_COLORS[item.category])}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {ERP_FEEDBACK_CATEGORY_LABELS[item.category]}
                            </Badge>
                            <Badge className={cn("text-xs", ERP_FEEDBACK_PRIORITY_COLORS[item.priority])}>
                              {ERP_FEEDBACK_PRIORITY_LABELS[item.priority]}
                            </Badge>
                            <Badge className={cn("text-xs", ERP_FEEDBACK_STATUS_COLORS[item.status])}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {ERP_FEEDBACK_STATUS_LABELS[item.status]}
                            </Badge>
                          </div>

                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.created_by_name || 'Usuario'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.created_at).toLocaleDateString('es-CO')}
                            </span>
                            {item.completed_at && item.completed_by && (
                              <span className="text-emerald-600">
                                Completado por {item.completed_by}
                              </span>
                            )}
                            {item.rejected_reason && (
                              <span className="text-red-600">
                                Rechazado: {item.rejected_reason}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions (only for superadmin or creator) */}
                        {(isSuperAdmin || item.created_by === userId) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isSuperAdmin && item.status !== 'completed' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(item.id, 'pending')}
                                  >
                                    <Clock className="h-4 w-4 mr-2 text-slate-600" />
                                    Pendiente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(item.id, 'in_progress')}
                                  >
                                    <PlayCircle className="h-4 w-4 mr-2 text-amber-600" />
                                    En Progreso
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(item.id, 'completed')}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                                    Completado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(item.id, 'rejected')}
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                    Rechazado
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={(open) => {
        setCreateModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Feedback</DialogTitle>
            <DialogDescription>
              Comparte tu sugerencia, reporta un bug o haz una pregunta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Agregar filtro por fecha en reportes"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as ERPFeedbackCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Nueva Funcionalidad
                      </div>
                    </SelectItem>
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4" />
                        Bug / Error
                      </div>
                    </SelectItem>
                    <SelectItem value="improvement">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Mejora
                      </div>
                    </SelectItem>
                    <SelectItem value="question">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Pregunta
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as ERPFeedbackPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe en detalle tu sugerencia, el bug encontrado o tu pregunta..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Feedback'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
