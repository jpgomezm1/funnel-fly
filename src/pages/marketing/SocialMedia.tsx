import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';
import {
  Instagram,
  Linkedin,
  Video,
  Image,
  Hash,
  Upload,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  TrendingUp,
  ExternalLink,
  Clock,
  FileUp,
  CheckCircle2,
  RefreshCw,
  Play,
  Users,
  Music,
  Search,
  User,
  MousePointer,
  FileText,
  BarChart3,
  Trophy,
  Zap,
  Calendar,
  Lightbulb,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  Target,
  Flame,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useInstagramPosts,
  useInstagramReels,
  useInstagramHashtags,
  useInstagramStats,
  useSocialMediaImports,
  useImportInstagramPosts,
  useImportInstagramReels,
  useImportInstagramHashtags,
  MetricoolPostRow,
  MetricoolReelRow,
  MetricoolHashtagRow,
} from '@/hooks/useInstagram';
import {
  useTikTokPosts,
  useTikTokStats,
  useImportTikTokPosts,
  MetricoolTikTokRow,
} from '@/hooks/useTikTok';
import {
  useLinkedInPosts,
  useLinkedInStats,
  useImportLinkedInPosts,
  MetricoolLinkedInRow,
} from '@/hooks/useLinkedIn';
import {
  useYouTubeVideos,
  useYouTubeStats,
  useImportYouTubeVideos,
  MetricoolYouTubeRow,
} from '@/hooks/useYouTube';
import {
  useSocialMediaAnalytics,
  useInstagramAnalytics,
} from '@/hooks/useSocialMediaAnalytics';

// =====================================================
// ANALYTICS TAB - CROSS-PLATFORM DASHBOARD
// =====================================================

