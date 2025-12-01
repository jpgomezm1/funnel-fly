import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface InstagramPost {
  id: string;
  post_id: string;
  type: string | null;
  image_url: string | null;
  post_url: string | null;
  content: string | null;
  posted_at: string | null;
  views: number;
  reach_organic: number;
  likes: number;
  saved: number;
  comments: number;
  interactions: number;
  engagement: number;
  created_at: string;
  updated_at: string;
}

export interface InstagramReel {
  id: string;
  reel_id: string;
  reel_url: string | null;
  image_url: string | null;
  title: string | null;
  posted_at: string | null;
  views: number;
  reach_organic: number;
  likes: number;
  saved: number;
  comments: number;
  shares: number;
  interactions: number;
  engagement: number;
  avg_watch_time: number;
  video_view_total_time: number;
  created_at: string;
  updated_at: string;
}

export interface InstagramHashtag {
  id: string;
  hashtag: string;
  usage_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  avg_engagement: number;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaImport {
  id: string;
  platform: string;
  content_type: string;
  file_name: string | null;
  records_imported: number;
  records_updated: number;
  records_skipped: number;
  date_range_start: string | null;
  date_range_end: string | null;
  imported_at: string;
  imported_by: string | null;
}

// CSV row types from Metricool
export interface MetricoolPostRow {
  Id: string;
  type: string;
  image: string;
  URL: string;
  Content: string;
  Timestamp: string;
  Views: string;
  'Reach (Organic)': string;
  Likes: string;
  Saved: string;
  Comments: string;
  Interactions: string;
  Engagement: string;
}

export interface MetricoolReelRow {
  Id: string;
  URL: string;
  image: string;
  title: string;
  date: string;
  Views: string;
  'Reach (Organic)': string;
  'Likes (Organic)': string;
  'Saved (Organic)': string;
  'Comments (Organic)': string;
  'Shares (Organic)': string;
  'Interactions (Organic)': string;
  'Engagement (Organic)': string;
  'Avg Watch Time (Organic)': string;
  'Video View Total Time (Organic)': string;
}

export interface MetricoolHashtagRow {
  Hashtag: string;
  Count: string;
  Views: string;
  Likes: string;
  CommentsCount: string;
}

// =====================================================
// HOOKS - POSTS
// =====================================================

export function useInstagramPosts() {
  return useQuery({
    queryKey: ['instagram-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_posts')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      return data as InstagramPost[];
    },
  });
}

