import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowRightLeft, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Deal, DealCurrency, DealStatus, DEAL_STATUS_LABELS } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface EditDealModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal;
  onSuccess: () => void;
}

export function EditDealModal({
  open,
  onClose,
  deal,
  onSuccess,
}: EditDealModalProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [currency, setCurrency] = useState<DealCurrency>(deal.currency);
  const [mrr, setMrr] = useState(deal.mrr_original.toString());
  const [implementationFee, setImplementationFee] = useState(deal.implementation_fee_original.toString());
  const [exchangeRate, setExchangeRate] = useState(deal.exchange_rate?.toString() || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    deal.start_date ? parseISO(deal.start_date) : new Date()
  );
  const [status, setStatus] = useState<DealStatus>(deal.status);
  const [notes, setNotes] = useState(deal.notes || '');

  // Reset form when deal changes
  useEffect(() => {
    setCurrency(deal.currency);
    setMrr(deal.mrr_original.toString());
    setImplementationFee(deal.implementation_fee_original.toString());
    setExchangeRate(deal.exchange_rate?.toString() || '');
    setStartDate(deal.start_date ? parseISO(deal.start_date) : new Date());
    setStatus(deal.status);
    setNotes(deal.notes || '');
  }, [deal]);

  const calculateUsdValues = () => {
    const mrrValue = parseFloat(mrr) || 0;
    const feeValue = parseFloat(implementationFee) || 0;
    const rate = parseFloat(exchangeRate) || 0;

    if (currency === 'USD') {
      return { mrr_usd: mrrValue, fee_usd: feeValue };
    } else if (rate > 0) {
      return {
        mrr_usd: Math.round((mrrValue / rate) * 100) / 100,
        fee_usd: Math.round((feeValue / rate) * 100) / 100,
      };
    }
    return { mrr_usd: 0, fee_usd: 0 };
  };

  const { mrr_usd, fee_usd } = calculateUsdValues();

  const isFormValid = () => {
    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = implementationFee.trim() === '' ? 0 : parseFloat(implementationFee);
    const rateValue = parseFloat(exchangeRate);

    const baseValid =
      !isNaN(mrrValue) &&
      mrrValue >= 0 &&
      !isNaN(feeValue) &&
      feeValue >= 0 &&
      startDate;

    if (currency === 'COP') {
      return baseValid && !isNaN(rateValue) && rateValue > 0;
    }

    return baseValid;
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = implementationFee.trim() === '' ? 0 : parseFloat(implementationFee);
    const rateValue = parseFloat(exchangeRate);

    setSaving(true);
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          currency,
          mrr_original: mrrValue,
          implementation_fee_original: feeValue,
          exchange_rate: currency === 'COP' ? rateValue : null,
          mrr_usd: currency === 'USD' ? mrrValue : Math.round((mrrValue / rateValue) * 100) / 100,
          implementation_fee_usd: currency === 'USD' ? feeValue : Math.round((feeValue / rateValue) * 100) / 100,
          start_date: format(startDate!, 'yyyy-MM-dd'),
          status,
          notes: notes.trim() || null,
        })
        .eq('id', deal.id);

      if (error) throw error;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating deal:', error);
      alert('Error al actualizar el contrato');
    } finally {
      setSaving(false);
    }
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Contrato
          </DialogTitle>
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
              <Label htmlFor="mrr">MRR ({currency})</Label>
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
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : 'Seleccionar'}
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
              className="min-h-[60px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid() || saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
