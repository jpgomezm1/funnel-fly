import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';
import { DealCurrency } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

interface SetBookedValuesModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

export function SetBookedValuesModal({
  open,
  onClose,
  projectId,
  projectName,
  onSuccess,
}: SetBookedValuesModalProps) {
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState<DealCurrency>('USD');
  const [mrr, setMrr] = useState('');
  const [fee, setFee] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');

  const calculateUsdValues = () => {
    const mrrValue = parseFloat(mrr) || 0;
    const feeValue = parseFloat(fee) || 0;
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
    const feeValue = fee.trim() === '' ? 0 : parseFloat(fee);
    const rateValue = parseFloat(exchangeRate);

    const baseValid = !isNaN(mrrValue) && mrrValue >= 0 && !isNaN(feeValue) && feeValue >= 0;

    if (currency === 'COP') {
      return baseValid && !isNaN(rateValue) && rateValue > 0;
    }

    return baseValid;
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = fee.trim() === '' ? 0 : parseFloat(fee);
    const rateValue = parseFloat(exchangeRate);

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          stage: 'PROPUESTA',
          stage_entered_at: new Date().toISOString(),
          booked_currency: currency,
          booked_mrr_original: mrrValue,
          booked_fee_original: feeValue,
          booked_exchange_rate: currency === 'COP' ? rateValue : null,
          booked_mrr_usd: currency === 'USD' ? mrrValue : Math.round((mrrValue / rateValue) * 100) / 100,
          booked_fee_usd: currency === 'USD' ? feeValue : Math.round((feeValue / rateValue) * 100) / 100,
        })
        .eq('id', projectId);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving booked values:', error);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Valores Esperados (Booked)
          </DialogTitle>
          <DialogDescription>
            Ingresa los valores esperados para <strong>{projectName}</strong> antes de pasar a Propuesta.
          </DialogDescription>
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
              <Label htmlFor="mrr">MRR Esperado ({currency})</Label>
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
              <Label htmlFor="fee">Fee Esperado ({currency})</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                step={currency === 'COP' ? '1000' : '0.01'}
                placeholder="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
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
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid() || saving}>
            {saving ? 'Guardando...' : 'Guardar y Avanzar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
