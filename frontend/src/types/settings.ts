export interface InviteTemplates {
  whatsapp_template: string;
  email_subject: string;
  email_template: string;
  /** Names usable between braces, as the backend declares them. */
  placeholders: string[];
}

export interface InviteTemplatesInput {
  whatsapp_template?: string | null;
  email_subject?: string | null;
  email_template?: string | null;
}

export const PLACEHOLDER_HINTS: Record<string, string> = {
  nombre: "el nombre de pila del cliente",
  nombre_completo: "su nombre y apellidos",
  enlace: "su enlace privado",
  entrenador: "tu nombre",
};
