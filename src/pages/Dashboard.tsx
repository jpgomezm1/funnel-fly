import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
  Briefcase,
  Trophy,
  Zap,
  Flame,
  Star,
  Rocket,
  Crown,
  Building,
  User,
  CheckCircle,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { useLeads } from '@/hooks/useLeads';
import { useLeadDeals } from '@/hooks/useDeals';
import { cn, formatOwnerName } from '@/lib/utils';
import { formatDateToBogota } from '@/lib/date-utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useMetrics();
  const { leads } = useLeads();
  
  // Get closed leads
  const closedLeads = leads.filter(lead => lead.stage === 'CERRADO_GANADO');
  const [animationStep, setAnimationStep] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [sparkleCount, setSparkleCount] = useState(0);

  // Animation effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Shake effect when close to goal
  useEffect(() => {
    if (metrics && metrics.currentMrr > metrics.goalMrr * 0.9) {
      const shakeInterval = setInterval(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }, 3000);
      return () => clearInterval(shakeInterval);
    }
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground text-xl font-medium">Cargando métricas épicas...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Error al cargar métricas</h1>
            <p className="text-muted-foreground mt-2">
              {error?.message || 'Error desconocido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min((metrics.currentMrr / metrics.goalMrr) * 100, 100);
  const remaining = Math.max(metrics.goalMrr - metrics.currentMrr, 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format MRR trend data for chart
  const mrrTrendChart = metrics.mrrTrend.map(item => ({
    month: new Date(item.month).toLocaleDateString('es-ES', {
      month: 'short',
      year: '2-digit'
    }),
    mrr: item.mrr_total,
  }));

  // Add goal line to chart data
  const chartDataWithGoal = mrrTrendChart.map(item => ({
    ...item,
    goal: metrics.goalMrr
  }));

  // Dynamic messages based on progress
  const getMotivationalMessage = () => {
    if (progressPercentage >= 100) return { text: "🎉 ¡OBJETIVO CONQUISTADO!", color: "text-green-600", bg: "from-green-500 to-emerald-500" };
    if (progressPercentage >= 90) return { text: "🔥 ¡CASI LO TIENES!", color: "text-orange-600", bg: "from-orange-500 to-red-500" };
    if (progressPercentage >= 75) return { text: "💪 ¡VAMOS POR MÁS!", color: "text-yellow-600", bg: "from-yellow-500 to-orange-500" };
    if (progressPercentage >= 50) return { text: "🚀 ¡A LA MITAD!", color: "text-blue-600", bg: "from-blue-500 to-purple-500" };
    if (progressPercentage >= 25) return { text: "⚡ ¡ACELERANDO!", color: "text-purple-600", bg: "from-purple-500 to-pink-500" };
    return { text: "🎯 ¡VAMOS A CONQUISTAR!", color: "text-primary", bg: "from-primary to-blue-500" };
  };

  const motivation = getMotivationalMessage();

  // Debug log to verify our epic dashboard is loading
  console.log('🚀 EPIC DASHBOARD LOADING!', { progressPercentage, motivation });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header with dynamic energy */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/10 to-purple-500/5 rounded-3xl" />
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />

          <div className="relative bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-900/90 dark:to-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="relative p-4 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-2xl shadow-xl">
                    <Crown className="h-8 w-8 text-primary animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                      Dashboard Épico
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 font-medium">
                      Rumbo a la conquista de los 50K USD
                    </p>
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-sm px-4 py-2 bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-600 shadow-lg"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                Actualizado hace 30s
              </Badge>
            </div>
          </div>
        </div>

        {/* HERO SECTION - META DE 50K GIGANTE */}
        <div className="relative">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/10 to-purple-500/5 rounded-3xl" />
          {progressPercentage >= 90 && (
            <>
              <div className="absolute top-4 left-4 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-orange-400/20 rounded-full blur-lg animate-pulse delay-500" />
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-red-400/20 rounded-full blur-2xl animate-pulse delay-1000" />
            </>
          )}

          <Card className={cn(
            "overflow-hidden border-0 shadow-2xl transition-all duration-500",
            progressPercentage >= 100
              ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/50 dark:via-emerald-900/50 dark:to-teal-900/50"
              : progressPercentage >= 90
                ? "bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/50 dark:via-red-900/50 dark:to-pink-900/50"
                : "bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-slate-900 dark:via-blue-900/30 dark:to-purple-900/30",
            isShaking && "animate-bounce"
          )}>
            <CardContent className="p-12">
              <div className="text-center space-y-8">
                {/* Motivational Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className={cn(
                      "p-4 rounded-full shadow-2xl transition-all duration-500",
                      `bg-gradient-to-r ${motivation.bg}`
                    )}>
                      {progressPercentage >= 100 ? (
                        <Trophy className="h-12 w-12 text-white animate-pulse" />
                      ) : progressPercentage >= 90 ? (
                        <Flame className="h-12 w-12 text-white animate-bounce" />
                      ) : progressPercentage >= 75 ? (
                        <Rocket className="h-12 w-12 text-white animate-pulse" />
                      ) : progressPercentage >= 50 ? (
                        <Zap className="h-12 w-12 text-white animate-pulse" />
                      ) : (
                        <Target className="h-12 w-12 text-white animate-pulse" />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {[...Array(Math.min(5, Math.floor(progressPercentage / 20)))].map((_, i) => (
                        <Star key={i} className="h-6 w-6 text-yellow-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                      ))}
                    </div>
                  </div>

                  <h2 className={cn(
                    "text-4xl lg:text-6xl font-black transition-all duration-500",
                    motivation.color
                  )}>
                    {motivation.text}
                  </h2>
                </div>

                {/* Giant Progress Display */}
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-8 text-center">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        MRR Actual
                      </p>
                      <p className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {formatCurrency(metrics.currentMrr)}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="text-4xl animate-pulse">
                        {progressPercentage >= 100 ? "🏆" : progressPercentage >= 90 ? "🔥" : progressPercentage >= 75 ? "💪" : progressPercentage >= 50 ? "🚀" : "⚡"}
                      </div>
                      <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                        {progressPercentage.toFixed(1)}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Meta
                      </p>
                      <p className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                        {formatCurrency(metrics.goalMrr)}
                      </p>
                    </div>
                  </div>

                  {/* Epic Progress Bar */}
                  <div className="space-y-4">
                    <div className="relative h-8 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000 ease-out rounded-full relative",
                          `bg-gradient-to-r ${motivation.bg}`,
                          progressPercentage >= 90 && "animate-pulse"
                        )}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        {progressPercentage >= 90 && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <Flame className="h-5 w-5 text-white animate-bounce" />
                          </div>
                        )}
                      </div>
                    </div>

                    {remaining > 0 && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                          ¡Solo faltan <span className="text-red-600 dark:text-red-400">{formatCurrency(remaining)}</span> para la victoria! 💪
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics - More compact and supportive */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/30 dark:to-blue-950/20 border-blue-200 dark:border-blue-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Fees Este Mes</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">{formatCurrency(metrics.feesMonth)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Fees Total</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-100">{formatCurrency(metrics.feesHistorical)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/70 dark:from-purple-900/30 dark:to-purple-950/20 border-purple-200 dark:border-purple-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Deals Activos</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">{metrics.activeDeals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/70 dark:from-orange-900/30 dark:to-orange-950/20 border-orange-200 dark:border-orange-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Cierres Semana</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-100">{metrics.newClosesWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MRR Trend Chart - Enhanced and Focused */}
        <Card className="bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/5 p-8 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-4 text-2xl">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent font-bold">
                Tendencia MRR - Camino a los 50K
              </span>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">En tiempo real</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartDataWithGoal}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    fontWeight={600}
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    fontWeight={600}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(value as number),
                      name === 'mrr' ? 'MRR Actual' : 'Meta MRR'
                    ]}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  {/* Goal Line */}
                  <Line
                    type="monotone"
                    dataKey="goal"
                    stroke="#10b981"
                    strokeWidth={3}
                    strokeDasharray="10 5"
                    dot={false}
                    name="Meta"
                  />
                  {/* Actual MRR Line */}
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={{
                      fill: 'hsl(var(--primary))',
                      strokeWidth: 3,
                      r: 6,
                      stroke: '#fff'
                    }}
                    activeDot={{
                      r: 8,
                      fill: 'hsl(var(--primary))',
                      stroke: '#fff',
                      strokeWidth: 3
                    }}
                    name="MRR"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clientes Cerrados Section */}
        <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50/50 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/5 p-8 border-b border-emerald-200 dark:border-emerald-700">
            <CardTitle className="flex items-center gap-4 text-2xl">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/30 rounded-xl shadow-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="bg-gradient-to-r from-emerald-800 to-green-600 dark:from-emerald-200 dark:to-green-200 bg-clip-text text-transparent font-bold">
                Clientes Cerrados - ¡Victoria Total!
              </span>
              <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-700 border-emerald-300">
                {closedLeads.length} cliente{closedLeads.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {closedLeads.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {closedLeads.map((lead) => (
                    <ClosedLeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
                {closedLeads.length > 6 && (
                  <div className="text-center">
                    <Button asChild variant="outline" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300">
                      <Link to="/leads?stage=CERRADO_GANADO">
                        Ver todos los clientes cerrados
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-6 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-2xl max-w-md mx-auto">
                  <Trophy className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                    ¡Primer cierre en camino!
                  </h3>
                  <p className="text-emerald-600 dark:text-emerald-400">
                    Los clientes cerrados aparecerán aquí cuando completes tu primer deal exitoso.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component for individual closed lead cards
function ClosedLeadCard({ lead }: { lead: any }) {
  const { dealsMap = {}, isLoading } = useLeadDeals([lead.id]);
  const deal = dealsMap && dealsMap[lead.id] ? dealsMap[lead.id][0] : null; // Get the first deal for this lead
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Add loading state handling
  if (isLoading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/50 border-emerald-200 dark:border-emerald-700 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-200 rounded-lg" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-emerald-200 rounded w-3/4" />
                <div className="h-4 bg-emerald-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-20 bg-emerald-100 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-emerald-200 rounded w-full" />
              <div className="h-4 bg-emerald-200 rounded w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/50 border-emerald-200 dark:border-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Company Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Building className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">
                  {lead.company_name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cerrado: {formatDateToBogota(lead.stage_entered_at)}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ganado
            </Badge>
          </div>

          {/* Deal Information */}
          {deal && (
            <div className="space-y-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">MRR</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-200">
                  {formatCurrency(deal.mrr_usd)}/mes
                </span>
              </div>
              {deal.implementation_fee_usd > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Implementation Fee</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-200">
                    {formatCurrency(deal.implementation_fee_usd)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Inicio</span>
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  {new Date(deal.start_date).toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2">
            {lead.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{lead.contact_name}</span>
                {lead.contact_role && (
                  <span className="text-slate-500 dark:text-slate-400">- {lead.contact_role}</span>
                )}
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{lead.phone}</span>
              </div>
            )}
            {lead.owner_id && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                  Owner: {formatOwnerName(lead.owner_id)}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
            >
              <Link to={`/leads/${lead.id}`} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Ver Detalles
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}