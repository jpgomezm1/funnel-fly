import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStage, ProjectStage } from '@/types/database';

interface NotificationPayload {
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

export const useEmailNotifications = () => {
  const sendNotification = async (payload: NotificationPayload) => {
    try {
      console.log('Sending email notification:', payload);
      
      const { data, error } = await supabase.functions.invoke('send-lead-notification', {
        body: payload,
      });

      if (error) {
        console.error('Error sending email notification:', error);
        return { success: false, error };
      }

      console.log('Email notification sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return { success: false, error };
    }
  };

  const notifyNewLead = async (lead: Lead) => {
    await sendNotification({
      type: 'new_lead',
      leadData: {
        id: lead.id,
        company_name: lead.company_name,
        contact_name: lead.contact_name || undefined,
        contact_role: lead.contact_role || undefined,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        channel: lead.channel,
        subchannel: lead.subchannel,
        owner_id: lead.owner_id || undefined,
      },
    });
  };

  const notifyStageChange = async (lead: Lead, fromStage: LeadStage, toStage: LeadStage) => {
    let notificationType: 'stage_change' | 'lead_won' | 'lead_lost' = 'stage_change';
    
    // Determinar el tipo de notificación basado en la etapa de destino
    if (toStage === 'CERRADO_GANADO') {
      notificationType = 'lead_won';
    } else if (toStage === 'CERRADO_PERDIDO') {
      notificationType = 'lead_lost';
    }

    await sendNotification({
      type: notificationType,
      leadData: {
        id: lead.id,
        company_name: lead.company_name,
        contact_name: lead.contact_name || undefined,
        contact_role: lead.contact_role || undefined,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        channel: lead.channel,
        subchannel: lead.subchannel,
        owner_id: lead.owner_id || undefined,
        from_stage: fromStage,
        to_stage: toStage,
      },
    });
  };

  const notifyProjectStageChange = async (
    project: { id: string; name: string; client?: { company_name: string; contact_name?: string }; deal?: { mrr_usd: number } | null },
    fromStage: ProjectStage,
    toStage: ProjectStage
  ) => {
    try {
      let notificationType: 'project_stage_change' | 'project_won' | 'project_lost' = 'project_stage_change';

      if (toStage === 'CERRADO_GANADO') {
        notificationType = 'project_won';
      } else if (toStage === 'CERRADO_PERDIDO') {
        notificationType = 'project_lost';
      }

      const { data, error } = await supabase.functions.invoke('send-pipeline-notification', {
        body: {
          type: notificationType,
          projectData: {
            id: project.id,
            name: project.name,
            company_name: project.client?.company_name || 'Sin empresa',
            contact_name: project.client?.contact_name || undefined,
            from_stage: fromStage,
            to_stage: toStage,
            mrr_usd: project.deal?.mrr_usd || undefined,
          },
        },
      });

      if (error) {
        console.error('Error sending pipeline notification:', error);
        return { success: false, error };
      }

      console.log('Pipeline notification sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error in notifyProjectStageChange:', error);
      return { success: false, error };
    }
  };

  return {
    sendNotification,
    notifyNewLead,
    notifyStageChange,
    notifyProjectStageChange,
  };
};