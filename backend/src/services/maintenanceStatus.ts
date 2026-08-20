export type MaintenanceStatus = "Overdue" | "Due Soon" | "Scheduled" | "Upcoming" | "Completed";
export type MaintenancePriority = "High" | "Medium" | "Low";

const DUE_SOON_WINDOW_DAYS = 7;

/**
 * Single source of truth for turning a next-service date into a status/priority,
 * reused by the dashboard, maintenance, and calendar endpoints.
 */
export function getMaintenanceStatus(nextServiceDate?: Date | string | null, now: Date = new Date()): MaintenanceStatus {
  if (!nextServiceDate) return "Scheduled";
  const due = new Date(nextServiceDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "Due Soon";
  if (diffDays <= 30) return "Scheduled";
  return "Upcoming";
}

export function getMaintenancePriority(nextServiceDate?: Date | string | null, now: Date = new Date()): MaintenancePriority {
  if (!nextServiceDate) return "Low";
  const due = new Date(nextServiceDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "High";
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "High";
  if (diffDays <= 30) return "Medium";
  return "Low";
}

export function daysUntil(date?: Date | string | null, now: Date = new Date()): number | null {
  if (!date) return null;
  const target = new Date(date);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
