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

const STAGE_LABELS: Record<string, string> = {
  'PROSPECTO': 'Prospecto',
  'CONTACTADO': 'Contactado',
  'DESCUBRIMIENTO': 'Descubrimiento',
  'DEMOSTRACION': 'Demostración',
  'PROPUESTA': 'Propuesta',
  'CERRADO_GANADO': 'Cerrado Ganado',
  'CERRADO_PERDIDO': 'Cerrado Perdido',
};

const STAGE_EMOJIS: Record<string, string> = {
  'DEMOSTRACION': '🎯',
  'PROPUESTA': '📋',
  'CERRADO_GANADO': '🎉',
  'CERRADO_PERDIDO': '📉',
};

interface PipelineNotificationRequest {
  type: 'project_stage_change' | 'project_won' | 'project_lost';
  projectData: {
    id: string;
    name: string;
    company_name: string;
    contact_name?: string;
    from_stage: string;
    to_stage: string;
    mrr_usd?: number;
  };
}

const formatDate = (): string => {
  const date = new Date();
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

const getEmailTemplate = (type: string, data: PipelineNotificationRequest['projectData']) => {
  const fromLabel = STAGE_LABELS[data.from_stage] || data.from_stage;
  const toLabel = STAGE_LABELS[data.to_stage] || data.to_stage;
  const emoji = STAGE_EMOJIS[data.to_stage] || '📈';
  const formattedDate = formatDate();

  switch (type) {
    case 'project_won':
      return {
        subject: `🎉 ¡DEAL CERRADO! ${data.company_name} - ${data.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="font-size: 40px;">🎉</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">¡Deal Cerrado!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Un proyecto ha sido marcado como ganado</p>
              </div>

              <!-- Company Banner -->
              <div style="background: #f8fafc; padding: 25px 30px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center;">
                  <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">${(data.company_name || 'P')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">${data.company_name}</h2>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Proyecto: ${data.name}</p>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 30px;">
                ${data.mrr_usd ? `
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 25px; margin-bottom: 20px; text-align: center; border: 1px solid #bbf7d0;">
                  <p style="margin: 0 0 5px 0; color: #166534; font-size: 12px; text-transform: uppercase; font-weight: 600;">MRR</p>
                  <p style="margin: 0; color: #15803d; font-size: 32px; font-weight: 700;">$${data.mrr_usd.toLocaleString()} USD/mes</p>
                </div>
                ` : ''}

                <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <span style="background: #e5e7eb; color: #374151; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ${fromLabel}
                    </span>
                    <span style="font-size: 24px;">→</span>
                    <span style="background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ✅ ${toLabel}
                    </span>
                  </div>
                </div>

                <div style="text-align: center; padding: 20px; background: #10b981; color: white; border-radius: 8px;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold;">
                    🚀 ¡Excelente trabajo equipo! 💪
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                  📅 ${formattedDate}
                </p>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">Notificacion enviada desde Funnel Fly CRM</p>
                  <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 11px;">Irrelevant - Stay Irrelevant</p>
                </div>
              </div>

            </div>
          </body>
          </html>
        `
      };

    case 'project_lost':
      return {
        subject: `📉 Proyecto Perdido - ${data.company_name} - ${data.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="font-size: 40px;">📉</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Proyecto Perdido</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Oportunidad para analizar y mejorar</p>
              </div>

              <!-- Company Banner -->
              <div style="background: #f8fafc; padding: 25px 30px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center;">
                  <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">${(data.company_name || 'P')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">${data.company_name}</h2>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Proyecto: ${data.name}</p>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 30px;">
                <div style="background: #fef2f2; border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <span style="background: #e5e7eb; color: #374151; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ${fromLabel}
                    </span>
                    <span style="font-size: 24px;">→</span>
                    <span style="background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ❌ ${toLabel}
                    </span>
                  </div>
                </div>

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #333;">💡 Próximos Pasos Sugeridos:</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #666;">
                    <li>Analizar el motivo de la pérdida</li>
                    <li>Documentar lecciones aprendidas</li>
                    <li>Considerar follow-up a futuro</li>
                    <li>Evaluar mejoras en el proceso de ventas</li>
                  </ul>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                  📅 ${formattedDate}
                </p>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">Notificacion enviada desde Funnel Fly CRM</p>
                  <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 11px;">Irrelevant - Stay Irrelevant</p>
                </div>
              </div>

            </div>
          </body>
          </html>
        `
      };

    default: // project_stage_change
      return {
        subject: `${emoji} Pipeline: ${data.company_name} → ${toLabel}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                <div style="background: rgba(255,255,255,0.2); width: 70px; height: 70px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="font-size: 32px;">${emoji}</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Movimiento en Pipeline</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Un proyecto ha cambiado de etapa</p>
              </div>

              <!-- Company Banner -->
              <div style="background: #f8fafc; padding: 25px 30px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center;">
                  <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">${(data.company_name || 'P')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">${data.company_name}</h2>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Proyecto: ${data.name}</p>
                    ${data.contact_name ? `<p style="margin: 3px 0 0 0; color: #94a3b8; font-size: 13px;">Contacto: ${data.contact_name}</p>` : ''}
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div style="padding: 30px;">
                <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 20px 0; color: #333;">🔄 Movimiento de Etapa</h3>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <span style="background: #e5e7eb; color: #374151; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ${fromLabel}
                    </span>
                    <span style="font-size: 24px;">→</span>
                    <span style="background: #4f46e5; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ${toLabel}
                    </span>
                  </div>
                </div>

                ${data.mrr_usd ? `
                <div style="background: #f1f5f9; border-radius: 10px; padding: 15px; text-align: center;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">MRR Estimado</p>
                  <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 20px; font-weight: 700;">$${data.mrr_usd.toLocaleString()} USD/mes</p>
                </div>
                ` : ''}
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                  📅 ${formattedDate}
                </p>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">Notificacion enviada desde Funnel Fly CRM</p>
                  <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 11px;">Irrelevant - Stay Irrelevant</p>
                </div>
              </div>

            </div>
          </body>
          </html>
        `
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, projectData }: PipelineNotificationRequest = await req.json();

    console.log('Sending pipeline notification:', { type, projectData });

    const template = getEmailTemplate(type, projectData);

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
    console.error('Error in send-pipeline-notification function:', error);
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
