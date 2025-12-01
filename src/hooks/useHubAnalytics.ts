import { useQuery } from '@tanstack/react-query';
import { hubSupabase, HubProfile, NewsletterSubscriber } from '@/integrations/supabase/hubClient';
import { supabase } from '@/integrations/supabase/client';

// Re-export types for convenience
export type { HubProfile, NewsletterSubscriber };

// Types
export interface HubMetrics {
  // User metrics
  totalUsers: number;
  totalNewsletterSubscribers: number;
  activeNewsletterSubscribers: number;
  usersWithMarketingConsent: number;

  // Growth metrics
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  subscribersThisMonth: number;

  // Engagement metrics
  avgLeadScore: number;
  usersByLeadStatus: Record<string, number>;
  usersByCountry: Record<string, number>;

  // Tool usage
  toolUsage: {
    stackGenerator: number;
    toolComparator: number;
    impactAnalyzer: number;
    aiAssistant: number;
  };

  // Trends
  usersTrend: Array<{ date: string; count: number }>;
  subscribersTrend: Array<{ date: string; count: number }>;

  // Sources
  subscribersBySource: Record<string, number>;

  // All users
  allUsers: HubProfile[];

  // Recent activity
  recentUsers: HubProfile[];
  recentSubscribers: NewsletterSubscriber[];

  // Company analysis
  usersByCompany: Array<{ company: string; count: number; users: HubProfile[] }>;
  topCompanies: Array<{ company: string; count: number; avgScore: number; hasPhone: number }>;

  // Position analysis
  usersByPosition: Record<string, number>;
  positionCategories: {
    cLevel: number;
    director: number;
    manager: number;
    specialist: number;
    other: number;
  };

  // Retention metrics
  usersWithRecentActivity: number;
  dormantUsers: number;
  usersActiveLastWeek: number;
  usersActiveLastMonth: number;

  // Quality metrics
  usersWithPhone: number;
  usersWithCompany: number;
  usersWithPosition: number;
  completionRate: number;

  // Country quality
  countryMetrics: Array<{
    country: string;
    users: number;
    avgScore: number;
    withPhone: number;
    withConsent: number;
    toolUsage: number;
  }>;

  // All subscribers for newsletter tab
  allSubscribers: NewsletterSubscriber[];
}

export interface MixPanelMetrics {
  pageViews: number;
  uniqueUsers: number;
  topEvents: Array<{ event: string; count: number }>;
  pageViewsTrend: Array<{ date: string; count: number }>;
}

// Helper functions
function getDateRange(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}

