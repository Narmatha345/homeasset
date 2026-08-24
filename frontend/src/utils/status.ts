import type { AssetStatus, MaintenanceStatus, MaintenancePriority, ServiceType, RequestType, ServiceOrderPriority, ServiceOrderStatus } from "../types";

export const maintenanceStatusStyles: Record<MaintenanceStatus, string> = {
  Overdue: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  "Due Soon": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Scheduled: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  Upcoming: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

export const assetStatusStyles: Record<AssetStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  "Under Maintenance": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Inactive: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  Retired: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export const priorityStyles: Record<MaintenancePriority, string> = {
  High: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

export const serviceTypeStyles: Record<ServiceType, string> = {
  "General Maintenance": "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  Cleaning: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  Inspection: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  Repair: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  "Part Replacement": "bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-200",
  Other: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

export const serviceOrderStatusStyles: Record<ServiceOrderStatus, string> = {
  Open: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  Assigned: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  "On Hold": "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  Cancelled: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export const serviceOrderPriorityStyles: Record<ServiceOrderPriority, string> = {
  Low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  High: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  Critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export const requestTypeStyles: Record<RequestType, string> = {
  Repair: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  "Preventive Maintenance": "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  Inspection: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  Cleaning: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  "Part Replacement": "bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-200",
  Emergency: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  Other: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const DUE_SOON_WINDOW_DAYS = 7;

export function getMaintenanceStatus(nextServiceDate?: string | null, now: Date = new Date()): MaintenanceStatus {
  if (!nextServiceDate) return "Scheduled";
  const due = new Date(nextServiceDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "Due Soon";
  if (diffDays <= 30) return "Scheduled";
  return "Upcoming";
}

export function getMaintenancePriority(nextServiceDate?: string | null, now: Date = new Date()): MaintenancePriority {
  if (!nextServiceDate) return "Low";
  const due = new Date(nextServiceDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "High";
  if (diffDays <= 30) return "Medium";
  return "Low";
}
