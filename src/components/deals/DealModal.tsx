import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DealStatus, DEAL_STATUS_LABELS } from '@/types/database';

interface DealModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    mrr_usd: number;
    implementation_fee_usd: number;
    start_date: string;
    status: DealStatus;
    notes?: string;
  }) => Promise<void>;
  initial?: {
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
  const [mrrUsd, setMrrUsd] = useState('');
  const [implementationFeeUsd, setImplementationFeeUsd] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<DealStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form with initial values
  useEffect(() => {
    if (open) {
      setMrrUsd(initial?.mrr_usd?.toString() || '');
      setImplementationFeeUsd(initial?.implementation_fee_usd?.toString() || '0');
      setStartDate(initial?.start_date ? new Date(initial.start_date) : new Date());
      setStatus(initial?.status || 'ACTIVE');
      setNotes(initial?.notes || '');
    }
  }, [open, initial]);

  const handleSave = async () => {
    const mrrValue = parseFloat(mrrUsd);
    const feeValue = parseFloat(implementationFeeUsd);

    // Validations
    if (isNaN(mrrValue) || mrrValue < 0) {
      alert('El MRR debe ser un número mayor o igual a 0');
      return;
    }
    
    if (isNaN(feeValue) || feeValue < 0) {
      alert('El fee de implementación debe ser un número mayor o igual a 0');
      return;
    }

    if (!startDate) {
      alert('Selecciona una fecha de inicio');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        mrr_usd: mrrValue,
        implementation_fee_usd: feeValue,
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
    const mrrValue = parseFloat(mrrUsd);
    const feeValue = parseFloat(implementationFeeUsd);
    return !isNaN(mrrValue) && mrrValue >= 0 && 
           !isNaN(feeValue) && feeValue >= 0 && 
           startDate;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initial?.mrr_usd !== undefined ? 'Editar' : 'Registrar'} Contrato
            {leadCompanyName && ` - ${leadCompanyName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* MRR USD */}
          <div className="grid gap-2">
            <Label htmlFor="mrr">MRR (USD) *</Label>
            <Input
              id="mrr"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={mrrUsd}
              onChange={(e) => setMrrUsd(e.target.value)}
            />
          </div>

          {/* Implementation Fee USD */}
          <div className="grid gap-2">
            <Label htmlFor="fee">Fee de Implementación (USD)</Label>
            <Input
              id="fee"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={implementationFeeUsd}
              onChange={(e) => setImplementationFeeUsd(e.target.value)}
            />
          </div>

          {/* Start Date */}
          <div className="grid gap-2">
            <Label>Fecha de Inicio *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status */}
          <div className="grid gap-2">
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

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid() || loading}
          >
            {loading ? 'Guardando...' : 'Guardar Contrato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}