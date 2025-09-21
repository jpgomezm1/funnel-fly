import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, Sparkles } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 border-0 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-6 pb-8 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 rounded-2xl" />
            <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl animate-pulse" />

            <div className="relative flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-lg">
              <div className="relative p-4 bg-gradient-to-br from-green-500/20 to-emerald-600/30 rounded-2xl shadow-xl border border-green-500/20">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  {initial?.mrr_usd !== undefined ? 'Editar' : 'Registrar'} Contrato
                </DialogTitle>
                {leadCompanyName && (
                  <p className="text-slate-600 dark:text-slate-300 font-semibold text-lg mt-1">{leadCompanyName}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {initial?.mrr_usd !== undefined ? 'Modificando contrato' : 'Creando nuevo contrato'}
                  </span>
                </div>
              </div>
              <Sparkles className="h-8 w-8 text-green-600 animate-pulse" />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-8">
          {/* Financial Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/30 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Información Financiera</h3>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-950/20 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="mrr" className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center gap-2 uppercase tracking-wider">
                    <DollarSign className="h-4 w-4" />
                    MRR (USD) *
                  </Label>
                  <Input
                    id="mrr"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={mrrUsd}
                    onChange={(e) => setMrrUsd(e.target.value)}
                    className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-green-200 dark:border-green-700 transition-all duration-200 focus:border-green-400 focus:bg-white dark:focus:bg-slate-800 hover:border-green-300 dark:hover:border-green-600 rounded-xl text-lg font-medium shadow-lg"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="fee" className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center gap-2 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    Fee de Implementación (USD)
                  </Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={implementationFeeUsd}
                    onChange={(e) => setImplementationFeeUsd(e.target.value)}
                    className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-green-200 dark:border-green-700 transition-all duration-200 focus:border-green-400 focus:bg-white dark:focus:bg-slate-800 hover:border-green-300 dark:hover:border-green-600 rounded-xl text-lg font-medium shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contract Details Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl shadow-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Detalles del Contrato</h3>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/30 dark:to-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                    <CalendarIcon className="h-4 w-4" />
                    Fecha de Inicio *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-14 justify-start text-left font-semibold bg-white/80 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl shadow-lg text-lg",
                          !startDate && "text-slate-400"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-200 dark:border-blue-700 rounded-xl shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="p-4 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    Estado
                  </Label>
                  <Select value={status} onValueChange={(value: DealStatus) => setStatus(value)}>
                    <SelectTrigger className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl shadow-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-200 dark:border-blue-700 rounded-xl shadow-2xl">
                      {Object.entries(DEAL_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg m-1">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Label htmlFor="notes" className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  placeholder="💼 Notas adicionales sobre el contrato, términos especiales, observaciones..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] bg-white/80 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl text-base font-medium shadow-lg resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-14 px-8 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl font-semibold"
          >
            <span className="h-5 w-5 mr-3">✕</span>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid() || loading}
            className="h-14 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border border-green-400/20 font-semibold text-white"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 mr-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <DollarSign className="h-5 w-5 mr-3" />
                Guardar Contrato
                <Sparkles className="h-5 w-5 ml-3" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}