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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, FileText, X, ExternalLink } from 'lucide-react';
import {
  FinanceTransaction,
  FinanceTransactionType,
  IncomeCategory,
  ExpenseCategory,
  PaymentMethod,
  RecurringFrequency,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  RECURRING_FREQUENCY_LABELS,
  FIXED_EXPENSE_CATEGORIES,
  VARIABLE_EXPENSE_CATEGORIES,
} from '@/types/database';
import { useCurrentExchangeRate } from '@/hooks/useFinanceExchangeRates';
import { uploadReceiptFile, getReceiptUrl } from '@/hooks/useFinanceTransactions';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinanceTransaction | null;
  transactionType: FinanceTransactionType;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
}

interface FormData {
  income_category: string;
  expense_category: string;
  amount_original: string;
  currency: 'USD' | 'COP';
  exchange_rate: string;
  description: string;
  vendor_or_source: string;
  reference_number: string;
  transaction_date: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency;
  recurring_day: string;
  recurring_end_date: string;
  payment_method: string;
  notes: string;
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  transactionType,
  onSave,
  isSaving,
}: TransactionModalProps) {
  const { currentRate } = useCurrentExchangeRate();
  const isIncome = transactionType === 'INCOME';
  const isEditing = !!transaction;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    income_category: '',
    expense_category: '',
    amount_original: '',
    currency: 'USD',
    exchange_rate: currentRate.toString(),
    description: '',
    vendor_or_source: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: 'MONTHLY',
    recurring_day: '',
    recurring_end_date: '',
    payment_method: '',
    notes: '',
  });

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setExistingReceiptUrl(null);

      if (transaction) {
        setFormData({
          income_category: transaction.income_category || '',
          expense_category: transaction.expense_category || '',
          amount_original: transaction.amount_original.toString(),
          currency: transaction.currency,
          exchange_rate: transaction.exchange_rate?.toString() || currentRate.toString(),
          description: transaction.description,
          vendor_or_source: transaction.vendor_or_source || '',
          reference_number: transaction.reference_number || '',
          transaction_date: transaction.transaction_date,
          is_recurring: transaction.is_recurring,
          recurring_frequency: transaction.recurring_frequency || 'MONTHLY',
          recurring_day: transaction.recurring_day?.toString() || '',
          recurring_end_date: transaction.recurring_end_date || '',
          payment_method: transaction.payment_method || '',
          notes: transaction.notes || '',
        });

        // Load existing receipt URL if exists
        if (transaction.receipt_path) {
          getReceiptUrl(transaction.receipt_path).then(url => {
            setExistingReceiptUrl(url);
          });
        }
      } else {
        setFormData({
          income_category: '',
          expense_category: '',
          amount_original: '',
          currency: 'USD',
          exchange_rate: currentRate.toString(),
          description: '',
          vendor_or_source: '',
          reference_number: '',
          transaction_date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          recurring_frequency: 'MONTHLY',
          recurring_day: '',
          recurring_end_date: '',
          payment_method: '',
          notes: '',
        });
      }
    }
  }, [open, transaction, currentRate]);

  // Calculate USD equivalent
  const amountUsd = formData.currency === 'COP' && parseFloat(formData.exchange_rate) > 0
    ? parseFloat(formData.amount_original || '0') / parseFloat(formData.exchange_rate)
    : parseFloat(formData.amount_original || '0');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Solo se permiten archivos PDF, JPG, PNG o WebP');
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede superar 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let receipt_path: string | undefined = transaction?.receipt_path || undefined;

    // Upload file if selected
    if (selectedFile) {
      try {
        setIsUploadingFile(true);
        receipt_path = await uploadReceiptFile(selectedFile, transactionType);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error al subir el archivo');
        setIsUploadingFile(false);
        return;
      } finally {
        setIsUploadingFile(false);
      }
    }

    const data = {
      transaction_type: transactionType,
      income_category: isIncome && formData.income_category ? formData.income_category : undefined,
      expense_category: !isIncome && formData.expense_category ? formData.expense_category : undefined,
      amount_original: parseFloat(formData.amount_original),
      currency: formData.currency,
      exchange_rate: formData.currency === 'COP' ? parseFloat(formData.exchange_rate) : undefined,
      description: formData.description,
      vendor_or_source: formData.vendor_or_source || undefined,
      reference_number: formData.reference_number || undefined,
      transaction_date: formData.transaction_date,
      is_recurring: formData.is_recurring,
      recurring_frequency: formData.is_recurring ? formData.recurring_frequency : undefined,
      recurring_day: formData.is_recurring && formData.recurring_day ? parseInt(formData.recurring_day) : undefined,
      recurring_end_date: formData.is_recurring && formData.recurring_end_date ? formData.recurring_end_date : undefined,
      payment_method: formData.payment_method || undefined,
      receipt_path,
      notes: formData.notes || undefined,
    };

    await onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar' : 'Nuevo'} {isIncome ? 'Ingreso' : 'Gasto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos de la transacción' : `Registra un nuevo ${isIncome ? 'ingreso' : 'gasto'}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría *</Label>
            {isIncome ? (
              <Select
                value={formData.income_category}
                onValueChange={(v) => setFormData({ ...formData, income_category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {INCOME_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={formData.expense_category}
                onValueChange={(v) => setFormData({ ...formData, expense_category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Gastos Fijos
                  </div>
                  {FIXED_EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                    Gastos Variables
                  </div>
                  {VARIABLE_EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_original}
                onChange={(e) => setFormData({ ...formData, amount_original: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(v: 'USD' | 'COP') => setFormData({ ...formData, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate (only for COP) */}
          {formData.currency === 'COP' && (
            <div className="space-y-2">
              <Label>Tasa de Cambio (USD a COP)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.exchange_rate}
                onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                placeholder="4200"
              />
              {amountUsd > 0 && (
                <p className="text-sm text-muted-foreground">
                  Equivalente: ${amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isIncome ? "Ej: Pago mensual Cliente X" : "Ej: AWS Hosting Diciembre"}
              required
            />
          </div>

          {/* Vendor/Source */}
          <div className="space-y-2">
            <Label>{isIncome ? 'Fuente' : 'Proveedor'}</Label>
            <Input
              value={formData.vendor_or_source}
              onChange={(e) => setFormData({ ...formData, vendor_or_source: e.target.value })}
              placeholder={isIncome ? "Ej: Cliente ABC" : "Ej: Amazon Web Services"}
            />
          </div>

          {/* Date and Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="# Factura o recibo"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <Select
              value={formData.payment_method || "none"}
              onValueChange={(v) => setFormData({ ...formData, payment_method: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin especificar</SelectItem>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="cursor-pointer">Es recurrente</Label>
              <p className="text-xs text-muted-foreground">
                Se repite periódicamente
              </p>
            </div>
            <Switch
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
            />
          </div>

          {formData.is_recurring && (
            <div className="space-y-4">
              {/* Frequency selector */}
              <div className="space-y-2">
                <Label>Periodicidad</Label>
                <Select
                  value={formData.recurring_frequency}
                  onValueChange={(v: RecurringFrequency) => setFormData({ ...formData, recurring_frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RECURRING_FREQUENCY_LABELS) as RecurringFrequency[]).map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {RECURRING_FREQUENCY_LABELS[freq]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.recurring_frequency === 'MONTHLY'
                    ? 'Se repite el mismo día cada mes'
                    : 'Se repite cada 15 días desde la fecha de inicio'}
                </p>
              </div>

              {/* Day of month - only for MONTHLY */}
              {formData.recurring_frequency === 'MONTHLY' && (
                <div className="space-y-2">
                  <Label>Día del mes</Label>
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.recurring_day}
                    onChange={(e) => setFormData({ ...formData, recurring_day: e.target.value })}
                    placeholder="Ej: 15"
                  />
                </div>
              )}

              {/* End date */}
              <div className="space-y-2">
                <Label>Fecha de fin (opcional)</Label>
                <Input
                  type="date"
                  value={formData.recurring_end_date}
                  onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Si no se especifica, se generarán todas las ocurrencias hasta hoy
                </p>
              </div>
            </div>
          )}

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Comprobante (Opcional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Show existing receipt */}
            {existingReceiptUrl && !selectedFile && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">Comprobante actual</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={existingReceiptUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}

            {/* Show selected file */}
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 border-green-200">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload button */}
            {!selectedFile && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {existingReceiptUrl ? 'Cambiar comprobante' : 'Subir comprobante'}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG o WebP. Máximo 10MB.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isUploadingFile}>
              {isSaving || isUploadingFile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploadingFile ? 'Subiendo archivo...' : 'Guardando...'}
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
