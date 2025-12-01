import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Loader2 } from 'lucide-react';
import {
  FinanceTransaction,
  FinanceTransactionType,
  IncomeCategory,
  ExpenseCategory,
  PaymentMethod,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  FIXED_EXPENSE_CATEGORIES,
  VARIABLE_EXPENSE_CATEGORIES,
} from '@/types/database';
import { useCurrentExchangeRate } from '@/hooks/useFinanceExchangeRates';

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
  recurring_day: string;
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
    recurring_day: '',
    payment_method: '',
    notes: '',
  });

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (open) {
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
          recurring_day: transaction.recurring_day?.toString() || '',
          payment_method: transaction.payment_method || '',
          notes: transaction.notes || '',
        });
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
          recurring_day: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      recurring_day: formData.is_recurring && formData.recurring_day ? parseInt(formData.recurring_day) : undefined,
      payment_method: formData.payment_method || undefined,
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
                Se repite cada mes
              </p>
            </div>
            <Switch
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
            />
          </div>

          {formData.is_recurring && (
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
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
