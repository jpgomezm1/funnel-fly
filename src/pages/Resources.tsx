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
  X,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamResources } from '@/hooks/useTeamResources';
import { useUserRole } from '@/hooks/useUserRole';
import {
  TeamResource,
  ResourceTag,
  ResourceType,
  ResourceDocument,
  NewResourceDocument,
  RESOURCE_TAG_LABELS,
  RESOURCE_TAG_COLORS,
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

// Get composite icon for a resource based on its documents
const getResourceIcon = (documents: ResourceDocument[]) => {
  const hasLinks = documents.some(d => d.document_type === 'link');
  const hasFiles = documents.some(d => d.document_type === 'file');

  if (hasLinks && hasFiles) return Paperclip;
  if (hasFiles) {
    const firstFile = documents.find(d => d.document_type === 'file');
    return getFileIcon(firstFile?.mime_type);
  }
  return LinkIcon;
};

const getResourceIconColor = (documents: ResourceDocument[]) => {
  const hasLinks = documents.some(d => d.document_type === 'link');
  const hasFiles = documents.some(d => d.document_type === 'file');

  if (hasLinks && hasFiles) return 'bg-violet-100 text-violet-600';
  if (hasFiles) return 'bg-emerald-100 text-emerald-600';
  return 'bg-blue-100 text-blue-600';
};

export default function Resources() {
  const {
    resources,
    stats,
    isLoading,
    createResource,
    deleteResource,
    addDocuments,
    deleteDocument,
    getFileUrl,
    isCreating,
    isAddingDocuments,
  } = useTeamResources();

  const { displayName, role } = useUserRole();
  const userId = displayName;
  const isSuperAdmin = role === 'superadmin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addDocFileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'ALL'>('ALL');
  const [tagFilter, setTagFilter] = useState<ResourceTag | 'ALL'>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [addDocResourceId, setAddDocResourceId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());

  // Form state for create modal
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as ResourceTag[],
  });
  const [pendingDocuments, setPendingDocuments] = useState<NewResourceDocument[]>([]);
  const [pendingLinkUrl, setPendingLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Form state for add document modal
  const [addDocPending, setAddDocPending] = useState<NewResourceDocument[]>([]);
  const [addDocLinkUrl, setAddDocLinkUrl] = useState('');

  const resetForm = () => {
    setFormData({ title: '', description: '', tags: [] });
    setPendingDocuments([]);
    setPendingLinkUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetAddDocForm = () => {
    setAddDocPending([]);
    setAddDocLinkUrl('');
    setAddDocResourceId(null);
    if (addDocFileInputRef.current) addDocFileInputRef.current.value = '';
  };

  // Filter resources
  const filteredResources = resources.filter((item) => {
    const docs = item.documents || [];
    const searchLower = search.toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(searchLower) ||
      (item.description?.toLowerCase().includes(searchLower) ?? false) ||
      docs.some(d =>
        (d.file_name?.toLowerCase().includes(searchLower) ?? false) ||
        (d.url?.toLowerCase().includes(searchLower) ?? false)
      );

    const matchesType =
      typeFilter === 'ALL' ||
      docs.some(d => d.document_type === typeFilter);

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

  // --- Pending document management (create modal) ---
  const handleAddPendingLink = () => {
    if (!pendingLinkUrl.trim()) return;
    setPendingDocuments(prev => [
      ...prev,
      {
        document_type: 'link',
        url: pendingLinkUrl.trim(),
        tempId: crypto.randomUUID(),
      },
    ]);
    setPendingLinkUrl('');
  };

  const handleAddPendingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs: NewResourceDocument[] = Array.from(files).map(file => ({
      document_type: 'file' as const,
      file,
      file_name: file.name,
      tempId: crypto.randomUUID(),
    }));
    setPendingDocuments(prev => [...prev, ...newDocs]);

    if (!formData.title && newDocs.length === 1 && newDocs[0].file) {
      setFormData(prev => ({
        ...prev,
        title: newDocs[0].file!.name.split('.').slice(0, -1).join('.'),
      }));
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingDoc = (tempId: string) => {
    setPendingDocuments(prev => prev.filter(d => d.tempId !== tempId));
  };

  // --- Pending document management (add doc modal) ---
  const handleAddDocPendingLink = () => {
    if (!addDocLinkUrl.trim()) return;
    setAddDocPending(prev => [
      ...prev,
      {
        document_type: 'link',
        url: addDocLinkUrl.trim(),
        tempId: crypto.randomUUID(),
      },
    ]);
    setAddDocLinkUrl('');
  };

  const handleAddDocPendingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs: NewResourceDocument[] = Array.from(files).map(file => ({
      document_type: 'file' as const,
      file,
      file_name: file.name,
      tempId: crypto.randomUUID(),
    }));
    setAddDocPending(prev => [...prev, ...newDocs]);
    if (addDocFileInputRef.current) addDocFileInputRef.current.value = '';
  };

  const removeAddDocPending = (tempId: string) => {
    setAddDocPending(prev => prev.filter(d => d.tempId !== tempId));
  };

  // --- Handlers ---
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'El título es requerido', variant: 'destructive' });
      return;
    }

    if (pendingDocuments.length === 0) {
      toast({ title: 'Error', description: 'Agrega al menos un documento', variant: 'destructive' });
      return;
    }

    try {
      setIsUploading(true);
      await createResource({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags,
        uploaded_by: userId || 'unknown',
        uploaded_by_name: displayName || 'Usuario',
        documents: pendingDocuments,
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

  const handleAddDocuments = async () => {
    if (!addDocResourceId || addDocPending.length === 0) return;

    try {
      setIsUploading(true);
      await addDocuments({
        resourceId: addDocResourceId,
        documents: addDocPending,
      });
      toast({ title: 'Documentos agregados', description: 'Los documentos han sido agregados al recurso' });
      setAddDocModalOpen(false);
      resetAddDocForm();
    } catch (error) {
      console.error('Error adding documents:', error);
      toast({ title: 'Error', description: 'No se pudieron agregar los documentos', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este recurso y todos sus documentos?')) return;

    try {
      await deleteResource(id);
      toast({ title: 'Recurso eliminado', description: 'El recurso ha sido eliminado' });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el recurso', variant: 'destructive' });
    }
  };

  const handleDeleteDocument = async (doc: ResourceDocument) => {
    if (!confirm('¿Eliminar este documento?')) return;

    try {
      await deleteDocument(doc);
      toast({ title: 'Documento eliminado', description: 'El documento ha sido eliminado' });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el documento', variant: 'destructive' });
    }
  };

  const handleOpenDocument = (doc: ResourceDocument) => {
    if (doc.document_type === 'link' && doc.url) {
      window.open(doc.url, '_blank');
    } else if (doc.document_type === 'file' && doc.file_path) {
      const url = getFileUrl(doc.file_path);
      window.open(url, '_blank');
    }
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleDocuments = (id: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
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
              <span className="text-xs font-medium">Con Enlaces</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.links}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Con Archivos</span>
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
            placeholder="Buscar recursos, archivos, enlaces..."
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
            <SelectItem value="link">Con Enlaces</SelectItem>
            <SelectItem value="file">Con Archivos</SelectItem>
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
            const docs = resource.documents || [];
            const ResourceIcon = getResourceIcon(docs);
            const iconColor = getResourceIconColor(docs);
            const isExpanded = expandedDescriptions.has(resource.id);
            const isDocsExpanded = expandedDocuments.has(resource.id);

            return (
              <Card
                key={resource.id}
                className="overflow-hidden hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn("p-3 rounded-lg flex-shrink-0", iconColor)}>
                      <ResourceIcon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">
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
                              setAddDocResourceId(resource.id);
                              setAddDocModalOpen(true);
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Documento
                            </DropdownMenuItem>
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
                                  Eliminar Recurso
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description */}
                      {resource.description && (
                        <div className="mt-1">
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

                      {/* Documents badge + expandable list */}
                      {docs.length > 0 && (
                        <div className="mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDocuments(resource.id);
                            }}
                          >
                            <Paperclip className="h-3 w-3" />
                            {docs.length} {docs.length === 1 ? 'documento' : 'documentos'}
                            {isDocsExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>

                          {isDocsExpanded && (
                            <div className="mt-2 space-y-1.5 border-t pt-2">
                              {docs.map((doc) => {
                                const DocIcon = doc.document_type === 'link'
                                  ? LinkIcon
                                  : getFileIcon(doc.mime_type);

                                return (
                                  <div
                                    key={doc.id}
                                    className="flex items-center gap-2 text-sm group/doc rounded-md px-2 py-1.5 hover:bg-muted/50"
                                  >
                                    <DocIcon className={cn(
                                      "h-4 w-4 flex-shrink-0",
                                      doc.document_type === 'link' ? "text-blue-500" : "text-emerald-500"
                                    )} />
                                    <span className="truncate flex-1 text-muted-foreground">
                                      {doc.document_type === 'link'
                                        ? doc.url
                                        : doc.file_name || 'Archivo'}
                                    </span>
                                    {doc.file_size && (
                                      <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {formatFileSize(doc.file_size)}
                                      </span>
                                    )}
                                    <div className="flex-shrink-0 flex gap-0.5 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDocument(doc);
                                        }}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                      {doc.document_type === 'file' && doc.file_path && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const url = getFileUrl(doc.file_path!);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = doc.file_name || 'download';
                                            link.click();
                                          }}
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      )}
                                      {(isSuperAdmin || resource.uploaded_by === userId) && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500 hover:text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDocument(doc);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
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
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {resource.uploaded_by_name || 'Usuario'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(resource.created_at).toLocaleDateString('es-CO')}
                        </span>
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
              Agrega un recurso con uno o más documentos (enlaces y/o archivos)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
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

            {/* Documents Section */}
            <div className="space-y-3">
              <Label>Documentos *</Label>

              {/* Pending document list */}
              {pendingDocuments.length > 0 && (
                <div className="space-y-2">
                  {pendingDocuments.map((doc) => (
                    <div
                      key={doc.tempId}
                      className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                    >
                      {doc.document_type === 'link' ? (
                        <LinkIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate flex-1">
                        {doc.document_type === 'link' ? doc.url : doc.file_name || doc.file?.name}
                      </span>
                      {doc.file && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatFileSize(doc.file.size)}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => removePendingDoc(doc.tempId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add link inline */}
              <div className="flex gap-2">
                <Input
                  value={pendingLinkUrl}
                  onChange={(e) => setPendingLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPendingLink();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPendingLink}
                  disabled={!pendingLinkUrl.trim()}
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Enlace
                </Button>
              </div>

              {/* Add file button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAddPendingFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Agregar Archivo
                </Button>
              </div>

              {pendingDocuments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Agrega al menos un enlace o archivo
                </p>
              )}
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

      {/* Add Documents Modal */}
      <Dialog open={addDocModalOpen} onOpenChange={(open) => {
        setAddDocModalOpen(open);
        if (!open) resetAddDocForm();
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Agregar Documentos</DialogTitle>
            <DialogDescription>
              Agrega enlaces o archivos a este recurso
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {/* Pending document list */}
            {addDocPending.length > 0 && (
              <div className="space-y-2">
                {addDocPending.map((doc) => (
                  <div
                    key={doc.tempId}
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                  >
                    {doc.document_type === 'link' ? (
                      <LinkIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate flex-1">
                      {doc.document_type === 'link' ? doc.url : doc.file_name || doc.file?.name}
                    </span>
                    {doc.file && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatFileSize(doc.file.size)}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeAddDocPending(doc.tempId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add link inline */}
            <div className="flex gap-2">
              <Input
                value={addDocLinkUrl}
                onChange={(e) => setAddDocLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDocPendingLink();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDocPendingLink}
                disabled={!addDocLinkUrl.trim()}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Enlace
              </Button>
            </div>

            {/* Add file button */}
            <div>
              <input
                ref={addDocFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAddDocPendingFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addDocFileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Agregar Archivo
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setAddDocModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddDocuments}
              disabled={isAddingDocuments || isUploading || addDocPending.length === 0}
            >
              {(isAddingDocuments || isUploading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                `Agregar ${addDocPending.length} documento${addDocPending.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