function formatDateForQuery(date: Date): string {
  return date.toISOString();
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useHubAnalytics() {
  return useQuery({
    queryKey: ['hub-analytics'],
    queryFn: async (): Promise<HubMetrics> => {
      const now = new Date();
      const todayStart = getStartOfDay(now);
      const weekStart = getStartOfWeek(now);
      const monthStart = getStartOfMonth(now);

      console.log('Fetching Hub data from:', 'ncqdixlsfoskuoyaijwk.supabase.co');

      // Fetch all data in parallel
      const [
        profilesResult,
        subscribersResult,
        todayUsersResult,
        weekUsersResult,
        monthUsersResult,
        monthSubscribersResult,
      ] = await Promise.all([
        hubSupabase.from('profiles').select('*'),
        hubSupabase.from('newsletter_subscribers').select('*'),
        hubSupabase.from('profiles').select('id').gte('created_at', todayStart.toISOString()),
        hubSupabase.from('profiles').select('id').gte('created_at', weekStart.toISOString()),
        hubSupabase.from('profiles').select('id').gte('created_at', monthStart.toISOString()),
        hubSupabase.from('newsletter_subscribers').select('id').gte('subscribed_at', monthStart.toISOString()),
      ]);

      // Log results for debugging
      console.log('Hub profiles result:', profilesResult.error ? profilesResult.error : `${profilesResult.data?.length || 0} profiles`);
      console.log('Hub subscribers result:', subscribersResult.error ? subscribersResult.error : `${subscribersResult.data?.length || 0} subscribers`);

      if (profilesResult.error) {
        console.error('Error fetching profiles:', profilesResult.error);
      }
      if (subscribersResult.error) {
        console.error('Error fetching subscribers:', subscribersResult.error);
      }

      const profiles = (profilesResult.data || []) as HubProfile[];
      const subscribers = (subscribersResult.data || []) as NewsletterSubscriber[];

      // Calculate metrics
      const totalUsers = profiles.length;
      const totalNewsletterSubscribers = subscribers.length;
      const activeNewsletterSubscribers = subscribers.filter(s => s.is_active).length;
      const usersWithMarketingConsent = profiles.filter(p => p.marketing_consent).length;

      const usersToday = todayUsersResult.data?.length || 0;
      const usersThisWeek = weekUsersResult.data?.length || 0;
      const usersThisMonth = monthUsersResult.data?.length || 0;
      const subscribersThisMonth = monthSubscribersResult.data?.length || 0;

      // Average lead score
      const avgLeadScore = profiles.length > 0
        ? profiles.reduce((sum, p) => sum + (p.lead_score || 0), 0) / profiles.length
        : 0;

      // Users by lead status
      const usersByLeadStatus: Record<string, number> = {};
      profiles.forEach(p => {
        const status = p.lead_status || 'new';
        usersByLeadStatus[status] = (usersByLeadStatus[status] || 0) + 1;
      });

      // Users by country
      const usersByCountry: Record<string, number> = {};
      profiles.forEach(p => {
        const country = p.country || 'Unknown';
        usersByCountry[country] = (usersByCountry[country] || 0) + 1;
      });

      // Tool usage totals
      const toolUsage = {
        stackGenerator: profiles.reduce((sum, p) => sum + (p.stack_generator_uses || 0), 0),
        toolComparator: profiles.reduce((sum, p) => sum + (p.tool_comparator_uses || 0), 0),
        impactAnalyzer: profiles.reduce((sum, p) => sum + (p.impact_analyzer_uses || 0), 0),
        aiAssistant: profiles.reduce((sum, p) => sum + (p.ai_assistant_uses || 0), 0),
      };

      // Subscribers by source
      const subscribersBySource: Record<string, number> = {};
      subscribers.forEach(s => {
        const source = s.source || 'unknown';
        subscribersBySource[source] = (subscribersBySource[source] || 0) + 1;
      });

      // Users trend (last 30 days)
      const usersTrend: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = profiles.filter(p => {
          const createdDate = new Date(p.created_at).toISOString().split('T')[0];
          return createdDate === dateStr;
        }).length;
        usersTrend.push({ date: dateStr, count });
      }

      // Subscribers trend (last 30 days)
      const subscribersTrend: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = subscribers.filter(s => {
          const subscribedDate = new Date(s.subscribed_at).toISOString().split('T')[0];
          return subscribedDate === dateStr;
        }).length;
        subscribersTrend.push({ date: dateStr, count });
      }

      // All users sorted by creation date (newest first)
      const allUsers = [...profiles]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Recent users (last 10) for dashboard preview
      const recentUsers = allUsers.slice(0, 10);

      // Recent subscribers (last 10)
      const recentSubscribers = [...subscribers]
        .sort((a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime())
        .slice(0, 10);

      // Company analysis
      const companyMap = new Map<string, HubProfile[]>();
      profiles.forEach(p => {
        if (p.company) {
          const normalized = p.company.trim().toLowerCase();
          if (!companyMap.has(normalized)) {
            companyMap.set(normalized, []);
          }
          companyMap.get(normalized)!.push(p);
        }
      });

      const usersByCompany = Array.from(companyMap.entries())
        .map(([company, users]) => ({
          company: users[0].company, // Use original casing
          count: users.length,
          users,
        }))
        .sort((a, b) => b.count - a.count);

      const topCompanies = usersByCompany.slice(0, 20).map(c => ({
        company: c.company,
        count: c.count,
        avgScore: c.users.reduce((sum, u) => sum + (u.lead_score || 0), 0) / c.count,
        hasPhone: c.users.filter(u => u.phone).length,
      }));

      // Position analysis
      const usersByPosition: Record<string, number> = {};
      profiles.forEach(p => {
        const position = p.position || 'Sin cargo';
        usersByPosition[position] = (usersByPosition[position] || 0) + 1;
      });

      // Categorize positions
      const positionCategories = {
        cLevel: 0,
        director: 0,
        manager: 0,
        specialist: 0,
        other: 0,
      };

      profiles.forEach(p => {
        const pos = (p.position || '').toLowerCase();
        if (pos.includes('ceo') || pos.includes('cto') || pos.includes('cfo') || pos.includes('coo') || pos.includes('cmo') || pos.includes('chief') || pos.includes('founder') || pos.includes('fundador') || pos.includes('owner') || pos.includes('presidente') || pos.includes('president')) {
          positionCategories.cLevel++;
        } else if (pos.includes('director') || pos.includes('vp') || pos.includes('vice')) {
          positionCategories.director++;
        } else if (pos.includes('manager') || pos.includes('gerente') || pos.includes('jefe') || pos.includes('head') || pos.includes('lead')) {
          positionCategories.manager++;
        } else if (pos.includes('specialist') || pos.includes('especialista') || pos.includes('analyst') || pos.includes('analista') || pos.includes('consultor') || pos.includes('consultant') || pos.includes('engineer') || pos.includes('developer')) {
          positionCategories.specialist++;
        } else {
          positionCategories.other++;
        }
      });

      // Retention metrics
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

      const usersWithRecentActivity = profiles.filter(p =>
        p.last_activity_at && new Date(p.last_activity_at) > oneMonthAgo
      ).length;

      const usersActiveLastWeek = profiles.filter(p =>
        p.last_activity_at && new Date(p.last_activity_at) > oneWeekAgo
      ).length;

      const usersActiveLastMonth = profiles.filter(p =>
        p.last_activity_at && new Date(p.last_activity_at) > oneMonthAgo
      ).length;

      const dormantUsers = profiles.filter(p => {
        if (!p.last_activity_at) return new Date(p.created_at) < threeMonthsAgo;
        return new Date(p.last_activity_at) < threeMonthsAgo;
      }).length;

      // Quality metrics
      const usersWithPhone = profiles.filter(p => p.phone).length;
      const usersWithCompany = profiles.filter(p => p.company).length;
      const usersWithPosition = profiles.filter(p => p.position).length;

      const completionRate = profiles.length > 0
        ? ((usersWithPhone + usersWithCompany + usersWithPosition) / (profiles.length * 3)) * 100
        : 0;

      // Country quality metrics
      const countryMetricsMap = new Map<string, HubProfile[]>();
      profiles.forEach(p => {
        const country = p.country || 'Unknown';
        if (!countryMetricsMap.has(country)) {
          countryMetricsMap.set(country, []);
        }
        countryMetricsMap.get(country)!.push(p);
      });

      const countryMetrics = Array.from(countryMetricsMap.entries())
        .map(([country, users]) => ({
          country,
          users: users.length,
          avgScore: users.reduce((sum, u) => sum + (u.lead_score || 0), 0) / users.length,
          withPhone: users.filter(u => u.phone).length,
          withConsent: users.filter(u => u.marketing_consent).length,
          toolUsage: users.reduce((sum, u) =>
            sum + (u.stack_generator_uses || 0) + (u.tool_comparator_uses || 0) +
            (u.impact_analyzer_uses || 0) + (u.ai_assistant_uses || 0), 0
          ),
        }))
        .sort((a, b) => b.users - a.users);

      // All subscribers sorted
      const allSubscribers = [...subscribers]
        .sort((a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime());

      return {
        totalUsers,
        totalNewsletterSubscribers,
        activeNewsletterSubscribers,
        usersWithMarketingConsent,
        usersToday,
        usersThisWeek,
        usersThisMonth,
        subscribersThisMonth,
        avgLeadScore,
        usersByLeadStatus,
        usersByCountry,
        toolUsage,
        usersTrend,
        subscribersTrend,
        subscribersBySource,
        allUsers,
        recentUsers,
        recentSubscribers,
        usersByCompany,
        topCompanies,
        usersByPosition,
        positionCategories,
        usersWithRecentActivity,
        dormantUsers,
        usersActiveLastWeek,
        usersActiveLastMonth,
        usersWithPhone,
        usersWithCompany,
        usersWithPosition,
        completionRate,
        countryMetrics,
        allSubscribers,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Hook for MixPanel data (requires Edge Function)
export function useMixPanelAnalytics(enabled: boolean = true) {
  return useQuery({
    queryKey: ['mixpanel-analytics'],
    queryFn: async (): Promise<MixPanelMetrics | null> => {
      console.log('Fetching MixPanel data...');

      // Call Edge Function for top events (uses Export API which is free tier)
      const { data, error } = await supabase.functions.invoke('mixpanel-analytics', {
        body: {
          endpoint: 'top-events',
          params: { days: 30 },
        },
      });

      console.log('MixPanel response:', data, error);

      if (error) {
        console.error('MixPanel error:', error);
        throw new Error(`Error fetching MixPanel data: ${error.message}`);
      }

      // Check if we got an error response from MixPanel API
      if (data?.error) {
        console.error('MixPanel API error:', data);
        throw new Error(`MixPanel API error: ${data.details || data.error}`);
      }

      // Process top events from the response
      const topEvents: Array<{ event: string; count: number }> = [];
      if (data?.events) {
        Object.entries(data.events).forEach(([event, count]) => {
          topEvents.push({ event, count: count as number });
        });
        topEvents.sort((a, b) => b.count - a.count);
      }

      // Get page views trend from response
      const pageViewsTrend: Array<{ date: string; count: number }> = data?.pageViewsTrend || [];

      // Calculate total
      const totalPageViews = data?.totalEvents || topEvents.reduce((sum, e) => sum + e.count, 0);

      console.log('MixPanel processed data:', { topEvents: topEvents.length, pageViewsTrend: pageViewsTrend.length, totalPageViews });

      return {
        pageViews: totalPageViews,
        uniqueUsers: 0,
        topEvents,
        pageViewsTrend,
      };
    },
    enabled,
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
}
