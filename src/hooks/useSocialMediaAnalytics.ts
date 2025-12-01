import { useMemo } from 'react';
import { useInstagramPosts, useInstagramReels } from './useInstagram';
import { useTikTokPosts } from './useTikTok';
import { useLinkedInPosts } from './useLinkedIn';
import { useYouTubeVideos } from './useYouTube';
import { startOfWeek, startOfMonth, subDays, subWeeks, subMonths, isAfter, parseISO, format } from 'date-fns';

// =====================================================
// TYPES
// =====================================================

export interface ContentItem {
  id: string;
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube';
  type: string;
  title: string;
  thumbnail: string | null;
  url: string | null;
  posted_at: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

export interface PlatformMetrics {
  platform: string;
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagement: number;
  color: string;
}

export interface TrendDataPoint {
  date: string;
  instagram: number;
  tiktok: number;
  linkedin: number;
  youtube: number;
  total: number;
}

export interface ContentTypeAnalysis {
  type: string;
  count: number;
  avgViews: number;
  avgEngagement: number;
  totalViews: number;
  platform: string;
}

export interface BestPostingTime {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  avgEngagement: number;
  count: number;
}

export interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  metric?: string;
}

// =====================================================
// MAIN ANALYTICS HOOK
// =====================================================

export function useSocialMediaAnalytics() {
  const { data: instagramPosts } = useInstagramPosts();
  const { data: instagramReels } = useInstagramReels();
  const { data: tiktokPosts } = useTikTokPosts();
  const { data: linkedinPosts } = useLinkedInPosts();
  const { data: youtubeVideos } = useYouTubeVideos();

  return useMemo(() => {
    // Normalize all content into a unified format
    const allContent: ContentItem[] = [
      ...(instagramPosts?.map((p) => ({
        id: p.id,
        platform: 'instagram' as const,
        type: p.type || 'POST',
        title: p.content?.substring(0, 100) || 'Sin contenido',
        thumbnail: p.image_url,
        url: p.post_url,
        posted_at: p.posted_at,
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: 0,
        engagement: p.engagement,
      })) || []),
      ...(instagramReels?.map((r) => ({
        id: r.id,
        platform: 'instagram' as const,
        type: 'REEL',
        title: r.title || 'Sin título',
        thumbnail: r.image_url,
        url: r.reel_url,
        posted_at: r.posted_at,
        views: r.views,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        engagement: r.engagement,
      })) || []),
      ...(tiktokPosts?.map((p) => ({
        id: p.id,
        platform: 'tiktok' as const,
        type: p.type || 'VIDEO',
        title: p.title || 'Sin título',
        thumbnail: p.image_url,
        url: p.post_url,
        posted_at: p.posted_at,
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        engagement: p.engagement,
      })) || []),
      ...(linkedinPosts?.map((p) => ({
        id: p.id,
        platform: 'linkedin' as const,
        type: p.type || 'POST',
        title: p.title || 'Sin título',
        thumbnail: null,
        url: p.post_url,
        posted_at: p.posted_at,
        views: p.impressions,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        engagement: p.engagement,
      })) || []),
      ...(youtubeVideos?.map((v) => ({
        id: v.id,
        platform: 'youtube' as const,
        type: 'VIDEO',
        title: v.title || 'Sin título',
        thumbnail: v.thumbnail_url,
        url: v.watch_url,
        posted_at: v.published_at,
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        engagement: v.views > 0 ? ((v.likes + v.comments + v.shares) / v.views) * 100 : 0,
      })) || []),
    ];

    // Sort by engagement for top performers
    const topPerformers = [...allContent]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);

    // Sort by views for most viewed
    const mostViewed = [...allContent]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Platform metrics
    const platformMetrics: PlatformMetrics[] = [
      {
        platform: 'Instagram',
        totalContent: (instagramPosts?.length || 0) + (instagramReels?.length || 0),
        totalViews: (instagramPosts?.reduce((s, p) => s + p.views, 0) || 0) + (instagramReels?.reduce((s, r) => s + r.views, 0) || 0),
        totalLikes: (instagramPosts?.reduce((s, p) => s + p.likes, 0) || 0) + (instagramReels?.reduce((s, r) => s + r.likes, 0) || 0),
        totalComments: (instagramPosts?.reduce((s, p) => s + p.comments, 0) || 0) + (instagramReels?.reduce((s, r) => s + r.comments, 0) || 0),
        totalShares: instagramReels?.reduce((s, r) => s + r.shares, 0) || 0,
        avgEngagement: (() => {
          const all = [...(instagramPosts || []), ...(instagramReels || [])];
          if (all.length === 0) return 0;
          return all.reduce((s, p) => s + p.engagement, 0) / all.length;
        })(),
        color: '#E4405F',
      },
      {
        platform: 'TikTok',
        totalContent: tiktokPosts?.length || 0,
        totalViews: tiktokPosts?.reduce((s, p) => s + p.views, 0) || 0,
        totalLikes: tiktokPosts?.reduce((s, p) => s + p.likes, 0) || 0,
        totalComments: tiktokPosts?.reduce((s, p) => s + p.comments, 0) || 0,
        totalShares: tiktokPosts?.reduce((s, p) => s + p.shares, 0) || 0,
        avgEngagement: tiktokPosts?.length ? tiktokPosts.reduce((s, p) => s + p.engagement, 0) / tiktokPosts.length : 0,
        color: '#000000',
      },
      {
        platform: 'LinkedIn',
        totalContent: linkedinPosts?.length || 0,
        totalViews: linkedinPosts?.reduce((s, p) => s + p.impressions, 0) || 0,
        totalLikes: linkedinPosts?.reduce((s, p) => s + p.likes, 0) || 0,
        totalComments: linkedinPosts?.reduce((s, p) => s + p.comments, 0) || 0,
        totalShares: linkedinPosts?.reduce((s, p) => s + p.shares, 0) || 0,
        avgEngagement: linkedinPosts?.length ? linkedinPosts.reduce((s, p) => s + p.engagement, 0) / linkedinPosts.length : 0,
        color: '#0A66C2',
      },
      {
        platform: 'YouTube',
        totalContent: youtubeVideos?.length || 0,
        totalViews: youtubeVideos?.reduce((s, v) => s + v.views, 0) || 0,
        totalLikes: youtubeVideos?.reduce((s, v) => s + v.likes, 0) || 0,
        totalComments: youtubeVideos?.reduce((s, v) => s + v.comments, 0) || 0,
        totalShares: youtubeVideos?.reduce((s, v) => s + v.shares, 0) || 0,
        avgEngagement: (() => {
          if (!youtubeVideos?.length) return 0;
          const totalViews = youtubeVideos.reduce((s, v) => s + v.views, 0);
          const totalEngagements = youtubeVideos.reduce((s, v) => s + v.likes + v.comments + v.shares, 0);
          return totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
        })(),
        color: '#FF0000',
      },
    ];

    // Totals
    const totals = {
      totalContent: allContent.length,
      totalViews: platformMetrics.reduce((s, p) => s + p.totalViews, 0),
      totalLikes: platformMetrics.reduce((s, p) => s + p.totalLikes, 0),
      totalComments: platformMetrics.reduce((s, p) => s + p.totalComments, 0),
      totalShares: platformMetrics.reduce((s, p) => s + p.totalShares, 0),
      avgEngagement: allContent.length > 0
        ? allContent.reduce((s, c) => s + c.engagement, 0) / allContent.length
        : 0,
    };

    // Trend data (last 12 weeks)
    const trendData: TrendDataPoint[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = startOfWeek(subWeeks(now, i - 1));
      const weekLabel = format(weekStart, 'dd/MM');

      const weekContent = allContent.filter((c) => {
        if (!c.posted_at) return false;
        const date = parseISO(c.posted_at);
        return date >= weekStart && date < weekEnd;
      });

      trendData.push({
        date: weekLabel,
        instagram: weekContent.filter((c) => c.platform === 'instagram').reduce((s, c) => s + c.views, 0),
        tiktok: weekContent.filter((c) => c.platform === 'tiktok').reduce((s, c) => s + c.views, 0),
        linkedin: weekContent.filter((c) => c.platform === 'linkedin').reduce((s, c) => s + c.views, 0),
        youtube: weekContent.filter((c) => c.platform === 'youtube').reduce((s, c) => s + c.views, 0),
        total: weekContent.reduce((s, c) => s + c.views, 0),
      });
    }

    // Content type analysis
    const contentTypeMap = new Map<string, { count: number; views: number; engagement: number; platform: string }>();
    allContent.forEach((c) => {
      const key = `${c.platform}-${c.type}`;
      const existing = contentTypeMap.get(key) || { count: 0, views: 0, engagement: 0, platform: c.platform };
      contentTypeMap.set(key, {
        count: existing.count + 1,
        views: existing.views + c.views,
        engagement: existing.engagement + c.engagement,
        platform: c.platform,
      });
    });

    const contentTypeAnalysis: ContentTypeAnalysis[] = Array.from(contentTypeMap.entries())
      .map(([key, data]) => ({
        type: key.split('-')[1],
        count: data.count,
        avgViews: data.views / data.count,
        avgEngagement: data.engagement / data.count,
        totalViews: data.views,
        platform: data.platform,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Best posting times
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const postingTimeMap = new Map<string, { engagement: number; count: number }>();

    allContent.forEach((c) => {
      if (!c.posted_at) return;
      const date = parseISO(c.posted_at);
      const day = date.getDay();
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      const existing = postingTimeMap.get(key) || { engagement: 0, count: 0 };
      postingTimeMap.set(key, {
        engagement: existing.engagement + c.engagement,
        count: existing.count + 1,
      });
    });

    const bestPostingTimes: BestPostingTime[] = Array.from(postingTimeMap.entries())
      .map(([key, data]) => {
        const [day, hour] = key.split('-').map(Number);
        return {
          dayOfWeek: day,
          dayName: dayNames[day],
          hour,
          avgEngagement: data.engagement / data.count,
          count: data.count,
        };
      })
      .filter((t) => t.count >= 2) // At least 2 posts to be significant
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 10);

    // Generate insights
    const insights: Insight[] = [];

    // Best platform by engagement
    const bestPlatform = [...platformMetrics].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
    if (bestPlatform && bestPlatform.avgEngagement > 0) {
      insights.push({
        type: 'success',
        title: `${bestPlatform.platform} lidera en engagement`,
        description: `Con un engagement promedio de ${bestPlatform.avgEngagement.toFixed(2)}%, ${bestPlatform.platform} es tu plataforma más efectiva.`,
        metric: `${bestPlatform.avgEngagement.toFixed(2)}%`,
      });
    }

    // Best content type
    if (contentTypeAnalysis.length > 0) {
      const bestType = contentTypeAnalysis[0];
      insights.push({
        type: 'info',
        title: `Los ${bestType.type} tienen mejor rendimiento`,
        description: `El contenido tipo "${bestType.type}" en ${bestType.platform} genera ${bestType.avgEngagement.toFixed(2)}% de engagement promedio.`,
        metric: `${bestType.avgEngagement.toFixed(2)}%`,
      });
    }

    // Best posting time
    if (bestPostingTimes.length > 0) {
      const best = bestPostingTimes[0];
      insights.push({
        type: 'info',
        title: `Mejor momento para publicar`,
        description: `Los ${best.dayName} a las ${best.hour}:00 obtienen el mejor engagement (${best.avgEngagement.toFixed(2)}%).`,
        metric: `${best.dayName} ${best.hour}:00`,
      });
    }

    // Low engagement warning
    const lowEngagementPlatforms = platformMetrics.filter((p) => p.avgEngagement < 1 && p.totalContent > 0);
    lowEngagementPlatforms.forEach((p) => {
      insights.push({
        type: 'warning',
        title: `Bajo engagement en ${p.platform}`,
        description: `El engagement promedio de ${p.platform} (${p.avgEngagement.toFixed(2)}%) está por debajo del 1%. Considera experimentar con nuevos formatos.`,
        metric: `${p.avgEngagement.toFixed(2)}%`,
      });
    });

    // Recent content performance (last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const recentContent = allContent.filter((c) => {
      if (!c.posted_at) return false;
      return isAfter(parseISO(c.posted_at), thirtyDaysAgo);
    });

    const recentStats = {
      count: recentContent.length,
      avgEngagement: recentContent.length > 0
        ? recentContent.reduce((s, c) => s + c.engagement, 0) / recentContent.length
        : 0,
      totalViews: recentContent.reduce((s, c) => s + c.views, 0),
    };

    if (recentContent.length === 0) {
      insights.push({
        type: 'warning',
        title: 'Sin contenido reciente',
        description: 'No has publicado contenido en los últimos 30 días. La consistencia es clave para el crecimiento.',
      });
    }

    return {
      allContent,
      topPerformers,
      mostViewed,
      platformMetrics,
      totals,
      trendData,
      contentTypeAnalysis,
      bestPostingTimes,
      insights,
      recentStats,
    };
  }, [instagramPosts, instagramReels, tiktokPosts, linkedinPosts, youtubeVideos]);
}

