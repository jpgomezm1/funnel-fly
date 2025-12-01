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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Receipt,
  RefreshCw,
  Calendar,
  Filter,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceTransactions } from '@/hooks/useFinanceTransactions';
import {
  FinanceTransaction,
  ExpenseCategory,
  ExpenseClassification,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CLASSIFICATION_LABELS,
  EXPENSE_CLASSIFICATION_COLORS,
  FIXED_EXPENSE_CATEGORIES,
  VARIABLE_EXPENSE_CATEGORIES,
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

export default function FinanceExpenses() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Build date filters
  const startDate = selectedMonth > 0
    ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    : `${selectedYear}-01-01`;
  const endDate = selectedMonth > 0
    ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`
    : `${selectedYear}-12-31`;

  const {
    expenseTransactions,
    fixedExpenses,
    variableExpenses,
    totalExpensesUsd,
    totalFixedExpensesUsd,
    totalVariableExpensesUsd,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
  } = useFinanceTransactions({
    type: 'EXPENSE',
    startDate,
    endDate,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);

  // Get transactions based on active tab
  const getTabTransactions = () => {
    switch (activeTab) {
      case 'fixed':
        return fixedExpenses;
      case 'variable':
        return variableExpenses;
      default:
        return expenseTransactions;
    }
  };

  // Filter transactions
  const filteredTransactions = getTabTransactions().filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.expense_category === selectedCategory;
    const matchesClassification = selectedClassification === 'all' || t.expense_classification === selectedClassification;
    const matchesSearch = !searchTerm ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vendor_or_source?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesClassification && matchesSearch;
  });

  // Group by category for summary
  const byCategory = expenseTransactions.reduce((acc, t) => {
    const cat = t.expense_category || 'OTHER_EXPENSE';
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
        toast({ title: 'Gasto actualizado', description: 'El gasto ha sido actualizado correctamente' });
      } else {
        await createTransaction(data);
        toast({ title: 'Gasto registrado', description: 'El gasto ha sido agregado correctamente' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el gasto', variant: 'destructive' });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      await deleteTransaction(id);
      toast({ title: 'Gasto eliminado', description: 'El gasto ha sido eliminado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el gasto', variant: 'destructive' });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
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
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">
            Control de gastos fijos y variables
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Gastos</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totalExpensesUsd)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos Fijos</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(totalFixedExpensesUsd)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Unlock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos Variables</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(totalVariableExpensesUsd)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desglose por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([category, amount]) => (
                <div
                  key={category}
                  className="p-3 rounded-lg bg-slate-50 text-center"
                >
                  <Badge className={cn("text-xs mb-2", EXPENSE_CATEGORY_COLORS[category as ExpenseCategory])}>
                    {EXPENSE_CATEGORY_LABELS[category as ExpenseCategory]}
                  </Badge>
                  <p className="font-bold">{formatCurrency(amount)}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              Todos ({expenseTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="fixed" className="flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              Fijos ({fixedExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="variable" className="flex items-center gap-1.5">
              <Unlock className="h-4 w-4" />
              Variables ({variableExpenses.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[130px]">
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
        </div>

        {/* Search and Category Filter */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descripción o proveedor..."
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
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Gastos Fijos
                  </div>
                  {FIXED_EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                    Gastos Variables
                  </div>
                  {VARIABLE_EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Listado de Gastos ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sin gastos</h3>
                  <p className="text-muted-foreground mb-4">
                    No hay gastos registrados para este período
                  </p>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Gasto
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Proveedor</TableHead>
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
                          {t.expense_category && (
                            <Badge className={cn("text-xs", EXPENSE_CATEGORY_COLORS[t.expense_category])}>
                              {EXPENSE_CATEGORY_LABELS[t.expense_category]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {t.expense_classification && (
                            <Badge variant="outline" className={cn("text-xs", EXPENSE_CLASSIFICATION_COLORS[t.expense_classification])}>
                              {t.expense_classification === 'FIXED' ? (
                                <Lock className="h-3 w-3 mr-1" />
                              ) : (
                                <Unlock className="h-3 w-3 mr-1" />
                              )}
                              {EXPENSE_CLASSIFICATION_LABELS[t.expense_classification]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.vendor_or_source || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(t.amount_original, t.currency)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
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
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={editingTransaction}
        transactionType="EXPENSE"
        onSave={handleSave}
        isSaving={isCreating || isUpdating}
      />
    </div>
  );
}
