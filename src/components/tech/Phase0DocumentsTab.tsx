import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Plus,
  Link as LinkIcon,
  FileUp,
  ExternalLink,
  Download,
  MoreVertical,
  Trash2,
  File,
  FileText,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePhase0Documents } from '@/hooks/usePhase0Documents';
import { Phase0Document } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface Phase0DocumentsTabProps {
  projectId: string;
}

export function Phase0DocumentsTab({ projectId }: Phase0DocumentsTabProps) {
  const {
    documents,
    isLoading,
    addLink,
    uploadFile,
    deleteDocument,
    getSignedUrl,
    isAddingLink,
    isUploading,
    isDeleting,
  } = usePhase0Documents({ projectId });

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ name: '', url: '', notes: '' });
  const [fileForm, setFileForm] = useState({ name: '', notes: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetLinkForm = () => {
    setLinkForm({ name: '', url: '', notes: '' });
  };

  const resetFileForm = () => {
    setFileForm({ name: '', notes: '' });
    setSelectedFile(null);
  };

  const handleAddLink = async () => {
    if (!linkForm.name.trim() || !linkForm.url.trim()) {
      toast({ title: 'Error', description: 'Nombre y URL son requeridos', variant: 'destructive' });
      return;
    }

    try {
      await addLink({
        name: linkForm.name.trim(),
        url: linkForm.url.trim(),
        notes: linkForm.notes.trim() || undefined,
      });
      toast({ title: 'Link agregado', description: 'El link ha sido agregado correctamente' });
      setLinkModalOpen(false);
      resetLinkForm();
    } catch (error) {
      console.error('Error adding link:', error);
      toast({ title: 'Error', description: 'No se pudo agregar el link', variant: 'destructive' });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !fileForm.name.trim()) {
      toast({ title: 'Error', description: 'Nombre y archivo son requeridos', variant: 'destructive' });
      return;
    }

    try {
      await uploadFile({
        file: selectedFile,
        name: fileForm.name.trim(),
        notes: fileForm.notes.trim() || undefined,
      });
      toast({ title: 'Archivo subido', description: 'El archivo ha sido subido correctamente' });
      setFileModalOpen(false);
      resetFileForm();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: 'Error', description: 'No se pudo subir el archivo', variant: 'destructive' });
    }
  };

  const handleDelete = async (document: Phase0Document) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await deleteDocument(document);
      toast({ title: 'Documento eliminado', description: 'El documento ha sido eliminado' });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el documento', variant: 'destructive' });
    }
  };

  const handleOpenDocument = async (document: Phase0Document) => {
    if (document.document_type === 'link' && document.url) {
      window.open(document.url, '_blank');
    } else if (document.document_type === 'file' && document.file_path) {
      try {
        const url = await getSignedUrl(document.file_path);
        window.open(url, '_blank');
      } catch (error) {
        console.error('Error getting signed URL:', error);
        toast({ title: 'Error', description: 'No se pudo abrir el archivo', variant: 'destructive' });
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Documentos</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLinkModalOpen(true)}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Agregar Link
          </Button>
          <Button onClick={() => setFileModalOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin documentos</h3>
          <p className="text-muted-foreground mb-4">
            Agrega links externos o sube archivos para este proyecto
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenDocument(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      doc.document_type === 'link' ? "bg-blue-100" : "bg-amber-100"
                    )}>
                      {doc.document_type === 'link' ? (
                        <LinkIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <File className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{doc.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type === 'link' ? 'Link' : 'Archivo'}
                        </Badge>
                        {doc.file_size && (
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                        )}
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {doc.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDocument(doc); }}>
                        {doc.document_type === 'link' ? (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Link
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                        className="text-red-600"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Link</DialogTitle>
            <DialogDescription>
              Agrega un link externo a este proyecto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-name">Nombre *</Label>
              <Input
                id="link-name"
                value={linkForm.name}
                onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
                placeholder="Ej: Documento de requerimientos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                type="url"
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-notes">Notas</Label>
              <Textarea
                id="link-notes"
                value={linkForm.notes}
                onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
                placeholder="Notas adicionales..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddLink} disabled={isAddingLink}>
              {isAddingLink ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                'Agregar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload File Modal */}
      <Dialog open={fileModalOpen} onOpenChange={setFileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
            <DialogDescription>
              Sube un archivo PDF o HTML a este proyecto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-name">Nombre *</Label>
              <Input
                id="file-name"
                value={fileForm.name}
                onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                placeholder="Ej: Propuesta técnica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload">Archivo *</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.html,.htm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    if (!fileForm.name) {
                      setFileForm({ ...fileForm, name: file.name.replace(/\.[^/.]+$/, '') });
                    }
                  }
                }}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-notes">Notas</Label>
              <Textarea
                id="file-notes"
                value={fileForm.notes}
                onChange={(e) => setFileForm({ ...fileForm, notes: e.target.value })}
                placeholder="Notas adicionales..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFileModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUploadFile} disabled={isUploading}>
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
