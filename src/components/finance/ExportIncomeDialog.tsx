import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
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
import { Calendar as CalendarIcon, Download, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  FinanceTransaction,
  INCOME_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  RECURRING_FREQUENCY_LABELS,
  IncomeCategory,
  PaymentMethod,
  RecurringFrequency,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface ExportIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportIncomeDialog({ open, onOpenChange }: ExportIncomeDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let query = supabase
        .from('finance_transactions')
        .select('*')
        .eq('transaction_type', 'INCOME')
        .order('transaction_date', { ascending: false });

      if (startDate) {
        query = query.gte('transaction_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('transaction_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data: incomes, error } = await query;

      if (error) throw error;

      if (!incomes || incomes.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'No hay ingresos para exportar en el rango de fechas seleccionado',
          variant: 'destructive',
        });
        return;
      }

      const rows = (incomes as FinanceTransaction[]).map((income) => ({
        'Fecha': income.transaction_date,
        'Descripción': income.description,
        'Categoría': income.income_category
          ? INCOME_CATEGORY_LABELS[income.income_category as IncomeCategory]
          : '',
        'Fuente': income.vendor_or_source || '',
        'Monto Original': Number(income.amount_original) || 0,
        'Moneda': income.currency,
        'Tasa de Cambio': income.exchange_rate != null ? Number(income.exchange_rate) : '',
        'Monto USD': Number(income.amount_usd) || 0,
        'Método de Pago': income.payment_method
          ? PAYMENT_METHOD_LABELS[income.payment_method as PaymentMethod]
          : '',
        'Referencia': income.reference_number || '',
        'Recurrente': income.is_recurring ? 'Sí' : 'No',
        'Frecuencia': income.recurring_frequency
          ? RECURRING_FREQUENCY_LABELS[income.recurring_frequency as RecurringFrequency]
          : '',
        'Notas': income.notes || '',
      }));

      const totalUsd = rows.reduce((sum, r) => sum + (Number(r['Monto USD']) || 0), 0);

      const worksheet = XLSX.utils.json_to_sheet(rows);

      worksheet['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 40 }, // Descripción
        { wch: 22 }, // Categoría
        { wch: 24 }, // Fuente
        { wch: 16 }, // Monto Original
        { wch: 8 },  // Moneda
        { wch: 14 }, // Tasa de Cambio
        { wch: 14 }, // Monto USD
        { wch: 18 }, // Método de Pago
        { wch: 18 }, // Referencia
        { wch: 12 }, // Recurrente
        { wch: 14 }, // Frecuencia
        { wch: 30 }, // Notas
      ];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [[], ['', '', '', '', '', '', 'Total USD:', totalUsd]],
        { origin: -1 }
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ingresos');

      let filename = 'ingresos';
      if (startDate && endDate) {
        filename += `_${format(startDate, 'yyyy-MM-dd')}_a_${format(endDate, 'yyyy-MM-dd')}`;
      } else if (startDate) {
        filename += `_desde_${format(startDate, 'yyyy-MM-dd')}`;
      } else if (endDate) {
        filename += `_hasta_${format(endDate, 'yyyy-MM-dd')}`;
      } else {
        filename += '_historico_completo';
      }
      filename += '.xlsx';

      XLSX.writeFile(workbook, filename);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${incomes.length} ingresos`,
      });

      setStartDate(undefined);
      setEndDate(undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting income:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar los ingresos',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exportar Ingresos a Excel
          </DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas para exportar los ingresos. Deja vacío para exportar todo el histórico.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
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

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {startDate || endDate ? (
              <p>
                Se exportarán los ingresos
                {startDate && ` desde el ${format(startDate, 'dd/MM/yyyy')}`}
                {endDate && ` hasta el ${format(endDate, 'dd/MM/yyyy')}`}
              </p>
            ) : (
              <p>Se exportará el histórico completo de todos los ingresos</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {(startDate || endDate) && (
            <Button variant="ghost" onClick={handleClearDates}>
              Limpiar fechas
            </Button>
          )}
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Descargar XLSX'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
