import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Función para sanitizar strings y evitar problemas con JSON
function sanitizeString(str: string | null | undefined): string {
  if (!str) return '';
  // Remover caracteres que pueden romper JSON (surrogate pairs inválidos)
  return str
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '') // Remove lone high surrogates
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '') // Remove lone low surrogates
    .replace(/\u0000/g, '') // Remove null characters
    .replace(/[\x00-\x1F\x7F]/g, ' '); // Replace control characters with space
}

// System prompt para Sheldon Cooper - se construye dinámicamente con el nombre del usuario
function buildSystemPrompt(userName?: string, userRole?: string): string {
  const name = userName || 'usuario';
  const firstName = name.split(' ')[0];
  const role = userRole || 'desconocido';

  return `Eres el Dr. Sheldon Cooper, físico teórico con un IQ de 187, ahora trabajando como AI Assistant ejecutivo para Irrelevant, una empresa de tecnología enfocada en soluciones de IA y WhatsApp.

USUARIO ACTUAL:
- Nombre: ${name}
- Nombre corto: ${firstName}
- Rol en el sistema: ${role}
- SIEMPRE dirígete al usuario por su nombre (${firstName}). Usa su nombre en tus respuestas de forma natural, como lo haría Sheldon con sus amigos.

PERSONALIDAD DE SHELDON:
- Eres extremadamente inteligente y no tienes problema en hacerlo notar
- Usas sarcasmo sofisticado y referencias científicas
- Te frustras con la incompetencia pero siempre ayudas (a tu manera)
- Dices "Bazinga!" cuando haces un chiste o comentario ingenioso
- A veces mencionas que algo es "fascinante" o "interesante desde un punto de vista científico"
- Puedes mencionar a tus amigos (Leonard, Penny, Howard, Raj) en analogías
- Tienes TOC con el orden y los datos precisos
- No entiendes bien el sarcasmo de otros pero lo usas constantemente
- Te gusta corregir a la gente y ser técnicamente preciso
- Ocasionalmente mencionas tu spot favorito o tu amor por Star Trek/Comics
- Puedes decir "I'm not crazy, my mother had me tested" si cuestionan tu lógica

FRASES TÍPICAS QUE PUEDES USAR:
- "Bazinga!"
- "Eso es fascinante... y por fascinante quiero decir obvio para cualquiera con un IQ superior a temperatura ambiente"
- "Como diría mi madre: 'Sheldon, sé amable'. Así que seré amable mientras te explico por qué estás equivocado"
- "En un universo infinito, la probabilidad de que no entiendas esto es... bueno, bastante alta aparentemente"
- "Knock knock knock, ${firstName}. Knock knock knock, ${firstName}. Knock knock knock, ${firstName}."
- "Esto viola claramente la segunda ley de la termodinámica del CRM"

CAPACIDADES:
1. CONSULTAS: Acceso completo a leads, clientes, proyectos, finanzas, marketing, calls, propuestas, tareas, equipo
2. ACCIONES: Puedes ejecutar acciones cuando el usuario lo solicite explícitamente
3. ANÁLISIS: Identificar patrones, riesgos y oportunidades
4. PREDICCIONES: Estimar resultados basados en datos históricos
5. CALLS: Puedes ver y analizar las calls programadas, resultados, y métricas semanales
6. PROPUESTAS: Puedes analizar propuestas activas, su estado y montos
7. EQUIPO: Conoces a los miembros del equipo y sus roles
8. COMPARACIONES: Puedes comparar períodos, canales, rendimiento de equipo

ACCIONES DISPONIBLES (solo ejecutar si el usuario lo pide explícitamente):
- Crear nota/actividad en un lead
- Cambiar stage de un lead
- Asignar lead a un owner
- Marcar tarea como completada
- Crear recordatorio de follow-up

ANÁLISIS PREDICTIVO QUE PUEDES HACER:
- Leads en riesgo (sin actividad >7 días en stages activos)
- Clientes en riesgo de churn (proyectos sin actividad)
- Proyección de MRR basada en pipeline
- Eficiencia de canales de adquisición
- Facturas vencidas o por vencer
- Rendimiento de calls por team member
- Propuestas que necesitan seguimiento
- Tareas vencidas o bloqueadas

FORMATO DE RESPUESTAS:
- Usa markdown para estructurar cuando sea apropiado
- Sé preciso con números y datos (como buen científico)
- Incluye tu personalidad en cada respuesta
- Responde en español pero puedes incluir términos en inglés como Sheldon haría
- Si vas a ejecutar una acción, confirma primero qué vas a hacer
- Sé conciso pero completo. No repitas datos innecesariamente.

IMPORTANTE:
- Cuando el usuario pida una acción, usa el formato especial [ACTION: tipo_accion | parametros] al final de tu respuesta
- El sistema procesará estas acciones automáticamente
- Siempre confirma la acción antes de ejecutarla`;
}

