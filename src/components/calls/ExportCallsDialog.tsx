import { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Download, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Call,
  CallTeamMember,
  CallResult,
  CallSource,
  CompanySize,
  OperationalMaturity,
  ContactRole,
  ProblemType,
  AffectedArea,
  ImpactLevel,
  PaymentCapacity,
  Urgency,
  YesNo,
  QualificationDecision,
  RiskSignal,
  TEAM_MEMBER_LABELS,
  CALL_RESULT_LABELS,
  CALL_SOURCE_LABELS,
  COMPANY_SIZE_LABELS,
  OPERATIONAL_MATURITY_LABELS,
  CONTACT_ROLE_LABELS,
  PROBLEM_TYPE_LABELS,
  AFFECTED_AREA_LABELS,
  IMPACT_LEVEL_LABELS,
  PAYMENT_CAPACITY_LABELS,
  URGENCY_LABELS,
  YES_NO_LABELS,
  QUALIFICATION_DECISION_LABELS,
  RISK_SIGNAL_LABELS,
} from '@/types/calls';
import { toast } from '@/hooks/use-toast';

type PeriodPreset = 'all' | 'this_week' | 'this_month' | 'this_year' | 'custom';

interface ExportCallsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportCallsDialog({ open, onOpenChange }: ExportCallsDialogProps) {
  const [period, setPeriod] = useState<PeriodPreset>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const getDateRangeFromPreset = (): { start: Date | null; end: Date | null } => {
    const now = new Date();
    switch (period) {
      case 'this_week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: startDate || null, end: endDate || null };
      default:
        return { start: null, end: null };
    }
  };

