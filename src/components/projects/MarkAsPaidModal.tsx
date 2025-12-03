import { useState, useEffect, useRef, useMemo } from 'react';
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
import { Loader2, CheckCircle, Upload, FileText, X, DollarSign, AlertCircle, TrendingDown, Receipt, Building2 } from 'lucide-react';
import { useProjectInvoices } from '@/hooks/useProjectInvoices';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/database';
import { cn } from '@/lib/utils';

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
      // Default to total amount (no retention)
      setAmountReceived(invoice.total.toString());
      setRetentionAmount('0');
      setSelectedFile(null);
    }
  }, [open, invoice]);

  // Calculate all financial values
  const calculations = useMemo(() => {
    const totalFacturado = invoice.total;
    const subtotal = invoice.subtotal;
    const ivaAmount = invoice.has_iva ? invoice.iva_amount : 0;

    const retention = parseFloat(retentionAmount) || 0;
    // Calculate retention percentage based on subtotal
    const retentionPct = subtotal > 0 ? Math.round((retention / subtotal) * 10000) / 100 : 0;

    // Amount received = Total - Retention
    const expectedReceived = totalFacturado - retention;
    const actualReceived = parseFloat(amountReceived) || 0;

    // Net income = Received - IVA (which we owe to DIAN)
    const netIncome = actualReceived - ivaAmount;

    // Difference between expected and actual
    const difference = expectedReceived - actualReceived;

    return {
      totalFacturado,
      subtotal,
      ivaAmount,
      retentionPct,
      retentionAmount: retention,
      expectedReceived,
      actualReceived,
      netIncome,
      difference,
    };
  }, [invoice, amountReceived, retentionAmount]);

  // Update amount received when retention changes
  useEffect(() => {
    if (open) {
      const newExpected = calculations.totalFacturado - calculations.retentionAmount;
      setAmountReceived(newExpected.toFixed(2));
    }
  }, [retentionAmount]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Solo se permiten archivos PDF o imágenes (JPG, PNG, WebP)');
        return;
      }
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

    if (calculations.actualReceived <= 0) {
      alert('El monto recibido debe ser mayor a 0');
      return;
    }

    setUploading(true);
    try {
      let paymentProofPath: string | undefined;

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
          amount_received: calculations.actualReceived,
          retention_amount: calculations.retentionAmount,
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
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            {invoice.concept}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Detalle de la Factura</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(calculations.subtotal)}</span>
              </div>
              {invoice.has_iva && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (19%):</span>
                  <span>{formatCurrency(calculations.ivaAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                <span>Total Facturado:</span>
                <span>{formatCurrency(calculations.totalFacturado)}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label htmlFor="retentionAmount" className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5" />
                Retención ({invoice.currency})
              </Label>
              <Input
                id="retentionAmount"
                type="number"
                step={invoice.currency === 'COP' ? '1000' : '0.01'}
                min="0"
                value={retentionAmount}
                onChange={(e) => setRetentionAmount(e.target.value)}
                placeholder="0"
              />
              {calculations.retentionAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ {calculations.retentionPct}% sobre subtotal
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountReceived" className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Monto Recibido *
            </Label>
            <Input
              id="amountReceived"
              type="number"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="0"
              required
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              El monto que efectivamente ingresó a tu cuenta bancaria
            </p>
          </div>

          {/* Payment Breakdown - The Key Visual */}
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <span className="text-sm font-medium">Resumen del Pago</span>
            </div>
            <div className="p-4 space-y-3">
              {/* Received */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Recibido en Banco</p>
                    <p className="text-xs text-muted-foreground">Lo que ingresó a tu cuenta</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(calculations.actualReceived)}
                </span>
              </div>

              {/* Retention */}
              {calculations.retentionAmount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Retención en la Fuente</p>
                      <p className="text-xs text-muted-foreground">
                        {calculations.retentionPct}% sobre subtotal • Retenido por cliente
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    -{formatCurrency(calculations.retentionAmount)}
                  </span>
                </div>
              )}

              {/* IVA - Debt to DIAN */}
              {invoice.has_iva && calculations.ivaAmount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">IVA - Deuda DIAN</p>
                      <p className="text-xs text-muted-foreground">
                        19% • Debes pagarlo a la DIAN
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    -{formatCurrency(calculations.ivaAmount)}
                  </span>
                </div>
              )}

              {/* Net Income */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ingreso Neto Real</p>
                    <p className="text-xs text-muted-foreground">
                      Tu ganancia después de IVA
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-xl font-bold",
                  calculations.netIncome >= 0 ? "text-primary" : "text-red-600"
                )}>
                  {formatCurrency(calculations.netIncome)}
                </span>
              </div>

              {/* Difference warning */}
              {Math.abs(calculations.difference) > 0.01 && (
                <div className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-sm",
                  calculations.difference > 0
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700"
                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"
                )}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {calculations.difference > 0
                      ? `Faltante de ${formatCurrency(calculations.difference)} vs. total - retención`
                      : `Excedente de ${formatCurrency(Math.abs(calculations.difference))} vs. total - retención`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment proof upload */}
          <div className="space-y-2">
            <Label>Comprobante de Pago (opcional)</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                selectedFile
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
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
                    <p className="font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
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

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating || uploading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || uploading}
              className="w-full sm:w-auto"
            >
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
