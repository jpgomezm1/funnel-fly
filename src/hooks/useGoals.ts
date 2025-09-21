import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoalMetrics {
  prospectos: number;
  contactados: number;
  descubrimientos: number;
  demostraciones: number;
  propuestas: number;
  cierres: number;
}

export const useGoals = () => {
  const [weeklyMetrics, setWeeklyMetrics] = useState<GoalMetrics>({
    prospectos: 0,
    contactados: 0,
    descubrimientos: 0,
    demostraciones: 0,
    propuestas: 0,
    cierres: 0,
  });
  
  const [monthlyMetrics, setMonthlyMetrics] = useState<GoalMetrics>({
    prospectos: 0,
    contactados: 0,
    descubrimientos: 0,
    demostraciones: 0,
    propuestas: 0,
    cierres: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Calcular fechas en América/Bogotá
      const now = new Date();
      const nowBogota = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
      
      // Semana actual (lunes a domingo)
      const weekStart = new Date(nowBogota);
      weekStart.setDate(nowBogota.getDate() - nowBogota.getDay() + 1); // Lunes
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      // Mes actual
      const monthStart = new Date(nowBogota.getFullYear(), nowBogota.getMonth(), 1);
      const monthEnd = new Date(nowBogota.getFullYear(), nowBogota.getMonth() + 1, 1);

      // Consultas para métricas semanales
      const weeklyQueries = await Promise.all([
        // Prospectos: leads creados esta semana
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', weekEnd.toISOString()),
        
        // Contactados: entradas a CONTACTADO esta semana
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'CONTACTADO')
          .gte('changed_at', weekStart.toISOString())
          .lt('changed_at', weekEnd.toISOString()),
          
        // Descubrimientos
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'DESCUBRIMIENTO')
          .gte('changed_at', weekStart.toISOString())
          .lt('changed_at', weekEnd.toISOString()),
          
        // Demostraciones
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'DEMOSTRACION')
          .gte('changed_at', weekStart.toISOString())
          .lt('changed_at', weekEnd.toISOString()),
          
        // Propuestas
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'PROPUESTA')
          .gte('changed_at', weekStart.toISOString())
          .lt('changed_at', weekEnd.toISOString()),
          
        // Cierres
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'CERRADO_GANADO')
          .gte('changed_at', weekStart.toISOString())
          .lt('changed_at', weekEnd.toISOString()),
      ]);

      // Consultas para métricas mensuales
      const monthlyQueries = await Promise.all([
        // Prospectos: leads creados este mes
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString()),
        
        // Contactados: entradas a CONTACTADO este mes
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'CONTACTADO')
          .gte('changed_at', monthStart.toISOString())
          .lt('changed_at', monthEnd.toISOString()),
          
        // Descubrimientos
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'DESCUBRIMIENTO')
          .gte('changed_at', monthStart.toISOString())
          .lt('changed_at', monthEnd.toISOString()),
          
        // Demostraciones
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'DEMOSTRACION')
          .gte('changed_at', monthStart.toISOString())
          .lt('changed_at', monthEnd.toISOString()),
          
        // Propuestas
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'PROPUESTA')
          .gte('changed_at', monthStart.toISOString())
          .lt('changed_at', monthEnd.toISOString()),
          
        // Cierres
        supabase
          .from('lead_stage_history')
          .select('id', { count: 'exact' })
          .eq('to_stage', 'CERRADO_GANADO')
          .gte('changed_at', monthStart.toISOString())
          .lt('changed_at', monthEnd.toISOString()),
      ]);

      setWeeklyMetrics({
        prospectos: weeklyQueries[0].count || 0,
        contactados: weeklyQueries[1].count || 0,
        descubrimientos: weeklyQueries[2].count || 0,
        demostraciones: weeklyQueries[3].count || 0,
        propuestas: weeklyQueries[4].count || 0,
        cierres: weeklyQueries[5].count || 0,
      });

      setMonthlyMetrics({
        prospectos: monthlyQueries[0].count || 0,
        contactados: monthlyQueries[1].count || 0,
        descubrimientos: monthlyQueries[2].count || 0,
        demostraciones: monthlyQueries[3].count || 0,
        propuestas: monthlyQueries[4].count || 0,
        cierres: monthlyQueries[5].count || 0,
      });

    } catch (error) {
      console.error('Error fetching goal metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Suscripción en tiempo real para actualizar métricas
    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          fetchMetrics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_stage_history'
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    weeklyMetrics,
    monthlyMetrics,
    loading,
    refetch: fetchMetrics,
  };
};