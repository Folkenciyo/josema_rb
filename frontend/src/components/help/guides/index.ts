import type { ComponentType } from "react";

import { AjustesYTrucos } from "./ajustes-y-trucos";
import { AlimentosComidasMenus } from "./alimentos-comidas-menus";
import { CalendarioYCargas } from "./calendario-y-cargas";
import { Clientes } from "./clientes";
import { Dietas } from "./dietas";
import { Ejercicios } from "./ejercicios";
import { Motivacion } from "./motivacion";
import { PortalDelCliente } from "./portal-del-cliente";
import { PrimerosPasos } from "./primeros-pasos";
import { Rutinas } from "./rutinas";
import { SeguimientoCorporal } from "./seguimiento-corporal";

/**
 * The body of each guide, keyed by the same slug the table of contents uses.
 * Kept apart from the metadata so the index and the tests stay free of JSX.
 */
export const GUIDE_BODIES: Record<string, ComponentType> = {
  "primeros-pasos": PrimerosPasos,
  clientes: Clientes,
  "portal-del-cliente": PortalDelCliente,
  ejercicios: Ejercicios,
  rutinas: Rutinas,
  "calendario-y-cargas": CalendarioYCargas,
  "alimentos-comidas-menus": AlimentosComidasMenus,
  dietas: Dietas,
  "seguimiento-corporal": SeguimientoCorporal,
  motivacion: Motivacion,
  "ajustes-y-trucos": AjustesYTrucos,
};
