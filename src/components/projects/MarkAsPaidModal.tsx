import { useState, useEffect, useRef } from 'react';
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
import { Loader2, CheckCircle, Upload, FileText, X } from 'lucide-react';
import { useProjectInvoices } from '@/hooks/useProjectInvoices';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/database';

const BUCKET_NAME = 'company-documents';

interface MarkAsPaidModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess: () => void;
}

export function MarkAsPaidModal({
  open,
  onClose,
  invoice,
  onSuccess,
}: MarkAsPaidModalProps) {
  const { markAsPaid, isUpdating } = useProjectInvoices({ projectId: invoice.project_id });

  const [paidAt, setPaidAt] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [retentionAmount, setRetentionAmount] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize values when modal opens
  useEffect(() => {
    if (open) {
      setPaidAt(new Date().toISOString().split('T')[0]);
      setAmountReceived(invoice.total.toString());
      setRetentionAmount('0');
      setSelectedFile(null);
    }
  }, [open, invoice]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF or image)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Solo se permiten archivos PDF o imágenes (JPG, PNG, WebP)');
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

    const received = parseFloat(amountReceived) || 0;
    const retention = parseFloat(retentionAmount) || 0;

    if (received <= 0) {
      alert('El monto recibido debe ser mayor a 0');
      return;
    }

    setUploading(true);
    try {
      let paymentProofPath: string | undefined;

      // Upload payment proof if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const timestamp = Date.now();
        paymentProofPath = `payment-proofs/${invoice.project_id}/${invoice.id}_${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(paymentProofPath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Error al subir el comprobante');
        }
      }

      await markAsPaid({
        invoiceId: invoice.id,
        data: {
          paid_at: paidAt,
          amount_received: received,
          retention_amount: retention,
          payment_proof_path: paymentProofPath,
        },
      });

      onSuccess();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error al marcar como pagada');
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

  const received = parseFloat(amountReceived) || 0;
  const retention = parseFloat(retentionAmount) || 0;
  const difference = invoice.total - received - retention;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Marcar como Pagada
          </DialogTitle>
          <DialogDescription>
            Registra el pago de la factura "{invoice.concept}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice summary */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Facturado:</span>
              <span className="font-semibold">{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.has_iva && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
            )}
            {invoice.has_iva && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>IVA:</span>
                <span>{formatCurrency(invoice.iva_amount)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAt">Fecha de Pago *</Label>
            <Input
              id="paidAt"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountReceived">Monto Recibido *</Label>
            <Input
              id="amountReceived"
              type="number"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="0"
              required
            />
            <p className="text-xs text-muted-foreground">
              El monto que efectivamente ingresó a la cuenta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retentionAmount">Retención (si aplica)</Label>
            <Input
              id="retentionAmount"
              type="number"
              step="0.01"
              value={retentionAmount}
              onChange={(e) => setRetentionAmount(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Monto retenido por el cliente (ej: retención en la fuente)
            </p>
          </div>

          {/* Payment proof upload */}
          <div className="space-y-2">
            <Label>Comprobante de Pago (opcional)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
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
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Clic para subir comprobante (PDF o imagen)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monto Recibido:</span>
              <span className="text-emerald-600 font-semibold">{formatCurrency(received)}</span>
            </div>
            {retention > 0 && (
              <div className="flex justify-between text-sm">
                <span>Retención:</span>
                <span className="text-amber-600">{formatCurrency(retention)}</span>
              </div>
            )}
            {Math.abs(difference) > 0.01 && (
              <div className="flex justify-between text-sm border-t pt-2">
                <span>Diferencia:</span>
                <span className={difference > 0 ? 'text-red-600' : 'text-emerald-600'}>
                  {formatCurrency(Math.abs(difference))} {difference > 0 ? '(faltante)' : '(sobrante)'}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating || uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating || uploading}>
              {isUpdating || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? 'Subiendo...' : 'Guardando...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
