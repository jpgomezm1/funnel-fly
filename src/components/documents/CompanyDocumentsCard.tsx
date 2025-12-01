import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  FileCheck,
  Loader2,
  X,
} from 'lucide-react';
import { useCompanyDocuments } from '@/hooks/useCompanyDocuments';
import { DocumentType, DOCUMENT_TYPE_LABELS, CompanyDocument } from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CompanyDocumentsCardProps {
  leadId?: string;
  clientId?: string;
  fullWidth?: boolean;
}

export function CompanyDocumentsCard({ leadId, clientId, fullWidth }: CompanyDocumentsCardProps) {
  const {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    hasDocumentType,
    isUploading,
    isDeleting,
  } = useCompanyDocuments({ leadId, clientId });

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<CompanyDocument | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>('RUT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only for RUT and Camara Comercio)
      if (selectedType !== 'OTRO' && file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF para RUT y Cámara de Comercio');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede superar 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadDocument({
        file: selectedFile,
        documentType: selectedType,
      });
      setUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedType('RUT');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento');
    }
  };

  const handleDelete = async () => {
    if (!deletingDocument) return;

    try {
      await deleteDocument(deletingDocument);
      setDeletingDocument(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleDownload = async (document: CompanyDocument) => {
    setDownloadingId(document.id);
    try {
      const url = await getDocumentUrl(document);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert('Error al obtener el documento');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeColor = (type: DocumentType): string => {
    const colors: Record<DocumentType, string> = {
      'RUT': 'bg-blue-100 text-blue-700 border-blue-200',
      'CAMARA_COMERCIO': 'bg-purple-100 text-purple-700 border-purple-200',
      'OTRO': 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[type];
  };

  // Get available document types for upload (excluding already uploaded ones, except OTRO)
  const availableTypes: DocumentType[] = (['RUT', 'CAMARA_COMERCIO', 'OTRO'] as DocumentType[]).filter(
    type => type === 'OTRO' || !hasDocumentType(type)
  );

  const rutDoc = documents.find(d => d.document_type === 'RUT');
  const camaraDoc = documents.find(d => d.document_type === 'CAMARA_COMERCIO');
  const otherDocs = documents.filter(d => d.document_type === 'OTRO');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documentos
            </CardTitle>
            {availableTypes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="h-4 w-4 mr-1" />
                Subir
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-3">
              {/* RUT */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${rutDoc ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <FileText className={`h-4 w-4 ${rutDoc ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">RUT</p>
                    {rutDoc ? (
                      <p className="text-xs text-muted-foreground">
                        {rutDoc.file_name} • {formatFileSize(rutDoc.file_size)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No cargado</p>
                    )}
                  </div>
                </div>
                {rutDoc ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(rutDoc)}
                      disabled={downloadingId === rutDoc.id}
                    >
                      {downloadingId === rutDoc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingDocument(rutDoc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Pendiente
                  </Badge>
                )}
              </div>

              {/* Cámara de Comercio */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${camaraDoc ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    <FileText className={`h-4 w-4 ${camaraDoc ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Cámara de Comercio</p>
                    {camaraDoc ? (
                      <p className="text-xs text-muted-foreground">
                        {camaraDoc.file_name} • {formatFileSize(camaraDoc.file_size)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No cargado</p>
                    )}
                  </div>
                </div>
                {camaraDoc ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(camaraDoc)}
                      disabled={downloadingId === camaraDoc.id}
                    >
                      {downloadingId === camaraDoc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingDocument(camaraDoc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Pendiente
                  </Badge>
                )}
              </div>

              {/* Other documents */}
              {otherDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-gray-100">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Otro • {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingDocument(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Empty state - show placeholders */}
              <div className="flex items-center justify-between p-3 border rounded-lg border-dashed">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">RUT</p>
                    <p className="text-xs text-muted-foreground">No cargado</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Pendiente
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg border-dashed">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Cámara de Comercio</p>
                    <p className="text-xs text-muted-foreground">No cargado</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Pendiente
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir documento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Documento
            </DialogTitle>
            <DialogDescription>
              Selecciona el tipo de documento y el archivo a subir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select
                value={selectedType}
                onValueChange={(value: DocumentType) => {
                  setSelectedType(value);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {DOCUMENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Archivo {selectedType !== 'OTRO' && '(PDF)'}</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selectedType === 'OTRO' ? '*' : 'application/pdf'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileCheck className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic para seleccionar un archivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedType === 'OTRO' ? 'Cualquier tipo de archivo' : 'Solo archivos PDF'} • Máximo 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setUploadModalOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDocument} onOpenChange={() => setDeletingDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{deletingDocument?.file_name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
