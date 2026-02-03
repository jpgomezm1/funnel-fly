import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Package,
  Loader2,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectDependencies } from '@/hooks/useProjectDependencies';
import { useProjectRepositories } from '@/hooks/useProjectRepositories';
import { ProjectDependency, DEPENDENCY_TYPE_LABELS } from '@/types/database';
import { toast } from '@/hooks/use-toast';

const DEP_TYPE_COLORS: Record<ProjectDependency['dependency_type'], string> = {
  NPM: 'bg-red-100 text-red-700',
  PIP: 'bg-blue-100 text-blue-700',
  COMPOSER: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-slate-100 text-slate-700',
};

interface TechProjectDependenciesTabProps {
  projectId: string;
}

export function TechProjectDependenciesTab({ projectId }: TechProjectDependenciesTabProps) {
  const {
    dependencies,
    isLoading,
    createDependency,
    updateDependency,
    deleteDependency,
    isCreating,
  } = useProjectDependencies(projectId);

  const { repositories } = useProjectRepositories(projectId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDep, setEditingDep] = useState<ProjectDependency | null>(null);
  const [filterType, setFilterType] = useState<ProjectDependency['dependency_type'] | 'ALL'>('ALL');
  const [formData, setFormData] = useState({
    dependency_type: 'NPM' as ProjectDependency['dependency_type'],
    name: '',
    version: '',
    is_dev_dependency: false,
    repository_id: '',
    notes: '',
  });

  const filteredDeps = filterType === 'ALL'
    ? dependencies
    : dependencies.filter(d => d.dependency_type === filterType);

  const resetForm = () => {
    setFormData({
      dependency_type: 'NPM',
      name: '',
      version: '',
      is_dev_dependency: false,
      repository_id: '',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingDep(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (dep: ProjectDependency) => {
    setFormData({
      dependency_type: dep.dependency_type,
      name: dep.name,
      version: dep.version || '',
      is_dev_dependency: dep.is_dev_dependency,
      repository_id: dep.repository_id || '',
      notes: dep.notes || '',
    });
    setEditingDep(dep);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    try {
      const depData = {
        dependency_type: formData.dependency_type,
        name: formData.name.trim(),
        version: formData.version.trim() || undefined,
        is_dev_dependency: formData.is_dev_dependency,
        repository_id: formData.repository_id || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingDep) {
        await updateDependency({ depId: editingDep.id, updates: depData });
        toast({ title: 'Dependencia actualizada' });
      } else {
        await createDependency({ ...depData, project_id: projectId });
        toast({ title: 'Dependencia creada' });
      }

      setModalOpen(false);
      resetForm();
      setEditingDep(null);
    } catch (error) {
      console.error('Error saving dependency:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la dependencia', variant: 'destructive' });
    }
  };

  const handleDelete = async (depId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dependencia?')) return;
    try {
      await deleteDependency(depId);
      toast({ title: 'Dependencia eliminada' });
    } catch (error) {
      console.error('Error deleting dependency:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la dependencia', variant: 'destructive' });
    }
  };

  const typeFilters: { value: ProjectDependency['dependency_type'] | 'ALL'; label: string }[] = [
    { value: 'ALL', label: `Todos (${dependencies.length})` },
    { value: 'NPM', label: `NPM (${dependencies.filter(d => d.dependency_type === 'NPM').length})` },
    { value: 'PIP', label: `PIP (${dependencies.filter(d => d.dependency_type === 'PIP').length})` },
    { value: 'COMPOSER', label: `Composer (${dependencies.filter(d => d.dependency_type === 'COMPOSER').length})` },
    { value: 'OTHER', label: `Otro (${dependencies.filter(d => d.dependency_type === 'OTHER').length})` },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Dependencias</h2>
          <p className="text-sm text-muted-foreground">
            {dependencies.length} dependencias registradas
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Dependencia
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {typeFilters.map(f => (
          <Button
            key={f.value}
            variant={filterType === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Dependencies List */}
      {filteredDeps.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin dependencias</h3>
          <p className="text-muted-foreground mb-4">
            Registra las dependencias del proyecto
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Dependencia
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDeps.map((dep: any) => (
            <Card key={dep.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className="font-medium text-sm">{dep.name}</span>
                    {dep.version && (
                      <Badge variant="outline" className="text-xs font-mono">{dep.version}</Badge>
                    )}
                    <Badge className={cn("text-xs", DEP_TYPE_COLORS[dep.dependency_type])}>
                      {DEPENDENCY_TYPE_LABELS[dep.dependency_type]}
                    </Badge>
                    <Badge variant={dep.is_dev_dependency ? 'secondary' : 'default'} className="text-xs">
                      {dep.is_dev_dependency ? 'Dev' : 'Prod'}
                    </Badge>
                    {dep.project_repositories?.name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {dep.project_repositories.name}
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(dep)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(dep.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDep ? 'Editar Dependencia' : 'Nueva Dependencia'}</DialogTitle>
            <DialogDescription>
              {editingDep ? 'Modifica los detalles de la dependencia' : 'Agrega una nueva dependencia al proyecto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.dependency_type}
                  onValueChange={(v) => setFormData({ ...formData, dependency_type: v as ProjectDependency['dependency_type'] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPENDENCY_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="react, django, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Versión</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="^18.2.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Repositorio</Label>
                <Select
                  value={formData.repository_id || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, repository_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin repositorio</SelectItem>
                    {repositories.map(repo => (
                      <SelectItem key={repo.id} value={repo.id}>{repo.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_dev"
                checked={formData.is_dev_dependency}
                onCheckedChange={(checked) => setFormData({ ...formData, is_dev_dependency: checked === true })}
              />
              <Label htmlFor="is_dev">Dependencia de desarrollo (devDependency)</Label>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales"
                className="min-h-[60px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isCreating}>
              {isCreating ? (
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
