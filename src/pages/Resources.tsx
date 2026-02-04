import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  FolderOpen,
  Search,
  Filter,
  Plus,
  Link as LinkIcon,
  FileText,
  File,
  MoreVertical,
  Trash2,
  ExternalLink,
  Download,
  Loader2,
  User,
  Calendar,
  Upload,
  Image,
  Video,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Archive,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamResources } from '@/hooks/useTeamResources';
import { useUserRole } from '@/hooks/useUserRole';
import {
  TeamResource,
  ResourceTag,
  ResourceType,
  RESOURCE_TAG_LABELS,
  RESOURCE_TAG_COLORS,
  RESOURCE_TYPE_LABELS,
} from '@/types/resources';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// File type icons based on mime type
const getFileIcon = (mimeType?: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return Presentation;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return Archive;
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return FileCode;
  return File;
};

// Format file size
const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ALL_TAGS: ResourceTag[] = [
  'ventas',
  'aprendizaje',
  'tecnologia',
  'marketing',
  'procesos',
  'plantillas',
  'finanzas',
  'onboarding',
  'otro',
];

export default function Resources() {
  const {
    resources,
    stats,
    isLoading,
    createResource,
    deleteResource,
    uploadFile,
    getFileUrl,
    isCreating,
  } = useTeamResources();

  const { displayName, role } = useUserRole();
  const userId = displayName;
  const isSuperAdmin = role === 'superadmin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'ALL'>('ALL');
  const [tagFilter, setTagFilter] = useState<ResourceTag | 'ALL'>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'link' as ResourceType,
    url: '',
    tags: [] as ResourceTag[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      resource_type: 'link',
      url: '',
      tags: [],
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesType = typeFilter === 'ALL' || item.resource_type === typeFilter;
    const matchesTag = tagFilter === 'ALL' || (item.tags || []).includes(tagFilter);

    return matchesSearch && matchesType && matchesTag;
  });

  const toggleTag = (tag: ResourceTag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.split('.').slice(0, -1).join('.'),
        }));
      }
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'El título es requerido', variant: 'destructive' });
      return;
    }

    if (formData.resource_type === 'link' && !formData.url.trim()) {
      toast({ title: 'Error', description: 'La URL es requerida para enlaces', variant: 'destructive' });
      return;
    }

    if (formData.resource_type === 'file' && !selectedFile) {
      toast({ title: 'Error', description: 'Selecciona un archivo', variant: 'destructive' });
      return;
    }

    try {
      setIsUploading(true);
      let fileData = {};

      if (formData.resource_type === 'file' && selectedFile) {
        const { path } = await uploadFile(selectedFile);
        fileData = {
          file_path: path,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        };
      }

      await createResource({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        resource_type: formData.resource_type,
        url: formData.resource_type === 'link' ? formData.url.trim() : undefined,
        ...fileData,
        tags: formData.tags,
        uploaded_by: userId || 'unknown',
        uploaded_by_name: displayName || 'Usuario',
      });

      toast({ title: 'Recurso creado', description: 'El recurso ha sido agregado exitosamente' });
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({ title: 'Error', description: 'No se pudo crear el recurso', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;

    try {
      await deleteResource(id);
      toast({ title: 'Recurso eliminado', description: 'El recurso ha sido eliminado' });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el recurso', variant: 'destructive' });
    }
  };

  const handleOpenResource = (resource: TeamResource) => {
    if (resource.resource_type === 'link' && resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.resource_type === 'file' && resource.file_path) {
      const url = getFileUrl(resource.file_path);
      window.open(url, '_blank');
    }
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isDescriptionLong = (description?: string | null) => {
    if (!description) return false;
    return description.length > 120;
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
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
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
            <FolderOpen className="h-6 w-6 text-primary" />
            Recursos del Equipo
          </h1>
          <p className="text-muted-foreground">
            Comparte enlaces, documentos y archivos útiles para el equipo
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Recurso
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FolderOpen className="h-4 w-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <LinkIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Enlaces</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.links}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Archivos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.files}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-medium">Categorías</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{Object.keys(stats.byTag).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | 'ALL')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="link">Enlaces</SelectItem>
            <SelectItem value="file">Archivos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={(v) => setTagFilter(v as ResourceTag | 'ALL')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {ALL_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {RESOURCE_TAG_LABELS[tag]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay recursos</h3>
          <p className="text-muted-foreground mb-4">
            {search || typeFilter !== 'ALL' || tagFilter !== 'ALL'
              ? 'No se encontraron recursos con los filtros aplicados'
              : 'Sé el primero en compartir un recurso útil'}
          </p>
          {!search && typeFilter === 'ALL' && tagFilter === 'ALL' && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Recurso
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const FileIcon = resource.resource_type === 'link'
              ? LinkIcon
              : getFileIcon(resource.mime_type);
            const isExpanded = expandedDescriptions.has(resource.id);

            return (
              <Card
                key={resource.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleOpenResource(resource)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "p-3 rounded-lg flex-shrink-0",
                      resource.resource_type === 'link'
                        ? "bg-blue-100 text-blue-600"
                        : "bg-emerald-100 text-emerald-600"
                    )}>
                      <FileIcon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {resource.title}
                        </h3>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResource(resource);
                            }}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir
                            </DropdownMenuItem>
                            {resource.resource_type === 'file' && resource.file_path && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                const url = getFileUrl(resource.file_path!);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = resource.file_name || 'download';
                                link.click();
                              }}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </DropdownMenuItem>
                            )}
                            {(isSuperAdmin || resource.uploaded_by === userId) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(resource.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description */}
                      {resource.description && (
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          <p className={cn(
                            "text-sm text-muted-foreground",
                            !isExpanded && isDescriptionLong(resource.description) && "line-clamp-2"
                          )}>
                            {resource.description}
                          </p>
                          {isDescriptionLong(resource.description) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 mt-1 text-xs text-primary hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDescription(resource.id);
                              }}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Ver más
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                          {resource.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={cn("text-xs", RESOURCE_TAG_COLORS[tag])}
                            >
                              {RESOURCE_TAG_LABELS[tag]}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {resource.uploaded_by_name || 'Usuario'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(resource.created_at).toLocaleDateString('es-CO')}
                        </span>
                        {resource.file_size && (
                          <span>{formatFileSize(resource.file_size)}</span>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Nuevo Recurso</DialogTitle>
            <DialogDescription>
              Comparte un enlace útil o sube un archivo para el equipo
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {/* Resource Type */}
            <div className="space-y-2">
              <Label>Tipo de Recurso</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.resource_type === 'link' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, resource_type: 'link' }))}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Enlace
                </Button>
                <Button
                  type="button"
                  variant={formData.resource_type === 'file' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, resource_type: 'file' }))}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Archivo
                </Button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Guía de ventas 2024"
              />
            </div>

            {/* URL or File */}
            {formData.resource_type === 'link' ? (
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Archivo *</Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click para seleccionar archivo
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional del recurso..."
                className="min-h-[80px]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Categorías</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map((tag) => (
                  <div
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm",
                      formData.tags.includes(tag)
                        ? cn(RESOURCE_TAG_COLORS[tag], "border-2")
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    )}
                  >
                    <Checkbox
                      checked={formData.tags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                      className="pointer-events-none"
                    />
                    {RESOURCE_TAG_LABELS[tag]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || isUploading}>
              {(isCreating || isUploading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? 'Subiendo...' : 'Creando...'}
                </>
              ) : (
                'Crear Recurso'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
