import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowRightLeft, Building2, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Lead, DealCurrency, DealStatus, DEAL_STATUS_LABELS } from '@/types/database';
import { useConvertLeadToClient } from '@/hooks/useProjects';

interface ConvertToClientModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess: (clientId: string) => void;
}

export function ConvertToClientModal({
  open,
  onClose,
  lead,
  onSuccess,
}: ConvertToClientModalProps) {
  const { convertLeadToClient, isConverting } = useConvertLeadToClient();

  // Project name
  const [projectName, setProjectName] = useState('');

  // Deal fields
  const [currency, setCurrency] = useState<DealCurrency>('USD');
  const [mrr, setMrr] = useState('');
  const [implementationFee, setImplementationFee] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<DealStatus>('ACTIVE');
  const [notes, setNotes] = useState('');

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
    if (!projectName.trim()) return false;

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

  const handleConvert = async () => {
    if (!isFormValid()) return;

    const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
    const feeValue = implementationFee.trim() === '' ? 0 : parseFloat(implementationFee);
    const rateValue = parseFloat(exchangeRate);

    try {
      const result = await convertLeadToClient({
        lead: {
          id: lead.id,
          company_name: lead.company_name,
          contact_name: lead.contact_name,
          contact_role: lead.contact_role,
          phone: lead.phone,
          email: lead.email,
          notes: lead.notes,
        },
        projectName: projectName.trim(),
        deal: {
          currency,
          mrr_original: mrrValue,
          implementation_fee_original: feeValue,
          exchange_rate: currency === 'COP' ? rateValue : undefined,
          mrr_usd: currency === 'USD' ? mrrValue : Math.round((mrrValue / rateValue) * 100) / 100,
          implementation_fee_usd: currency === 'USD' ? feeValue : Math.round((feeValue / rateValue) * 100) / 100,
          start_date: format(startDate!, 'yyyy-MM-dd'),
          status,
          notes: notes.trim() || undefined,
        },
      });

      onSuccess(result.client.id);
      onClose();
    } catch (error) {
      console.error('Error converting lead to client:', error);
      alert('Error al convertir el lead a cliente');
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
            <Building2 className="h-5 w-5" />
            Convertir a Cliente
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{lead.company_name}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Nombre del Proyecto *
            </Label>
            <Input
              id="projectName"
              placeholder="Ej: Implementación WhatsApp CRM"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Este será el nombre del primer proyecto con este cliente
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4">Datos del Contrato</h3>

            {/* Currency Selection */}
            <div className="space-y-2 mb-4">
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
            <div className="grid grid-cols-2 gap-4 mb-4">
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
              <div className="space-y-2 mb-4">
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
            <div className="grid grid-cols-2 gap-4 mb-4">
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
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isConverting}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={!isFormValid() || isConverting}>
            {isConverting ? 'Convirtiendo...' : 'Convertir a Cliente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
