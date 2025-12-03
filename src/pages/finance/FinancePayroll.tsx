import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
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
  Users,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Briefcase,
  Receipt,
  Plus,
  Pencil,
  Loader2,
  UserPlus,
  Calendar,
  Clock,
  PieChart,
  ChevronDown,
  Check,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useEmployees,
  useEmployeeTransactions,
  useCreateEmployee,
  useUpdateEmployee,
  EmployeeWithStats,
  Employee,
} from '@/hooks/useEmployees';
import { formatDateToBogota } from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { toast } from '@/hooks/use-toast';

// Predefined roles
const EMPLOYEE_ROLES = [
  'CEO',
  'CTO',
  'COO',
  'Desarrollador',
  'Diseñador',
  'Marketing',
  'Ventas',
  'Customer Success',
  'Operaciones',
  'Administración',
  'Equipo',
  'Freelancer',
  'Consultor',
];

// Currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Avatar colors based on name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Expense category colors for pie chart
const CATEGORY_COLORS: Record<string, string> = {
  'PAYROLL': '#3B82F6',
  'FREELANCERS': '#8B5CF6',
  'TRAINING': '#10B981',
  'EQUIPMENT': '#F59E0B',
  'TRAVEL': '#EF4444',
  'OTHER_EXPENSE': '#6B7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  'PAYROLL': 'Nómina',
  'FREELANCERS': 'Freelancers',
  'TRAINING': 'Capacitación',
  'EQUIPMENT': 'Equipos',
  'TRAVEL': 'Viáticos',
  'OTHER_EXPENSE': 'Otros',
};

