export interface SearchHit {
  id: string;
  label: string;
  detail: string | null;
}

export interface SearchResults {
  clients: SearchHit[];
  exercises: SearchHit[];
  foods: SearchHit[];
  meals: SearchHit[];
  menus: SearchHit[];
}