// =====================================================
// PLATFORM-SPECIFIC ANALYTICS
// =====================================================

export function useInstagramAnalytics() {
  const { data: posts } = useInstagramPosts();
  const { data: reels } = useInstagramReels();

  return useMemo(() => {
    const allContent = [
      ...(posts?.map((p) => ({ ...p, contentType: 'post' as const })) || []),
      ...(reels?.map((r) => ({ ...r, contentType: 'reel' as const, type: 'REEL' })) || []),
    ];

    // Top performers by engagement
    const topByEngagement = [...allContent]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Top by views
    const topByViews = [...allContent]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Performance by content type
    const typePerformance = new Map<string, { count: number; views: number; likes: number; engagement: number }>();

    allContent.forEach((item) => {
      const type = item.type || 'OTHER';
      const existing = typePerformance.get(type) || { count: 0, views: 0, likes: 0, engagement: 0 };
      typePerformance.set(type, {
        count: existing.count + 1,
        views: existing.views + item.views,
        likes: existing.likes + item.likes,
        engagement: existing.engagement + item.engagement,
      });
    });

    const contentTypeStats = Array.from(typePerformance.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        avgViews: Math.round(data.views / data.count),
        avgLikes: Math.round(data.likes / data.count),
        avgEngagement: data.engagement / data.count,
        totalViews: data.views,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Weekly trend
    const weeklyTrend: { week: string; posts: number; views: number; engagement: number }[] = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = startOfWeek(subWeeks(now, i - 1));
      const weekLabel = format(weekStart, 'dd/MM');

      const weekContent = allContent.filter((c) => {
        const dateField = 'posted_at' in c ? c.posted_at : null;
        if (!dateField) return false;
        const date = parseISO(dateField);
        return date >= weekStart && date < weekEnd;
      });

      weeklyTrend.push({
        week: weekLabel,
        posts: weekContent.length,
        views: weekContent.reduce((s, c) => s + c.views, 0),
        engagement: weekContent.length > 0
          ? weekContent.reduce((s, c) => s + c.engagement, 0) / weekContent.length
          : 0,
      });
    }

    // Reels vs Posts comparison
    const reelsVsPosts = {
      posts: {
        count: posts?.length || 0,
        avgViews: posts?.length ? posts.reduce((s, p) => s + p.views, 0) / posts.length : 0,
        avgEngagement: posts?.length ? posts.reduce((s, p) => s + p.engagement, 0) / posts.length : 0,
      },
      reels: {
        count: reels?.length || 0,
        avgViews: reels?.length ? reels.reduce((s, r) => s + r.views, 0) / reels.length : 0,
        avgEngagement: reels?.length ? reels.reduce((s, r) => s + r.engagement, 0) / reels.length : 0,
      },
    };

    return {
      topByEngagement,
      topByViews,
      contentTypeStats,
      weeklyTrend,
      reelsVsPosts,
      totalContent: allContent.length,
    };
  }, [posts, reels]);
}