function AnalyticsDashboard() {
  const analytics = useSocialMediaAnalytics();

  const COLORS = ['#E4405F', '#000000', '#0A66C2', '#FF0000'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Contenido</span>
            </div>
            <p className="text-2xl font-bold">{analytics.totals.totalContent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Total Views</span>
            </div>
            <p className="text-2xl font-bold">{(analytics.totals.totalViews / 1000).toFixed(1)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Total Likes</span>
            </div>
            <p className="text-2xl font-bold">{analytics.totals.totalLikes.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Comments</span>
            </div>
            <p className="text-2xl font-bold">{analytics.totals.totalComments.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Total Shares</span>
            </div>
            <p className="text-2xl font-bold">{analytics.totals.totalShares.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Avg Engagement</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{analytics.totals.avgEngagement.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Comparison + Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparativa por Plataforma
            </CardTitle>
            <CardDescription>Engagement rate promedio por red social</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.platformMetrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <YAxis type="category" dataKey="platform" width={80} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Engagement']}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="avgEngagement" radius={[0, 4, 4, 0]}>
                    {analytics.platformMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {analytics.platformMetrics.map((p) => (
                <div key={p.platform} className="text-center">
                  <p className="text-xs text-muted-foreground">{p.platform}</p>
                  <p className="font-semibold">{p.totalContent}</p>
                  <p className="text-xs text-muted-foreground">posts</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Views (12 semanas)
            </CardTitle>
            <CardDescription>Evolución de alcance por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Views']}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="instagram" stroke="#E4405F" strokeWidth={2} dot={false} name="Instagram" />
                  <Line type="monotone" dataKey="tiktok" stroke="#000000" strokeWidth={2} dot={false} name="TikTok" />
                  <Line type="monotone" dataKey="linkedin" stroke="#0A66C2" strokeWidth={2} dot={false} name="LinkedIn" />
                  <Line type="monotone" dataKey="youtube" stroke="#FF0000" strokeWidth={2} dot={false} name="YouTube" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Insights
            </CardTitle>
            <CardDescription>Recomendaciones basadas en tus datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay suficientes datos para generar insights</p>
            ) : (
              analytics.insights.slice(0, 5).map((insight, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                    insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
                    {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                    {insight.type === 'info' && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                    {insight.metric && (
                      <Badge variant="secondary" className="ml-2 shrink-0">{insight.metric}</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 10 - Mejor Engagement
            </CardTitle>
            <CardDescription>Tu contenido con mejor rendimiento en todas las plataformas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topPerformers.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
                    {index + 1}
                  </div>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.platform === 'instagram' && <Instagram className="h-2.5 w-2.5 mr-1" />}
                        {item.platform === 'tiktok' && <Video className="h-2.5 w-2.5 mr-1" />}
                        {item.platform === 'linkedin' && <Linkedin className="h-2.5 w-2.5 mr-1" />}
                        {item.platform === 'youtube' && <Play className="h-2.5 w-2.5 mr-1" />}
                        {item.type}
                      </Badge>
                      <span>{item.views.toLocaleString()} views</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{item.engagement.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">engagement</p>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Type Analysis + Best Posting Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Rendimiento por Tipo de Contenido
            </CardTitle>
            <CardDescription>Qué formatos generan mejor engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.contentTypeAnalysis.slice(0, 8).map((type, index) => {
                const maxEngagement = analytics.contentTypeAnalysis[0]?.avgEngagement || 1;
                return (
                  <div key={`${type.platform}-${type.type}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {type.platform === 'instagram' && <Instagram className="h-3 w-3 mr-1" />}
                          {type.platform === 'tiktok' && <Video className="h-3 w-3 mr-1" />}
                          {type.platform === 'linkedin' && <Linkedin className="h-3 w-3 mr-1" />}
                          {type.platform === 'youtube' && <Play className="h-3 w-3 mr-1" />}
                          {type.type}
                        </Badge>
                        <span className="text-muted-foreground">({type.count} posts)</span>
                      </div>
                      <span className="font-medium">{type.avgEngagement.toFixed(2)}%</span>
                    </div>
                    <Progress value={(type.avgEngagement / maxEngagement) * 100} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Best Posting Times */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Mejores Momentos para Publicar
            </CardTitle>
            <CardDescription>Días y horas con mejor engagement promedio</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.bestPostingTimes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay suficientes datos para determinar los mejores momentos
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.bestPostingTimes.slice(0, 8).map((time, index) => (
                  <div
                    key={`${time.dayOfWeek}-${time.hour}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index < 3 ? <Trophy className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{time.dayName}</p>
                      <p className="text-xs text-muted-foreground">{time.hour}:00 - {time.hour + 1}:00</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{time.avgEngagement.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground">{time.count} posts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Viewed Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Contenido con Más Alcance
          </CardTitle>
          <CardDescription>Tu contenido con más views en todas las plataformas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.mostViewed.slice(0, 5).map((item, index) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-white">
                        <ExternalLink className="h-6 w-6" />
                      </a>
                    )}
                  </div>
                  <Badge className="absolute top-2 left-2 text-xs">#{index + 1}</Badge>
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                    {item.platform}
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.views.toLocaleString()} views</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// INSTAGRAM - ENHANCED CONTENT
// =====================================================

function InstagramStatsCards() {
  const stats = useInstagramStats();
  const analytics = useInstagramAnalytics();

  const statCards = [
    { title: 'Total Posts', value: stats.totalPosts, icon: Image, color: 'text-blue-500' },
    { title: 'Total Reels', value: stats.totalReels, icon: Video, color: 'text-pink-500' },
    { title: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-500' },
    { title: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'text-red-500' },
    { title: 'Total Comments', value: stats.totalComments.toLocaleString(), icon: MessageCircle, color: 'text-green-500' },
    { title: 'Total Saved', value: stats.totalSaved.toLocaleString(), icon: Bookmark, color: 'text-yellow-500' },
    { title: 'Avg Engagement', value: `${stats.avgEngagement.toFixed(2)}%`, icon: TrendingUp, color: 'text-orange-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.title}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InstagramTopPerformers() {
  const analytics = useInstagramAnalytics();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top 5 por Engagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {analytics.topByEngagement.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-500 text-white' : 'bg-muted'
            }`}>
              {index + 1}
            </span>
            {'image_url' in item && item.image_url ? (
              <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <Image className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">
                {'content' in item ? item.content?.substring(0, 50) || 'Sin contenido' :
                 'title' in item ? item.title || 'Sin título' : 'Contenido'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px] px-1">
                  {'contentType' in item ? (item.contentType === 'reel' ? 'REEL' : item.type) : 'POST'}
                </Badge>
                <span>{item.views.toLocaleString()} views</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">{item.engagement.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InstagramContentTypeAnalysis() {
  const analytics = useInstagramAnalytics();

  const typeColors: Record<string, string> = {
    REEL: '#E4405F',
    FEED_IMAGE: '#8B5CF6',
    FEED_CAROUSEL: '#3B82F6',
    FEED_VIDEO: '#EC4899',
    OTHER: '#6B7280',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Rendimiento por Formato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics.contentTypeStats.map((type) => (
            <div key={type.type} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: typeColors[type.type] || '#6B7280' }}
                  />
                  <span>{type.type.replace('FEED_', '').replace('_', ' ')}</span>
                  <span className="text-xs text-muted-foreground">({type.count})</span>
                </div>
                <span className="font-medium">{type.avgEngagement.toFixed(2)}%</span>
              </div>
              <Progress
                value={(type.avgEngagement / (analytics.contentTypeStats[0]?.avgEngagement || 1)) * 100}
                className="h-1.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Avg views: {type.avgViews.toLocaleString()}</span>
                <span>Avg likes: {type.avgLikes.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InstagramReelsVsPosts() {
  const analytics = useInstagramAnalytics();

  const data = [
    { name: 'Posts', value: analytics.reelsVsPosts.posts.count, engagement: analytics.reelsVsPosts.posts.avgEngagement },
    { name: 'Reels', value: analytics.reelsVsPosts.reels.count, engagement: analytics.reelsVsPosts.reels.avgEngagement },
  ];

  const reelsBetter = analytics.reelsVsPosts.reels.avgEngagement > analytics.reelsVsPosts.posts.avgEngagement;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Reels vs Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${!reelsBetter ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-4 w-4" />
              <span className="font-medium">Posts</span>
              {!reelsBetter && <Badge className="bg-green-500 text-white text-[10px]">Mejor</Badge>}
            </div>
            <p className="text-2xl font-bold">{analytics.reelsVsPosts.posts.count}</p>
            <p className="text-sm text-muted-foreground">
              {analytics.reelsVsPosts.posts.avgEngagement.toFixed(2)}% engagement
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(analytics.reelsVsPosts.posts.avgViews).toLocaleString()} avg views
            </p>
          </div>
          <div className={`p-4 rounded-lg ${reelsBetter ? 'bg-pink-500/10 border border-pink-500/20' : 'bg-muted'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-4 w-4" />
              <span className="font-medium">Reels</span>
              {reelsBetter && <Badge className="bg-pink-500 text-white text-[10px]">Mejor</Badge>}
            </div>
            <p className="text-2xl font-bold">{analytics.reelsVsPosts.reels.count}</p>
            <p className="text-sm text-muted-foreground">
              {analytics.reelsVsPosts.reels.avgEngagement.toFixed(2)}% engagement
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(analytics.reelsVsPosts.reels.avgViews).toLocaleString()} avg views
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InstagramWeeklyTrend() {
  const analytics = useInstagramAnalytics();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Tendencia Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={11} />
              <YAxis yAxisId="left" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(1)}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Views" />
              <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#E4405F" strokeWidth={2} dot={false} name="Engagement %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function InstagramPostsTab() {
  const { data: posts, isLoading } = useInstagramPosts();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredPosts = selectedType ? posts?.filter((p) => p.type === selectedType) : posts;
  const postTypes = [...new Set(posts?.map((p) => p.type).filter(Boolean))];

  if (isLoading) return <div className="flex justify-center py-8">Cargando posts...</div>;
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay posts importados</p>
        <p className="text-sm">Importa tu archivo CSV de Metricool para ver los datos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant={selectedType === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(null)}>
          Todos ({posts.length})
        </Button>
        {postTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type as string)}
          >
            {type?.replace('FEED_', '').replace('_', ' ')} ({posts.filter((p) => p.type === type).length})
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPosts?.map((post) => (
          <Card key={post.id} className="overflow-hidden group">
            {post.image_url && (
              <div className="aspect-square relative overflow-hidden bg-muted">
                <img src={post.image_url} alt="Post" className="object-cover w-full h-full group-hover:scale-105 transition-transform" loading="lazy" />
                <Badge className="absolute top-2 right-2 text-xs">{post.type?.replace('FEED_', '').replace('_', ' ')}</Badge>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>
                    </div>
                    <span className="font-semibold">{post.engagement}%</span>
                  </div>
                </div>
              </div>
            )}
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.content || 'Sin contenido'}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {post.posted_at ? format(new Date(post.posted_at), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
                </span>
                {post.post_url && (
                  <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InstagramReelsTab() {
  const { data: reels, isLoading } = useInstagramReels();

  if (isLoading) return <div className="flex justify-center py-8">Cargando reels...</div>;
  if (!reels || reels.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay reels importados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {reels.map((reel) => (
        <Card key={reel.id} className="overflow-hidden group">
          {reel.image_url && (
            <div className="aspect-[9/16] relative overflow-hidden bg-muted">
              <img src={reel.image_url} alt="Reel" className="object-cover w-full h-full group-hover:scale-105 transition-transform" loading="lazy" />
              <Badge className="absolute top-2 right-2 text-xs bg-pink-500">REEL</Badge>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-xs font-medium line-clamp-2 mb-2">{reel.title || 'Sin título'}</p>
                <div className="flex items-center justify-between text-white/80 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{(reel.views/1000).toFixed(1)}K</span>
                    <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{reel.likes}</span>
                  </div>
                  <span className="font-semibold text-white">{reel.engagement}%</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function InstagramHashtagsTab() {
  const { data: hashtags, isLoading } = useInstagramHashtags();

  if (isLoading) return <div className="flex justify-center py-8">Cargando hashtags...</div>;
  if (!hashtags || hashtags.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay hashtags importados</p>
      </div>
    );
  }

  const maxViews = Math.max(...hashtags.map((h) => h.total_views));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Hashtags por Views</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hashtags.slice(0, 10).map((tag, i) => (
            <div key={tag.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    i < 3 ? 'bg-yellow-500 text-white' : 'bg-muted'
                  }`}>{i + 1}</span>
                  <span className="font-medium">{tag.hashtag}</span>
                </div>
                <span className="text-muted-foreground">{tag.total_views.toLocaleString()}</span>
              </div>
              <Progress value={(tag.total_views / maxViews) * 100} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todos los Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hashtag</TableHead>
                <TableHead className="text-center">Usos</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Likes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hashtags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.hashtag}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{tag.usage_count}</Badge></TableCell>
                  <TableCell className="text-center">{tag.total_views.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{tag.total_likes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InstagramImportDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    posts?: { imported: number; updated: number; skipped: number };
    reels?: { imported: number; updated: number; skipped: number };
    hashtags?: { imported: number; updated: number; skipped: number };
  }>({});

  const postsInputRef = useRef<HTMLInputElement>(null);
  const reelsInputRef = useRef<HTMLInputElement>(null);
  const hashtagsInputRef = useRef<HTMLInputElement>(null);

  const importPosts = useImportInstagramPosts();
  const importReels = useImportInstagramReels();
  const importHashtags = useImportInstagramHashtags();
  const { data: imports } = useSocialMediaImports('instagram');

  const handleFileUpload = async (file: File, type: 'posts' | 'reels' | 'hashtags') => {
    setImporting(true);
    Papa.parse(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let result;
          if (type === 'posts') {
            result = await importPosts.mutateAsync({ posts: results.data as MetricoolPostRow[], fileName: file.name });
            setImportResults((prev) => ({ ...prev, posts: result }));
          } else if (type === 'reels') {
            result = await importReels.mutateAsync({ reels: results.data as MetricoolReelRow[], fileName: file.name });
            setImportResults((prev) => ({ ...prev, reels: result }));
          } else {
            result = await importHashtags.mutateAsync({ hashtags: results.data as MetricoolHashtagRow[], fileName: file.name });
            setImportResults((prev) => ({ ...prev, hashtags: result }));
          }
          toast({ title: 'Importación completada', description: `${result.imported} nuevos, ${result.updated} actualizados` });
        } catch {
          toast({ title: 'Error al importar', description: 'Hubo un error procesando el archivo', variant: 'destructive' });
        } finally {
          setImporting(false);
        }
      },
      error: () => {
        toast({ title: 'Error al leer archivo', variant: 'destructive' });
        setImporting(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" />Importar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Instagram className="h-5 w-5" />Importar datos de Instagram</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Instrucciones:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Exporta tus datos desde Metricool en formato CSV</li>
              <li>Los archivos deben usar punto y coma (;) como separador</li>
            </ul>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['posts', 'reels', 'hashtags'].map((type) => (
              <Card key={type}>
                <CardContent className="p-4 text-center">
                  {type === 'posts' && <Image className="h-8 w-8 mx-auto mb-2 text-blue-500" />}
                  {type === 'reels' && <Video className="h-8 w-8 mx-auto mb-2 text-pink-500" />}
                  {type === 'hashtags' && <Hash className="h-8 w-8 mx-auto mb-2 text-purple-500" />}
                  <p className="font-medium mb-2 capitalize">{type}</p>
                  <input
                    ref={type === 'posts' ? postsInputRef : type === 'reels' ? reelsInputRef : hashtagsInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, type as any); }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (type === 'posts' ? postsInputRef : type === 'reels' ? reelsInputRef : hashtagsInputRef).current?.click()}
                    disabled={importing}
                  >
                    <FileUp className="h-4 w-4 mr-1" />Subir
                  </Button>
                  {importResults[type as keyof typeof importResults] && (
                    <div className="mt-2 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" />
                      {importResults[type as keyof typeof importResults]?.imported} nuevos
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {importing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />Importando...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InstagramContent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <InstagramImportDialog />
      </div>
      <InstagramStatsCards />

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InstagramTopPerformers />
        <InstagramContentTypeAnalysis />
        <InstagramReelsVsPosts />
      </div>

      <InstagramWeeklyTrend />

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="posts" className="gap-2"><Image className="h-4 w-4" />Posts</TabsTrigger>
          <TabsTrigger value="reels" className="gap-2"><Video className="h-4 w-4" />Reels</TabsTrigger>
          <TabsTrigger value="hashtags" className="gap-2"><Hash className="h-4 w-4" />Hashtags</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4"><InstagramPostsTab /></TabsContent>
        <TabsContent value="reels" className="mt-4"><InstagramReelsTab /></TabsContent>
        <TabsContent value="hashtags" className="mt-4"><InstagramHashtagsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// TIKTOK CONTENT
// =====================================================

function TikTokStatsCards() {
  const stats = useTikTokStats();

  const statCards = [
    { title: 'Total Videos', value: stats.totalPosts, icon: Video, color: 'text-pink-500' },
    { title: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-500' },
    { title: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'text-red-500' },
    { title: 'Total Comments', value: stats.totalComments.toLocaleString(), icon: MessageCircle, color: 'text-blue-500' },
    { title: 'Total Shares', value: stats.totalShares.toLocaleString(), icon: Share2, color: 'text-green-500' },
    { title: 'Avg Engagement', value: `${stats.avgEngagement.toFixed(2)}%`, icon: TrendingUp, color: 'text-orange-500' },
    { title: 'Avg Watch Time', value: `${stats.avgWatchTime.toFixed(1)}s`, icon: Clock, color: 'text-cyan-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.title}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TikTokTrafficSources() {
  const stats = useTikTokStats();

  const sources = [
    { name: 'For You Page', value: stats.trafficSources.forYou, icon: TrendingUp, color: 'bg-pink-500' },
    { name: 'Seguidores', value: stats.trafficSources.follow, icon: Users, color: 'bg-blue-500' },
    { name: 'Perfil', value: stats.trafficSources.personalProfile, icon: User, color: 'bg-purple-500' },
    { name: 'Hashtags', value: stats.trafficSources.hashtag, icon: Hash, color: 'bg-green-500' },
    { name: 'Búsqueda', value: stats.trafficSources.search, icon: Search, color: 'bg-orange-500' },
    { name: 'Sonido', value: stats.trafficSources.sound, icon: Music, color: 'bg-cyan-500' },
  ];

  const maxValue = Math.max(...sources.map((s) => s.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fuentes de Tráfico (Promedio)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sources.map((source) => (
          <div key={source.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <source.icon className="h-4 w-4 text-muted-foreground" />
                <span>{source.name}</span>
              </div>
              <span className="font-medium">{source.value.toFixed(1)}%</span>
            </div>
            <Progress value={maxValue > 0 ? (source.value / maxValue) * 100 : 0} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TikTokTopPerformers() {
  const { data: posts } = useTikTokPosts();

  if (!posts?.length) return null;

  const topByEngagement = [...posts].sort((a, b) => b.engagement - a.engagement).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top 5 por Engagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topByEngagement.map((post, index) => (
          <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-500 text-white' : 'bg-muted'
            }`}>{index + 1}</span>
            {post.image_url ? (
              <img src={post.image_url} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <Video className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{post.title || 'Sin título'}</p>
              <p className="text-xs text-muted-foreground">{post.views.toLocaleString()} views</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">{post.engagement.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TikTokVideosTab() {
  const { data: posts, isLoading } = useTikTokPosts();

  if (isLoading) return <div className="flex justify-center py-8">Cargando videos...</div>;
  if (!posts?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay videos importados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden group">
          <div className="aspect-[9/16] relative overflow-hidden bg-muted">
            {post.image_url && (
              <img src={post.image_url} alt="TikTok" className="object-cover w-full h-full group-hover:scale-105 transition-transform" loading="lazy" />
            )}
            <Badge className="absolute top-2 right-2 text-xs bg-black text-white">{post.type || 'VIDEO'}</Badge>
            {post.duration > 0 && (
              <Badge className="absolute bottom-2 right-2 text-xs bg-black/70 text-white">{post.duration}s</Badge>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-xs font-medium line-clamp-2 mb-1">{post.title || 'Sin título'}</p>
              <div className="flex items-center justify-between text-white/80 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{(post.views/1000).toFixed(1)}K</span>
                  <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{post.likes}</span>
                </div>
                <span className="font-semibold text-white">{post.engagement}%</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TikTokImportDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importPosts = useImportTikTokPosts();

  const handleFileUpload = async (file: File) => {
    setImporting(true);
    Papa.parse(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const result = await importPosts.mutateAsync({ posts: results.data as MetricoolTikTokRow[], fileName: file.name });
          toast({ title: 'Importación completada', description: `${result.imported} nuevos, ${result.updated} actualizados` });
        } catch {
          toast({ title: 'Error al importar', variant: 'destructive' });
        } finally {
          setImporting(false);
        }
      },
      error: () => { toast({ title: 'Error al leer archivo', variant: 'destructive' }); setImporting(false); },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" />Importar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5" />Importar datos de TikTok</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Instrucciones:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Exporta desde Metricool en formato CSV</li>
              <li>Usar punto y coma (;) como separador</li>
            </ul>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          <Button className="w-full" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <><FileUp className="h-4 w-4 mr-2" />Seleccionar CSV</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TikTokContent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end"><TikTokImportDialog /></div>
      <TikTokStatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><TikTokTopPerformers /></div>
        <div className="lg:col-span-1"><TikTokTrafficSources /></div>
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Métricas de Retención</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const stats = useTikTokStats();
              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Watch Time Total</p>
                    <p className="text-2xl font-bold">{stats.totalWatchTimeHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Avg Video Completion</p>
                    <p className="text-2xl font-bold">{(stats.avgFullVideoWatchedRate * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Avg Watch Time</p>
                    <p className="text-2xl font-bold">{stats.avgWatchTime.toFixed(1)}s</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
      <TikTokVideosTab />
    </div>
  );
}

// =====================================================
// LINKEDIN CONTENT
// =====================================================

function LinkedInStatsCards() {
  const stats = useLinkedInStats();

  const statCards = [
    { title: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-blue-600' },
    { title: 'Impressions', value: stats.totalImpressions.toLocaleString(), icon: Eye, color: 'text-purple-500' },
    { title: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'text-red-500' },
    { title: 'Total Comments', value: stats.totalComments.toLocaleString(), icon: MessageCircle, color: 'text-green-500' },
    { title: 'Total Clicks', value: stats.totalClicks.toLocaleString(), icon: MousePointer, color: 'text-orange-500' },
    { title: 'Total Shares', value: stats.totalShares.toLocaleString(), icon: Share2, color: 'text-cyan-500' },
    { title: 'Avg Engagement', value: `${stats.avgEngagement.toFixed(2)}%`, icon: TrendingUp, color: 'text-pink-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.title}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LinkedInPostsByType() {
  const stats = useLinkedInStats();
  const types = Object.entries(stats.postsByType);
  const maxValue = Math.max(...types.map(([, count]) => count));

  if (types.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Posts por Tipo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {types.map(([type, count]) => (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{type}</span>
              <span className="font-medium">{count}</span>
            </div>
            <Progress value={maxValue > 0 ? (count / maxValue) * 100 : 0} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LinkedInTopPerformers() {
  const { data: posts } = useLinkedInPosts();

  if (!posts?.length) return null;

  const topByEngagement = [...posts].sort((a, b) => b.engagement - a.engagement).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top 5 por Engagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topByEngagement.map((post, index) => (
          <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-500 text-white' : 'bg-muted'
            }`}>{index + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{post.title || 'Sin título'}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{post.type || 'POST'}</Badge>
                <span>{post.impressions.toLocaleString()} impr.</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">{post.engagement.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LinkedInPostsTab() {
  const { data: posts, isLoading } = useLinkedInPosts();

  if (isLoading) return <div className="flex justify-center py-8">Cargando posts...</div>;
  if (!posts?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Linkedin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay posts importados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{post.type || 'POST'}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.posted_at ? format(new Date(post.posted_at), 'dd MMM yyyy HH:mm', { locale: es }) : 'Sin fecha'}
                  </span>
                </div>
                <p className="text-sm line-clamp-2 mb-3">{post.title || 'Sin contenido'}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4 text-purple-500" />{post.impressions.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-red-500" />{post.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4 text-green-500" />{post.comments}</span>
                  <span className="flex items-center gap-1"><MousePointer className="h-4 w-4 text-orange-500" />{post.clicks}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-4 w-4 text-cyan-500" />{post.shares}</span>
                  <span className="flex items-center gap-1 font-medium"><TrendingUp className="h-4 w-4 text-pink-500" />{post.engagement}%</span>
                </div>
              </div>
              {post.post_url && (
                <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LinkedInImportDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importPosts = useImportLinkedInPosts();

  const handleFileUpload = async (file: File) => {
    setImporting(true);
    Papa.parse(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const result = await importPosts.mutateAsync({ posts: results.data as MetricoolLinkedInRow[], fileName: file.name });
          toast({ title: 'Importación completada', description: `${result.imported} nuevos, ${result.updated} actualizados` });
        } catch {
          toast({ title: 'Error al importar', variant: 'destructive' });
        } finally {
          setImporting(false);
        }
      },
      error: () => { toast({ title: 'Error al leer archivo', variant: 'destructive' }); setImporting(false); },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" />Importar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Linkedin className="h-5 w-5 text-blue-600" />Importar datos de LinkedIn</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Instrucciones:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Exporta desde Metricool en formato CSV</li>
              <li>Usar punto y coma (;) como separador</li>
            </ul>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          <Button className="w-full" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <><FileUp className="h-4 w-4 mr-2" />Seleccionar CSV</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinkedInContent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end"><LinkedInImportDialog /></div>
      <LinkedInStatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LinkedInTopPerformers />
        <LinkedInPostsByType />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />CTR Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const stats = useLinkedInStats();
              const ctr = stats.totalImpressions > 0 ? (stats.totalClicks / stats.totalImpressions) * 100 : 0;
              return (
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-blue-600">{ctr.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground mt-2">Click-Through Rate</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="font-medium">{stats.totalClicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="font-medium">{stats.totalImpressions.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
      <LinkedInPostsTab />
    </div>
  );
}

// =====================================================
// YOUTUBE CONTENT
// =====================================================

function YouTubeStatsCards() {
  const stats = useYouTubeStats();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statCards = [
    { title: 'Total Videos', value: stats.totalVideos, icon: Video, color: 'text-red-500' },
    { title: 'Total Vistas', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-blue-500' },
    { title: 'Horas de Reproducción', value: stats.totalWatchHours.toFixed(1), icon: Clock, color: 'text-purple-500' },
    { title: 'Duración Promedio', value: formatDuration(stats.avgViewDuration), icon: Play, color: 'text-green-500' },
    { title: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'text-pink-500' },
    { title: 'Total Comentarios', value: stats.totalComments.toLocaleString(), icon: MessageCircle, color: 'text-orange-500' },
    { title: 'Tasa Engagement', value: `${stats.engagementRate.toFixed(2)}%`, icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.title}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function YouTubeTopVideos() {
  const { data: videos } = useYouTubeVideos();

  if (!videos?.length) return null;

  const topVideos = [...videos].sort((a, b) => b.views - a.views).slice(0, 5);
  const maxViews = topVideos[0]?.views || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top 5 Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topVideos.map((video, index) => (
          <div key={video.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  index === 0 ? 'bg-yellow-500 text-white' : 'bg-muted'
                }`}>{index + 1}</span>
                <span className="truncate max-w-[180px]" title={video.title || ''}>{video.title || 'Sin título'}</span>
              </div>
              <span className="font-medium text-red-600">{video.views.toLocaleString()}</span>
            </div>
            <Progress value={(video.views / maxViews) * 100} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function YouTubeVideosTab() {
  const { data: videos, isLoading } = useYouTubeVideos();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <div className="flex justify-center py-8">Cargando videos...</div>;
  if (!videos?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay videos importados</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-red-500" />Videos ({videos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Video</TableHead>
              <TableHead className="text-right">Vistas</TableHead>
              <TableHead className="text-right">Min. Vistos</TableHead>
              <TableHead className="text-right">Duración Prom.</TableHead>
              <TableHead className="text-right">Likes</TableHead>
              <TableHead className="text-right">Comentarios</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {video.thumbnail_url && <img src={video.thumbnail_url} alt="" className="w-16 h-9 object-cover rounded" />}
                    <div className="max-w-[200px]">
                      <p className="font-medium truncate">{video.title || 'Sin título'}</p>
                      {video.watch_url && (
                        <a href={video.watch_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />Ver
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{video.views.toLocaleString()}</TableCell>
                <TableCell className="text-right">{video.watch_minutes.toFixed(1)}</TableCell>
                <TableCell className="text-right">{formatDuration(video.avg_view_duration)}</TableCell>
                <TableCell className="text-right">{video.likes}</TableCell>
                <TableCell className="text-right">{video.comments}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {video.published_at ? format(new Date(video.published_at), 'dd MMM yyyy', { locale: es }) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function YouTubeImportDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importVideos = useImportYouTubeVideos();

  const handleFileUpload = async (file: File) => {
    setImporting(true);
    Papa.parse(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const result = await importVideos.mutateAsync({ videos: results.data as MetricoolYouTubeRow[], fileName: file.name });
          toast({ title: 'Importación completada', description: `${result.imported} nuevos, ${result.updated} actualizados` });
        } catch {
          toast({ title: 'Error al importar', variant: 'destructive' });
        } finally {
          setImporting(false);
        }
      },
      error: () => { toast({ title: 'Error al leer archivo', variant: 'destructive' }); setImporting(false); },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" />Importar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Importar datos de YouTube
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Instrucciones:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Exporta desde Metricool en formato CSV</li>
              <li>Usar punto y coma (;) como separador</li>
            </ul>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          <Button className="w-full" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <><FileUp className="h-4 w-4 mr-2" />Seleccionar CSV</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function YouTubeContent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end"><YouTubeImportDialog /></div>
      <YouTubeStatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <YouTubeTopVideos />
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Métricas de Audiencia</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const stats = useYouTubeStats();
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.totalVideos}</p>
                    <p className="text-xs text-muted-foreground">Videos</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-2xl font-bold text-blue-600">{(stats.totalViews/1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Views Totales</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalWatchHours.toFixed(0)}h</p>
                    <p className="text-xs text-muted-foreground">Watch Time</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-2xl font-bold text-green-600">{Math.round(stats.avgViewsPerVideo)}</p>
                    <p className="text-xs text-muted-foreground">Avg Views/Video</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
      <YouTubeVideosTab />
    </div>
  );
}

// =====================================================
// TIKTOK ICON COMPONENT
// =====================================================

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

// =====================================================
// YOUTUBE ICON COMPONENT
// =====================================================

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function SocialMedia() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" />
            Redes Sociales
          </h1>
          <p className="text-muted-foreground">Analiza, compara y optimiza tu contenido en todas las plataformas</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="instagram" className="gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-2">
            <TikTokIcon className="h-4 w-4" />
            TikTok
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="youtube" className="gap-2">
            <YouTubeIcon className="h-4 w-4" />
            YouTube
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="instagram" className="mt-6">
          <InstagramContent />
        </TabsContent>

        <TabsContent value="tiktok" className="mt-6">
          <TikTokContent />
        </TabsContent>

        <TabsContent value="linkedin" className="mt-6">
          <LinkedInContent />
        </TabsContent>

        <TabsContent value="youtube" className="mt-6">
          <YouTubeContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
