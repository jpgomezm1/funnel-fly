import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Types
export interface Webinar {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  luma_event_id: string | null;
  total_registrants: number;
  attended_count: number;
  status: 'planned' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // New fields
  image_url: string | null;
  luma_url: string | null;
  recording_url: string | null;
  tags: string[];
}

export interface WebinarRegistrant {
  id: string;
  webinar_id: string;
  luma_api_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone_number: string | null;
  company: string | null;
  role: string | null;
  approval_status: string;
  has_joined_event: boolean;
  registered_at: string;
  created_at: string;
  notes: string | null;
}

export interface RepeatAttendee {
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone_number: string | null;
  webinars_registered: number;
  webinars_attended: number;
  webinar_ids: string[];
}

export interface AllRegistrant {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone_number: string | null;
  company: string | null;
  role: string | null;
  has_joined_event: boolean;
  registered_at: string;
  webinar_id: string;
  webinar_name: string;
  webinar_date: string;
  webinars_count: number; // How many webinars this person has registered for
}

export interface WebinarMetrics {
  totalWebinars: number;
  completedWebinars: number;
  plannedWebinars: number;
  totalRegistrants: number;
  totalAttendees: number;
  avgAttendanceRate: number;
  repeatAttendees: number;
}

// Extended analytics from CSV data
export interface WebinarAnalytics {
  // Attendance breakdown
  csvAttendees: number;
  csvAbsent: number;
  csvAttendanceRate: number;

  // Contact quality
  registrantsWithPhone: number;
  registrantsWithCompany: number;
  registrantsWithRole: number;
  contactQualityScore: number; // % with complete data

  // Company analysis
  uniqueCompanies: number;
  topCompanies: Array<{ company: string; count: number; attendedCount: number }>;

  // Role analysis
  topRoles: Array<{ role: string; count: number }>;

  // Registration timeline
  registrationsByDay: Array<{ date: string; count: number }>;

  // Engagement metrics
  conversionFromRegistration: number; // attended / registered
}

export interface AllWebinarsAnalytics {
  // Overall metrics
  totalRegistrantsAllTime: number;
  totalAttendeesFromCSV: number;
  overallAttendanceRate: number;

  // Trends
  webinarsByMonth: Array<{ month: string; count: number; registrants: number; attendees: number }>;
  attendanceRateTrend: Array<{ webinarName: string; date: string; rate: number }>;

  // Engagement
  avgRegistrantsPerWebinar: number;
  avgAttendeesPerWebinar: number;
  bestPerformingWebinar: { name: string; rate: number } | null;
  worstPerformingWebinar: { name: string; rate: number } | null;

  // Company insights across all webinars
  topCompaniesOverall: Array<{ company: string; totalRegistrations: number; webinarsAttended: number }>;

  // Repeat behavior
  repeatAttendeesCount: number;
  singleTimeAttendeesCount: number;
  repeatRate: number;
}

// Hook for fetching all webinars
export function useWebinars() {
  return useQuery({
    queryKey: ['webinars'],
    queryFn: async (): Promise<Webinar[]> => {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) {
        console.error('Error fetching webinars:', error);
        throw error;
      }

      return data as Webinar[];
    },
  });
}

// Hook for fetching a single webinar with its registrants
export function useWebinarDetail(webinarId: string | undefined) {
  const webinarQuery = useQuery({
    queryKey: ['webinar', webinarId],
    queryFn: async (): Promise<Webinar | null> => {
      if (!webinarId) return null;

      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', webinarId)
        .single();

      if (error) {
        console.error('Error fetching webinar:', error);
        throw error;
      }

      return data as Webinar;
    },
    enabled: !!webinarId,
  });

  const registrantsQuery = useQuery({
    queryKey: ['webinar-registrants', webinarId],
    queryFn: async (): Promise<WebinarRegistrant[]> => {
      if (!webinarId) return [];

      const { data, error } = await supabase
        .from('webinar_registrants')
        .select('*')
        .eq('webinar_id', webinarId)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrants:', error);
        throw error;
      }

      return data as WebinarRegistrant[];
    },
    enabled: !!webinarId,
  });

  return {
    webinar: webinarQuery.data,
    registrants: registrantsQuery.data || [],
    isLoading: webinarQuery.isLoading || registrantsQuery.isLoading,
    error: webinarQuery.error || registrantsQuery.error,
  };
}

