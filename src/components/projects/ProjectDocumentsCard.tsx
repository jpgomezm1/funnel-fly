import { useState, useRef } from 'react';
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
  FolderOpen,
  Plus,
  MoreVertical,
  Trash2,
  Download,
  Eye,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectDocuments } from '@/hooks/useProjectDocuments';
import {
  ProjectDocumentType,
  PROJECT_DOCUMENT_TYPE_LABELS,
} from '@/types/database';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';

interface ProjectDocumentsCardProps {
  projectId: string;
}

const DOCUMENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  doc: <FileText className="h-4 w-4 text-blue-500" />,
  docx: <FileText className="h-4 w-4 text-blue-500" />,
  xls: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  png: <FileImage className="h-4 w-4 text-purple-500" />,
  jpg: <FileImage className="h-4 w-4 text-purple-500" />,
  jpeg: <FileImage className="h-4 w-4 text-purple-500" />,
  default: <File className="h-4 w-4 text-slate-500" />,
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return DOCUMENT_TYPE_ICONS[ext] || DOCUMENT_TYPE_ICONS.default;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ProjectDocumentsCard({ projectId }: ProjectDocumentsCardProps) {
  const {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    getSignedUrl,
    isUploading,
  } = useProjectDocuments({ projectId });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState<ProjectDocumentType>('other');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setDocumentType('other');
    setName('');
    setNotes('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name) {
        setName(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !name.trim()) return;

    try {
      await uploadDocument({
        file: selectedFile,
        documentType,
        name: name.trim(),
        notes: notes.trim() || undefined,
      });
      setAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento');
    }
  };

  const handleDelete = async (document: typeof documents[0]) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await deleteDocument(document);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleView = async (document: typeof documents[0]) => {
    try {
      const url = await getSignedUrl(document.file_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting signed URL:', error);
      alert('Error al obtener el documento');
    }
  };

  const handleDownload = async (document: typeof documents[0]) => {
    try {
      const url = await getSignedUrl(document.file_path);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    }
  };

  // Group documents by type
  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.document_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<ProjectDocumentType, typeof documents>);

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
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              Documentos del Proyecto
              {documents.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {documents.length}
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Subir
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay documentos subidos</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Subir primer documento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedDocuments).map(([type, docs]) => (
                <div key={type}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    {PROJECT_DOCUMENT_TYPE_LABELS[type as ProjectDocumentType]}
                  </h4>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.file_path)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{formatDistanceToBogota(doc.created_at)}</span>
                            {doc.uploaded_by && (
                              <>
                                <span>•</span>
                                <span>{doc.uploaded_by}</span>
                              </>
                            )}
                          </div>
                          {doc.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {doc.notes}
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
                            <DropdownMenuItem onClick={() => handleView(doc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
            <DialogDescription>
              Sube un documento relacionado con el proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Archivo *</Label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  selectedFile
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
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
                    {getFileIcon(selectedFile.name)}
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic para seleccionar un archivo
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select
                value={documentType}
                onValueChange={(v: ProjectDocumentType) => setDocumentType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposal">Propuesta</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="credentials">Credenciales</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="meeting_notes">Notas de Reunión</SelectItem>
                  <SelectItem value="deliverable">Entregable</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del documento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre el documento..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !name.trim()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
