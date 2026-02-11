import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TodoNotificationRequest {
  type: 'task_assigned' | 'task_comment' | 'task_due_reminder' | 'task_status_changed';
  recipientEmails: string[];
  taskTitle: string;
  taskDescription?: string;
  assignedBy?: string;
  commentAuthor?: string;
  commentContent?: string;
  newStatus?: string;
  dueDate?: string;
}

const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pendiente',
  'in_progress': 'En Progreso',
  'completed': 'Completado',
  'cancelled': 'Cancelado',
};

const getEmailTemplate = (request: TodoNotificationRequest) => {
  switch (request.type) {
    case 'task_assigned':
      return {
        subject: `📋 Nueva tarea asignada: ${request.taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📋 Nueva Tarea Asignada</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Te han asignado una nueva tarea</p>
            </div>
            <div style="background: white; color: #333; padding: 30px;">
              <div style="border-left: 4px solid #8B5CF6; padding-left: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 5px 0; color: #8B5CF6; font-size: 22px;">${request.taskTitle}</h2>
                ${request.taskDescription ? `<p style="margin: 0; color: #666; font-size: 14px;">${request.taskDescription}</p>` : ''}
              </div>
              <div style="background: #f8f5ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #666;"><strong>Asignada por:</strong> ${request.assignedBy || 'Un miembro del equipo'}</p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Ingresa al CRM para ver los detalles de la tarea 💪</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'task_comment':
      return {
        subject: `💬 Nuevo comentario en: ${request.taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">💬 Nuevo Comentario</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Han comentado en tu tarea</p>
            </div>
            <div style="background: white; color: #333; padding: 30px;">
              <div style="border-left: 4px solid #3B82F6; padding-left: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 5px 0; color: #3B82F6; font-size: 22px;">${request.taskTitle}</h2>
              </div>
              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-weight: bold; color: #333;">${request.commentAuthor || 'Un miembro del equipo'}:</p>
                <p style="margin: 0; color: #555; font-style: italic;">"${request.commentContent || ''}"</p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Ingresa al CRM para responder 👏</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'task_due_reminder':
      return {
        subject: `⏰ Tu tarea vence pronto: ${request.taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">⏰ Recordatorio</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Tu tarea vence pronto</p>
            </div>
            <div style="background: white; color: #333; padding: 30px;">
              <div style="border-left: 4px solid #F59E0B; padding-left: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 5px 0; color: #D97706; font-size: 22px;">${request.taskTitle}</h2>
              </div>
              <div style="background: #fffbeb; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; color: #92400e;"><strong>Fecha limite:</strong> ${request.dueDate || 'Pronto'}</p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <p style="margin: 0; color: #666; font-size: 14px;">No olvides completar esta tarea a tiempo ⚡</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'task_status_changed':
      return {
        subject: `🔄 Estado actualizado: ${request.taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔄 Estado Actualizado</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">El estado de tu tarea ha cambiado</p>
            </div>
            <div style="background: white; color: #333; padding: 30px;">
              <div style="border-left: 4px solid #10B981; padding-left: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 5px 0; color: #10B981; font-size: 22px;">${request.taskTitle}</h2>
              </div>
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 18px;">
                  Nuevo estado: <strong style="color: #059669;">${STATUS_LABELS[request.newStatus || ''] || request.newStatus}</strong>
                </p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Ingresa al CRM para ver los detalles 🚀</p>
              </div>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `Notificacion de tarea: ${request.taskTitle}`,
        html: `<p>Tienes una notificacion sobre la tarea: ${request.taskTitle}</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TodoNotificationRequest = await req.json();

    console.log('Sending todo notification:', request);

    if (!request.recipientEmails || request.recipientEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recipients' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const template = getEmailTemplate(request);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'To-Do CRM <onboarding@resend.dev>',
        to: request.recipientEmails,
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${await response.text()}`);
    }

    const emailResponse = await response.json();
    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in send-todo-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
