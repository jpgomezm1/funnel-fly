import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckSquare,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  GripVertical,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectChecklist } from '@/hooks/useProjectChecklist';
import {
  ProjectChecklistItem,
  ChecklistCategory,
  CHECKLIST_CATEGORY_LABELS,
  CHECKLIST_CATEGORY_COLORS,
  CHECKLIST_CATEGORY_ORDER,
} from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';

interface ProjectChecklistCardProps {
  projectId: string;
}

export function ProjectChecklistCard({ projectId }: ProjectChecklistCardProps) {
  const {
    items,
    isLoading,
    createItem,
    updateItem,
    toggleCompleted,
    deleteItem,
    getProgress,
    getWeightedProgress,
    getProgressByCategory,
    getItemsByCategory,
    isCreating,
  } = useProjectChecklist({ projectId });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProjectChecklistItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<ChecklistCategory>>(
    new Set(CHECKLIST_CATEGORY_ORDER)
  );
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    notes: '',
    category: 'general' as ChecklistCategory,
    is_required: true,
    weight: 1,
  });

  const progress = getProgress();
  const weightedProgress = getWeightedProgress();
  const progressByCategory = getProgressByCategory();
  const itemsByCategory = getItemsByCategory();

  const toggleCategory = (category: ChecklistCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      notes: '',
      category: 'general' as ChecklistCategory,
      is_required: true,
      weight: 1,
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const handleOpenEdit = (item: ProjectChecklistItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      due_date: item.due_date || '',
      notes: item.notes || '',
      category: item.category || 'general',
      is_required: item.is_required ?? true,
      weight: item.weight || 1,
    });
    setEditModalOpen(true);
  };

  const handleOpenAddForCategory = (category: ChecklistCategory) => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      notes: '',
      category,
      is_required: true,
      weight: 1,
    });
    setAddModalOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    try {
      await createItem({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        due_date: formData.due_date || undefined,
        notes: formData.notes.trim() || undefined,
        category: formData.category,
        is_required: formData.is_required,
        weight: formData.weight,
      });
      setAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Error al crear el item');
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !formData.title.trim()) return;

    try {
      await updateItem({
        itemId: selectedItem.id,
        updates: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          due_date: formData.due_date || undefined,
          notes: formData.notes.trim() || undefined,
          category: formData.category,
          is_required: formData.is_required,
          weight: formData.weight,
        },
      });
      setEditModalOpen(false);
      setSelectedItem(null);
      resetForm();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error al actualizar el item');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al eliminar el item');
    }
  };

  const handleToggle = async (item: ProjectChecklistItem) => {
    try {
      await toggleCompleted({
        itemId: item.id,
        completed: !item.completed_at,
      });
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const isOverdue = (item: ProjectChecklistItem) => {
    if (!item.due_date || item.completed_at) return false;
    return new Date(item.due_date) < new Date();
  };

  const isDueSoon = (item: ProjectChecklistItem) => {
    if (!item.due_date || item.completed_at) return false;
    const dueDate = new Date(item.due_date);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= threeDaysFromNow;
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

  // Render a single checklist item
  const renderChecklistItem = (item: ProjectChecklistItem) => (
    <div
      key={item.id}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        item.completed_at
          ? 'bg-muted/30 border-muted'
          : isOverdue(item)
          ? 'bg-red-50 border-red-200'
          : isDueSoon(item)
          ? 'bg-amber-50 border-amber-200'
          : 'hover:bg-muted/50'
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={!!item.completed_at}
          onCheckedChange={() => handleToggle(item)}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'font-medium text-sm',
                  item.completed_at && 'line-through text-muted-foreground'
                )}
              >
                {item.title}
              </p>
              {item.is_required && (
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              )}
              {(item.weight || 1) > 1 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  x{item.weight}
                </Badge>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
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
              <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(item.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs">
          {item.due_date && (
            <span
              className={cn(
                'flex items-center gap-1',
                item.completed_at
                  ? 'text-muted-foreground'
                  : isOverdue(item)
                  ? 'text-red-600 font-medium'
                  : isDueSoon(item)
                  ? 'text-amber-600 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {isOverdue(item) && !item.completed_at && (
                <AlertCircle className="h-3 w-3" />
              )}
              <Calendar className="h-3 w-3" />
              {formatDateToBogota(item.due_date, 'dd/MM/yyyy')}
            </span>
          )}
          {item.completed_at && (
            <span className="text-emerald-600">
              Completado {formatDateToBogota(item.completed_at, 'dd/MM')}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              Checklist de Implementación
            </div>
            <Button size="sm" variant="outline" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar - Weighted */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso Ponderado</span>
                <span className="font-medium">
                  {weightedProgress.percentage}%
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({progress.completed}/{progress.total} tareas)
                  </span>
                </span>
              </div>
              <Progress value={weightedProgress.percentage} className="h-2" />
            </div>
          )}

          {/* Checklist items by category */}
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hay items en el checklist</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={handleOpenAdd}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar primer item
                </Button>
              </div>
            ) : (
              CHECKLIST_CATEGORY_ORDER.map((category) => {
                const categoryItems = itemsByCategory[category] || [];
                if (categoryItems.length === 0) return null;

                const catProgress = progressByCategory[category];
                const isExpanded = expandedCategories.has(category);

                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Badge
                              variant="outline"
                              className={cn('text-xs', CHECKLIST_CATEGORY_COLORS[category])}
                            >
                              {CHECKLIST_CATEGORY_LABELS[category]}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {catProgress.completed}/{catProgress.total}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={catProgress.percentage} className="w-20 h-1.5" />
                            <span className="text-xs text-muted-foreground w-8">
                              {catProgress.percentage}%
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddForCategory(category);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="p-3 pt-0 space-y-2">
                          {categoryItems.map(renderChecklistItem)}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Item al Checklist</DialogTitle>
            <DialogDescription>
              Agrega una nueva tarea o hito al checklist del proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ChecklistCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECKLIST_CATEGORY_ORDER.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              CHECKLIST_CATEGORY_COLORS[cat].replace('text-', 'bg-').split(' ')[0]
                            )}
                          />
                          {CHECKLIST_CATEGORY_LABELS[cat]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso</Label>
                <Select
                  value={formData.weight.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, weight: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Normal (x1)</SelectItem>
                    <SelectItem value="2">Importante (x2)</SelectItem>
                    <SelectItem value="3">Crítico (x3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Kickoff con cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha límite</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Opciones</Label>
                <div className="flex items-center gap-2 h-9 px-3 border rounded-md">
                  <Checkbox
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_required: !!checked })
                    }
                  />
                  <Label htmlFor="is_required" className="text-sm font-normal cursor-pointer">
                    Requerido
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                className="min-h-[60px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !formData.title.trim()}>
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
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Modifica los detalles del item del checklist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ChecklistCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECKLIST_CATEGORY_ORDER.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              CHECKLIST_CATEGORY_COLORS[cat].replace('text-', 'bg-').split(' ')[0]
                            )}
                          />
                          {CHECKLIST_CATEGORY_LABELS[cat]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-weight">Peso</Label>
                <Select
                  value={formData.weight.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, weight: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Normal (x1)</SelectItem>
                    <SelectItem value="2">Importante (x2)</SelectItem>
                    <SelectItem value="3">Crítico (x3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Kickoff con cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due_date">Fecha límite</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Opciones</Label>
                <div className="flex items-center gap-2 h-9 px-3 border rounded-md">
                  <Checkbox
                    id="edit-is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_required: !!checked })
                    }
                  />
                  <Label htmlFor="edit-is_required" className="text-sm font-normal cursor-pointer">
                    Requerido
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                className="min-h-[60px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.title.trim()}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
