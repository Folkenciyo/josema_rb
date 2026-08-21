import {
  Apple,
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Quote,
  Rocket,
  Salad,
  Settings,
  Share2,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The table of contents. Metadata only — plain data, so the index, the sidebar
 * of every guide and the tests can all read it without pulling in any JSX.
 */
export interface HelpGuide {
  slug: string;
  title: string;
  /** One line on the index card: what the reader will get out of it. */
  summary: string;
  icon: LucideIcon;
  /** Screens this guide talks about, linked from the index. */
  screens: { href: string; label: string }[];
}

export const HELP_GUIDES: HelpGuide[] = [
  {
    slug: "primeros-pasos",
    title: "Primeros pasos",
    summary:
      "Qué es cada parte de la aplicación y en qué orden montar el primer cliente de principio a fin.",
    icon: Rocket,
    screens: [{ href: "/dashboard", label: "Inicio" }],
  },
  {
    slug: "clientes",
    title: "Clientes y su ficha",
    summary:
      "Dar de alta, rellenar la ficha, leer los avisos de la portada, dar de baja y reactivar.",
    icon: Users,
    screens: [
      { href: "/clients", label: "Clientes" },
      { href: "/dashboard", label: "Inicio" },
    ],
  },
  {
    slug: "portal-del-cliente",
    title: "El portal del cliente",
    summary:
      "El enlace privado que le mandas: qué ve, qué puede escribir, cómo se envía y cómo se anula.",
    icon: Share2,
    screens: [
      { href: "/clients", label: "Clientes" },
      { href: "/settings", label: "Ajustes" },
    ],
  },
  {
    slug: "ejercicios",
    title: "Ejercicios",
    summary:
      "La librería en español, cómo buscar por músculo o material y cómo crear los tuyos con fotos.",
    icon: Dumbbell,
    screens: [
      { href: "/exercises", label: "Ejercicios" },
      { href: "/exercises/new", label: "Nuevo ejercicio" },
    ],
  },
  {
    slug: "rutinas",
    title: "Rutinas y plantillas",
    summary:
      "Montar un plan por semanas y días, repetir semanas, reutilizar rutinas entre clientes y exportar.",
    icon: ClipboardList,
    screens: [
      { href: "/routines", label: "Rutinas" },
      { href: "/clients", label: "Clientes" },
    ],
  },
  {
    slug: "calendario-y-cargas",
    title: "Calendario y registro de cargas",
    summary:
      "Ver qué días entrenó de verdad, si cumple el plan y cómo evoluciona su fuerza ejercicio a ejercicio.",
    icon: CalendarCheck,
    screens: [{ href: "/clients", label: "Clientes" }],
  },
  {
    slug: "alimentos-comidas-menus",
    title: "Alimentos, comidas y menús",
    summary:
      "Los tres pisos de la dieta: el catálogo, las comidas reutilizables y el día completo.",
    icon: Apple,
    screens: [
      { href: "/foods", label: "Alimentos" },
      { href: "/meal-templates", label: "Comidas" },
      { href: "/menus", label: "Menús" },
    ],
  },
  {
    slug: "dietas",
    title: "Dietas del cliente",
    summary:
      "Asignar menús a los días, fijar objetivos de calorías y macros, y escalar un menú a otro objetivo.",
    icon: Salad,
    screens: [
      { href: "/clients", label: "Clientes" },
      { href: "/menus", label: "Menús" },
    ],
  },
  {
    slug: "seguimiento-corporal",
    title: "Peso, fotos y seguimiento",
    summary:
      "Pesajes e IMC, fotos de progreso con su comparador, permiso del cliente y documento de Seguimiento.",
    icon: TrendingUp,
    screens: [{ href: "/clients", label: "Clientes" }],
  },
  {
    slug: "motivacion",
    title: "Mensajes motivadores",
    summary:
      "La cola de mensajes: elegir el de hoy, el siguiente, el orden, y fijarle uno a un cliente concreto.",
    icon: Quote,
    screens: [{ href: "/quotes", label: "Motivación" }],
  },
  {
    slug: "ajustes-y-trucos",
    title: "Ajustes y trucos",
    summary:
      "Cuestionario inicial, plantillas del mensaje de invitación, buscador rápido, tema e instalación en el móvil.",
    icon: Settings,
    screens: [{ href: "/settings", label: "Ajustes" }],
  },
];

export function findGuide(slug: string): HelpGuide | undefined {
  return HELP_GUIDES.find((guide) => guide.slug === slug);
}

export function guideHref(slug: string): string {
  return `/ayuda/${slug}`;
}

/** Previous and next, so the whole manual can be read straight through. */
export function guideNeighbours(slug: string): {
  previous: HelpGuide | null;
  next: HelpGuide | null;
} {
  const index = HELP_GUIDES.findIndex((guide) => guide.slug === slug);

  return {
    previous: index > 0 ? HELP_GUIDES[index - 1] : null,
    next:
      index >= 0 && index < HELP_GUIDES.length - 1
        ? HELP_GUIDES[index + 1]
        : null,
  };
}
