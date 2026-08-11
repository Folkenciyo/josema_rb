import {
  Apple,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Settings,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
      { href: "/clients", label: "Clientes", icon: Users },
    ],
  },
  {
    title: "Entrenamiento",
    items: [
      { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
      { href: "/routines", label: "Rutinas", icon: ClipboardList },
    ],
  },
  {
    title: "Dieta",
    items: [
      { href: "/foods", label: "Alimentos", icon: Apple },
      { href: "/meal-templates", label: "Comidas", icon: UtensilsCrossed },
      { href: "/menus", label: "Menús", icon: CalendarDays },
    ],
  },
  {
    title: null,
    items: [{ href: "/settings", label: "Ajustes", icon: Settings }],
  },
];
