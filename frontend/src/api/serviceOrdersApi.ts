import { apiClient } from "./client";
import type { ServiceOrder, RequestType, ServiceOrderPriority, ServiceOrderStatus } from "../types";

export interface ServiceOrderInput {
  assetId: string;
  requestType: RequestType;
  priority: ServiceOrderPriority;
  requestedDate: string;
  description: string;
  notes?: string;
  status?: ServiceOrderStatus;
}

export interface ServiceOrderFilters {
  status?: string;
  priority?: string;
  requestType?: string;
  from?: string;
  to?: string;
  search?: string;
  sortDir?: "asc" | "desc";
}

export const serviceOrdersApi = {
  list: (filters: ServiceOrderFilters = {}) =>
    apiClient.get<{ serviceOrders: ServiceOrder[] }>("/service-orders", { params: filters }).then((r) => r.data.serviceOrders),
  get: (id: string) => apiClient.get<{ serviceOrder: ServiceOrder }>(`/service-orders/${id}`).then((r) => r.data.serviceOrder),
  create: (input: ServiceOrderInput) =>
    apiClient.post<{ serviceOrder: ServiceOrder }>("/service-orders", input).then((r) => r.data.serviceOrder),
  update: (id: string, input: Partial<ServiceOrderInput>) =>
    apiClient.put<{ serviceOrder: ServiceOrder }>(`/service-orders/${id}`, input).then((r) => r.data.serviceOrder),
  remove: (id: string) => apiClient.delete(`/service-orders/${id}`).then((r) => r.data),
};
