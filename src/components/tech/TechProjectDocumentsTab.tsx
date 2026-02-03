import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Plus,
  Trash2,
  FileText,
  FileImage,
  FileArchive,
  File,
  Download,
  Loader2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectDocuments } from '@/hooks/useProjectDocuments';
import { ProjectDocument, ProjectDocumentType } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { formatDateToBogota } from '@/lib/date-utils';

const DOC_TYPE_LABELS: Record<ProjectDocumentType, string> = {
  proposal: 'Propuesta',
  contract: 'Contrato',
  credentials: 'Credenciales',
  manual: 'Manual',
  meeting_notes: 'Notas de Reunión',
  deliverable: 'Entregable',
  other: 'Otro',
};

const DOC_TYPE_COLORS: Record<ProjectDocumentType, string> = {
  proposal: 'bg-blue-100 text-blue-700',
  contract: 'bg-emerald-100 text-emerald-700',
  credentials: 'bg-red-100 text-red-700',
  manual: 'bg-purple-100 text-purple-700',
  meeting_notes: 'bg-amber-100 text-amber-700',
  deliverable: 'bg-cyan-100 text-cyan-700',
  other: 'bg-slate-100 text-slate-700',
};

function getFileIcon(mimeType?: string) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return FileArchive;
  return File;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TechProjectDocumentsTabProps {
  projectId: string;
}

export function TechProjectDocumentsTab({ projectId }: TechProjectDocumentsTabProps) {
  const {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    getSignedUrl,
    isUploading,
    isDeleting,
  } = useProjectDocuments({ projectId });

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    document_type: 'other' as ProjectDocumentType,
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ name: '', document_type: 'other', notes: '' });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'Error', description: 'Selecciona un archivo', variant: 'destructive' });
      return;
    }
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    try {
      await uploadDocument({
        file: selectedFile,
        documentType: formData.document_type,
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
      });
      toast({ title: 'Documento subido' });
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({ title: 'Error', description: 'No se pudo subir el documento', variant: 'destructive' });
    }
  };

  const handleView = async (doc: ProjectDocument) => {
    try {
      const url = await getSignedUrl(doc.file_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast({ title: 'Error', description: 'No se pudo obtener el enlace', variant: 'destructive' });
    }
  };

  const handleDelete = async (doc: ProjectDocument) => {
    if (!confirm(`¿Estás seguro de eliminar "${doc.name}"?`)) return;
    try {
      await deleteDocument(doc);
      toast({ title: 'Documento eliminado' });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el documento', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Documentos</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} documentos
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin documentos</h3>
          <p className="text-muted-foreground mb-4">
            Sube propuestas, contratos, manuales y más
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Subir Documento
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const DocIcon = getFileIcon(doc.mime_type);

            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <DocIcon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", DOC_TYPE_COLORS[doc.document_type])}>
                          {DOC_TYPE_LABELS[doc.document_type]}
                        </Badge>
                        {doc.file_size && (
                          <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateToBogota(doc.created_at, 'dd MMM yyyy')}
                      </p>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(doc)}>
                      <Download className="h-3 w-3 mr-1" />
                      Ver / Descargar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
            <DialogDescription>Sube un archivo al proyecto</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Archivo *</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors",
                  selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click para seleccionar archivo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del documento"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(v) => setFormData({ ...formData, document_type: v as ProjectDocumentType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                'Subir'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
