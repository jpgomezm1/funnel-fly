import { useState } from 'react';
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
import { Target, Edit, Plus, TrendingUp, AlertCircle } from 'lucide-react';

interface Goal {
  id: string;
  type: 'weekly' | 'monthly';
  metric: string;
  target: number;
  current: number;
  unit: string;
}

const defaultWeeklyGoals: Goal[] = [
  { id: '1', type: 'weekly', metric: 'Prospectos', target: 45, current: 32, unit: 'leads' },
  { id: '2', type: 'weekly', metric: 'Intentos de Contacto', target: 90, current: 78, unit: 'intentos' },
  { id: '3', type: 'weekly', metric: 'Descubrimientos', target: 11, current: 8, unit: 'leads' },
  { id: '4', type: 'weekly', metric: 'Demos', target: 5, current: 4, unit: 'demos' },
  { id: '5', type: 'weekly', metric: 'Propuestas', target: 3, current: 2, unit: 'propuestas' },
  { id: '6', type: 'weekly', metric: 'Cierres', target: 1, current: 1, unit: 'cierres' },
];

const defaultMonthlyGoals: Goal[] = [
  { id: '7', type: 'monthly', metric: 'Prospectos', target: 180, current: 142, unit: 'leads' },
  { id: '8', type: 'monthly', metric: 'Intentos de Contacto', target: 360, current: 298, unit: 'intentos' },
  { id: '9', type: 'monthly', metric: 'Descubrimientos', target: 44, current: 36, unit: 'leads' },
  { id: '10', type: 'monthly', metric: 'Demos', target: 20, current: 16, unit: 'demos' },
  { id: '11', type: 'monthly', metric: 'Propuestas', target: 12, current: 9, unit: 'propuestas' },
  { id: '12', type: 'monthly', metric: 'Cierres', target: 4, current: 3, unit: 'cierres' },
];

export default function Goals() {
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>(defaultWeeklyGoals);
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>(defaultMonthlyGoals);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const getGoalStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    
    if (percentage >= 100) return { status: 'success', color: 'bg-green-500', label: 'Logrado' };
    if (percentage >= 80) return { status: 'warning', color: 'bg-yellow-500', label: 'En Progreso' };
    if (percentage >= 60) return { status: 'attention', color: 'bg-orange-500', label: 'Atención' };
    return { status: 'danger', color: 'bg-red-500', label: 'Crítico' };
  };

  const getStatusBadge = (current: number, target: number) => {
    const { status, label } = getGoalStatus(current, target);
    const percentage = (current / target) * 100;
    
    const variants = {
      success: 'default' as const,
      warning: 'secondary' as const,
      attention: 'outline' as const,
      danger: 'destructive' as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {percentage.toFixed(1)}% - {label}
      </Badge>
    );
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoalTarget(goal.target.toString());
    setDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!editingGoal || !newGoalTarget) return;

    const updatedGoal = {
      ...editingGoal,
      target: parseInt(newGoalTarget)
    };

    if (editingGoal.type === 'weekly') {
      setWeeklyGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
    } else {
      setMonthlyGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
    }

    setDialogOpen(false);
    setEditingGoal(null);
    setNewGoalTarget('');
  };

  const renderGoalsTable = (goals: Goal[], type: 'weekly' | 'monthly') => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas {type === 'weekly' ? 'Semanales' : 'Mensuales'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Meta</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals.map((goal) => {
              const percentage = (goal.current / goal.target) * 100;
              const { color } = getGoalStatus(goal.current, goal.target);
              
              return (
                <TableRow key={goal.id}>
                  <TableCell className="font-medium">{goal.metric}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{goal.current}</span>
                      <span className="text-sm text-muted-foreground">{goal.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{goal.target}</span>
                      <span className="text-sm text-muted-foreground">{goal.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${color}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(goal.current, goal.target)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditGoal(goal)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderSummaryCards = (goals: Goal[], type: string) => {
    const totalGoals = goals.length;
    const achievedGoals = goals.filter(g => g.current >= g.target).length;
    const onTrackGoals = goals.filter(g => {
      const percentage = (g.current / g.target) * 100;
      return percentage >= 80 && percentage < 100;
    }).length;
    const needsAttention = goals.filter(g => {
      const percentage = (g.current / g.target) * 100;
      return percentage < 60;
    }).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Metas</p>
                <p className="text-2xl font-bold">{totalGoals}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Logradas</p>
                <p className="text-2xl font-bold text-green-600">{achievedGoals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold text-yellow-600">{onTrackGoals}</p>
              </div>
              <Target className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requieren Atención</p>
                <p className="text-2xl font-bold text-red-600">{needsAttention}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Gestión de Metas</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList>
          <TabsTrigger value="weekly">Metas Semanales</TabsTrigger>
          <TabsTrigger value="monthly">Metas Mensuales</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          {renderSummaryCards(weeklyGoals, 'weekly')}
          {renderGoalsTable(weeklyGoals, 'weekly')}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {renderSummaryCards(monthlyGoals, 'monthly')}
          {renderGoalsTable(monthlyGoals, 'monthly')}
        </TabsContent>
      </Tabs>

      {/* Edit Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar Meta: {editingGoal?.metric}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">Nueva Meta</Label>
              <Input
                id="target"
                type="number"
                placeholder="Ingresa la nueva meta"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
              />
            </div>
            
            {editingGoal && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Actual: <span className="font-medium">{editingGoal.current} {editingGoal.unit}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Meta Actual: <span className="font-medium">{editingGoal.target} {editingGoal.unit}</span>
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveGoal}
                disabled={!newGoalTarget || parseInt(newGoalTarget) <= 0}
              >
                Guardar Meta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}