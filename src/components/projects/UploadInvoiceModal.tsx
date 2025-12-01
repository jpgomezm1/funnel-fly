import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, X } from 'lucide-react';
import { useProjectInvoices } from '@/hooks/useProjectInvoices';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/database';

interface UploadInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess: () => void;
}

const BUCKET_NAME = 'company-documents';

export function UploadInvoiceModal({
  open,
  onClose,
  invoice,
  onSuccess,
}: UploadInvoiceModalProps) {
  const { markAsInvoiced, isUpdating } = useProjectInvoices({ projectId: invoice.project_id });

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setUploading(true);
    try {
      let filePath: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const timestamp = Date.now();
        filePath = `invoices/${invoice.project_id}/${invoice.id}_${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Error al subir el archivo');
        }
      }

      // Mark invoice as invoiced
      await markAsInvoiced({
        invoiceId: invoice.id,
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceFilePath: filePath,
      });

      onSuccess();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      alert('Error al cargar la factura');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (invoice.currency === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cargar Factura
          </DialogTitle>
          <DialogDescription>
            Registra el número de factura y opcionalmente sube el PDF.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice summary */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-medium text-sm">{invoice.concept}</p>
            <p className="text-lg font-semibold mt-1">{formatCurrency(invoice.total)}</p>
            {invoice.has_iva && (
              <p className="text-xs text-muted-foreground">
                Subtotal: {formatCurrency(invoice.subtotal)} + IVA: {formatCurrency(invoice.iva_amount)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Número de Factura</Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ej: FV-001234"
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo PDF (opcional)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
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
                  <Button
                    type="button"
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
                    Haz clic para seleccionar el PDF de la factura
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo archivos PDF - Máximo 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading || isUpdating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading || isUpdating}>
              {uploading || isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Registrar Factura
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
