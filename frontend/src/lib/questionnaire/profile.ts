import type { ClientProfile, ClientProfileInput } from "@/types/questionnaire";

/** The file fields the client fills in, in the order the block shows them. */
export const PROFILE_FIELDS = [
  "email",
  "phone",
  "birth_date",
  "sex",
  "height_cm",
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const PROFILE_LABELS: Record<ProfileField, string> = {
  email: "Email",
  phone: "Teléfono",
  birth_date: "Fecha de nacimiento",
  sex: "Sexo",
  height_cm: "Altura (cm)",
};

/** Every box holds text while it is being typed, the height included. */
export type ProfileDraft = Record<ProfileField, string>;

export function draftFromProfile(profile: ClientProfile): ProfileDraft {
  return {
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    birth_date: profile.birth_date?.slice(0, 10) ?? "",
    sex: profile.sex ?? "",
    height_cm: profile.height_cm === null ? "" : String(profile.height_cm),
  };
}

/**
 * The labels of the boxes still empty. All five are required, so this is what
 * decides whether the form can be sent; the shape of what was typed is the
 * server's business, and its complaint comes back in Spanish.
 */
export function missingProfileFields(draft: ProfileDraft): string[] {
  return PROFILE_FIELDS.filter((field) => draft[field].trim() === "").map(
    (field) => PROFILE_LABELS[field],
  );
}

/** A trainer's client typing on a phone writes "1,68" as often as "168". */
export function draftToProfileInput(draft: ProfileDraft): ClientProfileInput {
  const height = Number(draft.height_cm.replace(",", "."));

  return {
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    birth_date: draft.birth_date,
    sex: draft.sex,
    height_cm: Number.isFinite(height) && height > 0 ? height : null,
  };
}
