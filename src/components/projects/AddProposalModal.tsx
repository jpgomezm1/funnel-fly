import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, FileText, Link as LinkIcon } from 'lucide-react';
import { DealCurrency } from '@/types/database';
import { useProposals } from '@/hooks/useProposals';

interface AddProposalModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function AddProposalModal({
  open,
  onClose,
  projectId,
  onSuccess,
}: AddProposalModalProps) {
  const { createProposal, isCreating } = useProposals(projectId);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [currency, setCurrency] = useState<DealCurrency>('USD');
  const [mrr, setMrr] = useState('');
  const [fee, setFee] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [notes, setNotes] = useState('');

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
    if (!name.trim()) return false;

    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = fee.trim() === '' ? 0 : parseFloat(fee);
    const rateValue = parseFloat(exchangeRate);

    const baseValid = !isNaN(mrrValue) && mrrValue >= 0 && !isNaN(feeValue) && feeValue >= 0;

    if (currency === 'COP') {
      return baseValid && !isNaN(rateValue) && rateValue > 0;
    }

    return baseValid;
  };

  const handleCreate = async () => {
    if (!isFormValid()) return;

    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = fee.trim() === '' ? 0 : parseFloat(fee);
    const rateValue = parseFloat(exchangeRate);

    try {
      await createProposal({
        project_id: projectId,
        name: name.trim(),
        url: url.trim() || undefined,
        currency,
        mrr_original: mrrValue,
        fee_original: feeValue,
        exchange_rate: currency === 'COP' ? rateValue : undefined,
        mrr_usd: currency === 'USD' ? mrrValue : Math.round((mrrValue / rateValue) * 100) / 100,
        fee_usd: currency === 'USD' ? feeValue : Math.round((feeValue / rateValue) * 100) / 100,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setName('');
      setUrl('');
      setCurrency('USD');
      setMrr('');
      setFee('');
      setExchangeRate('');
      setNotes('');

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating proposal:', error);
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
            <FileText className="h-5 w-5" />
            Agregar Propuesta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Propuesta *</Label>
            <Input
              id="name"
              placeholder="Ej: Propuesta Inicial, Propuesta Ajustada..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <LinkIcon className="h-3 w-3" />
              URL de la Propuesta
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre esta propuesta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!isFormValid() || isCreating}>
            {isCreating ? 'Guardando...' : 'Guardar Propuesta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
