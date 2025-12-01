import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface YouTubeVideo {
  id: string;
  video_id: string;
  thumbnail_url: string | null;
  watch_url: string | null;
  title: string | null;
  published_at: string | null;
  views: number;
  watch_minutes: number;
  avg_view_duration: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  created_at: string;
  updated_at: string;
}

// CSV row type from Metricool
export interface MetricoolYouTubeRow {
  videoId: string;
  thumbnailUrl: string;
  watchUrl: string;
  title: string;
  publishedAt: string;
  views: string;
  watchMinutes: string;
  averageViewDuration: string;
  likes: string;
  dislikes: string;
  comments: string;
  shares: string;
}

// =====================================================
// HOOKS
// =====================================================

export function useYouTubeVideos() {
  return useQuery({
    queryKey: ['youtube-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as YouTubeVideo[];
    },
  });
}

export function useImportYouTubeVideos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videos,
      fileName,
    }: {
      videos: MetricoolYouTubeRow[];
      fileName: string;
    }) => {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let dateRangeStart: Date | null = null;
      let dateRangeEnd: Date | null = null;

      for (const video of videos) {
        // Clean videoId first (remove quotes)
        const cleanVideoId = video.videoId?.replace(/"/g, '').trim();

        if (!cleanVideoId) {
          skipped++;
          continue;
        }

        // Parse date - handle format "2025-11-07 19:10"
        let publishedAt: Date | null = null;
        if (video.publishedAt) {
          const cleanDate = video.publishedAt.replace(/"/g, '').trim();
          publishedAt = cleanDate ? new Date(cleanDate) : null;
        }

        if (publishedAt) {
          if (!dateRangeStart || publishedAt < dateRangeStart) dateRangeStart = publishedAt;
          if (!dateRangeEnd || publishedAt > dateRangeEnd) dateRangeEnd = publishedAt;
        }

        // Helper to clean values (remove quotes and trim)
        const clean = (val: string | undefined): string => (val?.replace(/"/g, '').trim() || '');
        const parseNum = (val: string | undefined): number => parseInt(clean(val) || '0') || 0;
        const parseFloat2 = (val: string | undefined): number => parseFloat(clean(val) || '0') || 0;

        const videoData = {
          video_id: cleanVideoId,
          thumbnail_url: clean(video.thumbnailUrl) || null,
          watch_url: clean(video.watchUrl) || null,
          title: clean(video.title) || null,
          published_at: publishedAt?.toISOString() || null,
          views: parseNum(video.views),
          watch_minutes: parseFloat2(video.watchMinutes),
          avg_view_duration: parseFloat2(video.averageViewDuration),
          likes: parseNum(video.likes),
          dislikes: parseNum(video.dislikes),
          comments: parseNum(video.comments),
          shares: parseNum(video.shares),
        };

        const { error } = await supabase
          .from('youtube_videos')
          .upsert(videoData, { onConflict: 'video_id' });

        if (error) {
          console.error('Error upserting YouTube video:', error);
          skipped++;
        } else {
          const { data: existing } = await supabase
            .from('youtube_videos')
            .select('created_at, updated_at')
            .eq('video_id', videoData.video_id)
            .single();

          if (existing && existing.created_at !== existing.updated_at) {
            updated++;
          } else {
            imported++;
          }
        }
      }

      // Log the import
      await supabase.from('social_media_imports').insert({
        platform: 'youtube',
        content_type: 'videos',
        file_name: fileName,
        records_imported: imported,
        records_updated: updated,
        records_skipped: skipped,
        date_range_start: dateRangeStart?.toISOString().split('T')[0] || null,
        date_range_end: dateRangeEnd?.toISOString().split('T')[0] || null,
      });

      return { imported, updated, skipped };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-imports'] });
    },
  });
}

// =====================================================
// STATS
// =====================================================

export interface YouTubeStats {
  totalVideos: number;
  totalViews: number;
  totalWatchMinutes: number;
  totalWatchHours: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgViewDuration: number;
  avgViewsPerVideo: number;
  engagementRate: number;
}

export function useYouTubeStats() {
  const { data: videos } = useYouTubeVideos();

  const stats: YouTubeStats = {
    totalVideos: videos?.length || 0,
    totalViews: videos?.reduce((sum, v) => sum + v.views, 0) || 0,
    totalWatchMinutes: videos?.reduce((sum, v) => sum + v.watch_minutes, 0) || 0,
    totalWatchHours: (() => {
      const totalMinutes = videos?.reduce((sum, v) => sum + v.watch_minutes, 0) || 0;
      return totalMinutes / 60;
    })(),
    totalLikes: videos?.reduce((sum, v) => sum + v.likes, 0) || 0,
    totalComments: videos?.reduce((sum, v) => sum + v.comments, 0) || 0,
    totalShares: videos?.reduce((sum, v) => sum + v.shares, 0) || 0,
    avgViewDuration: (() => {
      if (!videos || videos.length === 0) return 0;
      return videos.reduce((sum, v) => sum + v.avg_view_duration, 0) / videos.length;
    })(),
    avgViewsPerVideo: (() => {
      if (!videos || videos.length === 0) return 0;
      return videos.reduce((sum, v) => sum + v.views, 0) / videos.length;
    })(),
    engagementRate: (() => {
      if (!videos || videos.length === 0) return 0;
      const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
      const totalEngagements = videos.reduce((sum, v) => sum + v.likes + v.comments + v.shares, 0);
      return totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
    })(),
  };

  return stats;
}
