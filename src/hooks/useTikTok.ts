import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface TikTokPost {
  id: string;
  post_id: string;
  post_url: string | null;
  image_url: string | null;
  title: string | null;
  link: string | null;
  type: string | null;
  posted_at: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  duration: number;
  engagement: number;
  full_video_watched_rate: number;
  total_time_watched_seconds: number;
  avg_time_watched_seconds: number;
  source_for_you: number;
  source_follow: number;
  source_hashtag: number;
  source_sound: number;
  source_personal_profile: number;
  source_search: number;
  created_at: string;
  updated_at: string;
}

// CSV row type from Metricool
export interface MetricoolTikTokRow {
  Image: string;
  URL: string;
  Title: string;
  Date: string;
  Link: string;
  Type: string;
  Views: string;
  Likes: string;
  Comments: string;
  Shares: string;
  Reach: string;
  Duration: string;
  Engagement: string;
  'Full video watched rate': string;
  'Total time watched seconds': string;
  'Avg. time watched seconds': string;
  'For You': string;
  Follow: string;
  Hashtag: string;
  Sound: string;
  'Personal profile': string;
  Search: string;
}

// =====================================================
// HOOKS
// =====================================================

export function useTikTokPosts() {
  return useQuery({
    queryKey: ['tiktok-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_posts')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      return data as TikTokPost[];
    },
  });
}

export function useImportTikTokPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      posts,
      fileName,
    }: {
      posts: MetricoolTikTokRow[];
      fileName: string;
    }) => {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let dateRangeStart: Date | null = null;
      let dateRangeEnd: Date | null = null;

      for (const post of posts) {
        if (!post.URL) {
          skipped++;
          continue;
        }

        // Extract post ID from URL
        const urlMatch = post.URL.match(/video\/(\d+)/);
        const postId = urlMatch ? urlMatch[1] : post.URL;

        const postedAt = post.Date ? new Date(post.Date) : null;

        if (postedAt) {
          if (!dateRangeStart || postedAt < dateRangeStart) dateRangeStart = postedAt;
          if (!dateRangeEnd || postedAt > dateRangeEnd) dateRangeEnd = postedAt;
        }

        const postData = {
          post_id: postId.replace(/"/g, ''),
          post_url: post.URL?.replace(/"/g, '') || null,
          image_url: post.Image?.replace(/"/g, '') || null,
          title: post.Title?.replace(/"/g, '') || null,
          link: post.Link?.replace(/"/g, '') || null,
          type: post.Type?.replace(/"/g, '') || null,
          posted_at: postedAt?.toISOString() || null,
          views: parseInt(post.Views?.replace(/"/g, '') || '0') || 0,
          likes: parseInt(post.Likes?.replace(/"/g, '') || '0') || 0,
          comments: parseInt(post.Comments?.replace(/"/g, '') || '0') || 0,
          shares: parseInt(post.Shares?.replace(/"/g, '') || '0') || 0,
          reach: parseInt(post.Reach?.replace(/"/g, '') || '0') || 0,
          duration: parseInt(post.Duration?.replace(/"/g, '') || '0') || 0,
          engagement: parseFloat(post.Engagement?.replace(/"/g, '') || '0') || 0,
          full_video_watched_rate: parseFloat(post['Full video watched rate']?.replace(/"/g, '') || '0') || 0,
          total_time_watched_seconds: parseInt(post['Total time watched seconds']?.replace(/"/g, '') || '0') || 0,
          avg_time_watched_seconds: parseFloat(post['Avg. time watched seconds']?.replace(/"/g, '') || '0') || 0,
          source_for_you: parseFloat(post['For You']?.replace(/"/g, '') || '0') || 0,
          source_follow: parseFloat(post.Follow?.replace(/"/g, '') || '0') || 0,
          source_hashtag: parseFloat(post.Hashtag?.replace(/"/g, '') || '0') || 0,
          source_sound: parseFloat(post.Sound?.replace(/"/g, '') || '0') || 0,
          source_personal_profile: parseFloat(post['Personal profile']?.replace(/"/g, '') || '0') || 0,
          source_search: parseFloat(post.Search?.replace(/"/g, '') || '0') || 0,
        };

        const { error } = await supabase
          .from('tiktok_posts')
          .upsert(postData, { onConflict: 'post_id' });

        if (error) {
          console.error('Error upserting TikTok post:', error);
          skipped++;
        } else {
          const { data: existing } = await supabase
            .from('tiktok_posts')
            .select('created_at, updated_at')
            .eq('post_id', postData.post_id)
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
        platform: 'tiktok',
        content_type: 'posts',
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
      queryClient.invalidateQueries({ queryKey: ['tiktok-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-imports'] });
    },
  });
}

// =====================================================
// STATS
// =====================================================

export interface TikTokStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagement: number;
  avgWatchTime: number;
  totalWatchTimeHours: number;
  avgFullVideoWatchedRate: number;
  trafficSources: {
    forYou: number;
    follow: number;
    hashtag: number;
    sound: number;
    personalProfile: number;
    search: number;
  };
}

export function useTikTokStats() {
  const { data: posts } = useTikTokPosts();

  const stats: TikTokStats = {
    totalPosts: posts?.length || 0,
    totalViews: posts?.reduce((sum, p) => sum + p.views, 0) || 0,
    totalLikes: posts?.reduce((sum, p) => sum + p.likes, 0) || 0,
    totalComments: posts?.reduce((sum, p) => sum + p.comments, 0) || 0,
    totalShares: posts?.reduce((sum, p) => sum + p.shares, 0) || 0,
    avgEngagement: (() => {
      if (!posts || posts.length === 0) return 0;
      return posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length;
    })(),
    avgWatchTime: (() => {
      if (!posts || posts.length === 0) return 0;
      return posts.reduce((sum, p) => sum + p.avg_time_watched_seconds, 0) / posts.length;
    })(),
    totalWatchTimeHours: (() => {
      const totalSeconds = posts?.reduce((sum, p) => sum + p.total_time_watched_seconds, 0) || 0;
      return totalSeconds / 3600;
    })(),
    avgFullVideoWatchedRate: (() => {
      if (!posts || posts.length === 0) return 0;
      return posts.reduce((sum, p) => sum + p.full_video_watched_rate, 0) / posts.length;
    })(),
    trafficSources: (() => {
      if (!posts || posts.length === 0) {
        return { forYou: 0, follow: 0, hashtag: 0, sound: 0, personalProfile: 0, search: 0 };
      }
      const count = posts.length;
      return {
        forYou: posts.reduce((sum, p) => sum + p.source_for_you, 0) / count,
        follow: posts.reduce((sum, p) => sum + p.source_follow, 0) / count,
        hashtag: posts.reduce((sum, p) => sum + p.source_hashtag, 0) / count,
        sound: posts.reduce((sum, p) => sum + p.source_sound, 0) / count,
        personalProfile: posts.reduce((sum, p) => sum + p.source_personal_profile, 0) / count,
        search: posts.reduce((sum, p) => sum + p.source_search, 0) / count,
      };
    })(),
  };

  return stats;
}
