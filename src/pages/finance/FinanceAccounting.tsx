import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Building2,
  Receipt,
  Calculator,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useExchangeRate,
  getDateRangeFromPreset,
  DATE_RANGE_PRESET_LABELS,
  DateRangePreset,
} from '@/hooks/useFinanceDashboardMetrics';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface Transaction {
  id: string;
  transaction_type: 'INCOME' | 'EXPENSE';
  income_category: string | null;
  expense_category: string | null;
  expense_classification: 'FIXED' | 'VARIABLE' | null;
  amount_original: number;
  currency: string;
  exchange_rate: number | null;
  amount_usd: number;
  description: string;
  vendor_or_source: string | null;
  reference_number: string | null;
  transaction_date: string;
  payment_method: string | null;
  notes: string | null;
}

interface Invoice {
  id: string;
  project_id: string;
  invoice_type: string;
  period_month: string | null;
  concept: string;
  subtotal: number;
  has_iva: boolean;
  iva_amount: number;
  total: number;
  currency: string;
  exchange_rate: number | null;
  total_usd: number;
  invoice_number: string | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  retention_amount: number;
  is_cuenta_cobro: boolean;
  created_at: string;
  projects?: {
    name: string;
    clients?: {
      company_name: string;
    };
  };
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  'PAYROLL': 'Nómina',
  'OFFICE': 'Oficina',
  'SUBSCRIPTIONS': 'Suscripciones',
  'INFRASTRUCTURE': 'Infraestructura',
  'INSURANCE': 'Seguros',
  'ACCOUNTING': 'Contabilidad',
  'BANKING': 'Gastos Bancarios',
  'MARKETING': 'Marketing',
  'SALES_COMMISSION': 'Comisiones',
  'FREELANCERS': 'Freelancers',
  'TRAVEL': 'Viáticos',
  'EQUIPMENT': 'Equipos',
  'BRAND': 'Branding',
  'TRAINING': 'Capacitación',
  'EVENTS': 'Eventos',
  'LEGAL': 'Legal',
  'CONSTITUTION': 'Constitución',
  'TAXES': 'Impuestos',
  'OTHER_EXPENSE': 'Otros Gastos'
};

const INCOME_CATEGORY_LABELS: Record<string, string> = {
  'MRR': 'Ingresos Recurrentes (MRR)',
  'IMPLEMENTATION_FEE': 'Fee de Implementación',
  'CONSULTING': 'Consultoría',
  'PARTNER_CONTRIBUTION': 'Aporte de Socios',
  'OTHER_INCOME': 'Otros Ingresos'
};

// Colombian PUC (Plan Único de Cuentas) mapping - simplified
const PUC_ACCOUNTS: Record<string, { code: string; name: string }> = {
  // Ingresos (4xxx)
  'MRR': { code: '4135', name: 'Servicios de Software' },
  'IMPLEMENTATION_FEE': { code: '4135', name: 'Servicios de Software' },
  'CONSULTING': { code: '4130', name: 'Honorarios' },
  'PARTNER_CONTRIBUTION': { code: '3115', name: 'Aportes Sociales' },
  'OTHER_INCOME': { code: '4295', name: 'Diversos' },
  // Gastos (5xxx)
  'PAYROLL': { code: '5105', name: 'Gastos de Personal' },
  'OFFICE': { code: '5120', name: 'Arrendamientos' },
  'SUBSCRIPTIONS': { code: '5195', name: 'Gastos Diversos' },
  'INFRASTRUCTURE': { code: '5160', name: 'Seguros' },
  'INSURANCE': { code: '5160', name: 'Seguros' },
  'ACCOUNTING': { code: '5110', name: 'Honorarios' },
  'BANKING': { code: '5305', name: 'Gastos Financieros' },
  'MARKETING': { code: '5135', name: 'Servicios' },
  'SALES_COMMISSION': { code: '5135', name: 'Servicios' },
  'FREELANCERS': { code: '5110', name: 'Honorarios' },
  'TRAVEL': { code: '5145', name: 'Gastos de Viaje' },
  'EQUIPMENT': { code: '5160', name: 'Depreciaciones' },
  'BRAND': { code: '5135', name: 'Servicios' },
  'TRAINING': { code: '5195', name: 'Gastos Diversos' },
  'EVENTS': { code: '5195', name: 'Gastos Diversos' },
  'LEGAL': { code: '5110', name: 'Honorarios' },
  'CONSTITUTION': { code: '5110', name: 'Honorarios' },
  'TAXES': { code: '5115', name: 'Impuestos' },
  'OTHER_EXPENSE': { code: '5195', name: 'Gastos Diversos' },
};

