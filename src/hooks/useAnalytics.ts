import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface PipelineStageMetrics {
  stage: string;
  count: number;
  value: number;
  avgDaysInStage: number;
  conversionRate: number;
}

export interface ConversionMetrics {
  fromStage: string;
  toStage: string;
  rate: number;
  avgDays: number;
}

export interface RevenueMetrics {
  currentMrr: number;
  previousMrr: number;
  mrrGrowth: number;
  mrrGrowthPercentage: number;
  arr: number;
  goalMrr: number;
  goalProgress: number;
  feesMonth: number;
  feesHistorical: number;
  avgDealSize: number;
  avgMrr: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

export interface SalesVelocityMetrics {
  avgDealCycle: number;
  avgTimeByStage: Record<string, number>;
  dealsClosedThisMonth: number;
  dealsClosedLastMonth: number;
  closedWonThisMonth: number;
  closedLostThisMonth: number;
  winRate: number;
  lossReasons: Record<string, number>;
}

export interface ActivityMetrics {
  activitiesThisWeek: number;
  activitiesLastWeek: number;
  activitiesGrowth: number;
  activitiesByType: Record<string, number>;
  avgActivitiesPerLead: number;
  leadsWithoutActivity: number;
  activitiesThisMonth: number;
  mostActiveDay: string;
  activitiesByDay: Record<string, number>;
}

export interface ProjectHealthMetrics {
  totalProjects: number;
  activeProjects: number;
  projectsByStatus: Record<string, number>;
  projectsByStage: Record<string, number>;
  projectsByExecutionStage: Record<string, number>;
  avgCompletionPercentage: number;
  projectsOverdue: number;
  projectsWithBlockers: number;
  upcomingDeliveries: number;
  avgDaysToDelivery: number;
  onTimeDeliveryRate: number;
  projectsWithMilestones: number;
  completedMilestones: number;
  totalMilestones: number;
  avgChecklistCompletion: number;
}

export interface OwnerPerformance {
  ownerId: string;
  ownerName: string;
  totalMrr: number;
  activeDeals: number;
  dealsWonMonth: number;
  pipelineValue: number;
  avgDealSize: number;
  conversionRate: number;
  activitiesCount: number;
  avgCycleTime: number;
}

export interface MrrTrendItem {
  month: string;
  mrrTotal: number;
  newMrr: number;
  churnedMrr: number;
}

export interface ForecastMetrics {
  pipelineValue: number;
  weightedPipeline: number;
  expectedCloses30Days: number;
  expectedMrr30Days: number;
  bestCase: number;
  worstCase: number;
}

// Client Metrics
export interface ClientMetrics {
  totalClients: number;
  newClientsThisMonth: number;
  newClientsLastMonth: number;
  clientGrowth: number;
  avgClientAge: number;
  clientsBySource: Record<string, number>;
  topClients: Array<{
    id: string;
    name: string;
    mrr: number;
    projects: number;
    since: string;
  }>;
  clientsWithPhone: number;
  clientsWithLinkedIn: number;
  clientsWithWebsite: number;
  avgContactsPerClient: number;
  clientRetentionRate: number;
}

// Invoice Metrics
export interface InvoiceMetrics {
  totalInvoiced: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: number;
  invoicesThisMonth: number;
  invoicesLastMonth: number;
  avgInvoiceAmount: number;
  invoicesByStatus: Record<string, number>;
  invoicesByType: Record<string, number>;
  revenueByMonth: Array<{ month: string; invoiced: number; collected: number }>;
  avgDaysToPayment: number;
  overdueInvoices: Array<{
    id: string;
    projectName: string;
    amount: number;
    daysOverdue: number;
  }>;
  upcomingPayments: Array<{
    id: string;
    projectName: string;
    amount: number;
    dueDate: string;
  }>;
}

// Proposal Metrics
export interface ProposalMetrics {
  totalProposals: number;
  proposalsThisMonth: number;
  finalProposals: number;
  avgProposalValue: number;
  totalProposalValue: number;
  conversionRate: number;
}

// Channel Metrics
export interface ChannelMetrics {
  leadsByChannel: Record<string, number>;
  leadsBySubchannel: Record<string, number>;
  conversionByChannel: Record<string, number>;
  mrrByChannel: Record<string, number>;
  bestPerformingChannel: string;
  channelDetails: Array<{
    channel: string;
    leads: number;
    won: number;
    lost: number;
    mrr: number;
    conversionRate: number;
    avgCycleTime: number;
  }>;
}

// Product Metrics
export interface ProductMetrics {
  leadsByProduct: Record<string, number>;
  mrrByProduct: Record<string, number>;
  conversionByProduct: Record<string, number>;
}

export interface AnalyticsData {
  revenue: RevenueMetrics;
  pipeline: PipelineStageMetrics[];
  salesVelocity: SalesVelocityMetrics;
  activities: ActivityMetrics;
  projectHealth: ProjectHealthMetrics;
  ownerPerformance: OwnerPerformance[];
  mrrTrend: MrrTrendItem[];
  forecast: ForecastMetrics;
  leadsBySource: Record<string, number>;
  dealsByMonth: Array<{ month: string; won: number; lost: number; value: number }>;
  clients: ClientMetrics;
  invoices: InvoiceMetrics;
  proposals: ProposalMetrics;
  channels: ChannelMetrics;
  products: ProductMetrics;
  // Quick Stats
  totalLeads: number;
  activeLeads: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  leadGrowth: number;
}

// Stage order and weights for pipeline
const STAGE_ORDER = [
  'PROSPECTO',
  'PRIMER_CONTACTO',
  'CITA_AGENDADA',
  'PROPUESTA_ENVIADA',
  'NEGOCIACION',
  'CERRADO_GANADO',
  'CERRADO_PERDIDO',
];

const STAGE_WEIGHTS: Record<string, number> = {
  'PROSPECTO': 0.05,
  'PRIMER_CONTACTO': 0.15,
  'CITA_AGENDADA': 0.30,
  'PROPUESTA_ENVIADA': 0.50,
  'NEGOCIACION': 0.75,
  'CERRADO_GANADO': 1,
  'CERRADO_PERDIDO': 0,
};

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Week dates
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay() + 1);
      thisWeekStart.setHours(0, 0, 0, 0);

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setMilliseconds(-1);

      // Fetch all required data in parallel
      const [
        dealsResult,
        leadsResult,
        activitiesResult,
        stageHistoryResult,
        projectsResult,
        projectUpdatesResult,
        goalsResult,
        clientsResult,
        clientContactsResult,
        invoicesResult,
        proposalsResult,
        milestonesResult,
        checklistResult,
      ] = await Promise.all([
        supabase.from('deals').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('lead_activities').select('*'),
        supabase.from('lead_stage_history').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('project_updates').select('*'),
        supabase.from('goals').select('*').eq('goal_type', 'MRR_GLOBAL_USD').order('effective_from', { ascending: false }).limit(1),
        supabase.from('clients').select('*'),
        supabase.from('client_contacts').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('proposals').select('*'),
        supabase.from('project_milestones').select('*'),
        supabase.from('project_checklist_items').select('*'),
      ]);

      const deals = dealsResult.data || [];
      const leads = leadsResult.data || [];
      const activities = activitiesResult.data || [];
      const stageHistory = stageHistoryResult.data || [];
      const projects = projectsResult.data || [];
      const projectUpdates = projectUpdatesResult.data || [];
      const goalMrr = goalsResult.data?.[0]?.value_usd || 50000;
      const clients = clientsResult.data || [];
      const clientContacts = clientContactsResult.data || [];
      const invoices = invoicesResult.data || [];
      const proposalsData = proposalsResult.data || [];
      const milestones = milestonesResult.data || [];
      const checklistItems = checklistResult.data || [];

      // Create maps for quick lookup
      const leadMap = new Map(leads.map(l => [l.id, l]));
      const clientMap = new Map(clients.map(c => [c.id, c]));
      const projectMap = new Map(projects.map(p => [p.id, p]));

      // Build owner map
      const uniqueOwnerIds = [...new Set(leads.map(l => l.owner_id).filter(Boolean))];
      const ownerMap = new Map(uniqueOwnerIds.map(id => [id, id || 'Sin asignar']));

      // ==================== LEAD STATS ====================
      const totalLeads = leads.length;
      const activeLeads = leads.filter(l =>
        l.stage !== 'CERRADO_GANADO' && l.stage !== 'CERRADO_PERDIDO'
      );
      const leadsThisMonth = leads.filter(l => new Date(l.created_at) >= thisMonthStart).length;
      const leadsLastMonth = leads.filter(l =>
        new Date(l.created_at) >= lastMonthStart && new Date(l.created_at) <= lastMonthEnd
      ).length;
      const leadGrowth = leadsLastMonth > 0 ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100 : 0;

      // ==================== REVENUE METRICS ====================
      const activeDeals = deals.filter(d => d.status === 'ACTIVE');
      const currentMrr = activeDeals.reduce((sum, d) => sum + (d.mrr_usd || 0), 0);

      const previousMonthDeals = deals.filter(d => {
        const startDate = new Date(d.start_date);
        return startDate <= lastMonthEnd && d.status === 'ACTIVE';
      });
      const previousMrr = previousMonthDeals.reduce((sum, d) => sum + (d.mrr_usd || 0), 0);

      const mrrGrowth = currentMrr - previousMrr;
      const mrrGrowthPercentage = previousMrr > 0 ? (mrrGrowth / previousMrr) * 100 : 0;

      const feesMonth = deals
        .filter(d => new Date(d.created_at) >= thisMonthStart)
        .reduce((sum, d) => sum + (d.implementation_fee_usd || 0), 0);

      const feesHistorical = deals.reduce((sum, d) => sum + (d.implementation_fee_usd || 0), 0);

      const avgDealSize = activeDeals.length > 0
        ? activeDeals.reduce((sum, d) => sum + (d.implementation_fee_usd || 0), 0) / activeDeals.length
        : 0;

      const avgMrr = activeDeals.length > 0 ? currentMrr / activeDeals.length : 0;

      // Total revenue from invoices
      const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.total_usd || 0), 0);
      const revenueThisMonth = invoices
        .filter(i => i.status === 'PAID' && i.paid_at && new Date(i.paid_at) >= thisMonthStart)
        .reduce((sum, i) => sum + (i.total_usd || 0), 0);
      const revenueLastMonth = invoices
        .filter(i => i.status === 'PAID' && i.paid_at &&
          new Date(i.paid_at) >= lastMonthStart && new Date(i.paid_at) <= lastMonthEnd)
        .reduce((sum, i) => sum + (i.total_usd || 0), 0);

      const revenue: RevenueMetrics = {
        currentMrr,
        previousMrr,
        mrrGrowth,
        mrrGrowthPercentage,
        arr: currentMrr * 12,
        goalMrr,
        goalProgress: goalMrr > 0 ? (currentMrr / goalMrr) * 100 : 0,
        feesMonth,
        feesHistorical,
        avgDealSize,
        avgMrr,
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
      };

      // ==================== PIPELINE METRICS ====================
      const pipeline: PipelineStageMetrics[] = STAGE_ORDER.map(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        const stageValue = stageLeads.reduce((sum, l) => {
          const deal = deals.find(d => d.lead_id === l.id);
          return sum + (deal?.mrr_usd || 0);
        }, 0);

        // Calculate avg days in stage
        const daysInStage: number[] = [];
        stageLeads.forEach(l => {
          const enteredAt = l.stage_entered_at ? new Date(l.stage_entered_at) : new Date(l.created_at);
          const days = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));
          daysInStage.push(days);
        });
        const avgDaysInStage = daysInStage.length > 0
          ? daysInStage.reduce((a, b) => a + b, 0) / daysInStage.length
          : 0;

        // Calculate conversion from this stage
        const exitedFromStage = stageHistory.filter(h => h.from_stage === stage);
        const progressedFromStage = exitedFromStage.filter(h =>
          h.to_stage !== 'CERRADO_PERDIDO' && STAGE_ORDER.indexOf(h.to_stage) > STAGE_ORDER.indexOf(stage)
        );
        const conversionRate = exitedFromStage.length > 0
          ? (progressedFromStage.length / exitedFromStage.length) * 100
          : 0;

        return {
          stage,
          count: stageLeads.length,
          value: stageValue,
          avgDaysInStage,
          conversionRate,
        };
      });

      // ==================== SALES VELOCITY ====================
      const closedWonHistory = stageHistory.filter(h => h.to_stage === 'CERRADO_GANADO');
      const dealCycles: number[] = [];

      closedWonHistory.forEach(h => {
        const lead = leadMap.get(h.lead_id);
        if (lead) {
          const createdAt = new Date(lead.created_at);
          const closedAt = new Date(h.changed_at);
          const days = Math.floor((closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0) dealCycles.push(days);
        }
      });

      const avgDealCycle = dealCycles.length > 0
        ? dealCycles.reduce((a, b) => a + b, 0) / dealCycles.length
        : 0;

      // Average time by stage
      const avgTimeByStage: Record<string, number> = {};
      STAGE_ORDER.forEach(stage => {
        const stageTransitions = stageHistory.filter(h => h.from_stage === stage);
        if (stageTransitions.length === 0) {
          avgTimeByStage[stage] = 0;
          return;
        }

        const times: number[] = [];
        stageTransitions.forEach(h => {
          const entryRecord = stageHistory.find(
            entry => entry.lead_id === h.lead_id && entry.to_stage === stage
          );
          if (entryRecord) {
            const entryDate = new Date(entryRecord.changed_at);
            const exitDate = new Date(h.changed_at);
            const days = Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            if (days >= 0) times.push(days);
          }
        });

        avgTimeByStage[stage] = times.length > 0
          ? times.reduce((a, b) => a + b, 0) / times.length
          : 0;
      });

      const closedWonThisMonth = stageHistory.filter(h =>
        h.to_stage === 'CERRADO_GANADO' && new Date(h.changed_at) >= thisMonthStart
      ).length;

      const closedLostThisMonth = stageHistory.filter(h =>
        h.to_stage === 'CERRADO_PERDIDO' && new Date(h.changed_at) >= thisMonthStart
      ).length;

      const closedWonLastMonth = stageHistory.filter(h =>
        h.to_stage === 'CERRADO_GANADO' &&
        new Date(h.changed_at) >= lastMonthStart &&
        new Date(h.changed_at) <= lastMonthEnd
      ).length;

      const totalClosedThisMonth = closedWonThisMonth + closedLostThisMonth;
      const winRate = totalClosedThisMonth > 0
        ? (closedWonThisMonth / totalClosedThisMonth) * 100
        : 0;

      // Loss reasons (from lead notes for lost deals)
      const lossReasons: Record<string, number> = {};
      leads.filter(l => l.stage === 'CERRADO_PERDIDO').forEach(l => {
        const reason = l.notes?.toLowerCase().includes('precio') ? 'Precio' :
                       l.notes?.toLowerCase().includes('competencia') ? 'Competencia' :
                       l.notes?.toLowerCase().includes('timing') ? 'Timing' :
                       l.notes?.toLowerCase().includes('no responde') ? 'Sin respuesta' :
                       'Otro';
        lossReasons[reason] = (lossReasons[reason] || 0) + 1;
      });

      const salesVelocity: SalesVelocityMetrics = {
        avgDealCycle,
        avgTimeByStage,
        dealsClosedThisMonth: closedWonThisMonth,
        dealsClosedLastMonth: closedWonLastMonth,
        closedWonThisMonth,
        closedLostThisMonth,
        winRate,
        lossReasons,
      };

      // ==================== ACTIVITY METRICS ====================
      const activitiesThisWeek = activities.filter(a =>
        new Date(a.created_at) >= thisWeekStart
      ).length;

      const activitiesLastWeek = activities.filter(a =>
        new Date(a.created_at) >= lastWeekStart && new Date(a.created_at) < thisWeekStart
      ).length;

      const activitiesGrowth = activitiesLastWeek > 0
        ? ((activitiesThisWeek - activitiesLastWeek) / activitiesLastWeek) * 100
        : 0;

      const activitiesByType: Record<string, number> = {};
      activities.forEach(a => {
        const type = a.type || 'other';
        activitiesByType[type] = (activitiesByType[type] || 0) + 1;
      });

      const activitiesThisMonth = activities.filter(a =>
        new Date(a.created_at) >= thisMonthStart
      ).length;

      // Activities by day of week
      const activitiesByDay: Record<string, number> = { 'Lun': 0, 'Mar': 0, 'Mie': 0, 'Jue': 0, 'Vie': 0, 'Sab': 0, 'Dom': 0 };
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      activities.forEach(a => {
        const day = dayNames[new Date(a.created_at).getDay()];
        activitiesByDay[day]++;
      });
      const mostActiveDay = Object.entries(activitiesByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      const leadIdsWithActivity = new Set(activities.map(a => a.lead_id));
      const leadsWithoutActivity = activeLeads.filter(l => !leadIdsWithActivity.has(l.id)).length;

      const avgActivitiesPerLead = activeLeads.length > 0
        ? activities.filter(a => activeLeads.some(l => l.id === a.lead_id)).length / activeLeads.length
        : 0;

      const activityMetrics: ActivityMetrics = {
        activitiesThisWeek,
        activitiesLastWeek,
        activitiesGrowth,
        activitiesByType,
        avgActivitiesPerLead,
        leadsWithoutActivity,
        activitiesThisMonth,
        mostActiveDay,
        activitiesByDay,
      };

      // ==================== PROJECT HEALTH ====================
      const activeProjects = projects.filter(p => p.stage === 'CERRADO_GANADO');

      const projectsByStatus: Record<string, number> = {};
      const projectsByStage: Record<string, number> = {};
      const projectsByExecutionStage: Record<string, number> = {};

      projects.forEach(p => {
        projectsByStage[p.stage] = (projectsByStage[p.stage] || 0) + 1;
        if (p.execution_stage) {
          projectsByExecutionStage[p.execution_stage] = (projectsByExecutionStage[p.execution_stage] || 0) + 1;
        }
      });

      // Calculate project completion based on checklist
      const projectCompletions: number[] = [];
      activeProjects.forEach(p => {
        const projectChecklist = checklistItems.filter(c => c.project_id === p.id);
        if (projectChecklist.length > 0) {
          const completed = projectChecklist.filter(c => c.completed_at).length;
          projectCompletions.push((completed / projectChecklist.length) * 100);
        }
      });

      const avgChecklistCompletion = projectCompletions.length > 0
        ? projectCompletions.reduce((a, b) => a + b, 0) / projectCompletions.length
        : 0;

      // Milestones stats
      const projectsWithMilestones = new Set(milestones.map(m => m.project_id)).size;
      const completedMilestones = milestones.filter(m => m.actual_date).length;
      const totalMilestones = milestones.length;

      const projectsOverdue = projects.filter(p => {
        if (!p.estimated_delivery_date || p.stage !== 'CERRADO_GANADO') return false;
        return new Date(p.estimated_delivery_date) < now && !p.actual_delivery_date;
      }).length;

      const projectsWithBlockers = projectUpdates.filter(u =>
        u.update_type === 'blocker' && !u.is_resolved
      ).length;

      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingDeliveries = projects.filter(p => {
        if (!p.estimated_delivery_date || p.stage !== 'CERRADO_GANADO') return false;
        const deliveryDate = new Date(p.estimated_delivery_date);
        return deliveryDate >= now && deliveryDate <= thirtyDaysFromNow;
      }).length;

      // Average days to delivery
      const deliveryTimes: number[] = [];
      projects.filter(p => p.actual_delivery_date && p.kickoff_date).forEach(p => {
        const kickoff = new Date(p.kickoff_date!);
        const delivery = new Date(p.actual_delivery_date!);
        const days = Math.floor((delivery.getTime() - kickoff.getTime()) / (1000 * 60 * 60 * 24));
        if (days > 0) deliveryTimes.push(days);
      });
      const avgDaysToDelivery = deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

      // On-time delivery rate
      const deliveredProjects = projects.filter(p => p.actual_delivery_date);
      const onTimeDeliveries = deliveredProjects.filter(p => {
        if (!p.estimated_delivery_date) return true;
        return new Date(p.actual_delivery_date!) <= new Date(p.estimated_delivery_date);
      }).length;
      const onTimeDeliveryRate = deliveredProjects.length > 0
        ? (onTimeDeliveries / deliveredProjects.length) * 100
        : 100;

      const projectHealth: ProjectHealthMetrics = {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        projectsByStatus,
        projectsByStage,
        projectsByExecutionStage,
        avgCompletionPercentage: avgChecklistCompletion,
        projectsOverdue,
        projectsWithBlockers,
        upcomingDeliveries,
        avgDaysToDelivery,
        onTimeDeliveryRate,
        projectsWithMilestones,
        completedMilestones,
        totalMilestones,
        avgChecklistCompletion,
      };

      // ==================== OWNER PERFORMANCE ====================
      const ownerPerformance: OwnerPerformance[] = [];
      const ownerIds = [...new Set(leads.map(l => l.owner_id).filter(Boolean))];

      ownerIds.forEach(ownerId => {
        if (!ownerId) return;

        const ownerLeads = leads.filter(l => l.owner_id === ownerId);
        const ownerDeals = deals.filter(d => ownerLeads.some(l => l.id === d.lead_id));
        const activeOwnerDeals = ownerDeals.filter(d => d.status === 'ACTIVE');
        const ownerActivities = activities.filter(a => ownerLeads.some(l => l.id === a.lead_id));

        const totalMrr = activeOwnerDeals.reduce((sum, d) => sum + (d.mrr_usd || 0), 0);

        const dealsWonMonth = stageHistory.filter(h =>
          h.to_stage === 'CERRADO_GANADO' &&
          new Date(h.changed_at) >= thisMonthStart &&
          ownerLeads.some(l => l.id === h.lead_id)
        ).length;

        const pipelineLeads = ownerLeads.filter(l =>
          l.stage !== 'CERRADO_GANADO' && l.stage !== 'CERRADO_PERDIDO'
        );
        const pipelineValue = pipelineLeads.reduce((sum, l) => {
          const deal = deals.find(d => d.lead_id === l.id);
          return sum + (deal?.mrr_usd || 0);
        }, 0);

        const avgOwnerDealSize = activeOwnerDeals.length > 0
          ? activeOwnerDeals.reduce((sum, d) => sum + (d.implementation_fee_usd || 0), 0) / activeOwnerDeals.length
          : 0;

        const wonLeads = ownerLeads.filter(l => l.stage === 'CERRADO_GANADO').length;
        const lostLeads = ownerLeads.filter(l => l.stage === 'CERRADO_PERDIDO').length;
        const conversionRate = (wonLeads + lostLeads) > 0
          ? (wonLeads / (wonLeads + lostLeads)) * 100
          : 0;

        // Average cycle time for this owner
        const ownerCycles: number[] = [];
        stageHistory.filter(h =>
          h.to_stage === 'CERRADO_GANADO' && ownerLeads.some(l => l.id === h.lead_id)
        ).forEach(h => {
          const lead = leadMap.get(h.lead_id);
          if (lead) {
            const days = Math.floor((new Date(h.changed_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
            if (days > 0) ownerCycles.push(days);
          }
        });
        const avgCycleTime = ownerCycles.length > 0
          ? ownerCycles.reduce((a, b) => a + b, 0) / ownerCycles.length
          : 0;

        ownerPerformance.push({
          ownerId,
          ownerName: ownerMap.get(ownerId) || 'Sin asignar',
          totalMrr,
          activeDeals: activeOwnerDeals.length,
          dealsWonMonth,
          pipelineValue,
          avgDealSize: avgOwnerDealSize,
          conversionRate,
          activitiesCount: ownerActivities.length,
          avgCycleTime,
        });
      });

      ownerPerformance.sort((a, b) => b.totalMrr - a.totalMrr);

      // ==================== MRR TREND ====================
      const mrrTrend: MrrTrendItem[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);

        const mrrAtMonth = deals.filter(d => {
          const startDate = new Date(d.start_date);
          return d.status === 'ACTIVE' && startDate <= monthEnd;
        }).reduce((sum, d) => sum + (d.mrr_usd || 0), 0);

        const mrrPrevMonth = deals.filter(d => {
          const startDate = new Date(d.start_date);
          return d.status === 'ACTIVE' && startDate <= prevMonthEnd;
        }).reduce((sum, d) => sum + (d.mrr_usd || 0), 0);

        // Churn calculation
        const churnedThisMonth = deals.filter(d => {
          if (d.status !== 'CHURNED' && d.status !== 'CANCELLED') return false;
          const updatedAt = new Date(d.updated_at);
          return updatedAt >= monthDate && updatedAt <= monthEnd;
        }).reduce((sum, d) => sum + (d.mrr_usd || 0), 0);

        mrrTrend.push({
          month: monthDate.toISOString().substring(0, 7),
          mrrTotal: mrrAtMonth,
          newMrr: Math.max(0, mrrAtMonth - mrrPrevMonth + churnedThisMonth),
          churnedMrr: churnedThisMonth,
        });
      }

      // ==================== FORECAST ====================
      const pipelineValue = activeLeads.reduce((sum, l) => {
        const deal = deals.find(d => d.lead_id === l.id);
        return sum + (deal?.mrr_usd || 0);
      }, 0);

      const weightedPipeline = activeLeads.reduce((sum, l) => {
        const deal = deals.find(d => d.lead_id === l.id);
        const weight = STAGE_WEIGHTS[l.stage] || 0;
        return sum + ((deal?.mrr_usd || 0) * weight);
      }, 0);

      const closeableLeads = activeLeads.filter(l =>
        l.stage === 'NEGOCIACION' || l.stage === 'PROPUESTA_ENVIADA'
      );
      const effectiveWinRate = winRate > 0 ? winRate : 30;
      const expectedCloses30Days = Math.round(closeableLeads.length * (effectiveWinRate / 100));
      const expectedMrr30Days = closeableLeads.reduce((sum, l) => {
        const deal = deals.find(d => d.lead_id === l.id);
        return sum + ((deal?.mrr_usd || 0) * (effectiveWinRate / 100));
      }, 0);

      // Best/Worst case scenarios
      const bestCase = closeableLeads.reduce((sum, l) => {
        const deal = deals.find(d => d.lead_id === l.id);
        return sum + (deal?.mrr_usd || 0);
      }, 0);
      const worstCase = closeableLeads.reduce((sum, l) => {
        const deal = deals.find(d => d.lead_id === l.id);
        const weight = STAGE_WEIGHTS[l.stage] || 0;
        return sum + ((deal?.mrr_usd || 0) * weight * 0.5);
      }, 0);

      const forecast: ForecastMetrics = {
        pipelineValue,
        weightedPipeline,
        expectedCloses30Days,
        expectedMrr30Days,
        bestCase,
        worstCase,
      };

      // ==================== LEADS BY SOURCE/CHANNEL ====================
      const leadsBySource: Record<string, number> = {};
      leads.forEach(l => {
        const source = l.channel || 'Desconocido';
        leadsBySource[source] = (leadsBySource[source] || 0) + 1;
      });

      // ==================== DEALS BY MONTH ====================
      const dealsByMonth: Array<{ month: string; won: number; lost: number; value: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const wonThisMonth = stageHistory.filter(h =>
          h.to_stage === 'CERRADO_GANADO' &&
          new Date(h.changed_at) >= monthDate &&
          new Date(h.changed_at) <= monthEnd
        );

        const lostThisMonth = stageHistory.filter(h =>
          h.to_stage === 'CERRADO_PERDIDO' &&
          new Date(h.changed_at) >= monthDate &&
          new Date(h.changed_at) <= monthEnd
        );

        const valueWon = wonThisMonth.reduce((sum, h) => {
          const deal = deals.find(d => d.lead_id === h.lead_id);
          return sum + (deal?.mrr_usd || 0);
        }, 0);

        dealsByMonth.push({
          month: monthDate.toISOString().substring(0, 7),
          won: wonThisMonth.length,
          lost: lostThisMonth.length,
          value: valueWon,
        });
      }

      // ==================== CLIENT METRICS ====================
      const newClientsThisMonth = clients.filter(c => new Date(c.created_at) >= thisMonthStart).length;
      const newClientsLastMonth = clients.filter(c =>
        new Date(c.created_at) >= lastMonthStart && new Date(c.created_at) <= lastMonthEnd
      ).length;
      const clientGrowth = newClientsLastMonth > 0 ? ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100 : 0;

      // Average client age
      const clientAges = clients.map(c => Math.floor((now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)));
      const avgClientAge = clientAges.length > 0 ? clientAges.reduce((a, b) => a + b, 0) / clientAges.length : 0;

      // Clients by source (original lead channel)
      const clientsBySource: Record<string, number> = {};
      clients.forEach(c => {
        if (c.original_lead_id) {
          const lead = leadMap.get(c.original_lead_id);
          const source = lead?.channel || 'Directo';
          clientsBySource[source] = (clientsBySource[source] || 0) + 1;
        } else {
          clientsBySource['Directo'] = (clientsBySource['Directo'] || 0) + 1;
        }
      });

      // Top clients by MRR
      const topClients = clients.map(c => {
        const clientDeals = deals.filter(d => {
          const lead = d.lead_id ? leadMap.get(d.lead_id) : null;
          return lead && clients.find(cl => cl.original_lead_id === lead.id)?.id === c.id;
        });
        const clientProjects = projects.filter(p => p.client_id === c.id);
        const mrr = clientDeals.filter(d => d.status === 'ACTIVE').reduce((sum, d) => sum + (d.mrr_usd || 0), 0);
        return {
          id: c.id,
          name: c.company_name,
          mrr,
          projects: clientProjects.length,
          since: c.created_at,
        };
      }).sort((a, b) => b.mrr - a.mrr).slice(0, 10);

      // Client data quality
      const clientsWithPhone = clients.filter(c => c.phone).length;
      const clientsWithLinkedIn = clients.filter(c => c.linkedin_url).length;
      const clientsWithWebsite = clients.filter(c => c.website_url).length;
      const avgContactsPerClient = clients.length > 0
        ? clientContacts.length / clients.length
        : 0;

      // Retention rate (clients with active deals vs total)
      const clientsWithActiveDeals = new Set(
        activeDeals.map(d => {
          const lead = d.lead_id ? leadMap.get(d.lead_id) : null;
          return lead ? clients.find(c => c.original_lead_id === lead.id)?.id : null;
        }).filter(Boolean)
      ).size;
      const clientRetentionRate = clients.length > 0 ? (clientsWithActiveDeals / clients.length) * 100 : 0;

      const clientMetrics: ClientMetrics = {
        totalClients: clients.length,
        newClientsThisMonth,
        newClientsLastMonth,
        clientGrowth,
        avgClientAge,
        clientsBySource,
        topClients,
        clientsWithPhone,
        clientsWithLinkedIn,
        clientsWithWebsite,
        avgContactsPerClient,
        clientRetentionRate,
      };

      // ==================== INVOICE METRICS ====================
      const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total_usd || 0), 0);
      const totalCollected = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.total_usd || 0), 0);
      const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + (i.total_usd || 0), 0);
      const totalOverdue = invoices.filter(i => {
        if (i.status !== 'PENDING') return false;
        return i.due_date && new Date(i.due_date) < now;
      }).reduce((sum, i) => sum + (i.total_usd || 0), 0);

      const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

      const invoicesThisMonth = invoices.filter(i => new Date(i.created_at) >= thisMonthStart).length;
      const invoicesLastMonth = invoices.filter(i =>
        new Date(i.created_at) >= lastMonthStart && new Date(i.created_at) <= lastMonthEnd
      ).length;

      const avgInvoiceAmount = invoices.length > 0
        ? invoices.reduce((sum, i) => sum + (i.total_usd || 0), 0) / invoices.length
        : 0;

      // Invoices by status
      const invoicesByStatus: Record<string, number> = {};
      invoices.forEach(i => {
        invoicesByStatus[i.status] = (invoicesByStatus[i.status] || 0) + 1;
      });

      // Invoices by type
      const invoicesByType: Record<string, number> = {};
      invoices.forEach(i => {
        invoicesByType[i.invoice_type] = (invoicesByType[i.invoice_type] || 0) + 1;
      });

      // Revenue by month
      const revenueByMonth: Array<{ month: string; invoiced: number; collected: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const invoicedMonth = invoices.filter(i =>
          new Date(i.created_at) >= monthDate && new Date(i.created_at) <= monthEnd
        ).reduce((sum, i) => sum + (i.total_usd || 0), 0);

        const collectedMonth = invoices.filter(i =>
          i.status === 'PAID' && i.paid_at &&
          new Date(i.paid_at) >= monthDate && new Date(i.paid_at) <= monthEnd
        ).reduce((sum, i) => sum + (i.total_usd || 0), 0);

        revenueByMonth.push({
          month: monthDate.toISOString().substring(0, 7),
          invoiced: invoicedMonth,
          collected: collectedMonth,
        });
      }

      // Average days to payment
      const paymentTimes: number[] = [];
      invoices.filter(i => i.status === 'PAID' && i.paid_at).forEach(i => {
        const created = new Date(i.created_at);
        const paid = new Date(i.paid_at!);
        const days = Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 0) paymentTimes.push(days);
      });
      const avgDaysToPayment = paymentTimes.length > 0
        ? paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length
        : 0;

      // Overdue invoices
      const overdueInvoices = invoices
        .filter(i => i.status === 'PENDING' && i.due_date && new Date(i.due_date) < now)
        .map(i => {
          const project = projectMap.get(i.project_id);
          const daysOverdue = Math.floor((now.getTime() - new Date(i.due_date!).getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: i.id,
            projectName: project?.name || 'Proyecto desconocido',
            amount: i.total_usd || 0,
            daysOverdue,
          };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
        .slice(0, 10);

      // Upcoming payments
      const upcomingPayments = invoices
        .filter(i => i.status === 'PENDING' && i.due_date && new Date(i.due_date) >= now)
        .map(i => {
          const project = projectMap.get(i.project_id);
          return {
            id: i.id,
            projectName: project?.name || 'Proyecto desconocido',
            amount: i.total_usd || 0,
            dueDate: i.due_date!,
          };
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 10);

      const invoiceMetrics: InvoiceMetrics = {
        totalInvoiced,
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate,
        invoicesThisMonth,
        invoicesLastMonth,
        avgInvoiceAmount,
        invoicesByStatus,
        invoicesByType,
        revenueByMonth,
        avgDaysToPayment,
        overdueInvoices,
        upcomingPayments,
      };

      // ==================== PROPOSAL METRICS ====================
      const proposalsThisMonth = proposalsData.filter(p => new Date(p.created_at) >= thisMonthStart).length;
      const finalProposals = proposalsData.filter(p => p.is_final).length;
      const avgProposalValue = proposalsData.length > 0
        ? proposalsData.reduce((sum, p) => sum + (p.mrr_usd || 0), 0) / proposalsData.length
        : 0;
      const totalProposalValue = proposalsData.reduce((sum, p) => sum + (p.mrr_usd || 0) + (p.fee_usd || 0), 0);

      // Proposal to deal conversion
      const proposalProjectIds = new Set(proposalsData.map(p => p.project_id));
      const wonProposalProjects = projects.filter(p =>
        proposalProjectIds.has(p.id) && p.stage === 'CERRADO_GANADO'
      ).length;
      const proposalConversionRate = proposalProjectIds.size > 0
        ? (wonProposalProjects / proposalProjectIds.size) * 100
        : 0;

      const proposalMetrics: ProposalMetrics = {
        totalProposals: proposalsData.length,
        proposalsThisMonth,
        finalProposals,
        avgProposalValue,
        totalProposalValue,
        conversionRate: proposalConversionRate,
      };

      // ==================== CHANNEL METRICS ====================
      const leadsByChannel: Record<string, number> = {};
      const leadsBySubchannel: Record<string, number> = {};
      leads.forEach(l => {
        leadsByChannel[l.channel] = (leadsByChannel[l.channel] || 0) + 1;
        if (l.subchannel) {
          leadsBySubchannel[l.subchannel] = (leadsBySubchannel[l.subchannel] || 0) + 1;
        }
      });

      // Conversion and MRR by channel
      const conversionByChannel: Record<string, number> = {};
      const mrrByChannel: Record<string, number> = {};
      Object.keys(leadsByChannel).forEach(channel => {
        const channelLeads = leads.filter(l => l.channel === channel);
        const won = channelLeads.filter(l => l.stage === 'CERRADO_GANADO').length;
        const lost = channelLeads.filter(l => l.stage === 'CERRADO_PERDIDO').length;
        conversionByChannel[channel] = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;

        const channelMrr = channelLeads.reduce((sum, l) => {
          const deal = deals.find(d => d.lead_id === l.id && d.status === 'ACTIVE');
          return sum + (deal?.mrr_usd || 0);
        }, 0);
        mrrByChannel[channel] = channelMrr;
      });

      // Best performing channel
      const bestPerformingChannel = Object.entries(mrrByChannel)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      // Channel details
      const channelDetails = Object.keys(leadsByChannel).map(channel => {
        const channelLeads = leads.filter(l => l.channel === channel);
        const won = channelLeads.filter(l => l.stage === 'CERRADO_GANADO').length;
        const lost = channelLeads.filter(l => l.stage === 'CERRADO_PERDIDO').length;

        // Average cycle time for channel
        const channelCycles: number[] = [];
        stageHistory.filter(h =>
          h.to_stage === 'CERRADO_GANADO' && channelLeads.some(l => l.id === h.lead_id)
        ).forEach(h => {
          const lead = leadMap.get(h.lead_id);
          if (lead) {
            const days = Math.floor((new Date(h.changed_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
            if (days > 0) channelCycles.push(days);
          }
        });

        return {
          channel,
          leads: channelLeads.length,
          won,
          lost,
          mrr: mrrByChannel[channel] || 0,
          conversionRate: conversionByChannel[channel] || 0,
          avgCycleTime: channelCycles.length > 0
            ? channelCycles.reduce((a, b) => a + b, 0) / channelCycles.length
            : 0,
        };
      }).sort((a, b) => b.mrr - a.mrr);

      const channelMetrics: ChannelMetrics = {
        leadsByChannel,
        leadsBySubchannel,
        conversionByChannel,
        mrrByChannel,
        bestPerformingChannel,
        channelDetails,
      };

      // ==================== PRODUCT METRICS ====================
      const leadsByProduct: Record<string, number> = {};
      const mrrByProduct: Record<string, number> = {};
      const conversionByProduct: Record<string, number> = {};

      leads.forEach(l => {
        const product = l.product_tag || 'Sin producto';
        leadsByProduct[product] = (leadsByProduct[product] || 0) + 1;
      });

      Object.keys(leadsByProduct).forEach(product => {
        const productLeads = leads.filter(l => (l.product_tag || 'Sin producto') === product);
        const won = productLeads.filter(l => l.stage === 'CERRADO_GANADO').length;
        const lost = productLeads.filter(l => l.stage === 'CERRADO_PERDIDO').length;
        conversionByProduct[product] = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;

        const productMrr = productLeads.reduce((sum, l) => {
          const deal = deals.find(d => d.lead_id === l.id && d.status === 'ACTIVE');
          return sum + (deal?.mrr_usd || 0);
        }, 0);
        mrrByProduct[product] = productMrr;
      });

      const productMetrics: ProductMetrics = {
        leadsByProduct,
        mrrByProduct,
        conversionByProduct,
      };

      return {
        revenue,
        pipeline,
        salesVelocity,
        activities: activityMetrics,
        projectHealth,
        ownerPerformance,
        mrrTrend,
        forecast,
        leadsBySource,
        dealsByMonth,
        clients: clientMetrics,
        invoices: invoiceMetrics,
        proposals: proposalMetrics,
        channels: channelMetrics,
        products: productMetrics,
        totalLeads,
        activeLeads: activeLeads.length,
        leadsThisMonth,
        leadsLastMonth,
        leadGrowth,
      };
    },
    refetchInterval: 60000,
  });
}
