import { useState, useEffect } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Target,
  Edit,
  Plus,
  TrendingUp,
  AlertCircle,
  Trophy,
  Zap,
  Flame,
  Star,
  Crown,
  Sparkles,
  Rocket,
  Award,
  Calendar,
  BarChart3,
  Activity,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  type: 'weekly' | 'monthly';
  metric: string;
  target: number;
  current: number;
  unit: string;
}

// Metas target por defecto (estas se pueden hacer editables más adelante)
const defaultTargets = {
  weekly: {
    prospectos: 45,
    contactados: 90,
    descubrimientos: 11,
    demostraciones: 5,
    propuestas: 3,
    cierres: 1,
  },
  monthly: {
    prospectos: 180,
    contactados: 360,
    descubrimientos: 44,
    demostraciones: 20,
    propuestas: 12,
    cierres: 4,
  },
};

export default function Goals() {
  const { weeklyMetrics, monthlyMetrics, loading } = useGoals();
  const [targets, setTargets] = useState(defaultTargets);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [animationStep, setAnimationStep] = useState(0);
  const [achievementCelebration, setAchievementCelebration] = useState<string | null>(null);

  // Animation effects for motivation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Achievement celebration effect
  useEffect(() => {
    if (achievementCelebration) {
      const timer = setTimeout(() => setAchievementCelebration(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [achievementCelebration]);

  // Convertir métricas a formato Goal
  const weeklyGoals: Goal[] = [
    { id: '1', type: 'weekly', metric: 'Prospectos', target: targets.weekly.prospectos, current: weeklyMetrics.prospectos, unit: 'leads' },
    { id: '2', type: 'weekly', metric: 'Contactados', target: targets.weekly.contactados, current: weeklyMetrics.contactados, unit: 'contactados' },
    { id: '3', type: 'weekly', metric: 'Descubrimientos', target: targets.weekly.descubrimientos, current: weeklyMetrics.descubrimientos, unit: 'leads' },
    { id: '4', type: 'weekly', metric: 'Demos', target: targets.weekly.demostraciones, current: weeklyMetrics.demostraciones, unit: 'demos' },
    { id: '5', type: 'weekly', metric: 'Propuestas', target: targets.weekly.propuestas, current: weeklyMetrics.propuestas, unit: 'propuestas' },
    { id: '6', type: 'weekly', metric: 'Cierres', target: targets.weekly.cierres, current: weeklyMetrics.cierres, unit: 'cierres' },
  ];

  const monthlyGoals: Goal[] = [
    { id: '7', type: 'monthly', metric: 'Prospectos', target: targets.monthly.prospectos, current: monthlyMetrics.prospectos, unit: 'leads' },
    { id: '8', type: 'monthly', metric: 'Contactados', target: targets.monthly.contactados, current: monthlyMetrics.contactados, unit: 'contactados' },
    { id: '9', type: 'monthly', metric: 'Descubrimientos', target: targets.monthly.descubrimientos, current: monthlyMetrics.descubrimientos, unit: 'leads' },
    { id: '10', type: 'monthly', metric: 'Demos', target: targets.monthly.demostraciones, current: monthlyMetrics.demostraciones, unit: 'demos' },
    { id: '11', type: 'monthly', metric: 'Propuestas', target: targets.monthly.propuestas, current: monthlyMetrics.propuestas, unit: 'propuestas' },
    { id: '12', type: 'monthly', metric: 'Cierres', target: targets.monthly.cierres, current: monthlyMetrics.cierres, unit: 'cierres' },
  ];

  const getGoalStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;

    if (percentage >= 150) return {
      status: 'legendary',
      color: 'from-purple-500 via-pink-500 to-yellow-500',
      label: '🏆 LEGENDARIO',
      icon: Crown,
      gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500'
    };
    if (percentage >= 120) return {
      status: 'superstar',
      color: 'from-green-400 via-emerald-500 to-teal-500',
      label: '⭐ SUPERESTRELLA',
      icon: Star,
      gradient: 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
    };
    if (percentage >= 100) return {
      status: 'champion',
      color: 'from-green-500 to-emerald-600',
      label: '🎉 CAMPEÓN',
      icon: Trophy,
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600'
    };
    if (percentage >= 90) return {
      status: 'excellent',
      color: 'from-blue-500 to-blue-600',
      label: '🔥 EXCELENTE',
      icon: Flame,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
    };
    if (percentage >= 75) return {
      status: 'good',
      color: 'from-cyan-500 to-blue-500',
      label: '💪 BIEN ENCAMINADO',
      icon: Rocket,
      gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500'
    };
    if (percentage >= 50) return {
      status: 'progress',
      color: 'from-yellow-500 to-orange-500',
      label: '⚡ EN PROGRESO',
      icon: Zap,
      gradient: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    };
    if (percentage >= 25) return {
      status: 'started',
      color: 'from-orange-500 to-red-500',
      label: '🎯 INICIANDO',
      icon: Target,
      gradient: 'bg-gradient-to-r from-orange-500 to-red-500'
    };
    return {
      status: 'critical',
      color: 'from-red-500 to-red-600',
      label: '🚨 CRÍTICO',
      icon: AlertCircle,
      gradient: 'bg-gradient-to-r from-red-500 to-red-600'
    };
  };

  const getStatusBadge = (current: number, target: number) => {
    const { status, label, gradient, icon: Icon } = getGoalStatus(current, target);
    const percentage = (current / target) * 100;

    return (
      <Badge className={cn(
        "px-3 py-1.5 text-white border-0 shadow-lg font-bold text-sm transition-all duration-200 hover:scale-105",
        gradient
      )}>
        <Icon className="h-4 w-4 mr-1" />
        {percentage.toFixed(1)}% - {label}
      </Badge>
    );
  };

  // Get motivational message based on overall performance
  const getMotivationalMessage = (goals: Goal[]) => {
    const achievedGoals = goals.filter(g => g.current >= g.target).length;
    const totalGoals = goals.length;
    const percentage = (achievedGoals / totalGoals) * 100;

    if (percentage >= 100) return { text: "🏆 ¡DOMINIO TOTAL! ¡ERES UNA MÁQUINA!", color: "text-purple-600", bg: "from-purple-500 to-pink-500" };
    if (percentage >= 80) return { text: "🔥 ¡IMPARABLE! ¡SIGUE ASÍ!", color: "text-green-600", bg: "from-green-500 to-emerald-500" };
    if (percentage >= 60) return { text: "💪 ¡BUEN RITMO! ¡A POR MÁS!", color: "text-blue-600", bg: "from-blue-500 to-cyan-500" };
    if (percentage >= 40) return { text: "⚡ ¡ACELERANDO! ¡TÚ PUEDES!", color: "text-yellow-600", bg: "from-yellow-500 to-orange-500" };
    if (percentage >= 20) return { text: "🎯 ¡ENFÓCATE! ¡VAMOS A LOGRARLO!", color: "text-orange-600", bg: "from-orange-500 to-red-500" };
    return { text: "🚀 ¡HORA DE DESPEGAR! ¡A CONQUISTAR!", color: "text-red-600", bg: "from-red-500 to-red-600" };
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoalTarget(goal.target.toString());
    setDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!editingGoal || !newGoalTarget) return;

    const newTarget = parseInt(newGoalTarget);
    const metricKey = editingGoal.metric.toLowerCase() as keyof typeof targets.weekly;
    
    // Mapear nombres de métricas
    const metricMapping: { [key: string]: keyof typeof targets.weekly } = {
      'prospectos': 'prospectos',
      'contactados': 'contactados', 
      'descubrimientos': 'descubrimientos',
      'demos': 'demostraciones',
      'propuestas': 'propuestas',
      'cierres': 'cierres'
    };

    const mappedKey = metricMapping[metricKey] || metricKey;

    setTargets(prev => ({
      ...prev,
      [editingGoal.type]: {
        ...prev[editingGoal.type],
        [mappedKey]: newTarget
      }
    }));

    setDialogOpen(false);
    setEditingGoal(null);
    setNewGoalTarget('');
  };

  const renderGoalsTable = (goals: Goal[], type: 'weekly' | 'monthly') => (
    <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 backdrop-blur-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/5 p-6 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="flex items-center gap-4 text-2xl">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-xl shadow-lg">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent font-bold">
            Metas {type === 'weekly' ? 'Semanales' : 'Mensuales'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500 animate-pulse" />
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              {type === 'weekly' ? '7 días' : '30 días'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-base">Métrica</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-base">Actual</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-base">Meta</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-base">Progreso</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-base">Estado</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-base">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                const { gradient, icon: StatusIcon } = getGoalStatus(goal.current, goal.target);

                return (
                  <TableRow key={goal.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-bold text-slate-800 dark:text-white text-lg py-6">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-primary" />
                        {goal.metric}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-primary">{goal.current}</span>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                          {goal.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">{goal.target}</span>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                          {goal.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="space-y-3 min-w-[120px]">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{percentage.toFixed(1)}%</span>
                          {percentage >= 100 && <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 shadow-inner">
                          <div
                            className={cn(
                              "h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                              gradient
                            )}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            {percentage >= 90 && (
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                <Flame className="h-2 w-2 text-white animate-bounce" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      {getStatusBadge(goal.current, goal.target)}
                    </TableCell>
                    <TableCell className="py-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGoal(goal)}
                        className="h-10 px-4 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-primary/30 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl font-semibold"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderSummaryCards = (goals: Goal[], type: string) => {
    const totalGoals = goals.length;
    const achievedGoals = goals.filter(g => g.current >= g.target).length;
    const excellentGoals = goals.filter(g => {
      const percentage = (g.current / g.target) * 100;
      return percentage >= 90 && percentage < 100;
    }).length;
    const onTrackGoals = goals.filter(g => {
      const percentage = (g.current / g.target) * 100;
      return percentage >= 75 && percentage < 90;
    }).length;
    const needsAttention = goals.filter(g => {
      const percentage = (g.current / g.target) * 100;
      return percentage < 50;
    }).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="group bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/30 dark:to-blue-950/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Total Metas</p>
                <p className="text-3xl font-black text-blue-800 dark:text-blue-100">{totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-green-50 to-emerald-100/70 dark:from-green-900/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">🏆 Logradas</p>
                <p className="text-3xl font-black text-green-800 dark:text-green-100">{achievedGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-cyan-50 to-cyan-100/70 dark:from-cyan-900/30 dark:to-cyan-950/20 border-cyan-200 dark:border-cyan-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">🚀 En Camino</p>
                <p className="text-3xl font-black text-cyan-800 dark:text-cyan-100">{excellentGoals + onTrackGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-orange-50 to-red-100/70 dark:from-orange-900/30 dark:to-red-950/20 border-orange-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">⚡ Acelerar</p>
                <p className="text-3xl font-black text-orange-800 dark:text-orange-100">{needsAttention}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
        <div className="flex items-center justify-center h-64">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full border border-primary/20">
            <Trophy className="h-5 w-5 text-primary animate-spin" />
            <span className="text-primary font-semibold">Cargando metas épicas...</span>
          </div>
        </div>
      </div>
    );
  }

  const weeklyMotivation = getMotivationalMessage(weeklyGoals);
  const monthlyMotivation = getMotivationalMessage(monthlyGoals);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
      <div className="container mx-auto py-8 space-y-8">
        {/* Epic Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/10 to-purple-500/5 rounded-3xl" />
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-pulse delay-1000" />

          <div className="relative bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-900/90 dark:to-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="relative p-4 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-2xl shadow-xl border border-primary/20">
                  <Trophy className="h-8 w-8 text-primary animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent leading-tight">
                      Centro de Metas
                    </h1>
                    <Crown className="h-8 w-8 text-yellow-500 animate-bounce" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full border border-yellow-200 dark:border-yellow-800">
                      <Activity className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">En tiempo real</span>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Pipeline activo</span>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                    Conquista tus objetivos y alcanza la excelencia
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 py-1 bg-white/60 dark:bg-slate-800/60 rounded-full border">
                  Sistema de Metas V2.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-8">
            <Tabs defaultValue="weekly" className="space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200">
                    <Calendar className="h-4 w-4 mr-2" />
                    Metas Semanales
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Metas Mensuales
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Modo Campeón Activado
                  </span>
                </div>
              </div>

              <TabsContent value="weekly" className="space-y-8">
                {/* Weekly Motivation Banner */}
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-cyan-500/5 rounded-2xl" />
                  <Card className={cn(
                    "overflow-hidden border-0 shadow-xl transition-all duration-500",
                    `bg-gradient-to-r ${weeklyMotivation.bg}`
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center gap-4 text-center">
                        <Rocket className="h-8 w-8 text-white animate-bounce" />
                        <h2 className="text-2xl lg:text-3xl font-black text-white">
                          {weeklyMotivation.text}
                        </h2>
                        <Sparkles className="h-8 w-8 text-white animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {renderSummaryCards(weeklyGoals, 'weekly')}
                {renderGoalsTable(weeklyGoals, 'weekly')}
              </TabsContent>

              <TabsContent value="monthly" className="space-y-8">
                {/* Monthly Motivation Banner */}
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-green-500/10 to-emerald-500/5 rounded-2xl" />
                  <Card className={cn(
                    "overflow-hidden border-0 shadow-xl transition-all duration-500",
                    `bg-gradient-to-r ${monthlyMotivation.bg}`
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center gap-4 text-center">
                        <Trophy className="h-8 w-8 text-white animate-bounce" />
                        <h2 className="text-2xl lg:text-3xl font-black text-white">
                          {monthlyMotivation.text}
                        </h2>
                        <Crown className="h-8 w-8 text-white animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {renderSummaryCards(monthlyGoals, 'monthly')}
                {renderGoalsTable(monthlyGoals, 'monthly')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Enhanced Edit Goal Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 border-0 shadow-2xl backdrop-blur-xl">
            <DialogHeader className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    Editar Meta
                  </DialogTitle>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">{editingGoal?.metric}</p>
                </div>
                <Sparkles className="h-6 w-6 text-primary ml-auto animate-pulse" />
              </div>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div className="space-y-4">
                <Label htmlFor="target" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <Trophy className="h-4 w-4 text-primary" />
                  Nueva Meta
                </Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="Ingresa la nueva meta"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="h-12 bg-white/70 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-600 transition-all duration-200 focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 rounded-xl text-lg font-medium shadow-lg"
                />
              </div>

              {editingGoal && (
                <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Progreso Actual:</span>
                      <span className="text-lg font-bold text-primary">{editingGoal.current} {editingGoal.unit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Meta Actual:</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-white">{editingGoal.target} {editingGoal.unit}</span>
                    </div>
                    <div className="pt-2">
                      {getStatusBadge(editingGoal.current, editingGoal.target)}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="h-12 px-6 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 rounded-xl shadow-lg font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveGoal}
                  disabled={!newGoalTarget || parseInt(newGoalTarget) <= 0}
                  className="h-12 px-6 bg-gradient-to-r from-primary via-primary to-blue-600 hover:from-primary/90 hover:via-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border border-primary/20 font-semibold"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Guardar Meta
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}