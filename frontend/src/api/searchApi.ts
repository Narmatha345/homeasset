import { apiClient } from "./client";
import type { Asset, Location, ServiceRecord } from "../types";

export interface SearchResults {
  assets: Asset[];
  locations: Location[];
  services: ServiceRecord[];
}

export const searchApi = {
  search: (q: string) => apiClient.get<SearchResults>("/search", { params: { q } }).then((r) => r.data),
};
