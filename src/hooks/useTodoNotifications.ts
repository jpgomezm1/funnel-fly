import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
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

async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('user_roles')
    .select('email')
    .eq('user_id', userId)
    .single();

  return data?.email || null;
}

async function getUserNotificationSettings(userId: string) {
  const { data } = await (supabase as any)
    .from('todo_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Default: all enabled
  return data || {
    notify_on_assignment: true,
    notify_on_comment: true,
    notify_on_due_date: true,
    notify_on_status_change: true,
  };
}

async function sendNotification(payload: NotificationPayload) {
  if (payload.recipientEmails.length === 0) return;

  try {
    await supabase.functions.invoke('send-todo-notification', {
      body: payload,
    });
  } catch (error) {
    console.error('Failed to send todo notification:', error);
  }
}

export function useTodoNotifications() {
  const notifyAssignment = async (assigneeUserIds: string[], taskTitle: string, assignedByName: string) => {
    const emails: string[] = [];

    for (const uid of assigneeUserIds) {
      const settings = await getUserNotificationSettings(uid);
      if (!settings.notify_on_assignment) continue;

      const email = await getUserEmail(uid);
      if (email) emails.push(email);
    }

    if (emails.length > 0) {
      await sendNotification({
        type: 'task_assigned',
        recipientEmails: emails,
        taskTitle,
        assignedBy: assignedByName,
      });
    }
  };

  const notifyComment = async (assigneeUserIds: string[], taskTitle: string, commentAuthor: string, commentContent: string) => {
    const emails: string[] = [];

    for (const uid of assigneeUserIds) {
      const settings = await getUserNotificationSettings(uid);
      if (!settings.notify_on_comment) continue;

      const email = await getUserEmail(uid);
      if (email) emails.push(email);
    }

    if (emails.length > 0) {
      await sendNotification({
        type: 'task_comment',
        recipientEmails: emails,
        taskTitle,
        commentAuthor,
        commentContent,
      });
    }
  };

  const notifyStatusChange = async (assigneeUserIds: string[], taskTitle: string, newStatus: string) => {
    const emails: string[] = [];

    for (const uid of assigneeUserIds) {
      const settings = await getUserNotificationSettings(uid);
      if (!settings.notify_on_status_change) continue;

      const email = await getUserEmail(uid);
      if (email) emails.push(email);
    }

    if (emails.length > 0) {
      await sendNotification({
        type: 'task_status_changed',
        recipientEmails: emails,
        taskTitle,
        newStatus,
      });
    }
  };

  return {
    notifyAssignment,
    notifyComment,
    notifyStatusChange,
  };
}