export function useImportInstagramPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      posts,
      fileName,
    }: {
      posts: MetricoolPostRow[];
      fileName: string;
    }) => {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let dateRangeStart: Date | null = null;
      let dateRangeEnd: Date | null = null;

      for (const post of posts) {
        if (!post.Id) {
          skipped++;
          continue;
        }

        const postedAt = post.Timestamp ? new Date(post.Timestamp) : null;

        // Track date range
        if (postedAt) {
          if (!dateRangeStart || postedAt < dateRangeStart) dateRangeStart = postedAt;
          if (!dateRangeEnd || postedAt > dateRangeEnd) dateRangeEnd = postedAt;
        }

        const postData = {
          post_id: post.Id.replace(/"/g, ''),
          type: post.type?.replace(/"/g, '') || null,
          image_url: post.image?.replace(/"/g, '') || null,
          post_url: post.URL?.replace(/"/g, '') || null,
          content: post.Content?.replace(/"/g, '') || null,
          posted_at: postedAt?.toISOString() || null,
          views: parseInt(post.Views?.replace(/"/g, '') || '0') || 0,
          reach_organic: parseInt(post['Reach (Organic)']?.replace(/"/g, '') || '0') || 0,
          likes: parseInt(post.Likes?.replace(/"/g, '') || '0') || 0,
          saved: parseInt(post.Saved?.replace(/"/g, '') || '0') || 0,
          comments: parseInt(post.Comments?.replace(/"/g, '') || '0') || 0,
          interactions: parseInt(post.Interactions?.replace(/"/g, '') || '0') || 0,
          engagement: parseFloat(post.Engagement?.replace(/"/g, '') || '0') || 0,
        };

        // Upsert - insert or update if exists
        const { error } = await supabase
          .from('instagram_posts')
          .upsert(postData, { onConflict: 'post_id' });

        if (error) {
          console.error('Error upserting post:', error);
          skipped++;
        } else {
          // Check if it was an update or insert
          const { data: existing } = await supabase
            .from('instagram_posts')
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
        platform: 'instagram',
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
      queryClient.invalidateQueries({ queryKey: ['instagram-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-imports'] });
    },
  });
}

// =====================================================
// HOOKS - REELS
// =====================================================

export function useInstagramReels() {
  return useQuery({
    queryKey: ['instagram-reels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      return data as InstagramReel[];
    },
  });
}

export function useImportInstagramReels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reels,
      fileName,
    }: {
      reels: MetricoolReelRow[];
      fileName: string;
    }) => {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let dateRangeStart: Date | null = null;
      let dateRangeEnd: Date | null = null;

      for (const reel of reels) {
        if (!reel.Id) {
          skipped++;
          continue;
        }

        const postedAt = reel.date ? new Date(reel.date) : null;

        if (postedAt) {
          if (!dateRangeStart || postedAt < dateRangeStart) dateRangeStart = postedAt;
          if (!dateRangeEnd || postedAt > dateRangeEnd) dateRangeEnd = postedAt;
        }

        const reelData = {
          reel_id: reel.Id.replace(/"/g, ''),
          reel_url: reel.URL?.replace(/"/g, '') || null,
          image_url: reel.image?.replace(/"/g, '') || null,
          title: reel.title?.replace(/"/g, '') || null,
          posted_at: postedAt?.toISOString() || null,
          views: parseInt(reel.Views?.replace(/"/g, '') || '0') || 0,
          reach_organic: parseInt(reel['Reach (Organic)']?.replace(/"/g, '') || '0') || 0,
          likes: parseInt(reel['Likes (Organic)']?.replace(/"/g, '') || '0') || 0,
          saved: parseInt(reel['Saved (Organic)']?.replace(/"/g, '') || '0') || 0,
          comments: parseInt(reel['Comments (Organic)']?.replace(/"/g, '') || '0') || 0,
          shares: parseInt(reel['Shares (Organic)']?.replace(/"/g, '') || '0') || 0,
          interactions: parseInt(reel['Interactions (Organic)']?.replace(/"/g, '') || '0') || 0,
          engagement: parseFloat(reel['Engagement (Organic)']?.replace(/"/g, '') || '0') || 0,
          avg_watch_time: parseFloat(reel['Avg Watch Time (Organic)']?.replace(/"/g, '') || '0') || 0,
          video_view_total_time: parseInt(reel['Video View Total Time (Organic)']?.replace(/"/g, '') || '0') || 0,
        };

        const { error } = await supabase
          .from('instagram_reels')
          .upsert(reelData, { onConflict: 'reel_id' });

        if (error) {
          console.error('Error upserting reel:', error);
          skipped++;
        } else {
          const { data: existing } = await supabase
            .from('instagram_reels')
            .select('created_at, updated_at')
            .eq('reel_id', reelData.reel_id)
            .single();

          if (existing && existing.created_at !== existing.updated_at) {
            updated++;
          } else {
            imported++;
          }
        }
      }

      await supabase.from('social_media_imports').insert({
        platform: 'instagram',
        content_type: 'reels',
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
      queryClient.invalidateQueries({ queryKey: ['instagram-reels'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-imports'] });
    },
  });
}

// =====================================================
// HOOKS - HASHTAGS
// =====================================================

export function useInstagramHashtags() {
  return useQuery({
    queryKey: ['instagram-hashtags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_hashtags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data as InstagramHashtag[];
    },
  });
}

export function useImportInstagramHashtags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hashtags,
      fileName,
    }: {
      hashtags: MetricoolHashtagRow[];
      fileName: string;
    }) => {
      let imported = 0;
      let updated = 0;
      let skipped = 0;

      for (const tag of hashtags) {
        if (!tag.Hashtag) {
          skipped++;
          continue;
        }

        const hashtagData = {
          hashtag: tag.Hashtag.replace(/"/g, ''),
          usage_count: parseInt(tag.Count?.replace(/"/g, '') || '0') || 0,
          total_views: parseInt(tag.Views?.replace(/"/g, '') || '0') || 0,
          total_likes: parseInt(tag.Likes?.replace(/"/g, '') || '0') || 0,
          total_comments: parseInt(tag.CommentsCount?.replace(/"/g, '') || '0') || 0,
        };

        const { error } = await supabase
          .from('instagram_hashtags')
          .upsert(hashtagData, { onConflict: 'hashtag' });

        if (error) {
          console.error('Error upserting hashtag:', error);
          skipped++;
        } else {
          const { data: existing } = await supabase
            .from('instagram_hashtags')
            .select('created_at, updated_at')
            .eq('hashtag', hashtagData.hashtag)
            .single();

          if (existing && existing.created_at !== existing.updated_at) {
            updated++;
          } else {
            imported++;
          }
        }
      }

      await supabase.from('social_media_imports').insert({
        platform: 'instagram',
        content_type: 'hashtags',
        file_name: fileName,
        records_imported: imported,
        records_updated: updated,
        records_skipped: skipped,
      });

      return { imported, updated, skipped };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-imports'] });
    },
  });
}

// =====================================================
// HOOKS - IMPORT HISTORY
// =====================================================

export function useSocialMediaImports(platform?: string) {
  return useQuery({
    queryKey: ['social-media-imports', platform],
    queryFn: async () => {
      let query = supabase
        .from('social_media_imports')
        .select('*')
        .order('imported_at', { ascending: false });

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SocialMediaImport[];
    },
  });
}

// =====================================================
// ANALYTICS HELPERS
// =====================================================

export interface InstagramStats {
  totalPosts: number;
  totalReels: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSaved: number;
  avgEngagement: number;
  topHashtags: InstagramHashtag[];
}

export function useInstagramStats() {
  const { data: posts } = useInstagramPosts();
  const { data: reels } = useInstagramReels();
  const { data: hashtags } = useInstagramHashtags();

  const stats: InstagramStats = {
    totalPosts: posts?.length || 0,
    totalReels: reels?.length || 0,
    totalViews:
      (posts?.reduce((sum, p) => sum + p.views, 0) || 0) +
      (reels?.reduce((sum, r) => sum + r.views, 0) || 0),
    totalLikes:
      (posts?.reduce((sum, p) => sum + p.likes, 0) || 0) +
      (reels?.reduce((sum, r) => sum + r.likes, 0) || 0),
    totalComments:
      (posts?.reduce((sum, p) => sum + p.comments, 0) || 0) +
      (reels?.reduce((sum, r) => sum + r.comments, 0) || 0),
    totalSaved:
      (posts?.reduce((sum, p) => sum + p.saved, 0) || 0) +
      (reels?.reduce((sum, r) => sum + r.saved, 0) || 0),
    avgEngagement: (() => {
      const allEngagements = [
        ...(posts?.map((p) => p.engagement) || []),
        ...(reels?.map((r) => r.engagement) || []),
      ];
      if (allEngagements.length === 0) return 0;
      return allEngagements.reduce((sum, e) => sum + e, 0) / allEngagements.length;
    })(),
    topHashtags: hashtags?.slice(0, 10) || [],
  };

  return stats;
}
