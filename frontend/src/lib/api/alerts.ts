import { api } from "./http";
import type { DashboardAlerts } from "@/types/alert";

export function getAlerts(): Promise<DashboardAlerts> {
  return api.get<DashboardAlerts>("/alerts");
}