  const getInfoText = (): string => {
    const range = getDateRangeFromPreset();
    if (!range.start && !range.end) return 'Se exportará el histórico completo de todas las llamadas';
    let text = 'Se exportarán las llamadas';
    if (range.start) text += ` desde el ${format(range.start, 'dd/MM/yyyy')}`;
    if (range.end) text += ` hasta el ${format(range.end, 'dd/MM/yyyy')}`;
    return text;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let query = supabase
        .from('calls')
        .select('*')
        .order('scheduled_at', { ascending: false });

      const range = getDateRangeFromPreset();
      if (range.start) {
        query = query.gte('scheduled_at', range.start.toISOString());
      }
      if (range.end) {
        query = query.lte('scheduled_at', range.end.toISOString());
      }

      const { data: calls, error } = await query;

      if (error) throw error;

      if (!calls || calls.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'No hay llamadas para exportar en el rango seleccionado',
          variant: 'destructive',
        });
        return;
      }

      const csvContent = generateCSV(calls as Call[]);

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      let filename = 'llamadas';
      if (range.start && range.end) {
        filename += `_${format(range.start, 'yyyy-MM-dd')}_a_${format(range.end, 'yyyy-MM-dd')}`;
      } else if (range.start) {
        filename += `_desde_${format(range.start, 'yyyy-MM-dd')}`;
      } else if (range.end) {
        filename += `_hasta_${format(range.end, 'yyyy-MM-dd')}`;
      } else {
        filename += '_historico_completo';
      }
      filename += '.csv';

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${calls.length} llamadas`,
      });

      handleClear();
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting calls:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar las llamadas',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateStr;
    }
  };

  const generateCSV = (calls: Call[]): string => {
    const headers = [
      'ID',
      'Fecha Programada',
      'Empresa',
      'Contacto',
      'Telefono',
      'Email',
      'LinkedIn Contacto',
      'LinkedIn Empresa',
      'Responsable',
      'Fuente',
      'Resultado',
      'Duracion (min)',
      'Next Step',
      'Transcripcion',
      'Notas Clave',
      'Notas',
      'Industria',
      'Tamano Empresa',
      'Madurez Operativa',
      'Rol Contacto',
      'Problema Declarado',
      'Tipo Problema',
      'Area Afectada',
      'Problema Real',
      'Impacta Revenue',
      'Impacta Control',
      'Impacta Continuidad',
      'Nivel Impacto Global',
      'Decisor Final',
      'Quien Paga',
      'Quien Sufre Problema',
      'Stakeholders Alineados',
      'Capacidad de Pago',
      'Urgencia',
      'Intento Antes',
      'Senales de Riesgo',
      'Otras Senales Riesgo',
      'Decision Calificacion',
      'Justificacion Decision',
      'Creado',
      'Actualizado',
    ];

    const rows = calls.map((call) => {
      const q = call.qualification;
      return [
        escapeCSV(call.id),
        formatDate(call.scheduled_at),
        escapeCSV(call.company_name || ''),
        escapeCSV(call.contact_name || ''),
        escapeCSV(call.contact_phone || ''),
        escapeCSV(call.contact_email || ''),
        escapeCSV(call.contact_linkedin || ''),
        escapeCSV(call.company_linkedin || ''),
        call.team_member ? TEAM_MEMBER_LABELS[call.team_member as CallTeamMember] || call.team_member : '',
        call.source ? CALL_SOURCE_LABELS[call.source as CallSource] || call.source : '',
        call.call_result ? CALL_RESULT_LABELS[call.call_result as CallResult] || call.call_result : '',
        call.duration_minutes?.toString() || '',
        escapeCSV(call.next_step || ''),
        escapeCSV(call.transcript || ''),
        escapeCSV(call.key_notes ? call.key_notes.join('; ') : ''),
        escapeCSV(call.notes || ''),
        escapeCSV(q?.industry || ''),
        q?.company_size ? COMPANY_SIZE_LABELS[q.company_size as CompanySize] || q.company_size : '',
        q?.operational_maturity ? OPERATIONAL_MATURITY_LABELS[q.operational_maturity as OperationalMaturity] || q.operational_maturity : '',
        q?.contact_role ? CONTACT_ROLE_LABELS[q.contact_role as ContactRole] || q.contact_role : '',
        escapeCSV(q?.client_problem_description || ''),
        q?.problem_type ? PROBLEM_TYPE_LABELS[q.problem_type as ProblemType] || q.problem_type : '',
        q?.affected_area ? AFFECTED_AREA_LABELS[q.affected_area as AffectedArea] || q.affected_area : '',
        escapeCSV(q?.real_problem_description || ''),
        q?.impacts_revenue ? YES_NO_LABELS[q.impacts_revenue as YesNo] || q.impacts_revenue : '',
        q?.impacts_control ? YES_NO_LABELS[q.impacts_control as YesNo] || q.impacts_control : '',
        q?.impacts_continuity ? YES_NO_LABELS[q.impacts_continuity as YesNo] || q.impacts_continuity : '',
        q?.global_impact_level ? IMPACT_LEVEL_LABELS[q.global_impact_level as ImpactLevel] || q.global_impact_level : '',
        escapeCSV(q?.final_decision_maker || ''),
        escapeCSV(q?.who_pays || ''),
        escapeCSV(q?.who_suffers_problem || ''),
        q?.stakeholders_aligned != null ? (q.stakeholders_aligned ? 'Sí' : 'No') : '',
        q?.payment_capacity ? PAYMENT_CAPACITY_LABELS[q.payment_capacity as PaymentCapacity] || q.payment_capacity : '',
        q?.urgency ? URGENCY_LABELS[q.urgency as Urgency] || q.urgency : '',
        q?.tried_before ? YES_NO_LABELS[q.tried_before as YesNo] || q.tried_before : '',
        escapeCSV(q?.risk_signals ? q.risk_signals.map((s: RiskSignal) => RISK_SIGNAL_LABELS[s] || s).join('; ') : ''),
        escapeCSV(q?.other_risk_signals || ''),
        q?.qualification_decision ? QUALIFICATION_DECISION_LABELS[q.qualification_decision as QualificationDecision] || q.qualification_decision : '',
        escapeCSV(q?.decision_justification || ''),
        formatDate(call.created_at),
        formatDate(call.updated_at),
      ];
    });

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ];

    return csvLines.join('\n');
  };

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const handleClear = () => {
    setPeriod('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exportar Llamadas a CSV
          </DialogTitle>
          <DialogDescription>
            Selecciona un periodo para exportar las llamadas con toda la información de calificación.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Period selector */}
          <div className="space-y-2">
            <Label>Periodo</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo</SelectItem>
                <SelectItem value="this_week">Esta semana</SelectItem>
                <SelectItem value="this_month">Este mes</SelectItem>
                <SelectItem value="this_year">Este año</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom date pickers */}
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
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
                      {startDate ? format(startDate, 'dd MMM yyyy', { locale: es }) : 'Sin límite'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={es}
                      disabled={(date) => endDate ? date > endDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd MMM yyyy', { locale: es }) : 'Sin límite'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={es}
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Info text */}
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p>{getInfoText()}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {period !== 'all' && (
            <Button variant="ghost" onClick={handleClear}>
              Limpiar
            </Button>
          )}
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Descargar CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
