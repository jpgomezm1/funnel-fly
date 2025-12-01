import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Edit,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateToBogota } from '@/lib/date-utils';
import { ProjectBillingCard } from '@/components/projects/ProjectBillingCard';
import { DEAL_STATUS_LABELS, DealStatus } from '@/types/database';

interface Deal {
  id: string;
  mrr_usd: number;
  mrr_original: number;
  implementation_fee_usd: number;
  implementation_fee_original: number;
  currency: string;
  exchange_rate?: number;
  start_date: string;
  status: string;
  notes?: string;
}

interface Proposal {
  id: string;
  name: string;
  url?: string;
  is_final?: boolean;
}

interface ProjectTabFinancialProps {
  projectId: string;
  deal: Deal;
  bookedMrrUsd?: number;
  bookedFeeUsd?: number;
  finalProposal?: Proposal;
  onEditDeal: () => void;
  onRefetch: () => void;
}

export function ProjectTabFinancial({
  projectId,
  deal,
  bookedMrrUsd,
  bookedFeeUsd,
  finalProposal,
  onEditDeal,
  onRefetch,
}: ProjectTabFinancialProps) {
  const mrrDiff = bookedMrrUsd ? deal.mrr_usd - bookedMrrUsd : 0;
  const feeDiff = bookedFeeUsd ? deal.implementation_fee_usd - bookedFeeUsd : 0;

  return (
    <div className="space-y-6">
      {/* Contract Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Contrato
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs border-0',
                  deal.status === 'ACTIVE' && 'bg-emerald-100 text-emerald-700',
                  deal.status === 'ON_HOLD' && 'bg-amber-100 text-amber-700',
                  deal.status === 'CHURNED' && 'bg-red-100 text-red-700'
                )}
              >
                {DEAL_STATUS_LABELS[deal.status as DealStatus]}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEditDeal}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* MRR */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">MRR Mensual</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${deal.mrr_usd.toLocaleString('en-US')}
              </p>
              {deal.currency === 'COP' && (
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(deal.mrr_original)}
                </p>
              )}
              {bookedMrrUsd !== undefined && bookedMrrUsd > 0 && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  mrrDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {mrrDiff >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {mrrDiff >= 0 ? '+' : ''}${mrrDiff.toLocaleString('en-US')} vs booked
                  </span>
                </div>
              )}
            </div>

            {/* Implementation Fee */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Fee Implementación</p>
              <p className="text-2xl font-bold">
                ${deal.implementation_fee_usd.toLocaleString('en-US')}
              </p>
              {deal.currency === 'COP' && (
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(deal.implementation_fee_original)}
                </p>
              )}
              {bookedFeeUsd !== undefined && bookedFeeUsd > 0 && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  feeDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {feeDiff >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {feeDiff >= 0 ? '+' : ''}${feeDiff.toLocaleString('en-US')} vs booked
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Fecha de Inicio</p>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDateToBogota(deal.start_date, 'dd/MM/yyyy')}
                </div>
              </div>

              {deal.currency === 'COP' && deal.exchange_rate && (
                <div>
                  <p className="text-xs text-muted-foreground">TRM Aplicada</p>
                  <p className="text-sm">${deal.exchange_rate.toLocaleString('es-CO')}</p>
                </div>
              )}

              {finalProposal?.url && (
                <div>
                  <p className="text-xs text-muted-foreground">Propuesta Final</p>
                  <a
                    href={finalProposal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {finalProposal.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {deal.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notas del contrato</p>
              <p className="text-sm">{deal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Card */}
      <ProjectBillingCard
        projectId={projectId}
        deal={deal}
        onRefetch={onRefetch}
      />
    </div>
  );
}
