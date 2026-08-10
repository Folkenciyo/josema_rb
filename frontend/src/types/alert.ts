export type PlanKind = "training" | "diet";

export interface ClientWithoutPlanAlert {
  client_id: string;
  client_name: string;
  missing: PlanKind[];
}

export interface ExpiringPlanAlert {
  client_id: string;
  client_name: string;
  plan_id: string;
  plan_kind: PlanKind;
  title: string;
  end_date: string;
  /** Negative when the plan is already past its end date but still active. */
  days_left: number;
}

export interface StaleWeighInAlert {
  client_id: string;
  client_name: string;
  last_weighed_on: string | null;
  days_since: number | null;
}

export interface InactiveClientAlert {
  client_id: string;
  client_name: string;
  deactivated_on: string;
}

export interface DashboardAlerts {
  clients_without_plan: ClientWithoutPlanAlert[];
  expiring_plans: ExpiringPlanAlert[];
  stale_weigh_ins: StaleWeighInAlert[];
  inactive_clients: InactiveClientAlert[];
  total: number;
}

export const PLAN_KIND_LABELS: Record<PlanKind, string> = {
  training: "rutina",
  diet: "dieta",
};
