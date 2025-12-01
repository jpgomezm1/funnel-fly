import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  GitBranch,
  ExternalLink,
  Globe,
  Server,
  Smartphone,
  Code2,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectRepositories } from '@/hooks/useProjectRepositories';
import {
  ProjectRepository,
  REPO_TYPE_LABELS,
  REPO_TYPE_COLORS,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';

const REPO_TYPE_ICONS: Record<ProjectRepository['repo_type'], React.ElementType> = {
  FRONTEND: Globe,
  BACKEND: Server,
  MOBILE: Smartphone,
  OTHER: Code2,
};

interface TechProjectRepositoriesTabProps {
  projectId: string;
}

export function TechProjectRepositoriesTab({ projectId }: TechProjectRepositoriesTabProps) {
  const {
    repositories,
    isLoading,
    createRepository,
    updateRepository,
    deleteRepository,
    isCreating,
  } = useProjectRepositories(projectId);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<ProjectRepository | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    repo_type: 'FRONTEND' as ProjectRepository['repo_type'],
    repo_url: '',
    production_url: '',
    staging_url: '',
    tech_stack: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      repo_type: 'FRONTEND',
      repo_url: '',
      production_url: '',
      staging_url: '',
      tech_stack: '',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingRepo(null);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (repo: ProjectRepository) => {
    setFormData({
      name: repo.name,
      repo_type: repo.repo_type,
      repo_url: repo.repo_url,
      production_url: repo.production_url || '',
      staging_url: repo.staging_url || '',
      tech_stack: repo.tech_stack?.join(', ') || '',
      notes: repo.notes || '',
    });
    setEditingRepo(repo);
    setCreateModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.repo_url.trim()) {
      toast({ title: 'Error', description: 'Nombre y URL del repo son requeridos', variant: 'destructive' });
      return;
    }

    try {
      const repoData = {
        name: formData.name.trim(),
        repo_type: formData.repo_type,
        repo_url: formData.repo_url.trim(),
        production_url: formData.production_url.trim() || undefined,
        staging_url: formData.staging_url.trim() || undefined,
        tech_stack: formData.tech_stack ? formData.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingRepo) {
        await updateRepository({ repoId: editingRepo.id, updates: repoData });
        toast({ title: 'Repositorio actualizado', description: 'El repositorio ha sido actualizado correctamente' });
      } else {
        await createRepository({ ...repoData, project_id: projectId });
        toast({ title: 'Repositorio creado', description: 'El repositorio ha sido agregado correctamente' });
      }

      setCreateModalOpen(false);
      resetForm();
      setEditingRepo(null);
    } catch (error) {
      console.error('Error saving repository:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el repositorio', variant: 'destructive' });
    }
  };

  const handleDelete = async (repoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este repositorio?')) return;

    try {
      await deleteRepository(repoId);
      toast({ title: 'Repositorio eliminado', description: 'El repositorio ha sido eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting repository:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el repositorio', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Repositorios</h2>
          <p className="text-sm text-muted-foreground">
            {repositories.length} repositorios configurados
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Repositorio
        </Button>
      </div>

      {/* Repositories Grid */}
      {repositories.length === 0 ? (
        <Card className="p-12 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin repositorios</h3>
          <p className="text-muted-foreground mb-4">
            Agrega los repositorios de código del proyecto
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Repositorio
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repositories.map((repo) => {
            const TypeIcon = REPO_TYPE_ICONS[repo.repo_type];

            return (
              <Card key={repo.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        repo.repo_type === 'FRONTEND' && "bg-blue-100 text-blue-600",
                        repo.repo_type === 'BACKEND' && "bg-emerald-100 text-emerald-600",
                        repo.repo_type === 'MOBILE' && "bg-purple-100 text-purple-600",
                        repo.repo_type === 'OTHER' && "bg-slate-100 text-slate-600"
                      )}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{repo.name}</CardTitle>
                        <Badge className={cn("text-xs mt-1", REPO_TYPE_COLORS[repo.repo_type])}>
                          {REPO_TYPE_LABELS[repo.repo_type]}
                        </Badge>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(repo)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(repo.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Repository URL */}
                  <a
                    href={repo.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <GitBranch className="h-4 w-4" />
                    <span className="truncate">{repo.repo_url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>

                  {/* URLs */}
                  <div className="flex flex-wrap gap-2">
                    {repo.production_url && (
                      <a
                        href={repo.production_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 cursor-pointer hover:bg-red-100">
                          <Globe className="h-3 w-3 mr-1" />
                          Producción
                          <ExternalLink className="h-2.5 w-2.5 ml-1" />
                        </Badge>
                      </a>
                    )}
                    {repo.staging_url && (
                      <a
                        href={repo.staging_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 cursor-pointer hover:bg-amber-100">
                          <Globe className="h-3 w-3 mr-1" />
                          Staging
                          <ExternalLink className="h-2.5 w-2.5 ml-1" />
                        </Badge>
                      </a>
                    )}
                  </div>

                  {/* Tech Stack */}
                  {repo.tech_stack && repo.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {repo.tech_stack.map((tech, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {repo.notes && (
                    <p className="text-sm text-muted-foreground">{repo.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRepo ? 'Editar Repositorio' : 'Nuevo Repositorio'}</DialogTitle>
            <DialogDescription>
              {editingRepo ? 'Modifica los detalles del repositorio' : 'Agrega un nuevo repositorio al proyecto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Frontend App"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.repo_type}
                  onValueChange={(v) => setFormData({ ...formData, repo_type: v as ProjectRepository['repo_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRONTEND">Frontend</SelectItem>
                    <SelectItem value="BACKEND">Backend</SelectItem>
                    <SelectItem value="MOBILE">Mobile</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo_url">URL del Repositorio *</Label>
              <Input
                id="repo_url"
                value={formData.repo_url}
                onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                placeholder="https://github.com/org/repo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="production_url">URL Producción</Label>
                <Input
                  id="production_url"
                  value={formData.production_url}
                  onChange={(e) => setFormData({ ...formData, production_url: e.target.value })}
                  placeholder="https://app.example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staging_url">URL Staging</Label>
                <Input
                  id="staging_url"
                  value={formData.staging_url}
                  onChange={(e) => setFormData({ ...formData, staging_url: e.target.value })}
                  placeholder="https://staging.example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tech_stack">Tech Stack (separado por comas)</Label>
              <Input
                id="tech_stack"
                value={formData.tech_stack}
                onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                placeholder="React, TypeScript, Tailwind, Supabase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre el repositorio"
                className="min-h-[60px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
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
