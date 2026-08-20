import { apiClient } from "./client";
import type { ServiceRecord, ServiceType, Asset } from "../types";

export interface ServiceInput {
  assetId: string;
  serviceDate: string;
  serviceType: ServiceType;
  serviceProvider?: string;
  cost?: number;
  description?: string;
  partsReplaced?: string;
  nextServiceDate?: string;
  notes?: string;
}

export interface ServiceFilters {
  assetId?: string;
  locationId?: string;
  serviceType?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const servicesApi = {
  list: (filters: ServiceFilters = {}) =>
    apiClient.get<{ services: ServiceRecord[] }>("/services", { params: filters }).then((r) => r.data.services),
  get: (id: string) => apiClient.get<{ service: ServiceRecord }>(`/services/${id}`).then((r) => r.data.service),
  create: (input: ServiceInput) =>
    apiClient
      .post<{ service: ServiceRecord; asset: Asset }>("/services", input)
      .then((r) => r.data),
  update: (id: string, input: Partial<ServiceInput>) =>
    apiClient.put<{ service: ServiceRecord }>(`/services/${id}`, input).then((r) => r.data.service),
  remove: (id: string) => apiClient.delete(`/services/${id}`).then((r) => r.data),
};
