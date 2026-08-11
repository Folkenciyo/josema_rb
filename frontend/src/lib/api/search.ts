import { api } from "./http";
import type { SearchResults } from "@/types/search";

export function search(term: string): Promise<SearchResults> {
  return api.get<SearchResults>(`/search?q=${encodeURIComponent(term)}`);
}
