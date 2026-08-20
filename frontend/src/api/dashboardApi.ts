import { apiClient } from "./client";
import type { DashboardSummary, UpcomingMaintenanceItem, ServiceRecord, AppNotification } from "../types";

export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
  upcomingMaintenance: (range?: string) =>
    apiClient
      .get<{ items: UpcomingMaintenanceItem[] }>("/dashboard/upcoming-maintenance", { params: range ? { range } : undefined })
      .then((r) => r.data.items),
  recentlyServiced: () =>
    apiClient.get<{ items: ServiceRecord[] }>("/dashboard/recently-serviced").then((r) => r.data.items),
  assetsByLocation: () =>
    apiClient
      .get<{ data: { location: string; count: number }[] }>("/dashboard/assets-by-location")
      .then((r) => r.data.data),
  notifications: () =>
    apiClient.get<{ notifications: AppNotification[] }>("/dashboard/notifications").then((r) => r.data.notifications),
};
