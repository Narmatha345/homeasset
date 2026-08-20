import { apiClient } from "./client";
import type { Asset, AssetStatus, MaintenanceFrequency } from "../types";

export interface AssetInput {
  name: string;
  assetId?: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  houseId: string;
  locationId: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  maintenanceFrequency: MaintenanceFrequency;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
}

export interface AssetFilters {
  houseId?: string;
  locationId?: string;
  category?: string;
  status?: string;
  warranty?: string;
  maintenanceStatus?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const assetsApi = {
  list: (filters: AssetFilters = {}) =>
    apiClient.get<{ assets: Asset[] }>("/assets", { params: filters }).then((r) => r.data.assets),
  get: (id: string) => apiClient.get<{ asset: Asset }>(`/assets/${id}`).then((r) => r.data.asset),
  create: (input: AssetInput) => apiClient.post<{ asset: Asset }>("/assets", input).then((r) => r.data.asset),
  update: (id: string, input: Partial<AssetInput>) =>
    apiClient.put<{ asset: Asset }>(`/assets/${id}`, input).then((r) => r.data.asset),
  remove: (id: string) => apiClient.delete(`/assets/${id}`).then((r) => r.data),
  byLocation: () =>
    apiClient.get<{ data: { location: string; count: number }[] }>("/assets/by-location").then((r) => r.data.data),
};
