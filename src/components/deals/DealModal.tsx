import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DealStatus, DealCurrency, DEAL_STATUS_LABELS } from '@/types/database';

interface DealModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    currency: DealCurrency;
    mrr_original: number;
    implementation_fee_original: number;
    exchange_rate?: number;
    mrr_usd: number;
    implementation_fee_usd: number;
    start_date: string;
    status: DealStatus;
    notes?: string;
  }) => Promise<void>;
  initial?: {
    currency?: DealCurrency;
    mrr_original?: number;
    implementation_fee_original?: number;
    exchange_rate?: number;
    mrr_usd?: number;
    implementation_fee_usd?: number;
    start_date?: string;
    status?: DealStatus;
    notes?: string;
  };
  leadCompanyName?: string;
}

export function DealModal({
  open,
  onClose,
  onSave,
  initial,
  leadCompanyName
}: DealModalProps) {
  const [currency, setCurrency] = useState<DealCurrency>('USD');
  const [mrr, setMrr] = useState('');
  const [implementationFee, setImplementationFee] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<DealStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form with initial values
  useEffect(() => {
    if (open) {
      setCurrency(initial?.currency || 'USD');
      setMrr(initial?.mrr_original?.toString() || '');
      setImplementationFee(initial?.implementation_fee_original?.toString() || '0');
      setExchangeRate(initial?.exchange_rate?.toString() || '');
      setStartDate(initial?.start_date ? new Date(initial.start_date) : new Date());
      setStatus(initial?.status || 'ACTIVE');
      setNotes(initial?.notes || '');
    }
  }, [open, initial]);

  // Calculate USD values
  const calculateUsdValues = () => {
    const mrrValue = parseFloat(mrr) || 0;
    const feeValue = parseFloat(implementationFee) || 0;
    const rate = parseFloat(exchangeRate) || 0;

    if (currency === 'USD') {
      return { mrr_usd: mrrValue, fee_usd: feeValue };
    } else if (rate > 0) {
      return {
        mrr_usd: Math.round((mrrValue / rate) * 100) / 100,
        fee_usd: Math.round((feeValue / rate) * 100) / 100
      };
    }
    return { mrr_usd: 0, fee_usd: 0 };
  };

  const { mrr_usd, fee_usd } = calculateUsdValues();

  const handleSave = async () => {
    // Treat empty strings as 0
    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = implementationFee.trim() === '' ? 0 : parseFloat(implementationFee);
    const rateValue = parseFloat(exchangeRate);

    // Validations
    if (isNaN(mrrValue) || mrrValue < 0) {
      alert('El MRR debe ser un número mayor o igual a 0');
      return;
    }

    if (isNaN(feeValue) || feeValue < 0) {
      alert('El fee de implementación debe ser un número mayor o igual a 0');
      return;
    }

    if (currency === 'COP' && (isNaN(rateValue) || rateValue <= 0)) {
      alert('Debes ingresar una tasa de cambio válida para COP');
      return;
    }

    if (!startDate) {
      alert('Selecciona una fecha de inicio');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        currency,
        mrr_original: mrrValue,
        implementation_fee_original: feeValue,
        exchange_rate: currency === 'COP' ? rateValue : undefined,
        mrr_usd: currency === 'USD' ? mrrValue : Math.round((mrrValue / rateValue) * 100) / 100,
        implementation_fee_usd: currency === 'USD' ? feeValue : Math.round((feeValue / rateValue) * 100) / 100,
        start_date: format(startDate, 'yyyy-MM-dd'),
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Error al guardar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    // Treat empty strings as 0 (valid)
    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = implementationFee.trim() === '' ? 0 : parseFloat(implementationFee);
    const rateValue = parseFloat(exchangeRate);

    const baseValid = !isNaN(mrrValue) && mrrValue >= 0 &&
                      !isNaN(feeValue) && feeValue >= 0 &&
                      startDate;

    if (currency === 'COP') {
      return baseValid && !isNaN(rateValue) && rateValue > 0;
    }

    return baseValid;
  };

  const formatCurrency = (value: number, curr: DealCurrency) => {
    if (curr === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial?.mrr_usd !== undefined ? 'Editar' : 'Nuevo'} Contrato
          </DialogTitle>
          {leadCompanyName && (
            <p className="text-sm text-muted-foreground">{leadCompanyName}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select value={currency} onValueChange={(value: DealCurrency) => setCurrency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - Dólares</SelectItem>
                <SelectItem value="COP">COP - Pesos Colombianos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Financial Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mrr">MRR ({currency}) *</Label>
              <Input
                id="mrr"
                type="number"
                min="0"
                step={currency === 'COP' ? '1000' : '0.01'}
                placeholder="0"
                value={mrr}
                onChange={(e) => setMrr(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Fee Implementación ({currency})</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                step={currency === 'COP' ? '1000' : '0.01'}
                placeholder="0"
                value={implementationFee}
                onChange={(e) => setImplementationFee(e.target.value)}
              />
            </div>
          </div>

          {/* Exchange Rate (only for COP) */}
          {currency === 'COP' && (
            <div className="space-y-2">
              <Label htmlFor="exchangeRate" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Tasa de Cambio (COP por USD) *
              </Label>
              <Input
                id="exchangeRate"
                type="number"
                min="0"
                step="1"
                placeholder="Ej: 4200"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
              />
              {parseFloat(exchangeRate) > 0 && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground mb-1">Conversión a USD:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">MRR:</span>
                      <p className="font-medium">{formatCurrency(mrr_usd, 'USD')}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Fee:</span>
                      <p className="font-medium">{formatCurrency(fee_usd, 'USD')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(value: DealStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEAL_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre el contrato..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid() || loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