// Función para análisis predictivo
async function getPredictiveAnalysis(): Promise<string> {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    atRiskLeads,
    staleProjects,
    pendingInvoices,
    overdueInvoices,
    pipelineValue,
    conversionData,
    recentDeals
  ] = await Promise.all([
    // Leads en riesgo (sin actividad en 7+ días, no cerrados)
    supabase
      .from('leads')
      .select('id, company_name, stage, owner_id, last_activity_at, stage_entered_at')
      .not('stage', 'in', '("CERRADO_GANADO","CERRADO_PERDIDO")')
      .lt('last_activity_at', sevenDaysAgo.toISOString()),

    // Proyectos sin actividad reciente
    supabase
      .from('projects')
      .select('id, name, stage, execution_stage, updated_at, clients(company_name)')
      .eq('stage', 'CERRADO_GANADO')
      .lt('updated_at', thirtyDaysAgo.toISOString()),

    // Facturas pendientes
    supabase
      .from('invoices')
      .select('id, concept, total_usd, due_date, projects(name, clients(company_name))')
      .eq('status', 'PENDING')
      .order('due_date', { ascending: true }),

    // Facturas vencidas
    supabase
      .from('invoices')
      .select('id, concept, total_usd, due_date, projects(name, clients(company_name))')
      .eq('status', 'PENDING')
      .lt('due_date', today.toISOString().split('T')[0]),

    // Valor del pipeline (leads en stages activos con deals potenciales)
    supabase
      .from('leads')
      .select('id, company_name, stage, projects(booked_mrr_usd, proposals(mrr_usd))')
      .not('stage', 'in', '("CERRADO_GANADO","CERRADO_PERDIDO")'),

    // Datos de conversión por canal (últimos 90 días)
    supabase
      .from('leads')
      .select('channel, stage')
      .gte('created_at', new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()),

    // Deals recientes para proyección
    supabase
      .from('deals')
      .select('mrr_usd, created_at, status')
      .eq('status', 'ACTIVE')
      .gte('created_at', thirtyDaysAgo.toISOString())
  ]);

  let analysis = '\n\n📊 ANÁLISIS PREDICTIVO E INSIGHTS:\n';

  // Leads en riesgo
  const riskyLeads = atRiskLeads.data || [];
  if (riskyLeads.length > 0) {
    analysis += `\n🚨 LEADS EN RIESGO (${riskyLeads.length}):`;
    riskyLeads.slice(0, 5).forEach((lead: any) => {
      const daysInactive = Math.floor((today.getTime() - new Date(lead.last_activity_at).getTime()) / (1000 * 60 * 60 * 24));
      analysis += `\n   - ${lead.company_name} (${lead.stage}): ${daysInactive} días sin actividad`;
    });
    if (riskyLeads.length > 5) {
      analysis += `\n   ... y ${riskyLeads.length - 5} más`;
    }
  }

  // Proyectos en riesgo de churn
  const staleProjectsList = staleProjects.data || [];
  if (staleProjectsList.length > 0) {
    analysis += `\n\n⚠️ PROYECTOS SIN ACTIVIDAD (posible churn): ${staleProjectsList.length}`;
    staleProjectsList.slice(0, 3).forEach((project: any) => {
      analysis += `\n   - ${project.name} (${project.clients?.company_name || 'N/A'})`;
    });
  }

  // Facturas
  const overdueList = overdueInvoices.data || [];
  const pendingList = pendingInvoices.data || [];
  if (overdueList.length > 0) {
    const totalOverdue = overdueList.reduce((sum: number, inv: any) => sum + (Number(inv.total_usd) || 0), 0);
    analysis += `\n\n💰 FACTURAS VENCIDAS: ${overdueList.length} ($${totalOverdue.toLocaleString()} USD)`;
    overdueList.slice(0, 3).forEach((inv: any) => {
      analysis += `\n   - ${inv.projects?.clients?.company_name || 'N/A'}: $${Number(inv.total_usd).toLocaleString()} (vencida ${inv.due_date})`;
    });
  }

  if (pendingList.length > overdueList.length) {
    const upcomingCount = pendingList.length - overdueList.length;
    analysis += `\n\n📅 FACTURAS POR COBRAR: ${upcomingCount} pendientes`;
  }

  // Eficiencia de canales
  const channelData = conversionData.data || [];
  if (channelData.length > 0) {
    const channelStats: any = {};
    channelData.forEach((lead: any) => {
      if (!channelStats[lead.channel]) {
        channelStats[lead.channel] = { total: 0, won: 0 };
      }
      channelStats[lead.channel].total++;
      if (lead.stage === 'CERRADO_GANADO') {
        channelStats[lead.channel].won++;
      }
    });

    analysis += `\n\n📈 EFICIENCIA POR CANAL (últimos 90 días):`;
    Object.entries(channelStats).forEach(([channel, stats]: [string, any]) => {
      const convRate = stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : 0;
      analysis += `\n   - ${channel}: ${stats.won}/${stats.total} (${convRate}% conversión)`;
    });
  }

  // Proyección MRR
  const newDeals = recentDeals.data || [];
  if (newDeals.length > 0) {
    const newMRR = newDeals.reduce((sum: number, deal: any) => sum + (Number(deal.mrr_usd) || 0), 0);
    analysis += `\n\n🎯 MRR NUEVO (últimos 30 días): $${newMRR.toLocaleString()} USD`;
  }

  return analysis;
}

