import { apiClient } from "./client";
import type { House } from "../types";

export interface HouseInput {
  name: string;
  address: string;
  city: string;
  description?: string;
}

export const housesApi = {
  list: () => apiClient.get<{ houses: House[] }>("/houses").then((r) => r.data.houses),
  get: (id: string) => apiClient.get<{ house: House }>(`/houses/${id}`).then((r) => r.data.house),
  create: (input: HouseInput) => apiClient.post<{ house: House }>("/houses", input).then((r) => r.data.house),
  update: (id: string, input: HouseInput) =>
    apiClient.put<{ house: House }>(`/houses/${id}`, input).then((r) => r.data.house),
  remove: (id: string) => apiClient.delete(`/houses/${id}`).then((r) => r.data),
};
