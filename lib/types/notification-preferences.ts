export type AgendaNotificationPreferences = {
  userId: string;
  employeeEmail: string | null;
  emailEnabled: boolean;
  emailForReminderDue: boolean;
  emailForReminderUpcoming: boolean;
  emailForDueToday: boolean;
  emailForOverdue: boolean;
};
