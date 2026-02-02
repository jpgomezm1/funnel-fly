import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LossReason, LOSS_REASON_LABELS } from '@/types/database';
import { AlertTriangle } from 'lucide-react';

interface LossReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lossReason: LossReason, notes: string) => Promise<void>;
  companyName: string;
}

export function LossReasonModal({ open, onClose, onConfirm, companyName }: LossReasonModalProps) {
  const [lossReason, setLossReason] = useState<LossReason | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!lossReason) return;
    setLoading(true);
    try {
      await onConfirm(lossReason, notes);
      setLossReason('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error saving loss reason:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLossReason('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Motivo de Cierre Perdido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Estás marcando <span className="font-medium text-foreground">{companyName}</span> como Cerrado Perdido.
            Selecciona el motivo:
          </p>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={lossReason} onValueChange={(v) => setLossReason(v as LossReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOSS_REASON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas adicionales (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre por qué se perdió..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!lossReason || loading}
          >
            {loading ? 'Guardando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