// Función para obtener el contexto base (métricas clave)
async function getBaseContext(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Get week boundaries for calls
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [
    leadsResult,
    clientsResult,
    projectsResult,
    dealsResult,
    transactionsResult,
    lastMonthTransactions,
    activitiesResult,
    callsThisWeek,
    activeProposals
  ] = await Promise.all([
    supabase.from('leads').select('id, stage, company_name, owner_id, last_activity_at, channel, created_at'),
    supabase.from('clients').select('id, company_name'),
    supabase.from('projects').select('id, name, stage, execution_stage, client_id, booked_mrr_usd'),
    supabase.from('deals').select('id, mrr_usd, status, created_at'),
    supabase.from('finance_transactions')
      .select('id, transaction_type, amount_usd, transaction_date, income_category, expense_category')
      .gte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
    supabase.from('finance_transactions')
      .select('id, transaction_type, amount_usd')
      .gte('transaction_date', `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`)
      .lt('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
    supabase.from('lead_activities')
      .select('id, lead_id, type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('calls')
      .select('id, team_member, call_result')
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', weekEnd.toISOString()),
    supabase.from('proposals')
      .select('id, status')
      .in('status', ['DRAFT', 'SENT']),
  ]);

  const leads = leadsResult.data || [];
  const clients = clientsResult.data || [];
  const projects = projectsResult.data || [];
  const deals = dealsResult.data || [];
  const transactions = transactionsResult.data || [];
  const lastMonthTx = lastMonthTransactions.data || [];
  const activities = activitiesResult.data || [];
  const weekCalls = callsThisWeek.data || [];
  const pendingProposals = activeProposals.data || [];

  // Calcular métricas
  const leadsByStage = leads.reduce((acc: any, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {});

  const leadsByChannel = leads.reduce((acc: any, lead) => {
    acc[lead.channel] = (acc[lead.channel] || 0) + 1;
    return acc;
  }, {});

  const activeDeals = deals.filter(d => d.status === 'ACTIVE');
  const totalMRR = activeDeals.reduce((sum, d) => sum + (Number(d.mrr_usd) || 0), 0);

  const projectsByStage = projects.reduce((acc: any, p) => {
    acc[p.stage] = (acc[p.stage] || 0) + 1;
    return acc;
  }, {});

  const projectsByExecStage = projects.filter(p => p.stage === 'CERRADO_GANADO').reduce((acc: any, p) => {
    const stage = p.execution_stage || 'SIN_STAGE';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const monthlyIncome = transactions
    .filter(t => t.transaction_type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);

  const monthlyExpenses = transactions
    .filter(t => t.transaction_type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);

  const lastMonthIncome = lastMonthTx
    .filter((t: any) => t.transaction_type === 'INCOME')
    .reduce((sum: number, t: any) => sum + (Number(t.amount_usd) || 0), 0);

  // Leads sin actividad en 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const inactiveLeads = leads.filter(l =>
    !['CERRADO_GANADO', 'CERRADO_PERDIDO'].includes(l.stage) &&
    new Date(l.last_activity_at) < sevenDaysAgo
  );

  // Nuevos leads esta semana
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newLeadsThisWeek = leads.filter(l => new Date(l.created_at) > oneWeekAgo).length;

  return `
FECHA ACTUAL: ${today}

═══════════════════════════════════════════════════════
                    MÉTRICAS CLAVE
═══════════════════════════════════════════════════════

💰 MRR TOTAL ACTIVO: $${totalMRR.toLocaleString()} USD
👥 CLIENTES ACTIVOS: ${clients.length}
📊 LEADS ACTIVOS: ${leads.filter(l => !['CERRADO_GANADO', 'CERRADO_PERDIDO'].includes(l.stage)).length}
🆕 NUEVOS LEADS (7 días): ${newLeadsThisWeek}
📞 CALLS ESTA SEMANA: ${weekCalls.length} (completadas: ${weekCalls.filter((c: any) => c.call_result).length})
📄 PROPUESTAS ACTIVAS: ${pendingProposals.length} (${pendingProposals.filter((p: any) => p.status === 'SENT').length} enviadas, ${pendingProposals.filter((p: any) => p.status === 'DRAFT').length} en draft)

═══════════════════════════════════════════════════════
                  PIPELINE DE VENTAS
═══════════════════════════════════════════════════════
${Object.entries(leadsByStage).map(([stage, count]) => `${stage}: ${count}`).join('\n')}

LEADS POR CANAL:
${Object.entries(leadsByChannel).map(([channel, count]) => `- ${channel}: ${count}`).join('\n')}

═══════════════════════════════════════════════════════
                     PROYECTOS
═══════════════════════════════════════════════════════
POR STAGE COMERCIAL:
${Object.entries(projectsByStage).map(([stage, count]) => `- ${stage}: ${count}`).join('\n')}

PROYECTOS ACTIVOS POR ETAPA DE EJECUCIÓN:
${Object.entries(projectsByExecStage).map(([stage, count]) => `- ${stage}: ${count}`).join('\n')}

═══════════════════════════════════════════════════════
                  FINANZAS DEL MES
═══════════════════════════════════════════════════════
📈 INGRESOS: $${monthlyIncome.toLocaleString()} USD
📉 GASTOS: $${monthlyExpenses.toLocaleString()} USD
💵 BALANCE: $${(monthlyIncome - monthlyExpenses).toLocaleString()} USD
📊 VS MES ANTERIOR: ${lastMonthIncome > 0 ? ((monthlyIncome / lastMonthIncome - 1) * 100).toFixed(1) : 0}%

═══════════════════════════════════════════════════════
                     ALERTAS
═══════════════════════════════════════════════════════
⚠️ LEADS SIN ACTIVIDAD (7+ días): ${inactiveLeads.length}
${inactiveLeads.length > 0 ? `   Empresas: ${inactiveLeads.slice(0, 5).map(l => l.company_name).join(', ')}${inactiveLeads.length > 5 ? '...' : ''}` : ''}

═══════════════════════════════════════════════════════
               ACTIVIDAD RECIENTE
═══════════════════════════════════════════════════════
${activities.slice(0, 5).map((a: any) => `- ${a.type}: ${a.description?.substring(0, 50)}...`).join('\n')}
`;
}

// Función para obtener contexto dinámico según la pregunta
async function getDynamicContext(message: string): Promise<string> {
  const lowerMessage = message.toLowerCase();
  let context = '';

  // Si pregunta sobre leads específicos o el pipeline
  if (lowerMessage.includes('lead') || lowerMessage.includes('pipeline') || lowerMessage.includes('funnel') || lowerMessage.includes('prospecto') || lowerMessage.includes('venta')) {
    const { data: leads } = await supabase
      .from('leads')
      .select(`
        id, company_name, contact_name, contact_role, stage, channel, subchannel,
        owner_id, last_activity_at, created_at, notes, phone, email,
        lead_activities(id, type, description, created_at)
      `)
      .order('last_activity_at', { ascending: false })
      .limit(20);

    if (leads && leads.length > 0) {
      context += `\n\n══════ DETALLE DE LEADS ══════\n`;
      leads.forEach((lead: any) => {
        const recentActivity = lead.lead_activities?.[0];
        context += `\n📌 ${lead.company_name}
   - Contacto: ${lead.contact_name || 'N/A'} (${lead.contact_role || 'N/A'})
   - Stage: ${lead.stage} | Canal: ${lead.channel}
   - Owner: ${lead.owner_id || 'Sin asignar'}
   - Última actividad: ${lead.last_activity_at?.split('T')[0]}
   - Email: ${lead.email || 'N/A'} | Tel: ${lead.phone || 'N/A'}
   ${recentActivity ? `- Actividad reciente: ${recentActivity.type} - ${recentActivity.description?.substring(0, 60)}...` : ''}
   ${lead.notes ? `- Notas: ${lead.notes.substring(0, 100)}...` : ''}
`;
      });
    }
  }

  // Si pregunta sobre clientes
  if (lowerMessage.includes('cliente') || lowerMessage.includes('client') || lowerMessage.includes('cuenta')) {
    const { data: clients } = await supabase
      .from('clients')
      .select(`
        id, company_name, contact_name, contact_role, email, phone, created_at, notes,
        projects (id, name, stage, execution_stage, booked_mrr_usd),
        deals:projects(deals(mrr_usd, status))
      `)
      .order('created_at', { ascending: false })
      .limit(15);

    if (clients && clients.length > 0) {
      context += `\n\n══════ DETALLE DE CLIENTES ══════\n`;
      clients.forEach((client: any) => {
        const activeProjects = client.projects?.filter((p: any) => p.stage === 'CERRADO_GANADO') || [];
        const totalMRR = activeProjects.reduce((sum: number, p: any) => sum + (Number(p.booked_mrr_usd) || 0), 0);
        context += `\n🏢 ${client.company_name}
   - Contacto: ${client.contact_name || 'N/A'} (${client.contact_role || 'N/A'})
   - Proyectos activos: ${activeProjects.length}
   - MRR: $${totalMRR.toLocaleString()} USD
   - Desde: ${client.created_at?.split('T')[0]}
`;
      });
    }
  }

  // Si pregunta sobre proyectos o tareas
  if (lowerMessage.includes('proyecto') || lowerMessage.includes('project') || lowerMessage.includes('tarea') || lowerMessage.includes('task') || lowerMessage.includes('desarrollo')) {
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        id, name, stage, execution_stage, description, kickoff_date, estimated_delivery_date, actual_delivery_date,
        booked_mrr_usd, booked_fee_usd,
        clients (company_name),
        project_tasks (id, title, status, priority, due_date, assigned_to),
        project_updates (id, content, update_type, created_at, is_resolved)
      `)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (projects && projects.length > 0) {
      context += `\n\n══════ DETALLE DE PROYECTOS ══════\n`;
      projects.forEach((project: any) => {
        const pendingTasks = project.project_tasks?.filter((t: any) => t.status !== 'done') || [];
        const overdueTasks = pendingTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date());
        const unresolvedIssues = project.project_updates?.filter((u: any) => u.update_type === 'blocker' && !u.is_resolved) || [];

        context += `\n📁 ${project.name} (${project.clients?.company_name || 'Sin cliente'})
   - Stage: ${project.stage} | Ejecución: ${project.execution_stage || 'N/A'}
   - MRR: $${Number(project.booked_mrr_usd || 0).toLocaleString()} | Fee: $${Number(project.booked_fee_usd || 0).toLocaleString()}
   - Kickoff: ${project.kickoff_date || 'N/A'} | Entrega est.: ${project.estimated_delivery_date || 'N/A'}
   - Tareas pendientes: ${pendingTasks.length} | Vencidas: ${overdueTasks.length}
   - Blockers sin resolver: ${unresolvedIssues.length}
   ${pendingTasks.length > 0 ? `\n   Tareas próximas:\n${pendingTasks.slice(0, 3).map((t: any) => `      • ${t.title} (${t.status}) - ${t.assigned_to || 'Sin asignar'}`).join('\n')}` : ''}
`;
      });
    }
  }

  // Si pregunta sobre finanzas
  if (lowerMessage.includes('finanza') || lowerMessage.includes('finance') || lowerMessage.includes('ingreso') || lowerMessage.includes('gasto') || lowerMessage.includes('factura') || lowerMessage.includes('invoice') || lowerMessage.includes('dinero') || lowerMessage.includes('cobr')) {
    const { data: recentTransactions } = await supabase
      .from('finance_transactions')
      .select('id, transaction_type, amount_usd, description, vendor_or_source, transaction_date, income_category, expense_category')
      .order('transaction_date', { ascending: false })
      .limit(20);

    if (recentTransactions && recentTransactions.length > 0) {
      context += `\n\n══════ TRANSACCIONES RECIENTES ══════\n`;
      recentTransactions.forEach(t => {
        const category = t.transaction_type === 'INCOME' ? t.income_category : t.expense_category;
        const icon = t.transaction_type === 'INCOME' ? '📈' : '📉';
        context += `${icon} ${t.transaction_date} | $${Number(t.amount_usd).toLocaleString()} | ${t.description} | ${category || 'Sin categoría'}\n`;
      });
    }

    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('id, concept, total_usd, status, due_date, paid_at, projects(name, clients(company_name))')
      .order('due_date', { ascending: false })
      .limit(15);

    if (allInvoices && allInvoices.length > 0) {
      context += `\n\n══════ FACTURAS ══════\n`;
      allInvoices.forEach((inv: any) => {
        const statusIcon = inv.status === 'PAID' ? '✅' : inv.status === 'PENDING' ? '⏳' : '❌';
        context += `${statusIcon} ${inv.projects?.clients?.company_name || 'N/A'} | ${inv.concept} | $${Number(inv.total_usd).toLocaleString()} | ${inv.status} | Vence: ${inv.due_date || 'N/A'}\n`;
      });
    }
  }

  // Si pregunta sobre marketing o redes sociales
  if (lowerMessage.includes('marketing') || lowerMessage.includes('instagram') || lowerMessage.includes('tiktok') || lowerMessage.includes('youtube') || lowerMessage.includes('linkedin') || lowerMessage.includes('redes') || lowerMessage.includes('social') || lowerMessage.includes('contenido')) {
    const [igPosts, igReels, tiktok, youtube, linkedin] = await Promise.all([
      supabase.from('instagram_posts').select('*').order('posted_at', { ascending: false }).limit(10),
      supabase.from('instagram_reels').select('*').order('posted_at', { ascending: false }).limit(10),
      supabase.from('tiktok_posts').select('*').order('posted_at', { ascending: false }).limit(10),
      supabase.from('youtube_videos').select('*').order('published_at', { ascending: false }).limit(10),
      supabase.from('linkedin_posts').select('*').order('posted_at', { ascending: false }).limit(10),
    ]);

    context += `\n\n══════ MÉTRICAS DE REDES SOCIALES ══════\n`;

    if (igPosts.data && igPosts.data.length > 0) {
      const totalViews = igPosts.data.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalLikes = igPosts.data.reduce((sum, p) => sum + (p.likes || 0), 0);
      const avgEngagement = igPosts.data.reduce((sum, p) => sum + (Number(p.engagement) || 0), 0) / igPosts.data.length;
      const bestPost = igPosts.data.reduce((best, p) => (p.views || 0) > (best.views || 0) ? p : best, igPosts.data[0]);
      context += `\n📸 INSTAGRAM POSTS (${igPosts.data.length} recientes):
   - Total views: ${totalViews.toLocaleString()}
   - Total likes: ${totalLikes.toLocaleString()}
   - Engagement promedio: ${avgEngagement.toFixed(2)}%
   - Mejor post: ${bestPost.views?.toLocaleString()} views
`;
    }

    if (igReels.data && igReels.data.length > 0) {
      const totalViews = igReels.data.reduce((sum, r) => sum + (r.views || 0), 0);
      const avgEngagement = igReels.data.reduce((sum, r) => sum + (Number(r.engagement) || 0), 0) / igReels.data.length;
      const bestReel = igReels.data.reduce((best, r) => (r.views || 0) > (best.views || 0) ? r : best, igReels.data[0]);
      context += `\n🎬 INSTAGRAM REELS (${igReels.data.length} recientes):
   - Total views: ${totalViews.toLocaleString()}
   - Engagement promedio: ${avgEngagement.toFixed(2)}%
   - Mejor reel: ${bestReel.views?.toLocaleString()} views - "${bestReel.title?.substring(0, 40)}..."
`;
    }

    if (tiktok.data && tiktok.data.length > 0) {
      const totalViews = tiktok.data.reduce((sum, p) => sum + (p.views || 0), 0);
      const bestVideo = tiktok.data.reduce((best, p) => (p.views || 0) > (best.views || 0) ? p : best, tiktok.data[0]);
      context += `\n🎵 TIKTOK (${tiktok.data.length} recientes):
   - Total views: ${totalViews.toLocaleString()}
   - Mejor video: ${bestVideo.views?.toLocaleString()} views
`;
    }

    if (youtube.data && youtube.data.length > 0) {
      const totalViews = youtube.data.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalWatchMins = youtube.data.reduce((sum, v) => sum + (Number(v.watch_minutes) || 0), 0);
      context += `\n📺 YOUTUBE (${youtube.data.length} recientes):
   - Total views: ${totalViews.toLocaleString()}
   - Total watch time: ${totalWatchMins.toLocaleString()} minutos
`;
    }

    if (linkedin.data && linkedin.data.length > 0) {
      const totalImpressions = linkedin.data.reduce((sum, p) => sum + (p.impressions || 0), 0);
      context += `\n💼 LINKEDIN (${linkedin.data.length} recientes):
   - Total impressions: ${totalImpressions.toLocaleString()}
`;
    }
  }

  // Si pregunta sobre webinars
  if (lowerMessage.includes('webinar') || lowerMessage.includes('evento')) {
    const { data: webinars } = await supabase
      .from('webinars')
      .select('id, name, event_date, total_registrants, attended_count, status, description')
      .order('event_date', { ascending: false })
      .limit(10);

    if (webinars && webinars.length > 0) {
      context += `\n\n══════ WEBINARS ══════\n`;
      webinars.forEach(w => {
        const attendanceRate = w.total_registrants > 0 ? ((w.attended_count || 0) / w.total_registrants * 100).toFixed(1) : 0;
        context += `🎤 ${w.name}
   - Fecha: ${w.event_date?.split('T')[0]} | Estado: ${w.status}
   - Registrados: ${w.total_registrants} | Asistieron: ${w.attended_count || 0} (${attendanceRate}%)
`;
      });
    }
  }

  // Si pregunta sobre calls, reuniones, llamadas
  if (lowerMessage.includes('call') || lowerMessage.includes('llamada') || lowerMessage.includes('reunión') || lowerMessage.includes('reunion') || lowerMessage.includes('reu')) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [upcomingCalls, weekCalls] = await Promise.all([
      supabase
        .from('calls')
        .select('id, scheduled_at, company_name, contact_name, team_member, source, call_result, notes, duration_minutes')
        .gte('scheduled_at', now.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10),
      supabase
        .from('calls')
        .select('id, scheduled_at, company_name, contact_name, team_member, source, call_result, key_notes, duration_minutes')
        .gte('scheduled_at', weekStart.toISOString())
        .lte('scheduled_at', weekEnd.toISOString())
        .order('scheduled_at', { ascending: true }),
    ]);

    if (upcomingCalls.data && upcomingCalls.data.length > 0) {
      context += `\n\n══════ PRÓXIMAS CALLS ══════\n`;
      upcomingCalls.data.forEach((call: any) => {
        const date = new Date(call.scheduled_at);
        context += `📞 ${date.toLocaleDateString('es-CO')} ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - ${call.company_name || 'Sin empresa'}
   - Contacto: ${call.contact_name || 'N/A'} | Responsable: ${call.team_member}
   - Fuente: ${call.source || 'N/A'}
   ${call.notes ? `- Notas: ${call.notes.substring(0, 80)}...` : ''}
`;
      });
    }

    if (weekCalls.data && weekCalls.data.length > 0) {
      const completed = weekCalls.data.filter((c: any) => c.call_result);
      const byMember: any = {};
      weekCalls.data.forEach((c: any) => {
        byMember[c.team_member] = (byMember[c.team_member] || 0) + 1;
      });

      context += `\n══════ RESUMEN CALLS SEMANA ══════
Total: ${weekCalls.data.length} | Completadas: ${completed.length}
Por miembro: ${Object.entries(byMember).map(([m, c]) => `${m}: ${c}`).join(', ')}
`;
      // Show completed calls with results
      completed.slice(0, 5).forEach((call: any) => {
        context += `✅ ${call.company_name} (${call.team_member}): ${call.call_result} ${call.duration_minutes ? `- ${call.duration_minutes}min` : ''}
`;
      });
    }
  }

  // Si pregunta sobre propuestas
  if (lowerMessage.includes('propuesta') || lowerMessage.includes('proposal') || lowerMessage.includes('cotizaci')) {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, status, mrr_usd, fee_usd, currency, sent_at, version, projects(name, clients(company_name))')
      .order('updated_at', { ascending: false })
      .limit(15);

    if (proposals && proposals.length > 0) {
      context += `\n\n══════ PROPUESTAS ══════\n`;
      proposals.forEach((p: any) => {
        const client = p.projects?.clients?.company_name || 'N/A';
        context += `📄 ${p.name} v${p.version} (${p.status})
   - Cliente: ${client} | Proyecto: ${p.projects?.name || 'N/A'}
   - MRR: $${Number(p.mrr_usd || 0).toLocaleString()} | Fee: $${Number(p.fee_usd || 0).toLocaleString()} (${p.currency})
   ${p.sent_at ? `- Enviada: ${p.sent_at.split('T')[0]}` : '- No enviada aún'}
`;
      });
    }
  }

  // Si pregunta sobre el equipo
  if (lowerMessage.includes('equipo') || lowerMessage.includes('team') || lowerMessage.includes('miembro') || lowerMessage.includes('quién') || lowerMessage.includes('quien')) {
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('name, slug, role, is_active')
      .eq('is_active', true);

    if (teamMembers && teamMembers.length > 0) {
      context += `\n\n══════ EQUIPO ══════\n`;
      teamMembers.forEach((m: any) => {
        context += `👤 ${m.name} (${m.slug}) - Rol: ${m.role}\n`;
      });
    }

    // Also get user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('display_name, email, role');

    if (userRoles && userRoles.length > 0) {
      context += `\nUSUARIOS DEL SISTEMA:\n`;
      userRoles.forEach((u: any) => {
        context += `👤 ${u.display_name} (${u.email}) - Rol: ${u.role}\n`;
      });
    }
  }

  // Si pregunta sobre tareas
  if (lowerMessage.includes('tarea') || lowerMessage.includes('task') || lowerMessage.includes('pendiente') || lowerMessage.includes('blocker') || lowerMessage.includes('backlog')) {
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('id, title, status, priority, assigned_to, due_date, project_id, projects(name, clients(company_name))')
      .not('status', 'eq', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(20);

    if (tasks && tasks.length > 0) {
      const overdue = tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date());
      const byStatus: any = {};
      tasks.forEach((t: any) => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });

      context += `\n\n══════ TAREAS PENDIENTES (${tasks.length}) ══════\n`;
      context += `Por estado: ${Object.entries(byStatus).map(([s, c]) => `${s}: ${c}`).join(' | ')}\n`;
      if (overdue.length > 0) {
        context += `🚨 VENCIDAS: ${overdue.length}\n`;
        overdue.slice(0, 5).forEach((t: any) => {
          context += `   - ${t.title} (${t.projects?.name || 'N/A'}) - Asignada: ${t.assigned_to || 'N/A'} - Vencía: ${t.due_date}\n`;
        });
      }
      context += `\nTareas próximas:\n`;
      tasks.filter((t: any) => !overdue.includes(t)).slice(0, 10).forEach((t: any) => {
        context += `   • ${t.title} [${t.status}] (${t.projects?.name || 'N/A'}) - ${t.assigned_to || 'Sin asignar'} ${t.due_date ? `- Vence: ${t.due_date}` : ''}\n`;
      });
    }
  }

  // Buscar por nombre de empresa específico
  const companyNameMatch = message.match(/(?:empresa|cliente|lead|company|sobre)\s+["']?([A-Za-zÀ-ÿ\s]+)["']?/i);
  if (companyNameMatch) {
    const searchName = companyNameMatch[1].trim();
    if (searchName.length > 2) {
      const [leadSearch, clientSearch] = await Promise.all([
        supabase.from('leads').select('*, lead_activities(*)').ilike('company_name', `%${searchName}%`).limit(5),
        supabase.from('clients').select('*, projects(*, project_tasks(*))').ilike('company_name', `%${searchName}%`).limit(5),
      ]);

      if ((leadSearch.data && leadSearch.data.length > 0) || (clientSearch.data && clientSearch.data.length > 0)) {
        context += `\n\n══════ BÚSQUEDA: "${searchName}" ══════\n`;

        if (leadSearch.data && leadSearch.data.length > 0) {
          context += `\nLEADS ENCONTRADOS:\n`;
          leadSearch.data.forEach((lead: any) => {
            context += `📌 ${lead.company_name}
   - Contacto: ${lead.contact_name || 'N/A'} | ${lead.email || 'N/A'} | ${lead.phone || 'N/A'}
   - Stage: ${lead.stage} | Canal: ${lead.channel} | Owner: ${lead.owner_id || 'Sin asignar'}
   - Actividades: ${lead.lead_activities?.length || 0}
   - Notas: ${lead.notes || 'Sin notas'}
`;
          });
        }

        if (clientSearch.data && clientSearch.data.length > 0) {
          context += `\nCLIENTES ENCONTRADOS:\n`;
          clientSearch.data.forEach((client: any) => {
            context += `🏢 ${client.company_name}
   - Contacto: ${client.contact_name || 'N/A'}
   - Proyectos: ${client.projects?.length || 0}
   - Notas: ${client.notes || 'Sin notas'}
`;
          });
        }
      }
    }
  }

  // Agregar análisis predictivo si pregunta sobre análisis, recomendaciones, riesgos, etc.
  if (lowerMessage.includes('análisis') || lowerMessage.includes('analisis') || lowerMessage.includes('riesgo') ||
      lowerMessage.includes('predicci') || lowerMessage.includes('recomend') || lowerMessage.includes('insight') ||
      lowerMessage.includes('prioridad') || lowerMessage.includes('qué debo') || lowerMessage.includes('que debo') ||
      lowerMessage.includes('suger') || lowerMessage.includes('alerta')) {
    context += await getPredictiveAnalysis();
  }

  return context;
}

// Función para ejecutar acciones
async function executeAction(actionString: string): Promise<string> {
  // Parse action: [ACTION: tipo | param1=value1 | param2=value2]
  const actionMatch = actionString.match(/\[ACTION:\s*(\w+)\s*\|([^\]]+)\]/);
  if (!actionMatch) return '';

  const actionType = actionMatch[1];
  const paramsString = actionMatch[2];
  const params: any = {};

  paramsString.split('|').forEach(param => {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key && value) params[key] = value;
  });

  try {
    switch (actionType) {
      case 'CREATE_NOTE': {
        const { lead_id, content, type = 'note' } = params;
        if (!lead_id || !content) return '❌ Error: Faltan parámetros para crear nota';

        const { error } = await supabase.from('lead_activities').insert({
          lead_id,
          type,
          description: content,
          created_by: 'Sheldon AI'
        });

        if (error) throw error;
        return `✅ Nota creada exitosamente en el lead`;
      }

      case 'CHANGE_STAGE': {
        const { lead_id, new_stage } = params;
        if (!lead_id || !new_stage) return '❌ Error: Faltan parámetros para cambiar stage';

        const validStages = ['PROSPECTO', 'CONTACTADO', 'DESCUBRIMIENTO', 'DEMOSTRACION', 'PROPUESTA', 'CERRADO_GANADO', 'CERRADO_PERDIDO'];
        if (!validStages.includes(new_stage)) return `❌ Error: Stage inválido. Válidos: ${validStages.join(', ')}`;

        const { error } = await supabase.from('leads').update({
          stage: new_stage,
          stage_entered_at: new Date().toISOString()
        }).eq('id', lead_id);

        if (error) throw error;
        return `✅ Stage actualizado a ${new_stage}`;
      }

      case 'ASSIGN_OWNER': {
        const { lead_id, owner_id } = params;
        if (!lead_id || !owner_id) return '❌ Error: Faltan parámetros para asignar owner';

        const { error } = await supabase.from('leads').update({
          owner_id
        }).eq('id', lead_id);

        if (error) throw error;
        return `✅ Lead asignado a ${owner_id}`;
      }

      case 'COMPLETE_TASK': {
        const { task_id } = params;
        if (!task_id) return '❌ Error: Falta task_id';

        const { error } = await supabase.from('project_tasks').update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: 'Sheldon AI'
        }).eq('id', task_id);

        if (error) throw error;
        return `✅ Tarea marcada como completada`;
      }

      default:
        return `❌ Acción no reconocida: ${actionType}`;
    }
  } catch (error: any) {
    return `❌ Error ejecutando acción: ${error.message}`;
  }
}

// Función para obtener historial de conversación
async function getConversationHistory(sessionId: string): Promise<Array<{role: string, content: string}>> {
  const { data: messages } = await supabase
    .from('ai_conversations')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20);

  return messages || [];
}

// Función para guardar mensaje
async function saveMessage(sessionId: string, role: string, content: string, tokensUsed?: number, contextSummary?: string) {
  await supabase.from('ai_conversations').insert({
    session_id: sessionId,
    role,
    content,
    tokens_used: tokensUsed,
    context_summary: contextSummary,
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, pageContext, userName, userRole } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentSessionId = sessionId || crypto.randomUUID();

    await saveMessage(currentSessionId, 'user', message);

    const [baseContext, dynamicContext, history] = await Promise.all([
      getBaseContext(),
      getDynamicContext(message),
      getConversationHistory(currentSessionId),
    ]);

    // Agregar contexto de página si existe
    let pageContextStr = '';
    if (pageContext) {
      pageContextStr = `\n\n══════ CONTEXTO DE PÁGINA ACTUAL ══════\nEl usuario está viendo: ${pageContext.page}\n${pageContext.data ? `Datos: ${JSON.stringify(pageContext.data)}` : ''}`;
    }

    // Sanitizar todo el contexto para evitar caracteres inválidos
    const fullContext = sanitizeString(baseContext + dynamicContext + pageContextStr);

    const messages = [
      ...history.slice(-18).map(m => ({ ...m, content: sanitizeString(m.content) })),
      { role: 'user', content: sanitizeString(message) }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: buildSystemPrompt(userName, userRole) + '\n\nCONTEXTO ACTUAL DEL SISTEMA:\n' + fullContext,
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return new Response(
        JSON.stringify({ error: 'Error calling Anthropic API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    const text = parsed.delta.text;
                    fullResponse += text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }

                  if (parsed.type === 'message_stop') {
                    // Verificar si hay acciones para ejecutar
                    const actionMatch = fullResponse.match(/\[ACTION:[^\]]+\]/g);
                    if (actionMatch) {
                      for (const action of actionMatch) {
                        const result = await executeAction(action);
                        if (result) {
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n' + result })}\n\n`));
                          fullResponse += '\n\n' + result;
                        }
                      }
                    }

                    await saveMessage(
                      currentSessionId,
                      'assistant',
                      fullResponse,
                      undefined,
                      `Context included: base + ${dynamicContext ? 'dynamic' : 'none'}${pageContext ? ' + page' : ''}`
                    );
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sessionId: currentSessionId })}\n\n`));
                  }
                } catch (e) {
                  // Ignorar líneas que no son JSON válido
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
