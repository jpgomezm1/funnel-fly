import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Receipt,
  Plus,
  FileText,
  DollarSign,
  Calendar,
  Upload,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  CreditCard,
  ChevronDown,
  Banknote,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useProjectInvoices } from '@/hooks/useProjectInvoices';
import { supabase } from '@/integrations/supabase/client';
import {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  Deal,
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '@/types/database';
import { formatDateToBogota } from '@/lib/date-utils';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { MarkAsPaidModal } from './MarkAsPaidModal';
import { UploadInvoiceModal } from './UploadInvoiceModal';

interface ProjectBillingCardProps {
  projectId: string;
  deal: Deal;
  onRefetch?: () => void;
}

export function ProjectBillingCard({ projectId, deal, onRefetch }: ProjectBillingCardProps) {
  const {
    invoices,
    isLoading,
    createInvoice,
    markAsInvoiced,
    markAsPaid,
    generateRecurringInvoices,
    getInvoiceSummary,
    isCreating,
  } = useProjectInvoices({ projectId });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<InvoiceType>('IMPLEMENTATION');
  const [markAsPaidModalOpen, setMarkAsPaidModalOpen] = useState(false);
  const [uploadInvoiceModalOpen, setUploadInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);

  const summary = getInvoiceSummary();

  const handleOpenCreateModal = (type: InvoiceType) => {
    setCreateType(type);
    setCreateModalOpen(true);
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setMarkAsPaidModalOpen(true);
  };

  const handleUploadInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setUploadInvoiceModalOpen(true);
  };

  const handleGenerateRecurring = async () => {
    setGeneratingInvoices(true);
    try {
      const upToMonth = new Date();
      upToMonth.setMonth(upToMonth.getMonth() + 1); // Generate up to next month

      const count = await generateRecurringInvoices(deal, upToMonth);

      if (count > 0) {
        alert(`Se generaron ${count} factura(s) de mensualidad`);
      } else {
        alert('No hay nuevas facturas por generar');
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      alert('Error al generar facturas');
    } finally {
      setGeneratingInvoices(false);
    }
  };

  const handleViewFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('company-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (error) {
        console.error('Error getting signed URL:', error);
        alert('Error al obtener el archivo');
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Error al abrir el archivo');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3.5 w-3.5" />;
      case 'INVOICED':
        return <FileText className="h-3.5 w-3.5" />;
      case 'PAID':
        return <CheckCircle className="h-3.5 w-3.5" />;
    }
  };

  const renderInvoiceRow = (invoice: Invoice) => (
    <div
      key={invoice.id}
      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium text-sm">{invoice.concept}</p>
            <Badge
              variant="outline"
              className={cn('text-[10px] border-0', INVOICE_STATUS_COLORS[invoice.status])}
            >
              {getStatusIcon(invoice.status)}
              <span className="ml-1">{INVOICE_STATUS_LABELS[invoice.status]}</span>
            </Badge>
            {invoice.is_cuenta_cobro && (
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                Cuenta de Cobro
              </Badge>
            )}
            {invoice.invoice_type === 'ADVANCE' && (
              <Badge variant="outline" className="text-[10px] bg-violet-100 text-violet-700">
                Anticipo
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {invoice.period_month && (
              <span>
                Periodo: {formatDateToBogota(invoice.period_month, 'MMMM yyyy')}
              </span>
            )}
            {invoice.invoice_number && (
              <span>Factura: {invoice.invoice_number}</span>
            )}
            {invoice.due_date && (
              <span>Vence: {formatDateToBogota(invoice.due_date, 'dd/MM/yyyy')}</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-semibold">
            {formatCurrency(invoice.total, invoice.currency)}
          </p>
          {invoice.has_iva && (
            <p className="text-xs text-muted-foreground">
              IVA: {formatCurrency(invoice.iva_amount, invoice.currency)}
            </p>
          )}
          {invoice.currency === 'COP' && (
            <p className="text-xs text-muted-foreground">
              ~${invoice.total_usd.toLocaleString('en-US')} USD
            </p>
          )}
        </div>
      </div>

      {/* Payment info if paid */}
      {invoice.status === 'PAID' && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pagada el {formatDateToBogota(invoice.paid_at!, 'dd/MM/yyyy')}</span>
            <span>Total facturado: {formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recibido</p>
              <p className="font-semibold text-emerald-600">
                {formatCurrency(invoice.amount_received || 0, invoice.currency)}
              </p>
            </div>
            {invoice.retention_amount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Retención</p>
                <p className="font-semibold text-amber-600">
                  {formatCurrency(invoice.retention_amount, invoice.currency)}
                </p>
              </div>
            )}
            {invoice.has_iva && invoice.iva_amount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">IVA a pagar (DIAN)</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(invoice.iva_amount, invoice.currency)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ingreso neto</p>
              <p className="font-semibold">
                {formatCurrency(
                  (invoice.amount_received || 0) - (invoice.has_iva ? invoice.iva_amount : 0),
                  invoice.currency
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t flex items-center gap-2">
        {invoice.status === 'PENDING' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUploadInvoice(invoice)}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Cargar Factura
          </Button>
        )}

        {invoice.status === 'INVOICED' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMarkAsPaid(invoice)}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Marcar Pagada
          </Button>
        )}

        {invoice.invoice_file_path && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewFile(invoice.invoice_file_path!)}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Ver Factura
          </Button>
        )}

        {invoice.payment_proof_path && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewFile(invoice.payment_proof_path!)}
          >
            <CreditCard className="h-3.5 w-3.5 mr-1" />
            Ver Comprobante
          </Button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Facturación
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateRecurring}
                disabled={generatingInvoices}
              >
                {generatingInvoices ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                )}
                Generar Mensualidades
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Nuevo Cobro
                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenCreateModal('ADVANCE')}>
                    <Banknote className="h-4 w-4 mr-2" />
                    Anticipo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenCreateModal('IMPLEMENTATION')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Fee Implementación
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenCreateModal('RECURRING')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Mensualidad
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Facturado</p>
              <p className="text-lg font-semibold">
                ${summary.totalBilled.toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recibido</p>
              <p className="text-lg font-semibold text-emerald-600">
                ${summary.totalPaid.toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pendiente</p>
              <p className="text-lg font-semibold text-amber-600">
                ${summary.totalPending.toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Retenciones</p>
              <p className="text-lg font-semibold text-red-600">
                ${summary.totalRetention.toLocaleString('en-US')}
              </p>
            </div>
          </div>

          {/* Status counts */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{summary.pendingCount} pendientes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{summary.invoicedCount} facturadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{summary.paidCount} pagadas</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="advance">Anticipos</TabsTrigger>
              <TabsTrigger value="implementation">Implementación</TabsTrigger>
              <TabsTrigger value="recurring">Mensualidades</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin facturas registradas</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenCreateModal('IMPLEMENTATION')}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Fee Implementación
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateRecurring}
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      Generar Mensualidades
                    </Button>
                  </div>
                </div>
              ) : (
                invoices.map(renderInvoiceRow)
              )}
            </TabsContent>

            <TabsContent value="advance" className="space-y-3 mt-4">
              {summary.advanceInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin anticipos registrados</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleOpenCreateModal('ADVANCE')}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Crear Anticipo
                  </Button>
                </div>
              ) : (
                summary.advanceInvoices.map(renderInvoiceRow)
              )}
            </TabsContent>

            <TabsContent value="implementation" className="space-y-3 mt-4">
              {summary.implementationInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin facturas de implementación</p>
                  {deal.implementation_fee_original > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleOpenCreateModal('IMPLEMENTATION')}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Crear Factura de Implementación
                    </Button>
                  )}
                </div>
              ) : (
                summary.implementationInvoices.map(renderInvoiceRow)
              )}
            </TabsContent>

            <TabsContent value="recurring" className="space-y-3 mt-4">
              {summary.recurringInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin facturas de mensualidad</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={handleGenerateRecurring}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Generar Mensualidades
                  </Button>
                </div>
              ) : (
                summary.recurringInvoices.map(renderInvoiceRow)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        deal={deal}
        invoiceType={createType}
        onSuccess={() => {
          setCreateModalOpen(false);
          onRefetch?.();
        }}
      />

      {/* Mark As Paid Modal */}
      {selectedInvoice && (
        <MarkAsPaidModal
          open={markAsPaidModalOpen}
          onClose={() => {
            setMarkAsPaidModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onSuccess={() => {
            setMarkAsPaidModalOpen(false);
            setSelectedInvoice(null);
            onRefetch?.();
          }}
        />
      )}

      {/* Upload Invoice Modal */}
      {selectedInvoice && (
        <UploadInvoiceModal
          open={uploadInvoiceModalOpen}
          onClose={() => {
            setUploadInvoiceModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onSuccess={() => {
            setUploadInvoiceModalOpen(false);
            setSelectedInvoice(null);
            onRefetch?.();
          }}
        />
      )}
    </>
  );
}
