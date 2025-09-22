import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadNotificationRequest {
  type: 'new_lead' | 'stage_change' | 'lead_won' | 'lead_lost';
  leadData: {
    id: string;
    company_name: string;
    contact_name?: string;
    contact_role?: string;
    email?: string;
    phone?: string;
    channel: string;
    subchannel: string;
    owner_id?: string;
    from_stage?: string;
    to_stage?: string;
  };
}

const getEmailTemplate = (type: string, leadData: any) => {
  const channelLabels: any = {
    'OUTBOUND_APOLLO': 'Outbound Apollo',
    'WARM_INTRO': 'Warm Intro',
    'INBOUND_REDES': 'Inbound Redes'
  };

  const stageLabels: any = {
    'PROSPECTO': 'Prospecto',
    'CONTACTADO': 'Contactado',
    'DESCUBRIMIENTO': 'Descubrimiento',
    'DEMOSTRACION': 'Demostración',
    'PROPUESTA': 'Propuesta',
    'CERRADO_GANADO': 'Cerrado Ganado',
    'CERRADO_PERDIDO': 'Cerrado Perdido'
  };

  const ownerName = leadData.owner_id ? 
    leadData.owner_id.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') : 'No asignado';

  switch (type) {
    case 'new_lead':
      return {
        subject: '🎯 Nuevo Lead Ingresado al Pipeline',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 ¡Nuevo Lead!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Un nuevo prospecto ha ingresado al pipeline</p>
            </div>
            
            <div style="background: white; color: #333; padding: 30px; margin: 0;">
              <div style="display: grid; gap: 20px;">
                <div style="border-left: 4px solid #667eea; padding-left: 15px;">
                  <h2 style="margin: 0 0 5px 0; color: #667eea; font-size: 24px;">${leadData.company_name}</h2>
                  ${leadData.contact_name ? `<p style="margin: 0; font-size: 16px; color: #666;"><strong>${leadData.contact_name}</strong> - ${leadData.contact_role || 'Sin rol especificado'}</p>` : ''}
                </div>
                
                <div style="background: #f8f9ff; padding: 20px; border-radius: 8px;">
                  <h3 style="margin: 0 0 15px 0; color: #333;">📊 Detalles del Lead</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                      <strong>📢 Canal:</strong><br>
                      <span style="color: #667eea;">${channelLabels[leadData.channel] || leadData.channel}</span>
                    </div>
                    <div>
                      <strong>👤 Asignado a:</strong><br>
                      <span style="color: #667eea;">${ownerName}</span>
                    </div>
                    ${leadData.email ? `
                    <div>
                      <strong>📧 Email:</strong><br>
                      <a href="mailto:${leadData.email}" style="color: #667eea; text-decoration: none;">${leadData.email}</a>
                    </div>
                    ` : ''}
                    ${leadData.phone ? `
                    <div>
                      <strong>📱 Teléfono:</strong><br>
                      <a href="tel:${leadData.phone}" style="color: #667eea; text-decoration: none;">${leadData.phone}</a>
                    </div>
                    ` : ''}
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Es hora de dar seguimiento a este nuevo prospecto 💪
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      };

    case 'stage_change':
      return {
        subject: `📈 Lead Movido: ${leadData.company_name} → ${stageLabels[leadData.to_stage]}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📈 Progreso en el Pipeline</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Un lead ha avanzado de etapa</p>
            </div>
            
            <div style="background: white; color: #333; padding: 30px; margin: 0;">
              <div style="display: grid; gap: 20px;">
                <div style="border-left: 4px solid #4facfe; padding-left: 15px;">
                  <h2 style="margin: 0 0 5px 0; color: #4facfe; font-size: 24px;">${leadData.company_name}</h2>
                  ${leadData.contact_name ? `<p style="margin: 0; font-size: 16px; color: #666;"><strong>${leadData.contact_name}</strong> - ${leadData.contact_role || 'Sin rol especificado'}</p>` : ''}
                </div>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center;">
                  <h3 style="margin: 0 0 20px 0; color: #333;">🔄 Movimiento de Etapa</h3>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <span style="background: #e5e7eb; color: #374151; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ${stageLabels[leadData.from_stage] || leadData.from_stage}
                    </span>
                    <span style="font-size: 24px;">→</span>
                    <span style="background: #4facfe; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                      ${stageLabels[leadData.to_stage] || leadData.to_stage}
                    </span>
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    ¡Buen trabajo manteniendo el pipeline activo! 👏
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      };

    case 'lead_won':
      return {
        subject: '🎉 ¡VICTORIA! Lead Cerrado Ganado - ' + leadData.company_name,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎉 ¡VICTORIA!</h1>
              <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9;">¡Hemos cerrado un nuevo cliente!</p>
            </div>
            
            <div style="background: white; color: #333; padding: 40px; margin: 0;">
              <div style="display: grid; gap: 25px;">
                <div style="border-left: 4px solid #11998e; padding-left: 15px;">
                  <h2 style="margin: 0 0 5px 0; color: #11998e; font-size: 28px;">🏆 ${leadData.company_name}</h2>
                  ${leadData.contact_name ? `<p style="margin: 0; font-size: 18px; color: #666;"><strong>${leadData.contact_name}</strong> - ${leadData.contact_role || 'Sin rol especificado'}</p>` : ''}
                </div>
                
                <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 15px;">🎊</div>
                  <h3 style="margin: 0 0 10px 0; color: #11998e; font-size: 24px;">¡Cliente Conseguido!</h3>
                  <p style="margin: 0; color: #666; font-size: 16px;">
                    Este lead ha sido marcado como <strong style="color: #11998e;">Cerrado Ganado</strong>
                  </p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div style="text-align: center;">
                    <strong>👤 Cerrado por:</strong><br>
                    <span style="color: #11998e; font-size: 18px; font-weight: bold;">${ownerName}</span>
                  </div>
                  <div style="text-align: center;">
                    <strong>📢 Canal Original:</strong><br>
                    <span style="color: #11998e; font-size: 18px;">${channelLabels[leadData.channel] || leadData.channel}</span>
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px; padding: 20px; background: #11998e; color: white; border-radius: 8px;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold;">
                    🚀 ¡Excelente trabajo! ¡Sigamos así! 💪
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      };

    case 'lead_lost':
      return {
        subject: '📉 Lead Perdido - ' + leadData.company_name + ' - Analizar y Aprender',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📉 Lead No Convertido</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Oportunidad para aprender y mejorar</p>
            </div>
            
            <div style="background: white; color: #333; padding: 30px; margin: 0;">
              <div style="display: grid; gap: 20px;">
                <div style="border-left: 4px solid #fc466b; padding-left: 15px;">
                  <h2 style="margin: 0 0 5px 0; color: #fc466b; font-size: 24px;">${leadData.company_name}</h2>
                  ${leadData.contact_name ? `<p style="margin: 0; font-size: 16px; color: #666;"><strong>${leadData.contact_name}</strong> - ${leadData.contact_role || 'Sin rol especificado'}</p>` : ''}
                </div>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 10px;">🤔</div>
                  <h3 style="margin: 0 0 10px 0; color: #fc466b;">Lead Marcado como Perdido</h3>
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    No te desanimes, cada "no" nos acerca más al próximo "sí"
                  </p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="text-align: center;">
                    <strong>👤 Manejado por:</strong><br>
                    <span style="color: #fc466b;">${ownerName}</span>
                  </div>
                  <div style="text-align: center;">
                    <strong>📢 Canal:</strong><br>
                    <span style="color: #fc466b;">${channelLabels[leadData.channel] || leadData.channel}</span>
                  </div>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #333;">💡 Próximos Pasos Sugeridos:</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #666;">
                    <li>Analizar el motivo de la pérdida</li>
                    <li>Documentar lecciones aprendidas</li>
                    <li>Considerar follow-up a futuro</li>
                    <li>Evaluar si mejoras en el proceso pueden ayudar</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Cada experiencia nos hace más fuertes 💪
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      };

    default:
      return {
        subject: 'Notificación de Lead',
        html: '<p>Notificación de lead sin template específico.</p>'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, leadData }: LeadNotificationRequest = await req.json();

    console.log('Sending lead notification:', { type, leadData });

    const template = getEmailTemplate(type, leadData);

    const emailResponse = await resend.emails.send({
      from: 'Pipeline CRM <onboarding@resend.dev>',
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
    console.error('Error in send-lead-notification function:', error);
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