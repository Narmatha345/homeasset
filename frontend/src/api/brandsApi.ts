import { apiClient } from "./client";

export const brandsApi = {
  get: (category: string) => apiClient.get<{ brands: string[] }>("/brands", { params: { category } }).then((r) => r.data.brands),
};
