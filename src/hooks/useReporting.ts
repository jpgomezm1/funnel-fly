import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadStage, LeadChannel, LeadSubchannel, STAGE_ORDER } from '@/types/database';

export interface ReportingFilters {
  ownerId?: string;
  channel?: LeadChannel;
  subchannel?: LeadSubchannel;
}

export interface ReportingPeriod {
  start: Date;
  end: Date;
}

export interface StageMetrics {
  stage: LeadStage;
  entries: number;
}

export interface ConversionMetric {
  fromStage: LeadStage;
  toStage: LeadStage;
  percentage: number;
  fromCount: number;
  toCount: number;
}

export interface VelocityMetric {
  label: string;
  days: number | null;
}

export interface ChannelDistribution {
  channel: LeadChannel;
  subchannel: LeadSubchannel;
  count: number;
}

export interface TrendDataPoint {
  period: string;
  value: number;
}

export interface ReportingData {
  newLeads: number;
  stageMetrics: StageMetrics[];
  conversions: ConversionMetric[];
  velocity: VelocityMetric[];
  channelDistribution: ChannelDistribution[];
  trendData: TrendDataPoint[];
}

export function useReporting(
  period: ReportingPeriod,
  filters: ReportingFilters,
  trendType: 'weekly' | 'monthly' = 'weekly'
) {
  return useQuery({
    queryKey: ['reporting', { 
      start: period.start.toISOString(), 
      end: period.end.toISOString(), 
      ...filters,
      trendType 
    }],
    queryFn: async (): Promise<ReportingData> => {
      const startISO = period.start.toISOString();
      const endISO = period.end.toISOString();

      // Build filter conditions
      const ownerFilter = filters.ownerId ? filters.ownerId : null;
      const channelFilter = filters.channel ? filters.channel : null;
      const subchannelFilter = filters.subchannel ? filters.subchannel : null;

      // 1. New Leads Count
      let newLeadsQuery = supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startISO)
        .lt('created_at', endISO);

      if (ownerFilter) newLeadsQuery = newLeadsQuery.eq('owner_id', ownerFilter);
      if (channelFilter) newLeadsQuery = newLeadsQuery.eq('channel', channelFilter);
      if (subchannelFilter) newLeadsQuery = newLeadsQuery.eq('subchannel', subchannelFilter);

      const { count: newLeads, error: newLeadsError } = await newLeadsQuery;
      if (newLeadsError) throw newLeadsError;

      // 2. Stage Metrics - entries to each stage
      const stageMetrics: StageMetrics[] = [];
      for (const stage of STAGE_ORDER) {
        let stageQuery = supabase
          .from('lead_stage_history')
          .select(`
            id,
            leads!inner(owner_id, channel, subchannel)
          `, { count: 'exact', head: true })
          .eq('to_stage', stage)
          .gte('changed_at', startISO)
          .lt('changed_at', endISO);

        if (ownerFilter) stageQuery = stageQuery.eq('leads.owner_id', ownerFilter);
        if (channelFilter) stageQuery = stageQuery.eq('leads.channel', channelFilter);
        if (subchannelFilter) stageQuery = stageQuery.eq('leads.subchannel', subchannelFilter);

        const { count, error } = await stageQuery;
        if (error) throw error;

        stageMetrics.push({
          stage,
          entries: count || 0
        });
      }

      // 3. Calculate Conversions
      const conversions: ConversionMetric[] = [];
      const conversionPairs = [
        { from: 'PROSPECTO', to: 'CONTACTADO' },
        { from: 'CONTACTADO', to: 'DESCUBRIMIENTO' },
        { from: 'DESCUBRIMIENTO', to: 'DEMOSTRACION' },
        { from: 'DEMOSTRACION', to: 'PROPUESTA' },
        { from: 'PROPUESTA', to: 'CERRADO_GANADO' }
      ] as const;

      for (const pair of conversionPairs) {
        const fromMetric = stageMetrics.find(m => m.stage === pair.from);
        const toMetric = stageMetrics.find(m => m.stage === pair.to);
        
        const fromCount = fromMetric?.entries || 0;
        const toCount = toMetric?.entries || 0;
        const percentage = fromCount > 0 ? (toCount / fromCount) * 100 : 0;

        conversions.push({
          fromStage: pair.from as LeadStage,
          toStage: pair.to as LeadStage,
          percentage: Math.round(percentage * 100) / 100, // 2 decimals
          fromCount,
          toCount
        });
      }

      // 4. Velocity Metrics - simplified calculation
      const velocity: VelocityMetric[] = [
        { label: 'Descubrimiento → Demostración', days: null },
        { label: 'Demostración → Propuesta', days: null },
        { label: 'Propuesta → Cerrado Ganado', days: null }
      ];

      // Try to calculate velocity if we have sufficient data
      try {
        // Get stage history for velocity calculation
        let velocityQuery = supabase
          .from('lead_stage_history')
          .select(`
            lead_id,
            to_stage,
            changed_at,
            leads!inner(owner_id, channel, subchannel)
          `)
          .gte('changed_at', startISO)
          .lt('changed_at', endISO)
          .in('to_stage', ['DESCUBRIMIENTO', 'DEMOSTRACION', 'PROPUESTA', 'CERRADO_GANADO']);

        if (ownerFilter) velocityQuery = velocityQuery.eq('leads.owner_id', ownerFilter);
        if (channelFilter) velocityQuery = velocityQuery.eq('leads.channel', channelFilter);
        if (subchannelFilter) velocityQuery = velocityQuery.eq('leads.subchannel', subchannelFilter);

        const { data: velocityHistoryData, error: velocityHistoryError } = await velocityQuery;
        
        if (!velocityHistoryError && velocityHistoryData) {
          // Group by lead_id and calculate stage transitions
          const leadTransitions = new Map();
          
          velocityHistoryData.forEach(record => {
            if (!leadTransitions.has(record.lead_id)) {
              leadTransitions.set(record.lead_id, {});
            }
            const transitions = leadTransitions.get(record.lead_id);
            transitions[record.to_stage] = new Date(record.changed_at);
          });

          // Calculate average days for each transition
          const transitionPairs = [
            { from: 'DESCUBRIMIENTO', to: 'DEMOSTRACION', index: 0 },
            { from: 'DEMOSTRACION', to: 'PROPUESTA', index: 1 },
            { from: 'PROPUESTA', to: 'CERRADO_GANADO', index: 2 }
          ];

          for (const pair of transitionPairs) {
            const validTransitions = [];
            
            for (const [leadId, transitions] of leadTransitions) {
              const fromDate = transitions[pair.from];
              const toDate = transitions[pair.to];
              
              if (fromDate && toDate && toDate > fromDate) {
                const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
                validTransitions.push(daysDiff);
              }
            }

            if (validTransitions.length > 0) {
              const avgDays = validTransitions.reduce((sum, days) => sum + days, 0) / validTransitions.length;
              velocity[pair.index].days = Math.round(avgDays * 100) / 100; // 2 decimals
            }
          }
        }
      } catch (error) {
        console.warn('Error calculating velocity metrics:', error);
      }

      // 5. Channel Distribution
      let channelQuery = supabase
        .from('leads')
        .select('channel, subchannel')
        .gte('created_at', startISO)
        .lt('created_at', endISO);

      if (ownerFilter) channelQuery = channelQuery.eq('owner_id', ownerFilter);
      if (channelFilter) channelQuery = channelQuery.eq('channel', channelFilter);
      if (subchannelFilter) channelQuery = channelQuery.eq('subchannel', subchannelFilter);

      const { data: channelData, error: channelError } = await channelQuery;
      if (channelError) throw channelError;

      // Group by channel/subchannel
      const channelGroups = new Map<string, number>();
      channelData?.forEach(lead => {
        const key = `${lead.channel}-${lead.subchannel}`;
        channelGroups.set(key, (channelGroups.get(key) || 0) + 1);
      });

      const channelDistribution: ChannelDistribution[] = Array.from(channelGroups.entries()).map(([key, count]) => {
        const [channel, subchannel] = key.split('-');
        return {
          channel: channel as LeadChannel,
          subchannel: subchannel as LeadSubchannel,
          count
        };
      });

      // 6. Trend Data (simplified - last 8 weeks or 6 months)
      const trendData: TrendDataPoint[] = [];
      const periodsToShow = trendType === 'weekly' ? 8 : 6;
      const periodUnit = trendType === 'weekly' ? 7 : 30; // days

      for (let i = periodsToShow - 1; i >= 0; i--) {
        const periodEnd = new Date(period.end);
        const periodStart = new Date(period.end);
        
        if (trendType === 'weekly') {
          periodEnd.setDate(periodEnd.getDate() - (i * 7));
          periodStart.setDate(periodStart.getDate() - ((i + 1) * 7));
        } else {
          periodEnd.setMonth(periodEnd.getMonth() - i);
          periodStart.setMonth(periodStart.getMonth() - (i + 1));
        }

        // Count CERRADO_GANADO for this period
        let trendQuery = supabase
          .from('lead_stage_history')
          .select(`
            id,
            leads!inner(owner_id, channel, subchannel)
          `, { count: 'exact', head: true })
          .eq('to_stage', 'CERRADO_GANADO')
          .gte('changed_at', periodStart.toISOString())
          .lt('changed_at', periodEnd.toISOString());

        if (ownerFilter) trendQuery = trendQuery.eq('leads.owner_id', ownerFilter);
        if (channelFilter) trendQuery = trendQuery.eq('leads.channel', channelFilter);
        if (subchannelFilter) trendQuery = trendQuery.eq('leads.subchannel', subchannelFilter);

        const { count, error } = await trendQuery;
        if (error) throw error;

        const periodLabel = trendType === 'weekly' 
          ? `S${Math.floor((Date.now() - periodEnd.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`
          : periodEnd.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

        trendData.push({
          period: periodLabel,
          value: count || 0
        });
      }

      return {
        newLeads: newLeads || 0,
        stageMetrics,
        conversions,
        velocity,
        channelDistribution,
        trendData
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}