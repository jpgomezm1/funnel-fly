import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowRightLeft, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ProjectWithRelations,
  ProjectStage,
  PROJECT_STAGE_LABELS,
  DealCurrency,
  DealStatus,
  DEAL_STATUS_LABELS,
} from '@/types/database';

interface EditProjectModalProps {
  open: boolean;
  onClose: () => void;
  project: ProjectWithRelations;
  onSuccess: () => void;
}

export function EditProjectModal({
  open,
  onClose,
  project,
  onSuccess,
}: EditProjectModalProps) {
  const queryClient = useQueryClient();

  // Project fields
  const [projectName, setProjectName] = useState('');
  const [projectStage, setProjectStage] = useState<ProjectStage>('DEMOSTRACION');

  // Deal fields
  const [currency, setCurrency] = useState<DealCurrency>('USD');
  const [mrr, setMrr] = useState('');
  const [implementationFee, setImplementationFee] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [dealStatus, setDealStatus] = useState<DealStatus>('ACTIVE');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);

  // Initialize form with project data
  useEffect(() => {
    if (open && project) {
      setProjectName(project.name);
      setProjectStage(project.stage);

      if (project.deal) {
        setCurrency(project.deal.currency);
        setMrr(project.deal.mrr_original?.toString() || '');
        setImplementationFee(project.deal.implementation_fee_original?.toString() || '');
        setExchangeRate(project.deal.exchange_rate?.toString() || '');
        setStartDate(project.deal.start_date ? new Date(project.deal.start_date) : new Date());
        setDealStatus(project.deal.status);
        setNotes(project.deal.notes || '');
      }
    }
  }, [open, project]);

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

    if (project.deal) {
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
    }

    return true;
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    setSaving(true);
    try {
      // Update project
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          name: projectName.trim(),
          stage: projectStage,
          stage_entered_at: project.stage !== projectStage ? new Date().toISOString() : undefined,
        })
        .eq('id', project.id);

      if (projectError) throw projectError;

      // Update deal if exists
      if (project.deal) {
        const mrrValue = mrr.trim() === '' ? 0 : parseFloat(mrr);
        const feeValue = implementationFee.trim() === '' ? 0 : parseFloat(implementationFee);
        const rateValue = parseFloat(exchangeRate);

        const { error: dealError } = await supabase
          .from('deals')
          .update({
            currency,
            mrr_original: mrrValue,
            implementation_fee_original: feeValue,
            exchange_rate: currency === 'COP' ? rateValue : null,
            mrr_usd: currency === 'USD' ? mrrValue : Math.round((mrrValue / rateValue) * 100) / 100,
            implementation_fee_usd: currency === 'USD' ? feeValue : Math.round((feeValue / rateValue) * 100) / 100,
            start_date: format(startDate!, 'yyyy-MM-dd'),
            status: dealStatus,
            notes: notes.trim() || null,
          })
          .eq('id', project.deal.id);

        if (dealError) throw dealError;
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error al actualizar el proyecto');
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
            <Briefcase className="h-5 w-5" />
            Editar Proyecto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nombre del Proyecto *</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Etapa del Proyecto</Label>
              <Select value={projectStage} onValueChange={(value: ProjectStage) => setProjectStage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STAGE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deal Fields (if deal exists) */}
          {project.deal && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium">Datos del Contrato</h3>

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
                  <Label>Estado del Contrato</Label>
                  <Select value={dealStatus} onValueChange={(value: DealStatus) => setDealStatus(value)}>
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
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid() || saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
