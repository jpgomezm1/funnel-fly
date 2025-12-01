import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface LinkedInPost {
  id: string;
  post_id: string;
  post_url: string | null;
  title: string | null;
  type: string | null;
  posted_at: string | null;
  likes: number;
  comments: number;
  clicks: number;
  shares: number;
  impressions: number;
  engagement: number;
  video_views: number;
  viewers: number;
  time_watched: number;
  created_at: string;
  updated_at: string;
}

// CSV row type from Metricool
export interface MetricoolLinkedInRow {
  Title: string;
  Date: string;
  URL: string;
  Likes: string;
  Comments: string;
  Clicks: string;
  Shares: string;
  Impressions: string;
  Engagement: string;
  'Vid. Views': string;
  Viewers: string;
  'Time Watched': string;
  Type: string;
}

// =====================================================
// HOOKS
// =====================================================

export function useLinkedInPosts() {
  return useQuery({
    queryKey: ['linkedin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linkedin_posts')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      return data as LinkedInPost[];
    },
  });
}

export function useImportLinkedInPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      posts,
      fileName,
    }: {
      posts: MetricoolLinkedInRow[];
      fileName: string;
    }) => {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let dateRangeStart: Date | null = null;
      let dateRangeEnd: Date | null = null;

      for (const post of posts) {
        // Clean URL first (remove quotes)
        const cleanUrl = post.URL?.replace(/"/g, '').trim();

        if (!cleanUrl) {
          skipped++;
          continue;
        }

        // Extract post ID from URL (urn:li:share:XXXXX or activity:XXXXX)
        const urlMatch = cleanUrl.match(/(?:share:|activity:)(\d+)/);
        const postId = urlMatch ? urlMatch[1] : cleanUrl;

        // Parse date - handle format "2025-11-18 10:14"
        let postedAt: Date | null = null;
        if (post.Date) {
          const cleanDate = post.Date.replace(/"/g, '').trim();
          postedAt = cleanDate ? new Date(cleanDate) : null;
        }

        if (postedAt) {
          if (!dateRangeStart || postedAt < dateRangeStart) dateRangeStart = postedAt;
          if (!dateRangeEnd || postedAt > dateRangeEnd) dateRangeEnd = postedAt;
        }

        // Helper to clean values (remove quotes and trim)
        const clean = (val: string | undefined): string => (val?.replace(/"/g, '').trim() || '');
        const parseNum = (val: string | undefined): number => parseInt(clean(val) || '0') || 0;
        const parseFloat2 = (val: string | undefined): number => parseFloat(clean(val) || '0') || 0;

        const postData = {
          post_id: postId,
          post_url: cleanUrl,
          title: clean(post.Title) || null,
          type: clean(post.Type) || null,
          posted_at: postedAt?.toISOString() || null,
          likes: parseNum(post.Likes),
          comments: parseNum(post.Comments),
          clicks: parseNum(post.Clicks),
          shares: parseNum(post.Shares),
          impressions: parseNum(post.Impressions),
          engagement: parseFloat2(post.Engagement),
          video_views: parseNum(post['Vid. Views']),
          viewers: parseNum(post.Viewers),
          time_watched: parseNum(post['Time Watched']),
        };

        const { error } = await supabase
          .from('linkedin_posts')
          .upsert(postData, { onConflict: 'post_id' });

        if (error) {
          console.error('Error upserting LinkedIn post:', error);
          skipped++;
        } else {
          const { data: existing } = await supabase
            .from('linkedin_posts')
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
        platform: 'linkedin',
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
      queryClient.invalidateQueries({ queryKey: ['linkedin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-imports'] });
    },
  });
}

// =====================================================
// STATS
// =====================================================

export interface LinkedInStats {
  totalPosts: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalClicks: number;
  totalShares: number;
  avgEngagement: number;
  totalVideoViews: number;
  postsByType: Record<string, number>;
}

export function useLinkedInStats() {
  const { data: posts } = useLinkedInPosts();

  const stats: LinkedInStats = {
    totalPosts: posts?.length || 0,
    totalImpressions: posts?.reduce((sum, p) => sum + p.impressions, 0) || 0,
    totalLikes: posts?.reduce((sum, p) => sum + p.likes, 0) || 0,
    totalComments: posts?.reduce((sum, p) => sum + p.comments, 0) || 0,
    totalClicks: posts?.reduce((sum, p) => sum + p.clicks, 0) || 0,
    totalShares: posts?.reduce((sum, p) => sum + p.shares, 0) || 0,
    avgEngagement: (() => {
      if (!posts || posts.length === 0) return 0;
      return posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length;
    })(),
    totalVideoViews: posts?.reduce((sum, p) => sum + p.video_views, 0) || 0,
    postsByType: (() => {
      const types: Record<string, number> = {};
      posts?.forEach((p) => {
        const type = p.type || 'OTHER';
        types[type] = (types[type] || 0) + 1;
      });
      return types;
    })(),
  };

  return stats;
}
