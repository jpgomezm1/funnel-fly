import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Receipt, FileText, CreditCard } from 'lucide-react';
import { useProjectInvoices } from '@/hooks/useProjectInvoices';
import { Deal, InvoiceType, DealCurrency, INVOICE_TYPE_LABELS } from '@/types/database';

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  deal: Deal;
  invoiceType: InvoiceType;
  onSuccess: () => void;
}

const IVA_RATE = 0.19;

export function CreateInvoiceModal({
  open,
  onClose,
  projectId,
  deal,
  invoiceType,
  onSuccess,
}: CreateInvoiceModalProps) {
  const { createInvoice, isCreating } = useProjectInvoices({ projectId });

  const [concept, setConcept] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [hasIva, setHasIva] = useState(true);
  const [isCuentaCobro, setIsCuentaCobro] = useState(false);
  const [currency, setCurrency] = useState<DealCurrency>(deal.currency);
  const [exchangeRate, setExchangeRate] = useState(deal.exchange_rate?.toString() || '');
  const [periodMonth, setPeriodMonth] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate IVA and total
  const subtotalNum = parseFloat(subtotal) || 0;
  const ivaAmount = hasIva ? subtotalNum * IVA_RATE : 0;
  const total = subtotalNum + ivaAmount;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (invoiceType === 'ADVANCE') {
        // Anticipo: típicamente 50% del fee de implementación
        const advanceAmount = deal.implementation_fee_original * 0.5;
        setConcept('Anticipo - 50% Fee de Implementación');
        setSubtotal(advanceAmount.toString());
        setHasIva(false); // Por defecto sin IVA para anticipos
        setIsCuentaCobro(true); // Por defecto cuenta de cobro
      } else if (invoiceType === 'IMPLEMENTATION') {
        setConcept('Fee de Implementación');
        setSubtotal(deal.implementation_fee_original.toString());
        setHasIva(true);
        setIsCuentaCobro(false);
      } else {
        const now = new Date();
        const monthName = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        setConcept(`Mensualidad ${monthName}`);
        setSubtotal(deal.mrr_original.toString());
        setPeriodMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
        setHasIva(true);
        setIsCuentaCobro(false);
      }
      setCurrency(deal.currency);
      setExchangeRate(deal.exchange_rate?.toString() || '');
      setDueDate('');
      setNotes('');
    }
  }, [open, invoiceType, deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concept.trim() || subtotalNum <= 0) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      await createInvoice({
        invoice_type: invoiceType,
        period_month: invoiceType === 'RECURRING' ? periodMonth : undefined,
        concept: concept.trim(),
        subtotal: subtotalNum,
        has_iva: hasIva,
        is_cuenta_cobro: isCuentaCobro,
        currency,
        exchange_rate: currency === 'COP' ? parseFloat(exchangeRate) || undefined : undefined,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error al crear la factura');
    }
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'COP') {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Nueva Factura - {INVOICE_TYPE_LABELS[invoiceType]}
          </DialogTitle>
          <DialogDescription>
            Crea una nueva factura para este proyecto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concept">Concepto *</Label>
            <Input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Fee de Implementación"
            />
          </div>

          {invoiceType === 'RECURRING' && (
            <div className="space-y-2">
              <Label htmlFor="periodMonth">Periodo (Mes)</Label>
              <Input
                id="periodMonth"
                type="month"
                value={periodMonth.substring(0, 7)}
                onChange={(e) => setPeriodMonth(`${e.target.value}-01`)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select value={currency} onValueChange={(v: DealCurrency) => setCurrency(v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currency === 'COP' && (
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">TRM (COP/USD)</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="4200"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtotal">Subtotal (antes de IVA) *</Label>
            <Input
              id="subtotal"
              type="number"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Document type selector */}
          <div className="space-y-3">
            <Label>Tipo de documento</Label>
            <RadioGroup
              value={isCuentaCobro ? 'cuenta_cobro' : 'factura'}
              onValueChange={(value) => {
                const isCuenta = value === 'cuenta_cobro';
                setIsCuentaCobro(isCuenta);
                // Si es cuenta de cobro, típicamente no tiene IVA
                if (isCuenta) {
                  setHasIva(false);
                }
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="factura" id="factura" />
                <Label htmlFor="factura" className="flex items-center gap-1.5 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Factura
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cuenta_cobro" id="cuenta_cobro" />
                <Label htmlFor="cuenta_cobro" className="flex items-center gap-1.5 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Cuenta de Cobro
                </Label>
              </div>
            </RadioGroup>
            {isCuentaCobro && (
              <p className="text-xs text-muted-foreground">
                Las cuentas de cobro no causan IVA. Se usan típicamente para anticipos.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasIva"
              checked={hasIva}
              onCheckedChange={(checked) => setHasIva(checked === true)}
              disabled={isCuentaCobro}
            />
            <Label htmlFor="hasIva" className={`cursor-pointer ${isCuentaCobro ? 'text-muted-foreground' : ''}`}>
              Incluye IVA (19%)
            </Label>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotalNum)}</span>
            </div>
            {hasIva && (
              <div className="flex justify-between text-sm">
                <span>IVA (19%):</span>
                <span>{formatCurrency(ivaAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {currency === 'COP' && exchangeRate && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Equivalente USD:</span>
                <span>~${(total / parseFloat(exchangeRate)).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Factura'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