// Hook for webinar mutations (create, update, delete)
export function useWebinarMutations() {
  const queryClient = useQueryClient();

  const createWebinar = useMutation({
    mutationFn: async (webinarData: Omit<Webinar, 'id' | 'created_at' | 'updated_at' | 'total_registrants'>) => {
      const { data, error } = await supabase
        .from('webinars')
        .insert(webinarData)
        .select()
        .single();

      if (error) throw error;
      return data as Webinar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webinars'] });
      toast({
        title: 'Éxito',
        description: 'Webinar creado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al crear webinar: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateWebinar = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Webinar> & { id: string }) => {
      const { data, error } = await supabase
        .from('webinars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Webinar;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webinars'] });
      queryClient.invalidateQueries({ queryKey: ['webinar', data.id] });
      toast({
        title: 'Éxito',
        description: 'Webinar actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al actualizar webinar: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteWebinar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webinars')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webinars'] });
      toast({
        title: 'Éxito',
        description: 'Webinar eliminado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al eliminar webinar: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateAttendedCount = useMutation({
    mutationFn: async ({ id, attended_count }: { id: string; attended_count: number }) => {
      const { data, error } = await supabase
        .from('webinars')
        .update({ attended_count })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Webinar;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webinars'] });
      queryClient.invalidateQueries({ queryKey: ['webinar', data.id] });
      toast({
        title: 'Éxito',
        description: 'Asistentes actualizados',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al actualizar asistentes: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    createWebinar: createWebinar.mutateAsync,
    updateWebinar: updateWebinar.mutateAsync,
    deleteWebinar: deleteWebinar.mutateAsync,
    updateAttendedCount: updateAttendedCount.mutateAsync,
    isCreating: createWebinar.isPending,
    isUpdating: updateWebinar.isPending,
    isDeleting: deleteWebinar.isPending,
  };
}

// Hook for importing registrants from CSV
export function useImportRegistrants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ webinarId, registrants }: { webinarId: string; registrants: Omit<WebinarRegistrant, 'id' | 'created_at'>[] }) => {
      // Insert registrants in batches to avoid timeout
      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < registrants.length; i += batchSize) {
        const batch = registrants.slice(i, i + batchSize);

        const { error } = await supabase
          .from('webinar_registrants')
          .upsert(
            batch.map(r => ({
              ...r,
              webinar_id: webinarId,
            })),
            { onConflict: 'webinar_id,email' }
          );

        if (error) throw error;
        totalInserted += batch.length;
      }

      // Calculate attendance count from CSV data (has_joined_event)
      const attendedCount = registrants.filter(r => r.has_joined_event).length;
      const totalRegistrants = registrants.length;

      // Update webinar with new counts
      const { error: updateError } = await supabase
        .from('webinars')
        .update({
          attended_count: attendedCount,
          total_registrants: totalRegistrants,
        })
        .eq('id', webinarId);

      if (updateError) {
        console.error('Error updating webinar counts:', updateError);
      }

      return { inserted: totalInserted, attendedCount, totalRegistrants };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['webinar', variables.webinarId] });
      queryClient.invalidateQueries({ queryKey: ['webinar-registrants', variables.webinarId] });
      queryClient.invalidateQueries({ queryKey: ['webinars'] });
      queryClient.invalidateQueries({ queryKey: ['repeat-attendees'] });
      queryClient.invalidateQueries({ queryKey: ['all-webinar-registrants'] });
      toast({
        title: 'Éxito',
        description: `${data.inserted} registrados importados (${data.attendedCount} asistieron)`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al importar registrados: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Hook for fetching repeat attendees
export function useRepeatAttendees() {
  return useQuery({
    queryKey: ['repeat-attendees'],
    queryFn: async (): Promise<RepeatAttendee[]> => {
      const { data, error } = await supabase
        .from('repeat_attendees')
        .select('*');

      if (error) {
        console.error('Error fetching repeat attendees:', error);
        throw error;
      }

      return data as RepeatAttendee[];
    },
  });
}

// Hook for fetching ALL registrants across all webinars
export function useAllRegistrants() {
  return useQuery({
    queryKey: ['all-registrants'],
    queryFn: async (): Promise<AllRegistrant[]> => {
      // Get all registrants with webinar info
      const { data: registrants, error } = await supabase
        .from('webinar_registrants')
        .select(`
          id,
          email,
          first_name,
          last_name,
          full_name,
          phone_number,
          company,
          role,
          has_joined_event,
          registered_at,
          webinar_id,
          webinars:webinar_id (
            name,
            event_date
          )
        `)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching all registrants:', error);
        throw error;
      }

      // Count webinars per email
      const emailCounts: Record<string, number> = {};
      registrants?.forEach((r: any) => {
        emailCounts[r.email] = (emailCounts[r.email] || 0) + 1;
      });

      // Transform data
      return (registrants || []).map((r: any) => ({
        id: r.id,
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        full_name: r.full_name,
        phone_number: r.phone_number,
        company: r.company,
        role: r.role,
        has_joined_event: r.has_joined_event,
        registered_at: r.registered_at,
        webinar_id: r.webinar_id,
        webinar_name: r.webinars?.name || 'Webinar',
        webinar_date: r.webinars?.event_date || '',
        webinars_count: emailCounts[r.email] || 1,
      }));
    },
  });
}

// Hook for webinar metrics/analytics
export function useWebinarMetrics() {
  const webinarsQuery = useWebinars();
  const repeatAttendeesQuery = useRepeatAttendees();

  const metrics: WebinarMetrics | null = webinarsQuery.data ? {
    totalWebinars: webinarsQuery.data.length,
    completedWebinars: webinarsQuery.data.filter(w => w.status === 'completed').length,
    plannedWebinars: webinarsQuery.data.filter(w => w.status === 'planned').length,
    totalRegistrants: webinarsQuery.data.reduce((sum, w) => sum + w.total_registrants, 0),
    totalAttendees: webinarsQuery.data.reduce((sum, w) => sum + w.attended_count, 0),
    avgAttendanceRate: webinarsQuery.data.length > 0
      ? webinarsQuery.data
          .filter(w => w.total_registrants > 0)
          .reduce((sum, w) => sum + (w.attended_count / w.total_registrants) * 100, 0) /
        (webinarsQuery.data.filter(w => w.total_registrants > 0).length || 1)
      : 0,
    repeatAttendees: repeatAttendeesQuery.data?.length || 0,
  } : null;

  return {
    metrics,
    webinars: webinarsQuery.data || [],
    repeatAttendees: repeatAttendeesQuery.data || [],
    isLoading: webinarsQuery.isLoading || repeatAttendeesQuery.isLoading,
    error: webinarsQuery.error || repeatAttendeesQuery.error,
  };
}

// Hook for single webinar analytics (from CSV data)
export function useWebinarAnalytics(registrants: WebinarRegistrant[]): WebinarAnalytics {
  const csvAttendees = registrants.filter(r => r.has_joined_event).length;
  const csvAbsent = registrants.filter(r => !r.has_joined_event).length;
  const csvAttendanceRate = registrants.length > 0 ? (csvAttendees / registrants.length) * 100 : 0;

  const registrantsWithPhone = registrants.filter(r => r.phone_number).length;
  const registrantsWithCompany = registrants.filter(r => r.company && r.company.trim() !== '' && r.company !== '.' && r.company.toLowerCase() !== 'na' && r.company.toLowerCase() !== 'n/a').length;
  const registrantsWithRole = registrants.filter(r => r.role && r.role.trim() !== '' && r.role !== '.' && r.role.toLowerCase() !== 'na' && r.role.toLowerCase() !== 'n/a').length;

  // Contact quality: % of registrants with at least phone OR (company AND role)
  const qualityRegistrants = registrants.filter(r =>
    r.phone_number || (r.company && r.role)
  ).length;
  const contactQualityScore = registrants.length > 0 ? (qualityRegistrants / registrants.length) * 100 : 0;

  // Company analysis
  const companyMap = new Map<string, { count: number; attendedCount: number }>();
  registrants.forEach(r => {
    if (r.company && r.company.trim() !== '' && r.company !== '.' && r.company.toLowerCase() !== 'na') {
      const normalized = r.company.trim();
      const existing = companyMap.get(normalized) || { count: 0, attendedCount: 0 };
      existing.count++;
      if (r.has_joined_event) existing.attendedCount++;
      companyMap.set(normalized, existing);
    }
  });
  const topCompanies = Array.from(companyMap.entries())
    .map(([company, data]) => ({ company, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Role analysis
  const roleMap = new Map<string, number>();
  registrants.forEach(r => {
    if (r.role && r.role.trim() !== '' && r.role !== '.' && r.role.toLowerCase() !== 'na') {
      const normalized = r.role.trim().toLowerCase();
      roleMap.set(normalized, (roleMap.get(normalized) || 0) + 1);
    }
  });
  const topRoles = Array.from(roleMap.entries())
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Registration timeline
  const dateMap = new Map<string, number>();
  registrants.forEach(r => {
    const date = r.registered_at.split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });
  const registrationsByDay = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    csvAttendees,
    csvAbsent,
    csvAttendanceRate,
    registrantsWithPhone,
    registrantsWithCompany,
    registrantsWithRole,
    contactQualityScore,
    uniqueCompanies: companyMap.size,
    topCompanies,
    topRoles,
    registrationsByDay,
    conversionFromRegistration: csvAttendanceRate,
  };
}

// Hook for all webinars analytics
export function useAllWebinarsAnalytics() {
  // Fetch all registrants for all webinars
  const allRegistrantsQuery = useQuery({
    queryKey: ['all-webinar-registrants'],
    queryFn: async (): Promise<(WebinarRegistrant & { webinar_name?: string; webinar_date?: string })[]> => {
      const { data, error } = await supabase
        .from('webinar_registrants')
        .select(`
          *,
          webinars (name, event_date)
        `);

      if (error) {
        console.error('Error fetching all registrants:', error);
        throw error;
      }

      return (data || []).map((r: any) => ({
        ...r,
        webinar_name: r.webinars?.name,
        webinar_date: r.webinars?.event_date,
      }));
    },
  });

  const webinarsQuery = useWebinars();
  const repeatAttendeesQuery = useRepeatAttendees();

  const allRegistrants = allRegistrantsQuery.data || [];
  const webinars = webinarsQuery.data || [];
  const repeatAttendees = repeatAttendeesQuery.data || [];

  // Calculate analytics
  const totalRegistrantsAllTime = allRegistrants.length;
  const totalAttendeesFromCSV = allRegistrants.filter(r => r.has_joined_event).length;
  const overallAttendanceRate = totalRegistrantsAllTime > 0
    ? (totalAttendeesFromCSV / totalRegistrantsAllTime) * 100
    : 0;

  // Webinars by month
  const monthMap = new Map<string, { count: number; registrants: number; attendees: number }>();
  webinars.forEach(w => {
    const month = w.event_date.substring(0, 7); // YYYY-MM
    const existing = monthMap.get(month) || { count: 0, registrants: 0, attendees: 0 };
    existing.count++;
    existing.registrants += w.total_registrants;
    existing.attendees += w.attended_count;
    monthMap.set(month, existing);
  });
  const webinarsByMonth = Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Attendance rate trend per webinar
  const attendanceRateTrend = webinars
    .filter(w => w.total_registrants > 0)
    .map(w => ({
      webinarName: w.name.length > 30 ? w.name.substring(0, 30) + '...' : w.name,
      date: w.event_date.split('T')[0],
      rate: w.total_registrants > 0 ? (w.attended_count / w.total_registrants) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Best/worst performing
  const webinarsWithRate = webinars
    .filter(w => w.total_registrants >= 10) // Min 10 registrants for fair comparison
    .map(w => ({
      name: w.name,
      rate: w.total_registrants > 0 ? (w.attended_count / w.total_registrants) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  const bestPerformingWebinar = webinarsWithRate[0] || null;
  const worstPerformingWebinar = webinarsWithRate[webinarsWithRate.length - 1] || null;

  // Company insights across all webinars
  const companyOverall = new Map<string, { totalRegistrations: number; webinarsAttended: Set<string> }>();
  allRegistrants.forEach(r => {
    if (r.company && r.company.trim() !== '' && r.company !== '.' && r.company.toLowerCase() !== 'na') {
      const existing = companyOverall.get(r.company) || { totalRegistrations: 0, webinarsAttended: new Set() };
      existing.totalRegistrations++;
      if (r.has_joined_event) {
        existing.webinarsAttended.add(r.webinar_id);
      }
      companyOverall.set(r.company, existing);
    }
  });
  const topCompaniesOverall = Array.from(companyOverall.entries())
    .map(([company, data]) => ({
      company,
      totalRegistrations: data.totalRegistrations,
      webinarsAttended: data.webinarsAttended.size,
    }))
    .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
    .slice(0, 15);

  // Repeat behavior
  const emailAttendanceCount = new Map<string, number>();
  allRegistrants.forEach(r => {
    if (r.has_joined_event) {
      emailAttendanceCount.set(r.email, (emailAttendanceCount.get(r.email) || 0) + 1);
    }
  });
  const repeatAttendeesCount = Array.from(emailAttendanceCount.values()).filter(c => c > 1).length;
  const singleTimeAttendeesCount = Array.from(emailAttendanceCount.values()).filter(c => c === 1).length;
  const totalUniqueAttendees = emailAttendanceCount.size;
  const repeatRate = totalUniqueAttendees > 0 ? (repeatAttendeesCount / totalUniqueAttendees) * 100 : 0;

  const analytics: AllWebinarsAnalytics = {
    totalRegistrantsAllTime,
    totalAttendeesFromCSV,
    overallAttendanceRate,
    webinarsByMonth,
    attendanceRateTrend,
    avgRegistrantsPerWebinar: webinars.length > 0 ? totalRegistrantsAllTime / webinars.length : 0,
    avgAttendeesPerWebinar: webinars.length > 0 ? totalAttendeesFromCSV / webinars.length : 0,
    bestPerformingWebinar,
    worstPerformingWebinar,
    topCompaniesOverall,
    repeatAttendeesCount,
    singleTimeAttendeesCount,
    repeatRate,
  };

  return {
    analytics,
    isLoading: allRegistrantsQuery.isLoading || webinarsQuery.isLoading || repeatAttendeesQuery.isLoading,
    error: allRegistrantsQuery.error || webinarsQuery.error || repeatAttendeesQuery.error,
  };
}

// Helper function to parse Luma CSV
export function parseLumaCSV(csvContent: string): Omit<WebinarRegistrant, 'id' | 'created_at' | 'webinar_id'>[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  // Find column indices
  const getIndex = (possibleNames: string[]) =>
    headers.findIndex(h => possibleNames.some(name => h.includes(name)));

  const apiIdIdx = getIndex(['api_id']);
  const emailIdx = getIndex(['email']);
  const firstNameIdx = getIndex(['first_name', 'first name']);
  const lastNameIdx = getIndex(['last_name', 'last name']);
  const fullNameIdx = getIndex(['name']);
  const phoneIdx = getIndex(['phone_number', 'phone number', 'phone']);
  const companyIdx = getIndex(['empresa', 'company', '¿para qué empresa trabajas']);
  const roleIdx = getIndex(['cargo', 'role', '¿qué cargo desempeñas']);
  const approvalIdx = getIndex(['approval_status', 'approval status']);
  const joinedIdx = getIndex(['has_joined_event', 'has joined event', 'joined']);
  const createdAtIdx = getIndex(['created_at', 'created at', 'registered']);

  const registrants: Omit<WebinarRegistrant, 'id' | 'created_at' | 'webinar_id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted values with commas)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const getValue = (idx: number) => idx >= 0 && idx < values.length ? values[idx].replace(/"/g, '') || null : null;

    const email = getValue(emailIdx);
    if (!email) continue; // Skip rows without email

    const hasJoined = getValue(joinedIdx);

    registrants.push({
      luma_api_id: getValue(apiIdIdx),
      email,
      first_name: getValue(firstNameIdx),
      last_name: getValue(lastNameIdx),
      full_name: getValue(fullNameIdx),
      phone_number: getValue(phoneIdx),
      company: getValue(companyIdx),
      role: getValue(roleIdx),
      approval_status: getValue(approvalIdx) || 'approved',
      has_joined_event: hasJoined?.toLowerCase() === 'yes' || hasJoined?.toLowerCase() === 'true',
      registered_at: getValue(createdAtIdx) || new Date().toISOString(),
    });
  }

  return registrants;
}
