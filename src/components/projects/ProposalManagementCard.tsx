import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  MoreVertical,
  ExternalLink,
  Trash2,
  CheckCircle,
  Send,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProposals } from '@/hooks/useProposals';
import {
  Proposal,
  ProposalStatus,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_COLORS,
} from '@/types/database';
import { formatDateToBogota, formatDistanceToBogota } from '@/lib/date-utils';
import { AddProposalModal } from './AddProposalModal';

interface ProposalManagementCardProps {
  projectId: string;
  proposals: Proposal[];
  onRefetch: () => void;
}

const STATUS_ICONS: Record<ProposalStatus, React.ElementType> = {
  'DRAFT': FileText,
  'SENT': Send,
  'REVIEWING': Eye,
  'ACCEPTED': ThumbsUp,
  'REJECTED': ThumbsDown,
};

const STATUS_ORDER: ProposalStatus[] = ['DRAFT', 'SENT', 'REVIEWING', 'ACCEPTED', 'REJECTED'];

export function ProposalManagementCard({
  projectId,
  proposals,
  onRefetch,
}: ProposalManagementCardProps) {
  const { updateProposal, deleteProposal, setFinalProposal } = useProposals(projectId);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [newStatus, setNewStatus] = useState<ProposalStatus>('DRAFT');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sort proposals: non-rejected first, then by version desc
  const sortedProposals = [...proposals].sort((a, b) => {
    // Accepted first
    if (a.status === 'ACCEPTED' && b.status !== 'ACCEPTED') return -1;
    if (b.status === 'ACCEPTED' && a.status !== 'ACCEPTED') return 1;
    // Rejected last
    if (a.status === 'REJECTED' && b.status !== 'REJECTED') return 1;
    if (b.status === 'REJECTED' && a.status !== 'REJECTED') return -1;
    // Then by version desc
    return (b.version || 0) - (a.version || 0);
  });

  const handleStatusChange = async () => {
    if (!selectedProposal) return;

    setIsUpdating(true);
    try {
      const updates: Partial<Proposal> = {
        status: newStatus,
      };

      // If marking as sent, set sent_at
      if (newStatus === 'SENT' && !selectedProposal.sent_at) {
        updates.sent_at = new Date().toISOString();
      }

      // If accepted, also mark as final
      if (newStatus === 'ACCEPTED') {
        await setFinalProposal(selectedProposal.id);
      }

      await updateProposal({
        id: selectedProposal.id,
        updates,
      });

      onRefetch();
      setStatusDialogOpen(false);
      setSelectedProposal(null);
    } catch (error) {
      console.error('Error updating proposal status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (proposalId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta propuesta?')) return;

    try {
      await deleteProposal(proposalId);
      onRefetch();
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const handleMarkAsFinal = async (proposalId: string) => {
    try {
      await setFinalProposal(proposalId);
      onRefetch();
    } catch (error) {
      console.error('Error marking as final:', error);
    }
  };

  const openStatusDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setNewStatus(proposal.status || 'DRAFT');
    setStatusDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total potential value
  const acceptedProposal = proposals.find(p => p.status === 'ACCEPTED');
  const activeProposals = proposals.filter(p => p.status !== 'REJECTED');
  const highestMrr = Math.max(...activeProposals.map(p => p.mrr_usd), 0);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Propuestas
              {proposals.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {proposals.length}
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          {proposals.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">Mayor MRR:</span>
                <span className="font-semibold">{formatCurrency(highestMrr)}</span>
              </div>
              {acceptedProposal && (
                <Badge className="bg-emerald-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Propuesta Aceptada
                </Badge>
              )}
            </div>
          )}

          {/* Proposals list */}
          {proposals.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin propuestas</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear primera propuesta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedProposals.map((proposal) => {
                const StatusIcon = STATUS_ICONS[proposal.status || 'DRAFT'];
                const statusColor = PROPOSAL_STATUS_COLORS[proposal.status || 'DRAFT'];

                return (
                  <div
                    key={proposal.id}
                    className={cn(
                      'p-3 border rounded-lg transition-colors',
                      proposal.is_final && 'border-emerald-300 bg-emerald-50/50',
                      proposal.status === 'REJECTED' && 'opacity-60 bg-muted/30',
                      proposal.status === 'ACCEPTED' && 'border-emerald-300 bg-emerald-50/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{proposal.name}</p>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            v{proposal.version || 1}
                          </Badge>
                          {proposal.is_final && (
                            <Badge className="text-[10px] h-4 bg-emerald-500 text-white">
                              <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                              Final
                            </Badge>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] h-5 gap-1 cursor-pointer hover:opacity-80', statusColor)}
                            onClick={() => openStatusDialog(proposal)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {PROPOSAL_STATUS_LABELS[proposal.status || 'DRAFT']}
                          </Badge>
                          {proposal.sent_at && (
                            <span className="text-[10px] text-muted-foreground">
                              Enviada {formatDistanceToBogota(proposal.sent_at)}
                            </span>
                          )}
                        </div>

                        {/* Values */}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">MRR:</span>
                            <span className="font-medium">{formatCurrency(proposal.mrr_usd)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Fee:</span>
                            <span className="font-medium">{formatCurrency(proposal.fee_usd)}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        {proposal.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {proposal.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openStatusDialog(proposal)}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Cambiar estado
                          </DropdownMenuItem>
                          {proposal.url && (
                            <DropdownMenuItem onClick={() => window.open(proposal.url, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver documento
                            </DropdownMenuItem>
                          )}
                          {!proposal.is_final && proposal.status !== 'REJECTED' && (
                            <DropdownMenuItem onClick={() => handleMarkAsFinal(proposal.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como final
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(proposal.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comparison helper */}
          {proposals.length >= 2 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground text-center">
                {proposals.length} propuestas en total
                {' · '}
                Rango MRR: {formatCurrency(Math.min(...proposals.map(p => p.mrr_usd)))} - {formatCurrency(highestMrr)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Proposal Modal */}
      <AddProposalModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        projectId={projectId}
        onSuccess={() => {
          setAddModalOpen(false);
          onRefetch();
        }}
      />

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Propuesta</DialogTitle>
            <DialogDescription>
              Actualiza el estado de "{selectedProposal?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nuevo Estado</label>
              <Select value={newStatus} onValueChange={(v: ProposalStatus) => setNewStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((status) => {
                    const Icon = STATUS_ICONS[status];
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {PROPOSAL_STATUS_LABELS[status]}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status flow hint */}
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">Flujo sugerido:</p>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">Borrador</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className="text-[10px]">Enviada</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className="text-[10px]">En Revisión</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className="text-[10px] bg-emerald-50">Aceptada</Badge>
              </div>
            </div>

            {newStatus === 'ACCEPTED' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Al marcar como aceptada, esta propuesta se convertirá en la propuesta final.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
