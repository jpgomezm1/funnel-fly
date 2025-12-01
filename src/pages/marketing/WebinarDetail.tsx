import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Video,
  Users,
  UserCheck,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Play,
  Upload,
  Pencil,
  Trash2,
  Search,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Check,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  BarChart3,
  Download,
  Filter,
  MoreHorizontal,
  Copy,
  UserPlus,
  TrendingUp,
  TrendingDown,
  UserX,
  PieChart,
  Target,
  Award,
  Star,
  Zap,
  AlertTriangle,
  Info,
  Lightbulb,
  Percent,
  CalendarDays,
  Activity,
  Globe,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  useWebinarDetail,
  useWebinarMutations,
  useImportRegistrants,
  useWebinarAnalytics,
  parseLumaCSV,
  Webinar,
  WebinarRegistrant,
} from '@/hooks/useWebinars';

// Status config
const STATUS_CONFIG = {
  planned: {
    label: 'Planificado',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    bgLight: 'bg-blue-500/10',
    icon: Clock,
  },
  completed: {
    label: 'Completado',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    bgLight: 'bg-green-500/10',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    bgLight: 'bg-red-500/10',
    icon: XCircle,
  },
};

const DEFAULT_WEBINAR_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

// Edit Webinar Dialog
function EditWebinarDialog({
  open,
  onOpenChange,
  webinar,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webinar: Webinar;
  onSubmit: (data: Partial<Webinar>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: webinar.name,
    description: webinar.description || '',
    event_date: webinar.event_date.split('T')[0],
    status: webinar.status,
    attended_count: webinar.attended_count,
    image_url: webinar.image_url || '',
    luma_url: webinar.luma_url || '',
    recording_url: webinar.recording_url || '',
    tags: webinar.tags?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description || null,
      event_date: new Date(formData.event_date).toISOString(),
      status: formData.status as Webinar['status'],
      attended_count: formData.attended_count,
      image_url: formData.image_url || null,
      luma_url: formData.luma_url || null,
      recording_url: formData.recording_url || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Webinar
          </DialogTitle>
          <DialogDescription>
            Actualiza la informacion del webinar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Fecha *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planificado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attended_count">Numero de Asistentes</Label>
            <Input
              id="attended_count"
              type="number"
              min="0"
              value={formData.attended_count}
              onChange={(e) => setFormData({ ...formData, attended_count: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              Registrados: {webinar.total_registrants} | Tasa: {webinar.total_registrants > 0 ? ((formData.attended_count / webinar.total_registrants) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL de Imagen</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="luma_url">URL de Luma</Label>
              <Input
                id="luma_url"
                type="url"
                value={formData.luma_url}
                onChange={(e) => setFormData({ ...formData, luma_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recording_url">URL de Grabacion</Label>
              <Input
                id="recording_url"
                type="url"
                value={formData.recording_url}
                onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separados por coma)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="IA, No-Code, Automatizacion"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Import CSV Dialog
function ImportCSVDialog({
  open,
  onOpenChange,
  webinarId,
  webinarName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webinarId: string;
  webinarName: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ total: number; sample: string[] } | null>(null);
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseLumaCSV> | null>(null);

  const importMutation = useImportRegistrants();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseLumaCSV(content);
      setParsedData(parsed);
      setPreview({
        total: parsed.length,
        sample: parsed.slice(0, 5).map(r => r.email),
      });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData) return;

    await importMutation.mutateAsync({
      webinarId,
      registrants: parsedData,
    });

    onOpenChange(false);
    setPreview(null);
    setParsedData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Registrados
          </DialogTitle>
          <DialogDescription>
            Importar para: <strong>{webinarName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Haz clic para seleccionar CSV de Luma
            </p>
            <Button type="button" variant="outline" size="sm">
              Seleccionar CSV
            </Button>
          </div>

          {preview && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Registrados:</span>
                <Badge variant="secondary" className="text-lg px-3">{preview.total}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {preview.sample.map((email, i) => (
                  <p key={i} className="truncate">{email}</p>
                ))}
                {preview.total > 5 && (
                  <p className="text-primary">... y {preview.total - 5} mas</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importando...' : `Importar ${preview?.total || 0}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function WebinarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { webinar, registrants, isLoading, error } = useWebinarDetail(id);
  const mutations = useWebinarMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attended' | 'absent'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter registrants
  const filteredRegistrants = useMemo(() => {
    return registrants.filter(r => {
      const matchesSearch =
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAttendance =
        attendanceFilter === 'all' ||
        (attendanceFilter === 'attended' && r.has_joined_event) ||
        (attendanceFilter === 'absent' && !r.has_joined_event);

      const matchesCompany =
        companyFilter === 'all' ||
        (companyFilter === 'with' && r.company) ||
        (companyFilter === 'without' && !r.company);

      return matchesSearch && matchesAttendance && matchesCompany;
    });
  }, [registrants, searchQuery, attendanceFilter, companyFilter]);

  // Analytics from CSV data
  const analytics = useWebinarAnalytics(registrants);

  // Generate insights
  const insights = useMemo(() => {
    const result: Array<{ type: 'success' | 'warning' | 'info'; title: string; description: string }> = [];

    if (analytics.csvAttendanceRate >= 50) {
      result.push({
        type: 'success',
        title: 'Excelente tasa de asistencia',
        description: `${analytics.csvAttendanceRate.toFixed(1)}% de los registrados asistieron, superando el promedio de la industria.`,
      });
    } else if (analytics.csvAttendanceRate < 35 && analytics.csvAttendanceRate > 0) {
      result.push({
        type: 'warning',
        title: 'Tasa de asistencia por debajo del promedio',
        description: 'Considera mejorar los recordatorios y el engagement previo al evento.',
      });
    }

    if (analytics.registrantsWithPhone > registrants.length * 0.5) {
      result.push({
        type: 'success',
        title: 'Alta calidad de contactos',
        description: `${((analytics.registrantsWithPhone / registrants.length) * 100).toFixed(0)}% tienen telefono para seguimiento directo.`,
      });
    } else if (analytics.registrantsWithPhone < registrants.length * 0.3 && registrants.length > 0) {
      result.push({
        type: 'info',
        title: 'Pocos contactos con telefono',
        description: 'Considera solicitar telefono en futuros registros para mejor seguimiento.',
      });
    }

    if (analytics.topCompanies.length > 0 && analytics.topCompanies[0].count >= 3) {
      result.push({
        type: 'info',
        title: 'Interes empresarial destacado',
        description: `${analytics.topCompanies[0].company} registro ${analytics.topCompanies[0].count} personas. Considera outreach B2B.`,
      });
    }

    return result;
  }, [analytics, registrants.length]);

  // Company breakdown for pie chart
  const companyBreakdown = useMemo(() => {
    const topCompanies = analytics.topCompanies.slice(0, 5);
    const othersCount = registrants.filter(r => r.company).length - topCompanies.reduce((acc, c) => acc + c.count, 0);
    const noCompanyCount = registrants.filter(r => !r.company).length;

    const data = topCompanies.map((c, i) => ({
      name: c.company.length > 15 ? c.company.substring(0, 15) + '...' : c.company,
      value: c.count,
      color: COLORS[i % COLORS.length],
    }));

    if (othersCount > 0) {
      data.push({ name: 'Otras', value: othersCount, color: '#9CA3AF' });
    }
    if (noCompanyCount > 0) {
      data.push({ name: 'Sin empresa', value: noCompanyCount, color: '#D1D5DB' });
    }

    return data;
  }, [analytics.topCompanies, registrants]);

  const handleUpdateWebinar = async (data: Partial<Webinar>) => {
    if (!webinar) return;
    await mutations.updateWebinar({ id: webinar.id, ...data });
    setShowEditDialog(false);
  };

  const handleDeleteWebinar = async () => {
    if (!webinar) return;
    await mutations.deleteWebinar(webinar.id);
    navigate('/marketing/webinars');
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: 'Email copiado', description: email });
  };

  const handleCopyAllEmails = () => {
    const emails = [...new Set(filteredRegistrants.map(r => r.email))].join(', ');
    navigator.clipboard.writeText(emails);
    toast({
      title: 'Emails copiados',
      description: `${[...new Set(filteredRegistrants.map(r => r.email))].length} emails unicos copiados`,
    });
  };

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Email', 'Empresa', 'Cargo', 'Telefono', 'Asistio'];
    const rows = filteredRegistrants.map(r => [
      r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      r.email,
      r.company || '',
      r.role || '',
      r.phone_number || '',
      r.has_joined_event ? 'Si' : 'No',
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${webinar?.name || 'webinar'}-registrants.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !webinar) {
    return (
      <div className="text-center py-16">
        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold mb-2">Webinar no encontrado</h2>
        <p className="text-muted-foreground mb-6">El webinar que buscas no existe o fue eliminado.</p>
        <Link to="/marketing/webinars">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Webinars
          </Button>
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[webinar.status];
  const StatusIcon = status.icon;
  const eventDate = new Date(webinar.event_date);
  const isUpcoming = isFuture(eventDate);
  const daysUntil = differenceInDays(eventDate, new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/marketing/webinars">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{webinar.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <Badge className={`${status.bgLight} ${status.textColor} border-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(eventDate, "d 'de' MMMM, yyyy", { locale: es })}
            </span>
            {isUpcoming && daysUntil <= 7 && daysUntil > 0 && (
              <Badge variant="outline">en {daysUntil} dias</Badge>
            )}
            {isUpcoming && daysUntil === 0 && (
              <Badge className="bg-amber-500 text-white border-0 animate-pulse">HOY</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {webinar.luma_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={webinar.luma_url} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-2" />
                Luma
              </a>
            </Button>
          )}
          {webinar.recording_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={webinar.recording_url} target="_blank" rel="noopener noreferrer">
                <Play className="h-4 w-4 mr-2" />
                Grabacion
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hero Section with Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image & Description */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="relative h-64">
              <img
                src={webinar.image_url || DEFAULT_WEBINAR_IMAGE}
                alt={webinar.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {webinar.tags && webinar.tags.length > 0 && (
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {webinar.tags.map((tag, i) => (
                    <Badge key={i} className="bg-white/20 backdrop-blur text-white border-0">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {webinar.description && (
              <CardContent className="p-5">
                <p className="text-muted-foreground">{webinar.description}</p>
              </CardContent>
            )}
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Registrados</span>
                </div>
                <p className="text-2xl font-bold">{registrants.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Asistieron</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{analytics.csvAttendees}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <UserX className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">No asistieron</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{analytics.csvAbsent}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Empresas</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{analytics.uniqueCompanies}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Main Metrics */}
        <div className="space-y-4">
          {/* Attendance Rate Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Tasa de Asistencia</span>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  analytics.csvAttendanceRate >= 50 ? 'bg-green-500/10' :
                  analytics.csvAttendanceRate >= 35 ? 'bg-amber-500/10' : 'bg-red-500/10'
                }`}>
                  {analytics.csvAttendanceRate >= 50 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : analytics.csvAttendanceRate >= 35 ? (
                    <Activity className="h-5 w-5 text-amber-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              <p className={`text-4xl font-bold mb-2 ${
                analytics.csvAttendanceRate >= 50 ? 'text-green-600' :
                analytics.csvAttendanceRate >= 35 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {analytics.csvAttendanceRate.toFixed(1)}%
              </p>
              <Progress value={analytics.csvAttendanceRate} className="h-3 mb-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{analytics.csvAttendees} de {registrants.length}</span>
                <span className={`font-medium ${
                  analytics.csvAttendanceRate >= 50 ? 'text-green-600' :
                  analytics.csvAttendanceRate >= 35 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {analytics.csvAttendanceRate >= 50 ? 'Excelente' :
                   analytics.csvAttendanceRate >= 35 ? 'Promedio' : 'Por mejorar'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Quality Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-medium">Calidad de Contactos</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Con telefono
                    </span>
                    <span className="font-medium">{analytics.registrantsWithPhone} ({registrants.length > 0 ? ((analytics.registrantsWithPhone / registrants.length) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={registrants.length > 0 ? (analytics.registrantsWithPhone / registrants.length) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Con empresa
                    </span>
                    <span className="font-medium">{analytics.registrantsWithCompany} ({registrants.length > 0 ? ((analytics.registrantsWithCompany / registrants.length) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={registrants.length > 0 ? (analytics.registrantsWithCompany / registrants.length) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Con cargo
                    </span>
                    <span className="font-medium">{analytics.registrantsWithRole} ({registrants.length > 0 ? ((analytics.registrantsWithRole / registrants.length) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={registrants.length > 0 ? (analytics.registrantsWithRole / registrants.length) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Acciones Rapidas</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAllEmails} className="justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar emails
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for Analytics and Registrants */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="registrants" className="gap-2">
            <Users className="h-4 w-4" />
            Registrados ({registrants.length})
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {registrants.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Importa registrados para ver analytics</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Insights */}
              {insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insights.map((insight, i) => (
                    <Card key={i} className={
                      insight.type === 'success' ? 'bg-green-500/5 border-green-500/20' :
                      insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                      'bg-blue-500/5 border-blue-500/20'
                    }>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {insight.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />}
                          {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />}
                          {insight.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />}
                          <div>
                            <p className="font-medium text-sm">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Breakdown */}
                {companyBreakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Distribucion por Empresa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <div className="h-[200px] w-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={companyBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {companyBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-2">
                          {companyBreakdown.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm flex-1 truncate">{item.name}</span>
                              <Badge variant="secondary" className="text-xs">{item.value}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Companies */}
                {analytics.topCompanies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-500" />
                        Top Empresas
                      </CardTitle>
                      <CardDescription>Por cantidad de registrados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.topCompanies.slice(0, 8).map((item, i) => {
                          const attendanceRate = item.count > 0 ? (item.attendedCount / item.count * 100) : 0;
                          return (
                            <div key={item.company} className="space-y-1">
                              <div className="flex items-center gap-3">
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  i < 3 ? 'bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.company}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">{item.count}</p>
                                  <p className="text-xs text-muted-foreground">{item.attendedCount} asist.</p>
                                </div>
                              </div>
                              <Progress value={attendanceRate} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Top Roles */}
              {analytics.topRoles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Cargos mas Frecuentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analytics.topRoles.slice(0, 10).map((item, i) => (
                        <Badge
                          key={item.role}
                          variant={i < 3 ? 'default' : 'secondary'}
                          className={`text-sm py-1 px-3 ${i < 3 ? 'bg-primary' : ''}`}
                        >
                          {item.role}
                          <span className="ml-2 opacity-70">{item.count}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Registration Timeline */}
              {analytics.registrationsByDay.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Timeline de Registros
                    </CardTitle>
                    <CardDescription>Registros por dia previo al evento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.registrationsByDay}>
                          <defs>
                            <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(v) => format(new Date(v), 'd MMM', { locale: es })}
                            fontSize={11}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(v) => format(new Date(v), "d 'de' MMMM", { locale: es })}
                            formatter={(value: number) => [value, 'Registros']}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fill="url(#colorRegistrations)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Registrants Tab */}
        <TabsContent value="registrants" className="mt-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Lista de Registrados
                  <Badge variant="secondary">{filteredRegistrants.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={handleCopyAllEmails}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o empresa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={attendanceFilter} onValueChange={(v) => setAttendanceFilter(v as any)}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Asistencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="attended">Asistieron</SelectItem>
                    <SelectItem value="absent">No asistieron</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="with">Con empresa</SelectItem>
                    <SelectItem value="without">Sin empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {filteredRegistrants.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    {registrants.length === 0
                      ? 'No hay registrados. Importa un CSV de Luma.'
                      : 'No se encontraron resultados con los filtros aplicados'}
                  </p>
                  {registrants.length === 0 && (
                    <Button variant="outline" className="mt-4" onClick={() => setShowImportDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar CSV
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Contacto</TableHead>
                        <TableHead>Empresa / Cargo</TableHead>
                        <TableHead>Telefono</TableHead>
                        <TableHead className="text-center">Asistio</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrants.slice(0, 100).map((r) => {
                        const fullName = r.full_name ||
                          `${r.first_name || ''} ${r.last_name || ''}`.trim() ||
                          'Sin nombre';

                        return (
                          <TableRow key={r.id} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                  {fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{fullName}</p>
                                  <p className="text-xs text-muted-foreground">{r.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.company ? (
                                <div>
                                  <p className="text-sm font-medium">{r.company}</p>
                                  {r.role && (
                                    <p className="text-xs text-muted-foreground">{r.role}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {r.phone_number ? (
                                <a
                                  href={`https://wa.me/${r.phone_number.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-green-600 hover:underline"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span className="text-sm">{r.phone_number}</span>
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {r.has_joined_event ? (
                                <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                  <UserCheck className="h-4 w-4 text-green-500" />
                                </div>
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                                  <UserX className="h-4 w-4 text-red-500" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleCopyEmail(r.email)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {r.phone_number && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" asChild>
                                    <a
                                      href={`https://wa.me/${r.phone_number.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={`mailto:${r.email}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredRegistrants.length > 100 && (
                <p className="text-sm text-muted-foreground text-center">
                  Mostrando 100 de {filteredRegistrants.length} registrados. Usa filtros para refinar.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {webinar && (
        <EditWebinarDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          webinar={webinar}
          onSubmit={handleUpdateWebinar}
          isLoading={mutations.isUpdating}
        />
      )}

      {webinar && (
        <ImportCSVDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          webinarId={webinar.id}
          webinarName={webinar.name}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar Webinar
            </DialogTitle>
            <DialogDescription>
              Estas seguro de eliminar <strong>"{webinar.name}"</strong>?
              Se eliminaran {registrants.length} registrados y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteWebinar} disabled={mutations.isDeleting}>
              {mutations.isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
