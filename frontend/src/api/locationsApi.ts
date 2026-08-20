import { apiClient } from "./client";
import type { Location, LocationTreeNode } from "../types";

export interface LocationInput {
  houseId: string;
  name: string;
  description?: string;
}

export const locationsApi = {
  list: (houseId?: string) =>
    apiClient
      .get<{ locations: Location[] }>("/locations", { params: houseId ? { houseId } : undefined })
      .then((r) => r.data.locations),
  summary: () => apiClient.get<{ tree: LocationTreeNode[] }>("/locations/summary").then((r) => r.data.tree),
  create: (input: LocationInput) =>
    apiClient.post<{ location: Location }>("/locations", input).then((r) => r.data.location),
  update: (id: string, input: Partial<LocationInput>) =>
    apiClient.put<{ location: Location }>(`/locations/${id}`, input).then((r) => r.data.location),
  remove: (id: string) => apiClient.delete(`/locations/${id}`).then((r) => r.data),
};
