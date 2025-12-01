import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Calendar,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceTransactions } from '@/hooks/useFinanceTransactions';
import {
  FinanceTransaction,
  IncomeCategory,
  INCOME_CATEGORY_LABELS,
  INCOME_CATEGORY_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionModal } from '@/components/finance/TransactionModal';
import { toast } from '@/hooks/use-toast';
import { formatDateToBogota } from '@/lib/date-utils';

const MONTHS = [
  'Todos', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function FinanceIncome() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = all months
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Build date filters
  const startDate = selectedMonth > 0
    ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    : `${selectedYear}-01-01`;
  const endDate = selectedMonth > 0
    ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`
    : `${selectedYear}-12-31`;

  const {
    incomeTransactions,
    totalIncomeUsd,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
  } = useFinanceTransactions({
    type: 'INCOME',
    startDate,
    endDate,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);

  // Filter transactions
  const filteredTransactions = incomeTransactions.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.income_category === selectedCategory;
    const matchesSearch = !searchTerm ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vendor_or_source?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by category for summary
  const byCategory = incomeTransactions.reduce((acc, t) => {
    const cat = t.income_category || 'OTHER_INCOME';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += t.amount_usd;
    return acc;
  }, {} as Record<string, number>);

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (transaction: FinanceTransaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingTransaction) {
        await updateTransaction({ id: editingTransaction.id, updates: data });
        toast({ title: 'Ingreso actualizado', description: 'El ingreso ha sido actualizado correctamente' });
      } else {
        await createTransaction(data);
        toast({ title: 'Ingreso registrado', description: 'El ingreso ha sido agregado correctamente' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el ingreso', variant: 'destructive' });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return;

    try {
      await deleteTransaction(id);
      toast({ title: 'Ingreso eliminado', description: 'El ingreso ha sido eliminado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el ingreso', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
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
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ingresos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los ingresos de la empresa
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ingreso
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(totalIncomeUsd)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Category */}
        {(Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).map(cat => (
          <Card key={cat}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", INCOME_CATEGORY_COLORS[cat])}>
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{INCOME_CATEGORY_LABELS[cat]}</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(byCategory[cat] || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descripción o fuente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {(Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {INCOME_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Listado de Ingresos ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin ingresos</h3>
              <p className="text-muted-foreground mb-4">
                No hay ingresos registrados para este período
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Ingreso
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="text-right">Monto Original</TableHead>
                  <TableHead className="text-right">Monto USD</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {formatDateToBogota(t.transaction_date, 'dd MMM yyyy')}
                        {t.is_recurring && (
                          <RefreshCw className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{t.description}</p>
                        {t.reference_number && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {t.reference_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {t.income_category && (
                        <Badge className={cn("text-xs", INCOME_CATEGORY_COLORS[t.income_category])}>
                          {INCOME_CATEGORY_LABELS[t.income_category]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.vendor_or_source || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(t.amount_original, t.currency)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {formatCurrency(t.amount_usd)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(t)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(t.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={editingTransaction}
        transactionType="INCOME"
        onSave={handleSave}
        isSaving={isCreating || isUpdating}
      />
    </div>
  );
}
