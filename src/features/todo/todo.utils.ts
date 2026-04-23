import * as Notifications from "expo-notifications";
import { DeadlineStatus, Todo } from "./todo.types";

export const FOCUS_MINUTES = 25;
export const BREAK_MINUTES = 5;

export const REMINDER_OFFSETS = [
  { label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "1 day", ms: 1 * 24 * 60 * 60 * 1000 },
] as const;

let notificationHandlerConfigured = false;

export function configureNotificationHandler(): void {
  if (notificationHandlerConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  notificationHandlerConfigured = true;
}

export function sortTodosByDeadline(items: Todo[]): Todo[] {
  return [...items].sort((a, b) => {
    if (a.deadline_at && b.deadline_at) {
      return (
        new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()
      );
    }

    if (a.deadline_at && !b.deadline_at) return -1;
    if (!a.deadline_at && b.deadline_at) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function getDeadlineStatus(deadlineAt: string | null): DeadlineStatus {
  if (!deadlineAt) return "none";

  const now = new Date();
  const deadline = new Date(deadlineAt);
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "oneDay";
  if (diffDays <= 3) return "threeDays";
  if (diffDays <= 7) return "oneWeek";
  return "normal";
}

export function getDeadlineStyle(status: DeadlineStatus) {
  switch (status) {
    case "completed":
      return { backgroundColor: "#f5f5f5", borderColor: "#d9d9d9" };
    case "overdue":
      return { backgroundColor: "#ffe5e5", borderColor: "#ff4d4f" };
    case "oneDay":
      return { backgroundColor: "#fff1e6", borderColor: "#ff7a45" };
    case "threeDays":
      return { backgroundColor: "#fff7e6", borderColor: "#fa8c16" };
    case "oneWeek":
      return { backgroundColor: "#fffbe6", borderColor: "#fadb14" };
    default:
      return { backgroundColor: "#ffffff", borderColor: "#eeeeee" };
  }
}

export function getDeadlineLabel(status: DeadlineStatus): string {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "oneDay":
      return "Due within 1 day";
    case "threeDays":
      return "Due within 3 days";
    case "oneWeek":
      return "Due within 1 week";
    default:
      return "";
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function scheduleDeadlineReminders(
  title: string,
  deadlineAt: string | null
): Promise<void> {
  if (!deadlineAt) return;

  const deadlineDate = new Date(deadlineAt);
  const now = new Date();

  for (const reminder of REMINDER_OFFSETS) {
    const triggerDate = new Date(deadlineDate.getTime() - reminder.ms);

    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task deadline coming up",
          body: `"${title}" is due in ${reminder.label}.`,
          data: { deadlineAt, reminder: reminder.label },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}