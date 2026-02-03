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

interface CallNotificationRequest {
  callData: {
    id: string;
    scheduled_at: string;
    company_name?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    team_member: string;
    source?: string;
    notes?: string;
  };
}

const TEAM_MEMBER_LABELS: Record<string, string> = {
  juan_pablo: 'Juan Pablo Gomez',
  sara: 'Sara Garces',
  agustin: 'Agustin Hoyos',
};

const CALL_SOURCE_LABELS: Record<string, string> = {
  webinar: 'Webinar',
  referido: 'Referido',
  contenido: 'Contenido',
  outbound: 'Outbound',
  inbound: 'Inbound',
  evento: 'Evento',
  otro: 'Otro',
};

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

const getEmailTemplate = (callData: CallNotificationRequest['callData']) => {
  const teamMemberName = TEAM_MEMBER_LABELS[callData.team_member] || callData.team_member;
  const sourceName = callData.source ? CALL_SOURCE_LABELS[callData.source] || callData.source : 'No especificada';
  const formattedDate = formatDate(callData.scheduled_at);

  return {
    subject: `📞 Nueva Llamada Programada - ${callData.company_name || 'Sin empresa'}`,
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
              <span style="font-size: 32px;">📞</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Nueva Llamada Programada</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Se ha agendado una nueva llamada de ventas</p>
          </div>

          <!-- Company Name Banner -->
          <div style="background: #f8fafc; padding: 25px 30px; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center;">
              <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">${(callData.company_name || 'E')[0].toUpperCase()}</span>
              </div>
              <div>
                <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">${callData.company_name || 'Sin empresa'}</h2>
                ${callData.contact_name ? `<p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Contacto: ${callData.contact_name}</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">

            <!-- Date & Time Card -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 20px; margin-right: 10px;">🗓️</span>
                <span style="color: #92400e; font-weight: 600; font-size: 14px; text-transform: uppercase;">Fecha y Hora</span>
              </div>
              <p style="margin: 0; color: #78350f; font-size: 18px; font-weight: 600;">${formattedDate}</p>
            </div>

            <!-- Details Grid -->
            <div style="display: grid; gap: 15px;">

              <!-- Responsible -->
              <div style="background: #f1f5f9; border-radius: 10px; padding: 15px; display: flex; align-items: center;">
                <div style="width: 40px; height: 40px; background: #4f46e5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="color: white; font-size: 16px;">👤</span>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Responsable</p>
                  <p style="margin: 3px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${teamMemberName}</p>
                </div>
              </div>

              <!-- Source -->
              <div style="background: #f1f5f9; border-radius: 10px; padding: 15px; display: flex; align-items: center;">
                <div style="width: 40px; height: 40px; background: #7c3aed; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="color: white; font-size: 16px;">📢</span>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Fuente</p>
                  <p style="margin: 3px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${sourceName}</p>
                </div>
              </div>

              <!-- Contact Info -->
              ${callData.contact_phone || callData.contact_email ? `
              <div style="background: #f1f5f9; border-radius: 10px; padding: 15px;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Informacion de Contacto</p>
                ${callData.contact_phone ? `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="margin-right: 8px;">📱</span>
                  <a href="tel:${callData.contact_phone}" style="color: #4f46e5; text-decoration: none; font-size: 14px;">${callData.contact_phone}</a>
                </div>
                ` : ''}
                ${callData.contact_email ? `
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 8px;">📧</span>
                  <a href="mailto:${callData.contact_email}" style="color: #4f46e5; text-decoration: none; font-size: 14px;">${callData.contact_email}</a>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <!-- Notes -->
              ${callData.notes ? `
              <div style="background: #eff6ff; border-radius: 10px; padding: 15px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 12px; text-transform: uppercase; font-weight: 600;">📝 Notas</p>
                <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5;">${callData.notes}</p>
              </div>
              ` : ''}

            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
              💡 <strong>Tip:</strong> Prepara la llamada revisando el historial del lead
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
    const { callData }: CallNotificationRequest = await req.json();

    console.log('Sending call notification:', callData);

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
    console.error('Error in send-call-notification function:', error);
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
