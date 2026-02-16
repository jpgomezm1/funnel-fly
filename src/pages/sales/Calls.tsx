import { useState, useMemo } from 'react';
import { Phone, Plus, RefreshCw, BarChart3, List, Calendar, LayoutGrid, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCalls, useAllCalls, useCallMutations } from '@/hooks/useCalls';
import { Call, CallTeamMember, CallResult, CallSource } from '@/types/calls';
import { WeeklyMetrics } from '@/components/calls/WeeklyMetrics';
import { CallFilters, DateFilter, getDateRange } from '@/components/calls/CallFilters';
import { CallCard } from '@/components/calls/CallCard';
import { CallModal } from '@/components/calls/CallModal';
import { CloseCallModal } from '@/components/calls/CloseCallModal';
import { CallDetailModal } from '@/components/calls/CallDetailModal';
import { CallsAnalytics } from '@/components/calls/CallsAnalytics';
import { CallsCalendar } from '@/components/calls/CallsCalendar';
import { ExportCallsDialog } from '@/components/calls/ExportCallsDialog';

type ViewMode = 'list' | 'calendar';

export default function Calls() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all' | 'analytics'>('upcoming');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCall, setEditCall] = useState<Call | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [closeCallModalOpen, setCloseCallModalOpen] = useState(false);
  const [callToClose, setCallToClose] = useState<Call | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [callToView, setCallToView] = useState<Call | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // View modes for each tab
  const [upcomingViewMode, setUpcomingViewMode] = useState<ViewMode>('list');
  const [pastViewMode, setPastViewMode] = useState<ViewMode>('list');
  const [allViewMode, setAllViewMode] = useState<ViewMode>('calendar');

  // Filters for upcoming
  const [upcomingTeamMember, setUpcomingTeamMember] = useState<CallTeamMember | 'all'>('all');

  // Filters for past
  const [pastTeamMember, setPastTeamMember] = useState<CallTeamMember | 'all'>('all');
  const [pastResult, setPastResult] = useState<CallResult | 'all'>('all');
  const [pastSource, setPastSource] = useState<CallSource | 'all'>('all');
  const [pastDateFilter, setPastDateFilter] = useState<DateFilter>('all');

  // Filters for all calls
  const [allTeamMember, setAllTeamMember] = useState<CallTeamMember | 'all'>('all');
  const [allResult, setAllResult] = useState<CallResult | 'all'>('all');
  const [allSource, setAllSource] = useState<CallSource | 'all'>('all');

  // Filters for analytics
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<DateFilter>('all');
  const [analyticsTeamMember, setAnalyticsTeamMember] = useState<CallTeamMember | 'all'>('all');
  const [analyticsSource, setAnalyticsSource] = useState<CallSource | 'all'>('all');

  // Get date range for past calls
  const pastDateRange = useMemo(() => getDateRange(pastDateFilter), [pastDateFilter]);

  // Get date range for analytics
  const analyticsDateRange = useMemo(() => getDateRange(analyticsDateFilter), [analyticsDateFilter]);

  // Queries
  const { data: upcomingCalls, isLoading: loadingUpcoming } = useCalls({
    upcoming: true,
    teamMember: upcomingTeamMember,
  });

  const { data: pastCalls, isLoading: loadingPast } = useCalls({
    upcoming: false,
    teamMember: pastTeamMember,
    result: pastResult,
    source: pastSource,
    dateStart: pastDateRange.start,
    dateEnd: pastDateRange.end,
  });

  // All calls for analytics (with filters)
  const { data: allCalls, isLoading: loadingAll } = useAllCalls();

  // Filter calls for analytics
  const analyticsFilteredCalls = useMemo(() => {
    if (!allCalls) return [];

    let filtered = [...allCalls];

    // Filter by date range
    if (analyticsDateRange.start && analyticsDateRange.end) {
      filtered = filtered.filter(c => {
        const date = new Date(c.scheduled_at);
        return date >= analyticsDateRange.start! && date <= analyticsDateRange.end!;
      });
    }

    // Filter by team member
    if (analyticsTeamMember !== 'all') {
      filtered = filtered.filter(c => c.team_member === analyticsTeamMember);
    }

    // Filter by source
    if (analyticsSource !== 'all') {
      filtered = filtered.filter(c => c.source === analyticsSource);
    }

    return filtered;
  }, [allCalls, analyticsDateRange, analyticsTeamMember, analyticsSource]);

  // Filter all calls for "Todas" tab
  const allFilteredCalls = useMemo(() => {
    if (!allCalls) return [];

    let filtered = [...allCalls];

    // Filter by team member
    if (allTeamMember !== 'all') {
      filtered = filtered.filter(c => c.team_member === allTeamMember);
    }

    // Filter by result
    if (allResult !== 'all') {
      filtered = filtered.filter(c => c.call_result === allResult);
    }

    // Filter by source
    if (allSource !== 'all') {
      filtered = filtered.filter(c => c.source === allSource);
    }

    return filtered;
  }, [allCalls, allTeamMember, allResult, allSource]);

  const { deleteCall, isDeleting } = useCallMutations();

  const handleEdit = (call: Call) => {
    setEditCall(call);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCall(deleteId);
      setDeleteId(null);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditCall(null);
  };

  const handleCloseCall = (call: Call) => {
    setCallToClose(call);
    setCloseCallModalOpen(true);
  };

  const handleCloseCallModal = () => {
    setCloseCallModalOpen(false);
    setCallToClose(null);
  };

  const handleViewDetail = (call: Call) => {
    setCallToView(call);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setCallToView(null);
  };

  const handleEditFromDetail = (call: Call) => {
    handleCloseDetailModal();
    handleCloseCall(call);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Llamadas de Ventas</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las llamadas del equipo de ventas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Llamada
          </Button>
        </div>
      </div>

      {/* Weekly Metrics */}
      <WeeklyMetrics />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past' | 'all' | 'analytics')}
      >
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Proximas
            {upcomingCalls && (
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                {upcomingCalls.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            Pasadas
            {pastCalls && (
              <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                {pastCalls.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Todas
            {allCalls && (
              <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                {allCalls.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <CallFilters
              teamMember={upcomingTeamMember}
              onTeamMemberChange={setUpcomingTeamMember}
            />
            <ToggleGroup
              type="single"
              value={upcomingViewMode}
              onValueChange={(v) => v && setUpcomingViewMode(v as ViewMode)}
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem value="list" className="px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" className="px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <Calendar className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {loadingUpcoming ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingCalls && upcomingCalls.length > 0 ? (
            upcomingViewMode === 'list' ? (
              <div className="grid gap-4">
                {upcomingCalls.map((call) => (
                  <CallCard
                    key={call.id}
                    call={call}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onClose={handleCloseCall}
                  />
                ))}
              </div>
            ) : (
              <CallsCalendar
                calls={upcomingCalls}
                onEditCall={handleEdit}
                onCloseCall={handleCloseCall}
              />
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay llamadas programadas</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Programar Llamada
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Past Tab */}
        <TabsContent value="past" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <CallFilters
              teamMember={pastTeamMember}
              onTeamMemberChange={setPastTeamMember}
              showResultFilter
              result={pastResult}
              onResultChange={setPastResult}
              showSourceFilter
              source={pastSource}
              onSourceChange={setPastSource}
              showDateFilter
              dateFilter={pastDateFilter}
              onDateFilterChange={setPastDateFilter}
            />
            <ToggleGroup
              type="single"
              value={pastViewMode}
              onValueChange={(v) => v && setPastViewMode(v as ViewMode)}
              className="bg-muted rounded-lg p-1 flex-shrink-0"
            >
              <ToggleGroupItem value="list" className="px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" className="px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <Calendar className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {loadingPast ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pastCalls && pastCalls.length > 0 ? (
            pastViewMode === 'list' ? (
              <div className="grid gap-4">
                {pastCalls.map((call) => (
                  <CallCard
                    key={call.id}
                    call={call}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onClose={handleCloseCall}
                    onViewDetail={handleViewDetail}
                  />
                ))}
              </div>
            ) : (
              <CallsCalendar
                calls={pastCalls}
                onEditCall={handleEdit}
                onCloseCall={handleCloseCall}
                onViewDetail={handleViewDetail}
              />
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay llamadas pasadas</p>
            </div>
          )}
        </TabsContent>

        {/* All Calls Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <CallFilters
              teamMember={allTeamMember}
              onTeamMemberChange={setAllTeamMember}
              showResultFilter
              result={allResult}
              onResultChange={setAllResult}
              showSourceFilter
              source={allSource}
              onSourceChange={setAllSource}
            />
            <ToggleGroup
              type="single"
              value={allViewMode}
              onValueChange={(v) => v && setAllViewMode(v as ViewMode)}
              className="bg-muted rounded-lg p-1 flex-shrink-0"
            >
              <ToggleGroupItem value="list" className="px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" className="px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <Calendar className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {loadingAll ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : allFilteredCalls && allFilteredCalls.length > 0 ? (
            allViewMode === 'list' ? (
              <div className="grid gap-4">
                {allFilteredCalls.map((call) => (
                  <CallCard
                    key={call.id}
                    call={call}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onClose={handleCloseCall}
                    onViewDetail={handleViewDetail}
                  />
                ))}
              </div>
            ) : (
              <CallsCalendar
                calls={allFilteredCalls}
                onEditCall={handleEdit}
                onCloseCall={handleCloseCall}
                onViewDetail={handleViewDetail}
              />
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay llamadas</p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <CallFilters
            teamMember={analyticsTeamMember}
            onTeamMemberChange={setAnalyticsTeamMember}
            showSourceFilter
            source={analyticsSource}
            onSourceChange={setAnalyticsSource}
            showDateFilter
            dateFilter={analyticsDateFilter}
            onDateFilterChange={setAnalyticsDateFilter}
          />

          {loadingAll ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CallsAnalytics calls={analyticsFilteredCalls} />
          )}
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <CallModal
        open={modalOpen}
        onClose={handleCloseModal}
        editCall={editCall}
      />

      {/* Close Call Modal */}
      <CloseCallModal
        open={closeCallModalOpen}
        onClose={handleCloseCallModal}
        call={callToClose}
      />

      {/* Call Detail Modal */}
      <CallDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        call={callToView}
        onEdit={handleEditFromDetail}
      />

      {/* Export Dialog */}
      <ExportCallsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Llamada</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La llamada sera eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
