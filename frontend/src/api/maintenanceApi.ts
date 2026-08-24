import { apiClient } from "./client";
import type { UpcomingMaintenanceItem } from "../types";

export const maintenanceApi = {
  upcoming: () => apiClient.get<{ items: UpcomingMaintenanceItem[] }>("/maintenance/upcoming").then((r) => r.data.items),
  due: (range?: "today" | "week" | "month") =>
    apiClient.get<{ items: UpcomingMaintenanceItem[] }>("/maintenance/due", { params: range ? { range } : undefined }).then((r) => r.data.items),
  overdue: () => apiClient.get<{ items: UpcomingMaintenanceItem[] }>("/maintenance/overdue").then((r) => r.data.items),
};
