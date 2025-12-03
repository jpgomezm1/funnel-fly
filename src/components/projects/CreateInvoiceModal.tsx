import { useState, useEffect, useMemo } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Loader2, Receipt, FileText, CreditCard, Percent, AlertCircle, CheckCircle, Banknote } from 'lucide-react';
import { useProjectInvoices } from '@/hooks/useProjectInvoices';
import { Deal, Invoice, InvoiceType, DealCurrency, INVOICE_TYPE_LABELS } from '@/types/database';
import { cn } from '@/lib/utils';

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  deal: Deal;
  invoiceType: InvoiceType;
  onSuccess: () => void;
}

const IVA_RATE = 0.19;

const ADVANCE_PERCENTAGES = [
  { value: 30, label: '30%' },
  { value: 50, label: '50%' },
  { value: 70, label: '70%' },
  { value: 100, label: '100%' },
];

export function CreateInvoiceModal({
  open,
  onClose,
  projectId,
  deal,
  invoiceType,
  onSuccess,
}: CreateInvoiceModalProps) {
  const { createInvoice, isCreating, invoices } = useProjectInvoices({ projectId });

  const [concept, setConcept] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [hasIva, setHasIva] = useState(true);
  const [isCuentaCobro, setIsCuentaCobro] = useState(false);
  const [currency, setCurrency] = useState<DealCurrency>(deal.currency);
  const [exchangeRate, setExchangeRate] = useState(deal.exchange_rate?.toString() || '');
  const [periodMonth, setPeriodMonth] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // For ADVANCE type
  const [advancePercent, setAdvancePercent] = useState(50);
  const [advanceIsFactura, setAdvanceIsFactura] = useState(false); // false = cuenta de cobro, true = factura

  // For IMPLEMENTATION type - select advance to deduct
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string>('none');

  // Get available paid advances for implementation invoice
  const paidAdvances = useMemo(() => {
    return invoices.filter(
      (inv) => inv.invoice_type === 'ADVANCE' && inv.status === 'PAID'
    );
  }, [invoices]);

  // Get selected advance details
  const selectedAdvance = useMemo(() => {
    if (selectedAdvanceId === 'none') return null;
    return paidAdvances.find((adv) => adv.id === selectedAdvanceId) || null;
  }, [selectedAdvanceId, paidAdvances]);

  // Calculate IVA and total
  const subtotalNum = parseFloat(subtotal) || 0;
  const ivaAmount = hasIva ? subtotalNum * IVA_RATE : 0;
  const total = subtotalNum + ivaAmount;

  // For implementation: calculate what will be received after advance deduction
  const advanceDeduction = selectedAdvance?.total || 0;
  const amountToReceive = total - advanceDeduction;

  // Calculate remaining amount for implementation after advance
  const getRemainingImplementation = useMemo(() => {
    if (!selectedAdvance) {
      return {
        subtotal: deal.implementation_fee_original,
        concept: 'Fee de Implementación',
      };
    }
    // If advance was a factura, we subtract the advance subtotal (both have their own IVA)
    // If advance was cuenta de cobro, we still invoice the full amount but receive less
    if (!selectedAdvance.is_cuenta_cobro) {
      // Advance was factura - remaining is full fee minus advance subtotal
      const remainingSubtotal = deal.implementation_fee_original - selectedAdvance.subtotal;
      return {
        subtotal: remainingSubtotal,
        concept: 'Fee de Implementación - Saldo',
      };
    }
    // Advance was cuenta de cobro - invoice full amount
    return {
      subtotal: deal.implementation_fee_original,
      concept: 'Fee de Implementación',
    };
  }, [selectedAdvance, deal]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (invoiceType === 'ADVANCE') {
        // Anticipo: based on percentage of implementation fee
        setAdvancePercent(50);
        setAdvanceIsFactura(false); // Default to cuenta de cobro
        const advanceAmount = deal.implementation_fee_original * 0.5;
        setConcept('Anticipo - 50% Fee de Implementación');
        setSubtotal(advanceAmount.toString());
        setHasIva(false);
        setIsCuentaCobro(true);
        setSelectedAdvanceId('none');
      } else if (invoiceType === 'IMPLEMENTATION') {
        // Auto-select advance if there's only one paid
        if (paidAdvances.length === 1) {
          setSelectedAdvanceId(paidAdvances[0].id);
        } else {
          setSelectedAdvanceId('none');
        }
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
        setSelectedAdvanceId('none');
      }
      setCurrency(deal.currency);
      setExchangeRate(deal.exchange_rate?.toString() || '');
      setDueDate('');
      setNotes('');
    }
  }, [open, invoiceType, deal, paidAdvances]);

  // Update subtotal and IVA when advance percentage or type changes
  useEffect(() => {
    if (open && invoiceType === 'ADVANCE') {
      const advanceAmount = deal.implementation_fee_original * (advancePercent / 100);
      setSubtotal(advanceAmount.toString());
      setConcept(`Anticipo - ${advancePercent}% Fee de Implementación`);
      // Update IVA and document type based on selection
      setHasIva(advanceIsFactura);
      setIsCuentaCobro(!advanceIsFactura);
    }
  }, [advancePercent, advanceIsFactura, open, invoiceType, deal]);

  // Update subtotal when selected advance changes for implementation
  useEffect(() => {
    if (open && invoiceType === 'IMPLEMENTATION') {
      setConcept(getRemainingImplementation.concept);
      setSubtotal(getRemainingImplementation.subtotal.toString());
    }
  }, [selectedAdvanceId, open, invoiceType, getRemainingImplementation]);

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
      alert('Error al crear el cobro');
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
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <span className="truncate">Nuevo Cobro - {INVOICE_TYPE_LABELS[invoiceType]}</span>
          </DialogTitle>
          <DialogDescription>
            {invoiceType === 'ADVANCE' && 'Crea un anticipo sobre el fee de implementación.'}
            {invoiceType === 'IMPLEMENTATION' && 'Crea la factura del fee de implementación.'}
            {invoiceType === 'RECURRING' && 'Crea un cobro de mensualidad.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ADVANCE: Percentage and type selector */}
          {invoiceType === 'ADVANCE' && (
            <div className="space-y-4">
              {/* Document Type Selection */}
              <div className="space-y-3">
                <Label>Tipo de documento del anticipo</Label>
                <RadioGroup
                  value={advanceIsFactura ? 'factura' : 'cuenta_cobro'}
                  onValueChange={(value) => setAdvanceIsFactura(value === 'factura')}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="adv_cuenta_cobro"
                    className={cn(
                      'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                      !advanceIsFactura ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <RadioGroupItem value="cuenta_cobro" id="adv_cuenta_cobro" />
                    <CreditCard className="h-4 w-4" />
                    <div className="text-left">
                      <span className="text-sm font-medium">Cuenta de Cobro</span>
                      <p className="text-xs text-muted-foreground">Sin IVA</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="adv_factura"
                    className={cn(
                      'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                      advanceIsFactura ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <RadioGroupItem value="factura" id="adv_factura" />
                    <FileText className="h-4 w-4" />
                    <div className="text-left">
                      <span className="text-sm font-medium">Factura</span>
                      <p className="text-xs text-muted-foreground">Con IVA 19%</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Percentage selector */}
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800 space-y-4">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                  <Percent className="h-4 w-4" />
                  <span className="font-medium">Porcentaje del Anticipo</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {ADVANCE_PERCENTAGES.map((pct) => (
                    <Button
                      key={pct.value}
                      type="button"
                      variant={advancePercent === pct.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAdvancePercent(pct.value)}
                      className={cn(
                        advancePercent === pct.value && 'bg-violet-600 hover:bg-violet-700'
                      )}
                    >
                      {pct.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Personalizado:</span>
                    <span className="font-semibold">{advancePercent}%</span>
                  </div>
                  <Slider
                    value={[advancePercent]}
                    onValueChange={([value]) => setAdvancePercent(value)}
                    min={10}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>

                <div className="pt-2 border-t border-violet-200 dark:border-violet-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee de Implementación:</span>
                    <span>{formatCurrency(deal.implementation_fee_original)}</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-1">
                    <span>Anticipo ({advancePercent}%):</span>
                    <span className="text-violet-600 dark:text-violet-400">
                      {formatCurrency(deal.implementation_fee_original * (advancePercent / 100))}
                    </span>
                  </div>
                  {advanceIsFactura && (
                    <div className="flex justify-between text-sm mt-1 text-muted-foreground">
                      <span>+ IVA (19%):</span>
                      <span>
                        {formatCurrency(deal.implementation_fee_original * (advancePercent / 100) * IVA_RATE)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  {advanceIsFactura ? (
                    <p>
                      Al crear el anticipo como <strong>factura</strong>, incluirá IVA.
                      La factura del saldo solo será por el monto restante (también con su IVA).
                    </p>
                  ) : (
                    <p>
                      Al crear el anticipo como <strong>cuenta de cobro</strong>, no incluye IVA.
                      La factura de implementación será por el monto total + IVA completo.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* IMPLEMENTATION: Select advance to deduct */}
          {invoiceType === 'IMPLEMENTATION' && paidAdvances.length > 0 && (
            <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Banknote className="h-4 w-4" />
                <span className="font-medium">Anticipo Existente</span>
              </div>

              <Select value={selectedAdvanceId} onValueChange={setSelectedAdvanceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar anticipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin anticipo previo</SelectItem>
                  {paidAdvances.map((adv) => (
                    <SelectItem key={adv.id} value={adv.id}>
                      {adv.concept} - {formatCurrency(adv.total)} {adv.is_cuenta_cobro ? '(Cuenta de Cobro)' : '(Factura)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAdvance && (
                <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                  {selectedAdvance.is_cuenta_cobro ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-700 dark:text-amber-300">
                          Anticipo fue <strong>Cuenta de Cobro</strong> (sin IVA)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        La factura se emite por el total ({formatCurrency(deal.implementation_fee_original)} + IVA),
                        pero recibirás {formatCurrency(deal.implementation_fee_original * (1 + IVA_RATE) - selectedAdvance.total)}
                        (descontando el anticipo de {formatCurrency(selectedAdvance.total)}).
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-700 dark:text-amber-300">
                          Anticipo fue <strong>Factura</strong> (con IVA)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Esta factura será solo por el saldo restante: {formatCurrency(getRemainingImplementation.subtotal)} + IVA.
                        El anticipo de {formatCurrency(selectedAdvance.subtotal)} + IVA ya fue facturado.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select value={currency} onValueChange={(v: DealCurrency) => setCurrency(v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP - Pesos</SelectItem>
                  <SelectItem value="USD">USD - Dólares</SelectItem>
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
            <Label htmlFor="subtotal">
              {invoiceType === 'ADVANCE' ? 'Monto del Anticipo *' : 'Subtotal (antes de IVA) *'}
            </Label>
            <Input
              id="subtotal"
              type="number"
              step={currency === 'COP' ? '1000' : '0.01'}
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              placeholder="0"
              className="text-lg"
            />
          </div>

          {/* Document type selector - only for non-advance */}
          {invoiceType !== 'ADVANCE' && (
            <div className="space-y-3">
              <Label>Tipo de documento</Label>
              <RadioGroup
                value={isCuentaCobro ? 'cuenta_cobro' : 'factura'}
                onValueChange={(value) => {
                  const isCuenta = value === 'cuenta_cobro';
                  setIsCuentaCobro(isCuenta);
                  if (isCuenta) {
                    setHasIva(false);
                  }
                }}
                className="grid grid-cols-2 gap-2"
              >
                <Label
                  htmlFor="factura"
                  className={cn(
                    'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                    !isCuentaCobro ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  )}
                >
                  <RadioGroupItem value="factura" id="factura" />
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Factura</span>
                </Label>
                <Label
                  htmlFor="cuenta_cobro"
                  className={cn(
                    'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                    isCuentaCobro ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  )}
                >
                  <RadioGroupItem value="cuenta_cobro" id="cuenta_cobro" />
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">Cuenta de Cobro</span>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* IVA checkbox - only show for factura, not cuenta de cobro */}
          {!isCuentaCobro && invoiceType !== 'ADVANCE' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasIva"
                checked={hasIva}
                onCheckedChange={(checked) => setHasIva(checked === true)}
              />
              <Label htmlFor="hasIva" className="cursor-pointer">
                Incluye IVA (19%)
              </Label>
            </div>
          )}

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
              <span>Total Documento:</span>
              <span className="text-lg">{formatCurrency(total)}</span>
            </div>

            {/* For implementation with advance - cuenta de cobro scenario */}
            {invoiceType === 'IMPLEMENTATION' && selectedAdvance && selectedAdvance.is_cuenta_cobro && (
              <>
                <div className="flex justify-between text-sm text-amber-600 pt-2 border-t">
                  <span>(-) Anticipo (cuenta de cobro):</span>
                  <span>-{formatCurrency(selectedAdvance.total)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-600">
                  <span>= A recibir (antes de retención):</span>
                  <span className="text-lg">{formatCurrency(total - selectedAdvance.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  La factura se emite por {formatCurrency(total)}, pero solo recibirás {formatCurrency(total - selectedAdvance.total)} porque ya se pagó el anticipo.
                </p>
              </>
            )}

            {/* For implementation with advance - factura scenario (no deduction shown, different subtotal) */}
            {invoiceType === 'IMPLEMENTATION' && selectedAdvance && !selectedAdvance.is_cuenta_cobro && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Esta es la factura del saldo. El anticipo de {formatCurrency(selectedAdvance.total)} ya fue facturado por separado.
              </p>
            )}

            {currency === 'COP' && exchangeRate && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Equivalente USD:</span>
                <span>~${(total / parseFloat(exchangeRate)).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha de Vencimiento (opcional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              className="min-h-[60px]"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Cobro'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