function formatCurrency(amount: number, currency: 'USD' | 'COP' = 'USD'): string {
  if (currency === 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  // Manejar fechas YYYY-MM-DD correctamente para evitar problemas de timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  // Para otros formatos, parsear y formatear
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Helper to build date range label
function buildDateRangeLabel(startDate: string, endDate: string): string {
  const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const startParts = startDate.split('-');
  const endParts = endDate.split('-');
  const startLabel = `${MONTH_LABELS[parseInt(startParts[1]) - 1]} ${startParts[0]}`;
  const endLabel = `${MONTH_LABELS[parseInt(endParts[1]) - 1]} ${endParts[0]}`;
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

export default function FinanceAccounting() {
  // Date range state - same as Dashboard
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('this_year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'COP'>('COP');
  const [activeTab, setActiveTab] = useState('libro-diario');

  // Get the actual date range based on preset or custom dates
  const dateRange = useMemo(() => {
    if (selectedPreset === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return getDateRangeFromPreset(selectedPreset);
  }, [selectedPreset, customStartDate, customEndDate]);

  const dateRangeLabel = buildDateRangeLabel(dateRange.startDate, dateRange.endDate);

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const { exchangeRate } = useExchangeRate();

  // Fetch transactions
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['accounting-transactions', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .gte('transaction_date', dateRange.startDate)
        .lte('transaction_date', dateRange.endDate)
        .order('transaction_date', { ascending: true });

      if (error) throw error;
      return (data || []) as Transaction[];
    },
  });

  // Fetch invoices
  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['accounting-invoices', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          projects (
            name,
            clients (
              company_name
            )
          )
        `)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Invoice[];
    },
  });

  const convert = (amountUsd: number) => {
    if (currency === 'COP') {
      return amountUsd * (exchangeRate || 4200);
    }
    return amountUsd;
  };

  // Computed data for reports
  const reportData = useMemo(() => {
    if (!transactions) return null;

    // Libro Diario - all transactions sorted by date
    const libroDiario = transactions.map((t, index) => ({
      numero: index + 1,
      fecha: t.transaction_date,
      cuenta: t.transaction_type === 'INCOME'
        ? PUC_ACCOUNTS[t.income_category || 'OTHER_INCOME']?.code || '4295'
        : PUC_ACCOUNTS[t.expense_category || 'OTHER_EXPENSE']?.code || '5195',
      nombreCuenta: t.transaction_type === 'INCOME'
        ? INCOME_CATEGORY_LABELS[t.income_category || 'OTHER_INCOME'] || t.income_category
        : EXPENSE_CATEGORY_LABELS[t.expense_category || 'OTHER_EXPENSE'] || t.expense_category,
      descripcion: t.description,
      tercero: t.vendor_or_source || '-',
      debito: t.transaction_type === 'EXPENSE' ? t.amount_usd : 0,
      credito: t.transaction_type === 'INCOME' ? t.amount_usd : 0,
      referencia: t.reference_number || '-',
    }));

    // Libro Mayor - grouped by account
    const libroMayorMap = new Map<string, {
      cuenta: string;
      nombreCuenta: string;
      tipo: string;
      movimientos: typeof libroDiario;
      totalDebito: number;
      totalCredito: number;
      saldo: number;
    }>();

    transactions.forEach(t => {
      const cuenta = t.transaction_type === 'INCOME'
        ? PUC_ACCOUNTS[t.income_category || 'OTHER_INCOME']?.code || '4295'
        : PUC_ACCOUNTS[t.expense_category || 'OTHER_EXPENSE']?.code || '5195';

      const nombreCuenta = t.transaction_type === 'INCOME'
        ? INCOME_CATEGORY_LABELS[t.income_category || 'OTHER_INCOME'] || t.income_category
        : EXPENSE_CATEGORY_LABELS[t.expense_category || 'OTHER_EXPENSE'] || t.expense_category;

      if (!libroMayorMap.has(cuenta)) {
        libroMayorMap.set(cuenta, {
          cuenta,
          nombreCuenta: nombreCuenta || cuenta,
          tipo: t.transaction_type,
          movimientos: [],
          totalDebito: 0,
          totalCredito: 0,
          saldo: 0,
        });
      }

      const entry = libroMayorMap.get(cuenta)!;
      entry.movimientos.push({
        numero: entry.movimientos.length + 1,
        fecha: t.transaction_date,
        cuenta,
        nombreCuenta: nombreCuenta || cuenta,
        descripcion: t.description,
        tercero: t.vendor_or_source || '-',
        debito: t.transaction_type === 'EXPENSE' ? t.amount_usd : 0,
        credito: t.transaction_type === 'INCOME' ? t.amount_usd : 0,
        referencia: t.reference_number || '-',
      });

      if (t.transaction_type === 'EXPENSE') {
        entry.totalDebito += t.amount_usd;
      } else {
        entry.totalCredito += t.amount_usd;
      }
      entry.saldo = entry.totalDebito - entry.totalCredito;
    });

    const libroMayor = Array.from(libroMayorMap.values()).sort((a, b) => a.cuenta.localeCompare(b.cuenta));

    // Estado de Resultados (P&L)
    const ingresos = transactions
      .filter(t => t.transaction_type === 'INCOME' && t.income_category !== 'PARTNER_CONTRIBUTION')
      .reduce((sum, t) => sum + t.amount_usd, 0);

    const aportesSocios = transactions
      .filter(t => t.income_category === 'PARTNER_CONTRIBUTION')
      .reduce((sum, t) => sum + t.amount_usd, 0);

    const gastos = transactions
      .filter(t => t.transaction_type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount_usd, 0);

    const gastosFijos = transactions
      .filter(t => t.transaction_type === 'EXPENSE' && t.expense_classification === 'FIXED')
      .reduce((sum, t) => sum + t.amount_usd, 0);

    const gastosVariables = transactions
      .filter(t => t.transaction_type === 'EXPENSE' && t.expense_classification === 'VARIABLE')
      .reduce((sum, t) => sum + t.amount_usd, 0);

    // Breakdown by category
    const ingresosPorCategoria = transactions
      .filter(t => t.transaction_type === 'INCOME')
      .reduce((acc, t) => {
        const cat = t.income_category || 'OTHER_INCOME';
        acc[cat] = (acc[cat] || 0) + t.amount_usd;
        return acc;
      }, {} as Record<string, number>);

    const gastosPorCategoria = transactions
      .filter(t => t.transaction_type === 'EXPENSE')
      .reduce((acc, t) => {
        const cat = t.expense_category || 'OTHER_EXPENSE';
        acc[cat] = (acc[cat] || 0) + t.amount_usd;
        return acc;
      }, {} as Record<string, number>);

    // Auxiliar de Terceros
    const terceros = transactions
      .filter(t => t.vendor_or_source)
      .reduce((acc, t) => {
        const tercero = t.vendor_or_source!;
        if (!acc[tercero]) {
          acc[tercero] = {
            tercero,
            ingresos: 0,
            gastos: 0,
            transacciones: 0,
          };
        }
        if (t.transaction_type === 'INCOME') {
          acc[tercero].ingresos += t.amount_usd;
        } else {
          acc[tercero].gastos += t.amount_usd;
        }
        acc[tercero].transacciones++;
        return acc;
      }, {} as Record<string, { tercero: string; ingresos: number; gastos: number; transacciones: number }>);

    const auxiliarTerceros = Object.values(terceros).sort((a, b) =>
      (b.ingresos + b.gastos) - (a.ingresos + a.gastos)
    );

    return {
      libroDiario,
      libroMayor,
      estadoResultados: {
        ingresos,
        aportesSocios,
        gastos,
        gastosFijos,
        gastosVariables,
        utilidadOperacional: ingresos - gastos,
        utilidadNeta: ingresos + aportesSocios - gastos,
        ingresosPorCategoria,
        gastosPorCategoria,
      },
      auxiliarTerceros,
      balanceComprobacion: libroMayor.map(l => ({
        cuenta: l.cuenta,
        nombreCuenta: l.nombreCuenta,
        debito: l.totalDebito,
        credito: l.totalCredito,
        saldoDeudor: l.saldo > 0 ? l.saldo : 0,
        saldoAcreedor: l.saldo < 0 ? Math.abs(l.saldo) : 0,
      })),
    };
  }, [transactions]);

  // IVA Report from invoices
  const ivaReport = useMemo(() => {
    if (!invoices) return null;

    const invoicesWithIva = invoices.filter(i => i.has_iva && i.iva_amount > 0);
    const totalBase = invoicesWithIva.reduce((sum, i) => sum + i.subtotal, 0);
    const totalIva = invoicesWithIva.reduce((sum, i) => sum + i.iva_amount, 0);
    const totalConIva = invoicesWithIva.reduce((sum, i) => sum + i.total, 0);

    return {
      facturas: invoicesWithIva.map(i => ({
        numero: i.invoice_number || '-',
        fecha: i.created_at,
        cliente: i.projects?.clients?.company_name || i.projects?.name || '-',
        concepto: i.concept,
        base: i.subtotal,
        iva: i.iva_amount,
        total: i.total,
        estado: i.status,
      })),
      totales: {
        base: totalBase,
        iva: totalIva,
        total: totalConIva,
      },
    };
  }, [invoices]);

  // Retenciones Report
  const retencionesReport = useMemo(() => {
    if (!invoices) return null;

    const invoicesWithRetention = invoices.filter(i => i.retention_amount > 0);
    const totalRetenciones = invoicesWithRetention.reduce((sum, i) => sum + i.retention_amount, 0);

    return {
      facturas: invoicesWithRetention.map(i => ({
        numero: i.invoice_number || '-',
        fecha: i.created_at,
        cliente: i.projects?.clients?.company_name || i.projects?.name || '-',
        concepto: i.concept,
        base: i.subtotal,
        retencion: i.retention_amount,
        neto: i.total - i.retention_amount,
      })),
      totalRetenciones,
    };
  }, [invoices]);

  // Export functions
  const exportToExcel = (reportName: string) => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    switch (reportName) {
      case 'libro-diario': {
        const data = reportData.libroDiario.map(r => ({
          'No.': r.numero,
          'Fecha': formatDate(r.fecha),
          'Cuenta': r.cuenta,
          'Nombre Cuenta': r.nombreCuenta,
          'Descripción': r.descripcion,
          'Tercero': r.tercero,
          'Débito': convert(r.debito),
          'Crédito': convert(r.credito),
          'Referencia': r.referencia,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Libro Diario');
        break;
      }
      case 'libro-mayor': {
        reportData.libroMayor.forEach(cuenta => {
          const data = cuenta.movimientos.map(m => ({
            'Fecha': formatDate(m.fecha),
            'Descripción': m.descripcion,
            'Tercero': m.tercero,
            'Débito': convert(m.debito),
            'Crédito': convert(m.credito),
            'Referencia': m.referencia,
          }));
          data.push({
            'Fecha': '',
            'Descripción': 'TOTALES',
            'Tercero': '',
            'Débito': convert(cuenta.totalDebito),
            'Crédito': convert(cuenta.totalCredito),
            'Referencia': '',
          });
          const ws = XLSX.utils.json_to_sheet(data);
          const sheetName = `${cuenta.cuenta}-${cuenta.nombreCuenta}`.substring(0, 31);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        break;
      }
      case 'estado-resultados': {
        const { estadoResultados } = reportData;
        const data = [
          { 'Concepto': 'INGRESOS OPERACIONALES', 'Valor': '' },
          ...Object.entries(estadoResultados.ingresosPorCategoria)
            .filter(([cat]) => cat !== 'PARTNER_CONTRIBUTION')
            .map(([cat, val]) => ({
              'Concepto': `  ${INCOME_CATEGORY_LABELS[cat] || cat}`,
              'Valor': formatCurrency(convert(val), currency),
            })),
          { 'Concepto': 'TOTAL INGRESOS OPERACIONALES', 'Valor': formatCurrency(convert(estadoResultados.ingresos), currency) },
          { 'Concepto': '', 'Valor': '' },
          { 'Concepto': 'GASTOS OPERACIONALES', 'Valor': '' },
          { 'Concepto': '  Gastos Fijos', 'Valor': formatCurrency(convert(estadoResultados.gastosFijos), currency) },
          { 'Concepto': '  Gastos Variables', 'Valor': formatCurrency(convert(estadoResultados.gastosVariables), currency) },
          { 'Concepto': 'TOTAL GASTOS', 'Valor': formatCurrency(convert(estadoResultados.gastos), currency) },
          { 'Concepto': '', 'Valor': '' },
          { 'Concepto': 'UTILIDAD OPERACIONAL', 'Valor': formatCurrency(convert(estadoResultados.utilidadOperacional), currency) },
          { 'Concepto': '', 'Valor': '' },
          { 'Concepto': 'OTROS INGRESOS (Aportes Socios)', 'Valor': formatCurrency(convert(estadoResultados.aportesSocios), currency) },
          { 'Concepto': '', 'Valor': '' },
          { 'Concepto': 'UTILIDAD NETA', 'Valor': formatCurrency(convert(estadoResultados.utilidadNeta), currency) },
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados');
        break;
      }
      case 'auxiliar-terceros': {
        const data = reportData.auxiliarTerceros.map(t => ({
          'Tercero': t.tercero,
          'Ingresos': formatCurrency(convert(t.ingresos), currency),
          'Gastos': formatCurrency(convert(t.gastos), currency),
          'Neto': formatCurrency(convert(t.ingresos - t.gastos), currency),
          'No. Transacciones': t.transacciones,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Auxiliar Terceros');
        break;
      }
      case 'balance-comprobacion': {
        const data = reportData.balanceComprobacion.map(b => ({
          'Cuenta': b.cuenta,
          'Nombre': b.nombreCuenta,
          'Débito': formatCurrency(convert(b.debito), currency),
          'Crédito': formatCurrency(convert(b.credito), currency),
          'Saldo Deudor': formatCurrency(convert(b.saldoDeudor), currency),
          'Saldo Acreedor': formatCurrency(convert(b.saldoAcreedor), currency),
        }));
        const totals = reportData.balanceComprobacion.reduce((acc, b) => ({
          debito: acc.debito + b.debito,
          credito: acc.credito + b.credito,
          saldoDeudor: acc.saldoDeudor + b.saldoDeudor,
          saldoAcreedor: acc.saldoAcreedor + b.saldoAcreedor,
        }), { debito: 0, credito: 0, saldoDeudor: 0, saldoAcreedor: 0 });
        data.push({
          'Cuenta': '',
          'Nombre': 'TOTALES',
          'Débito': formatCurrency(convert(totals.debito), currency),
          'Crédito': formatCurrency(convert(totals.credito), currency),
          'Saldo Deudor': formatCurrency(convert(totals.saldoDeudor), currency),
          'Saldo Acreedor': formatCurrency(convert(totals.saldoAcreedor), currency),
        });
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Balance Comprobación');
        break;
      }
      case 'informe-iva': {
        if (!ivaReport) return;
        const data = ivaReport.facturas.map(f => ({
          'No. Factura': f.numero,
          'Fecha': formatDate(f.fecha),
          'Cliente': f.cliente,
          'Concepto': f.concepto,
          'Base': formatCurrency(f.base, 'COP'),
          'IVA': formatCurrency(f.iva, 'COP'),
          'Total': formatCurrency(f.total, 'COP'),
          'Estado': f.estado,
        }));
        data.push({
          'No. Factura': '',
          'Fecha': '',
          'Cliente': '',
          'Concepto': 'TOTALES',
          'Base': formatCurrency(ivaReport.totales.base, 'COP'),
          'IVA': formatCurrency(ivaReport.totales.iva, 'COP'),
          'Total': formatCurrency(ivaReport.totales.total, 'COP'),
          'Estado': '',
        });
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Informe IVA');
        break;
      }
      case 'informe-retenciones': {
        if (!retencionesReport) return;
        const data = retencionesReport.facturas.map(f => ({
          'No. Factura': f.numero,
          'Fecha': formatDate(f.fecha),
          'Cliente': f.cliente,
          'Concepto': f.concepto,
          'Base': formatCurrency(f.base, 'COP'),
          'Retención': formatCurrency(f.retencion, 'COP'),
          'Neto a Recibir': formatCurrency(f.neto, 'COP'),
        }));
        data.push({
          'No. Factura': '',
          'Fecha': '',
          'Cliente': '',
          'Concepto': 'TOTAL RETENCIONES',
          'Base': '',
          'Retención': formatCurrency(retencionesReport.totalRetenciones, 'COP'),
          'Neto a Recibir': '',
        });
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Informe Retenciones');
        break;
      }
    }

    XLSX.writeFile(wb, `${reportName}_${dateRangeLabel.replace(/ /g, '_')}.xlsx`);
  };

  const exportToPDF = (reportName: string) => {
    if (!reportData) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text('irrelevant', 14, 15);
    doc.setFontSize(10);
    doc.text(`NIT: 901.XXX.XXX-X`, 14, 22);
    doc.setFontSize(12);

    switch (reportName) {
      case 'libro-diario': {
        doc.text(`LIBRO DIARIO - ${dateRangeLabel}`, 14, 35);
        autoTable(doc, {
          startY: 42,
          head: [['No.', 'Fecha', 'Cuenta', 'Descripción', 'Débito', 'Crédito']],
          body: reportData.libroDiario.map(r => [
            r.numero,
            formatDate(r.fecha),
            r.cuenta,
            r.descripcion.substring(0, 30),
            formatCurrency(convert(r.debito), currency),
            formatCurrency(convert(r.credito), currency),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });
        break;
      }
      case 'estado-resultados': {
        const { estadoResultados } = reportData;
        doc.text(`ESTADO DE RESULTADOS - ${dateRangeLabel}`, 14, 35);

        let y = 50;
        doc.setFontSize(11);
        doc.text('INGRESOS OPERACIONALES', 14, y);
        y += 8;

        doc.setFontSize(10);
        Object.entries(estadoResultados.ingresosPorCategoria)
          .filter(([cat]) => cat !== 'PARTNER_CONTRIBUTION')
          .forEach(([cat, val]) => {
            doc.text(`  ${INCOME_CATEGORY_LABELS[cat] || cat}`, 14, y);
            doc.text(formatCurrency(convert(val), currency), 150, y, { align: 'right' });
            y += 6;
          });

        doc.setFontSize(11);
        doc.text('TOTAL INGRESOS', 14, y);
        doc.text(formatCurrency(convert(estadoResultados.ingresos), currency), 150, y, { align: 'right' });
        y += 12;

        doc.text('GASTOS OPERACIONALES', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.text('  Gastos Fijos', 14, y);
        doc.text(formatCurrency(convert(estadoResultados.gastosFijos), currency), 150, y, { align: 'right' });
        y += 6;
        doc.text('  Gastos Variables', 14, y);
        doc.text(formatCurrency(convert(estadoResultados.gastosVariables), currency), 150, y, { align: 'right' });
        y += 6;
        doc.setFontSize(11);
        doc.text('TOTAL GASTOS', 14, y);
        doc.text(formatCurrency(convert(estadoResultados.gastos), currency), 150, y, { align: 'right' });
        y += 12;

        doc.setFontSize(12);
        doc.text('UTILIDAD OPERACIONAL', 14, y);
        doc.text(formatCurrency(convert(estadoResultados.utilidadOperacional), currency), 150, y, { align: 'right' });
        y += 10;

        doc.setFontSize(10);
        doc.text('Otros Ingresos (Aportes Socios)', 14, y);
        doc.text(formatCurrency(convert(estadoResultados.aportesSocios), currency), 150, y, { align: 'right' });
        y += 10;

        doc.setFontSize(14);
        doc.text('UTILIDAD NETA', 14, y);
        doc.text(formatCurrency(convert(estadoResultados.utilidadNeta), currency), 150, y, { align: 'right' });
        break;
      }
      case 'balance-comprobacion': {
        doc.text(`BALANCE DE COMPROBACIÓN - ${dateRangeLabel}`, 14, 35);
        const totals = reportData.balanceComprobacion.reduce((acc, b) => ({
          debito: acc.debito + b.debito,
          credito: acc.credito + b.credito,
          saldoDeudor: acc.saldoDeudor + b.saldoDeudor,
          saldoAcreedor: acc.saldoAcreedor + b.saldoAcreedor,
        }), { debito: 0, credito: 0, saldoDeudor: 0, saldoAcreedor: 0 });

        autoTable(doc, {
          startY: 42,
          head: [['Cuenta', 'Nombre', 'Débito', 'Crédito', 'Saldo Deudor', 'Saldo Acreedor']],
          body: [
            ...reportData.balanceComprobacion.map(b => [
              b.cuenta,
              b.nombreCuenta.substring(0, 20),
              formatCurrency(convert(b.debito), currency),
              formatCurrency(convert(b.credito), currency),
              formatCurrency(convert(b.saldoDeudor), currency),
              formatCurrency(convert(b.saldoAcreedor), currency),
            ]),
            ['', 'TOTALES',
              formatCurrency(convert(totals.debito), currency),
              formatCurrency(convert(totals.credito), currency),
              formatCurrency(convert(totals.saldoDeudor), currency),
              formatCurrency(convert(totals.saldoAcreedor), currency),
            ],
          ],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });
        break;
      }
      case 'informe-iva': {
        if (!ivaReport) return;
        doc.text(`INFORME DE IVA GENERADO - ${dateRangeLabel}`, 14, 35);
        autoTable(doc, {
          startY: 42,
          head: [['No. Factura', 'Fecha', 'Cliente', 'Base', 'IVA', 'Total']],
          body: [
            ...ivaReport.facturas.map(f => [
              f.numero,
              formatDate(f.fecha),
              f.cliente.substring(0, 25),
              formatCurrency(f.base, 'COP'),
              formatCurrency(f.iva, 'COP'),
              formatCurrency(f.total, 'COP'),
            ]),
            ['', '', 'TOTALES',
              formatCurrency(ivaReport.totales.base, 'COP'),
              formatCurrency(ivaReport.totales.iva, 'COP'),
              formatCurrency(ivaReport.totales.total, 'COP'),
            ],
          ],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });
        break;
      }
      case 'informe-retenciones': {
        if (!retencionesReport) return;
        doc.text(`INFORME DE RETENCIONES - ${dateRangeLabel}`, 14, 35);
        autoTable(doc, {
          startY: 42,
          head: [['No. Factura', 'Fecha', 'Cliente', 'Base', 'Retención', 'Neto']],
          body: [
            ...retencionesReport.facturas.map(f => [
              f.numero,
              formatDate(f.fecha),
              f.cliente.substring(0, 25),
              formatCurrency(f.base, 'COP'),
              formatCurrency(f.retencion, 'COP'),
              formatCurrency(f.neto, 'COP'),
            ]),
            ['', '', 'TOTAL RETENCIONES', '', formatCurrency(retencionesReport.totalRetenciones, 'COP'), ''],
          ],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });
        break;
      }
      default: {
        doc.text(`Informe no disponible para PDF: ${reportName}`, 14, 35);
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-CO')} - Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`${reportName}_${dateRangeLabel.replace(/ /g, '_')}.pdf`);
  };

  const isLoading = loadingTransactions || loadingInvoices;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Same style as Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Contabilidad
          </h1>
          <p className="text-muted-foreground">
            {dateRangeLabel} • Informes según normativa colombiana (PUC)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={currency === 'USD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrency('USD')}
            >
              USD
            </Button>
            <Button
              variant={currency === 'COP' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrency('COP')}
            >
              COP
            </Button>
          </div>

          {/* Date Range Selector - Same as Dashboard */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {DATE_RANGE_PRESET_LABELS[selectedPreset]}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Período</Label>
                  <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATE_RANGE_PRESET_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPreset === 'custom' && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm">Desde</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Hasta</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  {dateRange.startDate} → {dateRange.endDate}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards - Same grid as Dashboard */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ingresos Op.</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(convert(reportData.estadoResultados.ingresos), currency)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gastos Totales</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(convert(reportData.estadoResultados.gastos), currency)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Utilidad Op.</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    reportData.estadoResultados.utilidadOperacional >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(convert(reportData.estadoResultados.utilidadOperacional), currency)}
                  </p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  reportData.estadoResultados.utilidadOperacional >= 0 ? "bg-blue-100" : "bg-amber-100"
                )}>
                  <Calculator className={cn(
                    "h-6 w-6",
                    reportData.estadoResultados.utilidadOperacional >= 0 ? "text-blue-600" : "text-amber-600"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transacciones</p>
                  <p className="text-2xl font-bold">{transactions?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tabs - Same style as Dashboard */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-6">
              <TabsTrigger value="libro-diario">L. Diario</TabsTrigger>
              <TabsTrigger value="libro-mayor">L. Mayor</TabsTrigger>
              <TabsTrigger value="estado-resultados">P&L</TabsTrigger>
              <TabsTrigger value="balance-comprobacion">Balance</TabsTrigger>
              <TabsTrigger value="auxiliar-terceros">Terceros</TabsTrigger>
              <TabsTrigger value="informe-iva">IVA</TabsTrigger>
              <TabsTrigger value="informe-retenciones">Retenciones</TabsTrigger>
            </TabsList>

            {/* Libro Diario */}
            <TabsContent value="libro-diario" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Libro Diario</h3>
                  <p className="text-sm text-muted-foreground">Registro cronológico de todas las transacciones</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel('libro-diario')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToPDF('libro-diario')}>
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
              <div className="rounded-md border max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tercero</TableHead>
                      <TableHead className="text-right">Débito</TableHead>
                      <TableHead className="text-right">Crédito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.libroDiario.map((row) => (
                      <TableRow key={row.numero}>
                        <TableCell className="font-mono text-xs">{row.numero}</TableCell>
                        <TableCell className="text-sm">{formatDate(row.fecha)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {row.cuenta}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{row.descripcion}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.tercero}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.debito > 0 ? formatCurrency(convert(row.debito), currency) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.credito > 0 ? formatCurrency(convert(row.credito), currency) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData && reportData.libroDiario.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={5}>TOTALES</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            convert(reportData.libroDiario.reduce((sum, r) => sum + r.debito, 0)),
                            currency
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            convert(reportData.libroDiario.reduce((sum, r) => sum + r.credito, 0)),
                            currency
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Libro Mayor */}
            <TabsContent value="libro-mayor" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Libro Mayor</h3>
                  <p className="text-sm text-muted-foreground">Movimientos agrupados por cuenta contable (PUC)</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportToExcel('libro-mayor')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                </Button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-auto">
                {reportData?.libroMayor.map((cuenta) => (
                  <div key={cuenta.cuenta} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">{cuenta.cuenta}</Badge>
                        <span className="font-medium">{cuenta.nombreCuenta}</span>
                      </div>
                      <Badge variant={cuenta.tipo === 'INCOME' ? 'default' : 'destructive'}>
                        Saldo: {formatCurrency(convert(Math.abs(cuenta.saldo)), currency)}
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Tercero</TableHead>
                          <TableHead className="text-right">Débito</TableHead>
                          <TableHead className="text-right">Crédito</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cuenta.movimientos.map((m, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">{formatDate(m.fecha)}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{m.descripcion}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{m.tercero}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {m.debito > 0 ? formatCurrency(convert(m.debito), currency) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {m.credito > 0 ? formatCurrency(convert(m.credito), currency) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(convert(cuenta.totalDebito), currency)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(convert(cuenta.totalCredito), currency)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Estado de Resultados */}
            <TabsContent value="estado-resultados" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Estado de Resultados (P&L)</h3>
                  <p className="text-sm text-muted-foreground">Pérdidas y ganancias del período</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel('estado-resultados')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToPDF('estado-resultados')}>
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
              {reportData && (
                <div className="space-y-6 max-w-2xl">
                  {/* Ingresos */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      INGRESOS OPERACIONALES
                    </h4>
                    <div className="ml-6 space-y-2">
                      {Object.entries(reportData.estadoResultados.ingresosPorCategoria)
                        .filter(([cat]) => cat !== 'PARTNER_CONTRIBUTION')
                        .map(([cat, val]) => (
                          <div key={cat} className="flex justify-between text-sm py-1">
                            <span className="text-muted-foreground">
                              {INCOME_CATEGORY_LABELS[cat] || cat}
                            </span>
                            <span className="font-mono">{formatCurrency(convert(val), currency)}</span>
                          </div>
                        ))}
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Ingresos Operacionales</span>
                      <span className="font-mono text-emerald-600">
                        {formatCurrency(convert(reportData.estadoResultados.ingresos), currency)}
                      </span>
                    </div>
                  </div>

                  {/* Gastos */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      GASTOS OPERACIONALES
                    </h4>
                    <div className="ml-6 space-y-2">
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-muted-foreground">Gastos Fijos</span>
                        <span className="font-mono">
                          {formatCurrency(convert(reportData.estadoResultados.gastosFijos), currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-muted-foreground">Gastos Variables</span>
                        <span className="font-mono">
                          {formatCurrency(convert(reportData.estadoResultados.gastosVariables), currency)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Gastos</span>
                      <span className="font-mono text-red-600">
                        {formatCurrency(convert(reportData.estadoResultados.gastos), currency)}
                      </span>
                    </div>
                  </div>

                  {/* Utilidad Operacional */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between text-lg font-bold">
                      <span>UTILIDAD OPERACIONAL</span>
                      <span className={cn(
                        "font-mono",
                        reportData.estadoResultados.utilidadOperacional >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrency(convert(reportData.estadoResultados.utilidadOperacional), currency)}
                      </span>
                    </div>
                  </div>

                  {/* Otros Ingresos */}
                  {reportData.estadoResultados.aportesSocios > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">OTROS INGRESOS</h4>
                      <div className="ml-6">
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">Aportes de Socios</span>
                          <span className="font-mono">
                            {formatCurrency(convert(reportData.estadoResultados.aportesSocios), currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Utilidad Neta */}
                  <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                    <div className="flex justify-between text-xl font-bold">
                      <span>UTILIDAD NETA</span>
                      <span className={cn(
                        "font-mono",
                        reportData.estadoResultados.utilidadNeta >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrency(convert(reportData.estadoResultados.utilidadNeta), currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Balance de Comprobación */}
            <TabsContent value="balance-comprobacion" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Balance de Comprobación</h3>
                  <p className="text-sm text-muted-foreground">Resumen de saldos por cuenta contable</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel('balance-comprobacion')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToPDF('balance-comprobacion')}>
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
              <div className="rounded-md border max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Débito</TableHead>
                      <TableHead className="text-right">Crédito</TableHead>
                      <TableHead className="text-right">Saldo Deudor</TableHead>
                      <TableHead className="text-right">Saldo Acreedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.balanceComprobacion.map((row) => (
                      <TableRow key={row.cuenta}>
                        <TableCell className="font-mono">{row.cuenta}</TableCell>
                        <TableCell>{row.nombreCuenta}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(convert(row.debito), currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(convert(row.credito), currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.saldoDeudor > 0 ? formatCurrency(convert(row.saldoDeudor), currency) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.saldoAcreedor > 0 ? formatCurrency(convert(row.saldoAcreedor), currency) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2}>TOTALES</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            convert(reportData.balanceComprobacion.reduce((sum, r) => sum + r.debito, 0)),
                            currency
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            convert(reportData.balanceComprobacion.reduce((sum, r) => sum + r.credito, 0)),
                            currency
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            convert(reportData.balanceComprobacion.reduce((sum, r) => sum + r.saldoDeudor, 0)),
                            currency
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            convert(reportData.balanceComprobacion.reduce((sum, r) => sum + r.saldoAcreedor, 0)),
                            currency
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Auxiliar de Terceros */}
            <TabsContent value="auxiliar-terceros" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Auxiliar de Terceros</h3>
                  <p className="text-sm text-muted-foreground">Movimientos agrupados por proveedor/cliente</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportToExcel('auxiliar-terceros')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                </Button>
              </div>
              <div className="rounded-md border max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Tercero</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Gastos</TableHead>
                      <TableHead className="text-right">Neto</TableHead>
                      <TableHead className="text-right">Transacciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.auxiliarTerceros.map((row) => (
                      <TableRow key={row.tercero}>
                        <TableCell className="font-medium">{row.tercero}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-600">
                          {row.ingresos > 0 ? formatCurrency(convert(row.ingresos), currency) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {row.gastos > 0 ? formatCurrency(convert(row.gastos), currency) : '-'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono",
                          row.ingresos - row.gastos >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {formatCurrency(convert(row.ingresos - row.gastos), currency)}
                        </TableCell>
                        <TableCell className="text-right">{row.transacciones}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Informe IVA */}
            <TabsContent value="informe-iva" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Informe de IVA Generado</h3>
                  <p className="text-sm text-muted-foreground">Facturas con IVA del período (base para declaración)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel('informe-iva')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToPDF('informe-iva')}>
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
              {ivaReport && ivaReport.facturas.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Base Gravable</p>
                      <p className="text-xl font-bold">{formatCurrency(ivaReport.totales.base, 'COP')}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">IVA Generado (19%)</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(ivaReport.totales.iva, 'COP')}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Total con IVA</p>
                      <p className="text-xl font-bold text-emerald-600">{formatCurrency(ivaReport.totales.total, 'COP')}</p>
                    </div>
                  </div>
                  <div className="rounded-md border max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>No. Factura</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Base</TableHead>
                          <TableHead className="text-right">IVA</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ivaReport.facturas.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{row.numero}</TableCell>
                            <TableCell>{formatDate(row.fecha)}</TableCell>
                            <TableCell>{row.cliente}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{row.concepto}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(row.base, 'COP')}</TableCell>
                            <TableCell className="text-right font-mono text-blue-600">{formatCurrency(row.iva, 'COP')}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(row.total, 'COP')}</TableCell>
                            <TableCell>
                              <Badge variant={row.estado === 'PAID' ? 'default' : 'secondary'}>
                                {row.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  No hay facturas con IVA en este período
                </div>
              )}
            </TabsContent>

            {/* Informe Retenciones */}
            <TabsContent value="informe-retenciones" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Informe de Retenciones</h3>
                  <p className="text-sm text-muted-foreground">Retenciones en la fuente practicadas por clientes</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel('informe-retenciones')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToPDF('informe-retenciones')}>
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
              {retencionesReport && retencionesReport.facturas.length > 0 ? (
                <>
                  <div className="bg-amber-50 p-4 rounded-lg text-center max-w-sm">
                    <p className="text-sm text-muted-foreground">Total Retenciones del Período</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(retencionesReport.totalRetenciones, 'COP')}
                    </p>
                  </div>
                  <div className="rounded-md border max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>No. Factura</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Base</TableHead>
                          <TableHead className="text-right">Retención</TableHead>
                          <TableHead className="text-right">Neto a Recibir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {retencionesReport.facturas.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{row.numero}</TableCell>
                            <TableCell>{formatDate(row.fecha)}</TableCell>
                            <TableCell>{row.cliente}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{row.concepto}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(row.base, 'COP')}</TableCell>
                            <TableCell className="text-right font-mono text-amber-600">{formatCurrency(row.retencion, 'COP')}</TableCell>
                            <TableCell className="text-right font-mono text-emerald-600">{formatCurrency(row.neto, 'COP')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  No hay retenciones registradas en este período
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
