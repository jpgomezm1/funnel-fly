import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_6jqUQ8Fw_TUvnjatdXFGpGrLLvE9kpR87';

const resend = {
  emails: {
    send: async (payload: any) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${await response.text()}`);
      }

      return response.json();
    }
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== LABELS ==========

const TEAM_MEMBER_LABELS: Record<string, string> = {
  juan_pablo: 'Juan Pablo Gomez',
  sara: 'Sara Garces',
  agustin: 'Agustin Hoyos',
};

const CALL_RESULT_LABELS: Record<string, string> = {
  lead_no_califica: 'Lead No Califica',
  lead_pasa_fase_0: 'Lead Pasa a Fase 0',
  lead_quiere_reunion_adicional: 'Reunion Adicional',
};

const CALL_SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  conocido: 'Conocido/Familiar/Amigo',
  intro: 'Intro',
  linkedin: 'LinkedIn',
  webinar: 'Webinar',
  otro: 'Otro',
};

const COMPANY_SIZE_LABELS: Record<string, string> = {
  micro: 'Micro',
  pyme: 'PYME',
  mid_market: 'Mid-market',
  enterprise: 'Enterprise',
};

const OPERATIONAL_MATURITY_LABELS: Record<string, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

const CONTACT_ROLE_LABELS: Record<string, string> = {
  decisor: 'Decisor',
  influenciador: 'Influenciador',
  operativo: 'Operativo',
  consultor_externo: 'Consultor Externo',
};

const PROBLEM_TYPE_LABELS: Record<string, string> = {
  sintoma: 'Síntoma',
  causa: 'Causa',
};

const AFFECTED_AREA_LABELS: Record<string, string> = {
  revenue: 'Revenue',
  operaciones: 'Operaciones',
  finanzas: 'Finanzas',
  customer_experience: 'Customer Experience',
  multiples: 'Múltiples',
};

const IMPACT_LEVEL_LABELS: Record<string, string> = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

const PAYMENT_CAPACITY_LABELS: Record<string, string> = {
  si: 'Sí',
  no: 'No',
  no_claro: 'No claro',
};

const URGENCY_LABELS: Record<string, string> = {
  hoy: 'Hoy',
  proximo_trimestre: 'Próximo trimestre',
  algun_dia: 'Algún día',
};

const YES_NO_LABELS: Record<string, string> = {
  si: 'Sí',
  no: 'No',
};

const QUALIFICATION_DECISION_LABELS: Record<string, string> = {
  aplica_fase_0: 'Aplica para Fase 0',
  no_aplica: 'No Aplica',
};

const RISK_SIGNAL_LABELS: Record<string, string> = {
  expectativas_magicas_ia: 'Expectativas mágicas con IA',
  lenguaje_vago: 'Lenguaje vago',
  decisor_ausente: 'Decisor ausente',
  falta_datos: 'Falta de datos',
  precio_unica_objecion: 'Precio como única objeción',
  luego_vemos: '"Luego vemos"',
};

// ========== TYPES ==========

interface CallQualification {
  industry?: string | null;
  company_size?: string | null;
  operational_maturity?: string | null;
  contact_role?: string | null;
  client_problem_description?: string | null;
  problem_type?: string | null;
  affected_area?: string | null;
  real_problem_description?: string | null;
  impacts_revenue?: string | null;
  impacts_control?: string | null;
  impacts_continuity?: string | null;
  global_impact_level?: string | null;
  final_decision_maker?: string | null;
  who_pays?: string | null;
  who_suffers_problem?: string | null;
  stakeholders_aligned?: boolean;
  payment_capacity?: string | null;
  urgency?: string | null;
  tried_before?: string | null;
  risk_signals?: string[];
  other_risk_signals?: string | null;
  qualification_decision?: string | null;
  decision_justification?: string | null;
}

interface CallData {
  id: string;
  scheduled_at: string;
  company_name?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  team_member: string;
  source?: string | null;
  call_result?: string | null;
  key_notes?: string[] | null;
  notes?: string | null;
  duration_minutes?: number | null;
  qualification?: CallQualification | null;
}

interface CallCompletedNotificationRequest {
  callData: CallData;
}

// ========== HELPERS ==========

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  };
  return date.toLocaleDateString('es-CO', options);
};

const getLabel = (value: string | null | undefined, labels: Record<string, string>): string => {
  if (!value) return 'No especificado';
  return labels[value] || value;
};

// ========== EMAIL TEMPLATE ==========

const getEmailTemplate = (callData: CallData) => {
  const qualification = callData.qualification || {};
  const isApplica = qualification.qualification_decision === 'aplica_fase_0';
  const headerColor = isApplica ? '#10b981' : '#ef4444'; // green or red
  const headerBgGradient = isApplica
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  const decisionText = getLabel(qualification.qualification_decision, QUALIFICATION_DECISION_LABELS);
  const decisionEmoji = isApplica ? '✅' : '❌';

  const teamMemberName = getLabel(callData.team_member, TEAM_MEMBER_LABELS);
  const sourceName = getLabel(callData.source, CALL_SOURCE_LABELS);
  const resultName = getLabel(callData.call_result, CALL_RESULT_LABELS);
  const formattedDate = formatDate(callData.scheduled_at);

  // Key notes section
  const keyNotesHtml = callData.key_notes && callData.key_notes.length > 0
    ? `
      <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; text-transform: uppercase; font-weight: 600;">📝 Key Notes</p>
        <ul style="margin: 0; padding-left: 20px; color: #1e293b;">
          ${callData.key_notes.map(note => `<li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">${note}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  // Justification section
  const justificationHtml = qualification.decision_justification
    ? `
      <div style="background: #fef3c7; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 12px 0; color: #92400e; font-size: 14px; text-transform: uppercase; font-weight: 600;">💡 Justificación de la Decisión</p>
        <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.6;">${qualification.decision_justification}</p>
      </div>
    `
    : '';

  // Context section
  const contextHtml = `
    <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 15px 0; color: #475569; font-size: 14px; text-transform: uppercase; font-weight: 600;">🏢 Contexto del Cliente</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Industria</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${qualification.industry || 'No especificada'}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Tamaño</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.company_size, COMPANY_SIZE_LABELS)}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Madurez Operacional</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.operational_maturity, OPERATIONAL_MATURITY_LABELS)}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Rol del Contacto</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.contact_role, CONTACT_ROLE_LABELS)}</p>
        </div>
      </div>
    </div>
  `;

  // Problem section
  const problemHtml = `
    <div style="background: #fef2f2; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 15px 0; color: #991b1b; font-size: 14px; text-transform: uppercase; font-weight: 600;">🎯 Problema</p>
      ${qualification.client_problem_description ? `
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Problema Declarado por el Cliente</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; line-height: 1.5;">${qualification.client_problem_description}</p>
        </div>
      ` : ''}
      ${qualification.real_problem_description ? `
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Problema Real Identificado</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; line-height: 1.5;">${qualification.real_problem_description}</p>
        </div>
      ` : ''}
      <div style="display: flex; gap: 20px;">
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Tipo de Problema</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.problem_type, PROBLEM_TYPE_LABELS)}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Área Afectada</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.affected_area, AFFECTED_AREA_LABELS)}</p>
        </div>
      </div>
    </div>
  `;

  // Impact section
  const impactHtml = `
    <div style="background: #eff6ff; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0 0 15px 0; color: #1e40af; font-size: 14px; text-transform: uppercase; font-weight: 600;">📊 Impacto en el Negocio</p>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
          <p style="margin: 0; color: #64748b; font-size: 11px;">Revenue</p>
          <p style="margin: 4px 0 0 0; font-size: 18px;">${qualification.impacts_revenue === 'si' ? '✅' : '❌'}</p>
        </div>
        <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
          <p style="margin: 0; color: #64748b; font-size: 11px;">Control</p>
          <p style="margin: 4px 0 0 0; font-size: 18px;">${qualification.impacts_control === 'si' ? '✅' : '❌'}</p>
        </div>
        <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
          <p style="margin: 0; color: #64748b; font-size: 11px;">Continuidad</p>
          <p style="margin: 4px 0 0 0; font-size: 18px;">${qualification.impacts_continuity === 'si' ? '✅' : '❌'}</p>
        </div>
        <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
          <p style="margin: 0; color: #64748b; font-size: 11px;">Nivel Global</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 600;">${getLabel(qualification.global_impact_level, IMPACT_LEVEL_LABELS)}</p>
        </div>
      </div>
    </div>
  `;

  // Capacity section
  const capacityHtml = `
    <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #22c55e;">
      <p style="margin: 0 0 15px 0; color: #166534; font-size: 14px; text-transform: uppercase; font-weight: 600;">💰 Capacidad y Urgencia</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Capacidad de Pago</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.payment_capacity, PAYMENT_CAPACITY_LABELS)}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Urgencia</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.urgency, URGENCY_LABELS)}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Intentó Antes</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${getLabel(qualification.tried_before, YES_NO_LABELS)}</p>
        </div>
      </div>
    </div>
  `;

  // Risk signals section
  const hasRisks = (qualification.risk_signals && qualification.risk_signals.length > 0) || qualification.other_risk_signals;
  const riskSignalsHtml = hasRisks
    ? `
      <div style="background: #fef2f2; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
        <p style="margin: 0 0 12px 0; color: #991b1b; font-size: 14px; text-transform: uppercase; font-weight: 600;">⚠️ Señales de Riesgo</p>
        ${qualification.risk_signals && qualification.risk_signals.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: ${qualification.other_risk_signals ? '12px' : '0'};">
            ${qualification.risk_signals.map(signal => `
              <span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                ${getLabel(signal, RISK_SIGNAL_LABELS)}
              </span>
            `).join('')}
          </div>
        ` : ''}
        ${qualification.other_risk_signals ? `
          <p style="margin: 0; color: #1e293b; font-size: 14px; font-style: italic;">"${qualification.other_risk_signals}"</p>
        ` : ''}
      </div>
    `
    : '';

  // Stakeholders section
  const stakeholdersHtml = `
    <div style="background: #faf5ff; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #a855f7;">
      <p style="margin: 0 0 15px 0; color: #7e22ce; font-size: 14px; text-transform: uppercase; font-weight: 600;">👥 Stakeholders</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Decisor Final</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${qualification.final_decision_maker || 'No especificado'}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Quién Paga</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${qualification.who_pays || 'No especificado'}</p>
        </div>
        <div>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Quién Sufre el Problema</p>
          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 500;">${qualification.who_suffers_problem || 'No especificado'}</p>
        </div>
      </div>
      ${qualification.stakeholders_aligned !== undefined ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e9d5ff;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Stakeholders Alineados</p>
          <p style="margin: 4px 0 0 0; font-size: 16px;">${qualification.stakeholders_aligned ? '✅ Sí' : '❌ No'}</p>
        </div>
      ` : ''}
    </div>
  `;

  return {
    subject: `${decisionEmoji} Llamada Completada - ${callData.company_name || 'Sin empresa'} - ${decisionText}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">

          <!-- Header -->
          <div style="background: ${headerBgGradient}; padding: 40px 30px; text-align: center;">
            <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 40px;">${decisionEmoji}</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${decisionText}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Llamada completada y calificada</p>
          </div>

          <!-- Summary Banner -->
          <div style="background: #f8fafc; padding: 25px 30px; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="width: 50px; height: 50px; background: ${headerBgGradient}; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">${(callData.company_name || 'E')[0].toUpperCase()}</span>
              </div>
              <div>
                <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">${callData.company_name || 'Sin empresa'}</h2>
                ${callData.contact_name ? `<p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Contacto: ${callData.contact_name}</p>` : ''}
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
              <div>
                <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Responsable</p>
                <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 600;">${teamMemberName}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Resultado</p>
                <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 600;">${resultName}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Duración</p>
                <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 600;">${callData.duration_minutes ? `${callData.duration_minutes} min` : 'No registrada'}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Fuente</p>
                <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 600;">${sourceName}</p>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">

            ${keyNotesHtml}

            ${justificationHtml}

            ${contextHtml}

            ${problemHtml}

            ${impactHtml}

            ${capacityHtml}

            ${riskSignalsHtml}

            ${stakeholdersHtml}

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
              📅 Llamada realizada el <strong>${formattedDate}</strong>
            </p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Notificacion enviada desde Funnel Fly CRM
              </p>
              <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 11px;">
                Irrelevant - Stay Irrelevant
              </p>
            </div>
          </div>

        </div>
      </body>
      </html>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { callData }: CallCompletedNotificationRequest = await req.json();

    console.log('Sending call completed notification:', callData);

    const template = getEmailTemplate(callData);

    const emailResponse = await resend.emails.send({
      from: 'Funnel Fly CRM <notificaciones@updates.stayirrelevant.com>',
      to: ['jpgomez@stayirrelevant.com'],
      subject: template.subject,
      html: template.html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-call-completed-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