// Role Selector Component
function RoleSelector({
  currentRole,
  onRoleChange,
  disabled,
}: {
  currentRole: string | null;
  onRoleChange: (role: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [customRole, setCustomRole] = useState('');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          disabled={disabled}
        >
          <Briefcase className="h-3 w-3" />
          {currentRole || 'Sin cargo'}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-2">Seleccionar cargo</p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {EMPLOYEE_ROLES.map((role) => (
              <button
                key={role}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted flex items-center justify-between",
                  currentRole === role && "bg-muted"
                )}
                onClick={() => {
                  onRoleChange(role);
                  setOpen(false);
                }}
              >
                {role}
                {currentRole === role && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground px-2 mb-1">Cargo personalizado</p>
            <div className="flex gap-1">
              <Input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Otro cargo..."
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                className="h-8"
                disabled={!customRole.trim()}
                onClick={() => {
                  onRoleChange(customRole.trim());
                  setCustomRole('');
                  setOpen(false);
                }}
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Employee Card Component
function EmployeeCard({
  employee,
  onClick,
  onRoleChange,
  isUpdating,
}: {
  employee: EmployeeWithStats;
  onClick: () => void;
  onRoleChange: (role: string) => void;
  isUpdating: boolean;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 cursor-pointer',
              getAvatarColor(employee.display_name)
            )}
            onClick={onClick}
          >
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(employee.display_name)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
                onClick={onClick}
              >
                {employee.display_name}
              </h3>
              {!employee.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inactivo
                </Badge>
              )}
            </div>

            {/* Role selector */}
            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
              <RoleSelector
                currentRole={employee.role}
                onRoleChange={onRoleChange}
                disabled={isUpdating}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4" onClick={onClick}>
              <div>
                <p className="text-xs text-muted-foreground">Total Pagado</p>
                <p className="font-semibold text-emerald-600">
                  {formatCurrency(employee.total_paid_usd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Promedio Mensual</p>
                <p className="font-medium">{formatCurrency(employee.avg_monthly_cost)}</p>
              </div>
            </div>

            {/* Last payment */}
            {employee.last_payment_date && (
              <p className="text-xs text-muted-foreground mt-3" onClick={onClick}>
                Último pago: {formatDateToBogota(employee.last_payment_date, 'dd MMM yyyy')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Employee Detail Modal - Improved
function EmployeeDetailModal({
  employeeId,
  open,
  onClose,
}: {
  employeeId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, refetch } = useEmployeeTransactions(employeeId);
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const [showEditModal, setShowEditModal] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const MONTH_LABELS: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
  };

  // Get available years from transactions
  const availableYears = useMemo(() => {
    if (!data?.transactions) return [];
    const years = new Set(data.transactions.map(t => t.transaction_date.substring(0, 4)));
    return Array.from(years).sort().reverse();
  }, [data?.transactions]);

  // Get available categories
  const availableCategories = useMemo(() => {
    if (!data?.transactions) return [];
    const cats = new Set(data.transactions.map(t => t.expense_category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [data?.transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter(t => {
      const yearMatch = yearFilter === 'all' || t.transaction_date.startsWith(yearFilter);
      const catMatch = categoryFilter === 'all' || t.expense_category === categoryFilter;
      return yearMatch && catMatch;
    });
  }, [data?.transactions, yearFilter, categoryFilter]);

  // Chart data based on filtered transactions
  const chartData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    filteredTransactions.forEach(t => {
      const month = t.transaction_date.substring(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (Number(t.amount_usd) || 0));
    });

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, amount]) => ({
        month: `${MONTH_LABELS[month.substring(5, 7)]} ${month.substring(2, 4)}`,
        amount,
      }));
  }, [filteredTransactions]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, number>();
    filteredTransactions.forEach(t => {
      const cat = t.expense_category || 'OTHER_EXPENSE';
      catMap.set(cat, (catMap.get(cat) || 0) + (Number(t.amount_usd) || 0));
    });

    return Array.from(catMap.entries()).map(([category, amount]) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      amount,
      color: CATEGORY_COLORS[category] || '#6B7280',
    }));
  }, [filteredTransactions]);

  const totalFiltered = filteredTransactions.reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);
  const totalPaid = data?.transactions.reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0) || 0;

  // Calculate tenure
  const getTenure = () => {
    if (!data?.employee.start_date) return null;
    const start = new Date(data.employee.start_date);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  };

  const handleRoleChange = (role: string) => {
    if (!data?.employee) return;
    updateEmployee(
      { id: data.employee.id, role },
      {
        onSuccess: () => {
          toast({ title: 'Cargo actualizado' });
          refetch();
        },
      }
    );
  };

  // Early return AFTER all hooks
  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : data ? (
            <>
              <DialogHeader>
                <VisuallyHidden.Root>
                  <DialogDescription>Detalle del empleado</DialogDescription>
                </VisuallyHidden.Root>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl',
                        getAvatarColor(data.employee.display_name)
                      )}
                    >
                      {getInitials(data.employee.display_name)}
                    </div>
                    <div>
                      <DialogTitle className="text-2xl">{data.employee.display_name}</DialogTitle>

                      {/* Role selector inline */}
                      <div className="mt-2">
                        <RoleSelector
                          currentRole={data.employee.role}
                          onRoleChange={handleRoleChange}
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Contact & Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {data.employee.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {data.employee.email}
                          </span>
                        )}
                        {data.employee.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {data.employee.phone}
                          </span>
                        )}
                        {data.employee.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Desde {formatDateToBogota(data.employee.start_date, 'MMM yyyy')}
                          </span>
                        )}
                        {getTenure() && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTenure()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </DialogHeader>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <DollarSign className="h-4 w-4" />
                      Total Pagado
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {formatCurrency(totalPaid)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Receipt className="h-4 w-4" />
                      Transacciones
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.transactions.length}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <TrendingUp className="h-4 w-4" />
                      Promedio Mensual
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(totalPaid / (data.monthlyBreakdown.length || 1))}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <DollarSign className="h-4 w-4" />
                      Salario Base
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {data.employee.salary_usd > 0 ? formatCurrency(data.employee.salary_usd) : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Monthly Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Pagos Mensuales</CardTitle>
                      <div className="flex gap-2">
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue placeholder="Año" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {availableYears.map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No hay datos para mostrar
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Category Pie Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Por Categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPie>
                          <Pie
                            data={categoryBreakdown}
                            dataKey="amount"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No hay datos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Table */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Historial de Pagos</CardTitle>
                    <div className="flex items-center gap-2">
                      {yearFilter !== 'all' || categoryFilter !== 'all' ? (
                        <Badge variant="secondary" className="text-xs">
                          {filteredTransactions.length} de {data.transactions.length} • {formatCurrency(totalFiltered)}
                        </Badge>
                      ) : null}
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <Filter className="h-3 w-3 mr-1" />
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {availableCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {CATEGORY_LABELS[cat] || cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Fecha</th>
                          <th className="text-left py-2 font-medium">Descripción</th>
                          <th className="text-left py-2 font-medium">Proveedor</th>
                          <th className="text-left py-2 font-medium">Categoría</th>
                          <th className="text-right py-2 font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t) => (
                          <tr key={t.id} className="border-b border-dashed hover:bg-muted/50">
                            <td className="py-2 whitespace-nowrap">
                              {formatDateToBogota(t.transaction_date, 'dd MMM yyyy')}
                            </td>
                            <td className="py-2 max-w-[200px] truncate" title={t.description}>
                              {t.description}
                            </td>
                            <td className="py-2 max-w-[150px] truncate text-muted-foreground">
                              {t.vendor_or_source || '-'}
                            </td>
                            <td className="py-2">
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: CATEGORY_COLORS[t.expense_category || 'OTHER_EXPENSE'],
                                  color: CATEGORY_COLORS[t.expense_category || 'OTHER_EXPENSE'],
                                }}
                              >
                                {CATEGORY_LABELS[t.expense_category || 'OTHER_EXPENSE'] || t.expense_category || 'Otros'}
                              </Badge>
                            </td>
                            <td className="py-2 text-right font-medium text-red-600 whitespace-nowrap">
                              {formatCurrency(Number(t.amount_usd) || 0)}
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              No hay transacciones {yearFilter !== 'all' || categoryFilter !== 'all' ? 'con los filtros seleccionados' : 'registradas'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {filteredTransactions.length > 0 && (
                        <tfoot className="sticky bottom-0 bg-muted/50">
                          <tr className="font-medium">
                            <td colSpan={4} className="py-2">Total</td>
                            <td className="py-2 text-right text-red-600">
                              {formatCurrency(totalFiltered)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {data.employee.notes && (
                <Card className="mt-6 bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium mb-1">Notas</p>
                    <p className="text-sm text-muted-foreground">{data.employee.notes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      {data && (
        <EditEmployeeModal
          employee={data.employee}
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      )}
    </>
  );
}

// Edit Employee Modal
function EditEmployeeModal({
  employee,
  open,
  onClose,
}: {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: updateEmployee, isPending } = useUpdateEmployee();
  const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee();
  const isNew = !employee;

  const [formData, setFormData] = useState({
    name: employee?.name || '',
    display_name: employee?.display_name || '',
    role: employee?.role || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    start_date: employee?.start_date || '',
    salary_usd: employee?.salary_usd || 0,
    is_active: employee?.is_active ?? true,
    notes: employee?.notes || '',
  });

  const handleSave = () => {
    if (!formData.name || !formData.display_name) {
      toast({
        title: 'Error',
        description: 'El nombre es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (isNew) {
      createEmployee(
        {
          name: formData.name,
          display_name: formData.display_name,
          role: formData.role || null,
          email: formData.email || null,
          phone: formData.phone || null,
          start_date: formData.start_date || null,
          end_date: null,
          salary_usd: formData.salary_usd,
          is_active: formData.is_active,
          avatar_url: null,
          notes: formData.notes || null,
        },
        {
          onSuccess: () => {
            toast({ title: 'Empleado creado exitosamente' });
            onClose();
          },
          onError: () => {
            toast({ title: 'Error al crear empleado', variant: 'destructive' });
          },
        }
      );
    } else {
      updateEmployee(
        {
          id: employee!.id,
          name: formData.name,
          display_name: formData.display_name,
          role: formData.role || null,
          email: formData.email || null,
          phone: formData.phone || null,
          start_date: formData.start_date || null,
          salary_usd: formData.salary_usd,
          is_active: formData.is_active,
          notes: formData.notes || null,
        },
        {
          onSuccess: () => {
            toast({ title: 'Empleado actualizado exitosamente' });
            onClose();
          },
          onError: () => {
            toast({ title: 'Error al actualizar empleado', variant: 'destructive' });
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nuevo Empleado' : 'Editar Empleado'}</DialogTitle>
          <DialogDescription>
            {isNew
              ? 'Agrega un nuevo empleado al sistema'
              : 'Actualiza la información del empleado'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre (para match) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pablo Gomez"
              />
              <p className="text-xs text-muted-foreground">
                Debe coincidir con el nombre en las transacciones
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nombre a mostrar *</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Juan Pablo Gómez"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={formData.role || ''}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cargo" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Salario Base (USD)</Label>
              <Input
                type="number"
                value={formData.salary_usd}
                onChange={(e) => setFormData({ ...formData, salary_usd: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha de Inicio</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Empleado activo
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || isCreating}>
            {(isPending || isCreating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isNew ? 'Crear' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function FinancePayroll() {
  const { data: employees, isLoading, refetch } = useEmployees();
  const { mutate: updateEmployee, isPending: isUpdatingRole } = useUpdateEmployee();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null);

  // Calculate totals
  const totalPaidAll = employees?.reduce((sum, e) => sum + e.total_paid_usd, 0) || 0;
  const avgMonthlyCost = employees?.reduce((sum, e) => sum + e.avg_monthly_cost, 0) || 0;
  const activeEmployees = employees?.filter(e => e.is_active).length || 0;

  const handleRoleChange = (employeeId: string, role: string) => {
    setUpdatingEmployeeId(employeeId);
    updateEmployee(
      { id: employeeId, role },
      {
        onSuccess: () => {
          toast({ title: 'Cargo actualizado' });
          refetch();
          setUpdatingEmployeeId(null);
        },
        onError: () => {
          toast({ title: 'Error al actualizar cargo', variant: 'destructive' });
          setUpdatingEmployeeId(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Nómina
          </h1>
          <p className="text-muted-foreground">
            Gestión de nómina y pagos a empleados
          </p>
        </div>
        <Button onClick={() => setShowNewEmployeeModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Empleados Activos
            </div>
            <p className="text-3xl font-bold mt-1">{activeEmployees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Total Pagado (Histórico)
            </div>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {formatCurrency(totalPaidAll)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Costo Mensual Estimado
            </div>
            <p className="text-3xl font-bold mt-1">{formatCurrency(avgMonthlyCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees && employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onClick={() => setSelectedEmployeeId(employee.id)}
              onRoleChange={(role) => handleRoleChange(employee.id, role)}
              isUpdating={updatingEmployeeId === employee.id}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No hay empleados registrados
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Agrega empleados para comenzar a hacer seguimiento de los pagos de nómina.
            </p>
            <Button onClick={() => setShowNewEmployeeModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Empleado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        employeeId={selectedEmployeeId}
        open={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
      />

      {/* New Employee Modal */}
      <EditEmployeeModal
        employee={null}
        open={showNewEmployeeModal}
        onClose={() => {
          setShowNewEmployeeModal(false);
          refetch();
        }}
      />
    </div>
  );
}
