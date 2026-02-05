import { useState } from 'react';
import { format } from 'date-fns';
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
import { Calendar as CalendarIcon, Download, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  FinanceTransaction,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CLASSIFICATION_LABELS,
  PAYMENT_METHOD_LABELS,
  ExpenseCategory,
  ExpenseClassification,
  PaymentMethod,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface ExportExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportExpensesDialog({ open, onOpenChange }: ExportExpensesDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Build query
      let query = supabase
        .from('finance_transactions')
        .select('*')
        .eq('transaction_type', 'EXPENSE')
        .order('transaction_date', { ascending: false });

      // Apply date filters if provided
      if (startDate) {
        query = query.gte('transaction_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('transaction_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data: expenses, error } = await query;

      if (error) throw error;

      if (!expenses || expenses.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'No hay gastos para exportar en el rango de fechas seleccionado',
          variant: 'destructive',
        });
        return;
      }

      // Generate CSV
      const csvContent = generateCSV(expenses as FinanceTransaction[]);

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      // Generate filename with date range
      let filename = 'gastos';
      if (startDate && endDate) {
        filename += `_${format(startDate, 'yyyy-MM-dd')}_a_${format(endDate, 'yyyy-MM-dd')}`;
      } else if (startDate) {
        filename += `_desde_${format(startDate, 'yyyy-MM-dd')}`;
      } else if (endDate) {
        filename += `_hasta_${format(endDate, 'yyyy-MM-dd')}`;
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
        description: `Se exportaron ${expenses.length} gastos`,
      });

      // Reset and close
      setStartDate(undefined);
      setEndDate(undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting expenses:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar los gastos',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (expenses: FinanceTransaction[]): string => {
    // CSV Headers
    const headers = [
      'Fecha',
      'Descripción',
      'Categoría',
      'Clasificación',
      'Proveedor',
      'Monto Original',
      'Moneda',
      'Tasa de Cambio',
      'Monto USD',
      'Método de Pago',
      'Referencia',
      'Recurrente',
      'Notas',
    ];

    // CSV Rows
    const rows = expenses.map((expense) => [
      expense.transaction_date,
      escapeCSV(expense.description),
      expense.expense_category
        ? EXPENSE_CATEGORY_LABELS[expense.expense_category as ExpenseCategory]
        : '',
      expense.expense_classification
        ? EXPENSE_CLASSIFICATION_LABELS[expense.expense_classification as ExpenseClassification]
        : '',
      escapeCSV(expense.vendor_or_source || ''),
      expense.amount_original.toString(),
      expense.currency,
      expense.exchange_rate?.toString() || '',
      expense.amount_usd.toString(),
      expense.payment_method
        ? PAYMENT_METHOD_LABELS[expense.payment_method as PaymentMethod]
        : '',
      escapeCSV(expense.reference_number || ''),
      expense.is_recurring ? 'Sí' : 'No',
      escapeCSV(expense.notes || ''),
    ]);

    // Combine headers and rows
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
            Exportar Gastos a CSV
          </DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas para exportar los gastos. Deja vacío para exportar todo el histórico.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
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

            {/* End Date */}
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

          {/* Info text */}
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {startDate || endDate ? (
              <p>
                Se exportarán los gastos
                {startDate && ` desde el ${format(startDate, 'dd/MM/yyyy')}`}
                {endDate && ` hasta el ${format(endDate, 'dd/MM/yyyy')}`}
              </p>
            ) : (
              <p>Se exportará el histórico completo de todos los gastos</p>
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
            {isExporting ? 'Exportando...' : 'Descargar CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
