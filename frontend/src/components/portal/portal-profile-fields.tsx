"use client";

import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PROFILE_LABELS, type ProfileDraft } from "@/lib/questionnaire/profile";
import { SEX_LABELS } from "@/types/client";

/**
 * The five things the trainer cannot work without, asked once at the top of the
 * questionnaire. They land straight on the client's file when it is saved,
 * which beats chasing each one by message.
 */
export function PortalProfileFields({
  draft,
  onChange,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
}) {
  const set = (field: keyof ProfileDraft, value: string) =>
    onChange({ ...draft, [field]: value });

  return (
    <Card className="flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="font-semibold text-slate-800">Tus datos</p>
        <p className="text-sm text-slate-500">
          Para que tu entrenador pueda escribirte y calcular tus referencias.
        </p>
      </div>

      <Row label={PROFILE_LABELS.email} htmlFor="profile-email">
        <Input
          id="profile-email"
          type="email"
          value={draft.email}
          onChange={(event) => set("email", event.target.value)}
          placeholder="tunombre@correo.com"
          autoComplete="email"
          inputMode="email"
        />
      </Row>

      <Row label={PROFILE_LABELS.phone} htmlFor="profile-phone">
        <Input
          id="profile-phone"
          type="tel"
          value={draft.phone}
          onChange={(event) => set("phone", event.target.value)}
          placeholder="+34 600 000 000"
          autoComplete="tel"
          inputMode="tel"
        />
      </Row>

      <Row label={PROFILE_LABELS.birth_date} htmlFor="profile-birth-date">
        <Input
          id="profile-birth-date"
          type="date"
          value={draft.birth_date}
          onChange={(event) => set("birth_date", event.target.value)}
        />
      </Row>

      <Row label={PROFILE_LABELS.sex} htmlFor="profile-sex">
        <Select
          id="profile-sex"
          value={draft.sex}
          onChange={(event) => set("sex", event.target.value)}
        >
          <option value="">Elige una opción</option>
          {Object.entries(SEX_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Row>

      <Row label={PROFILE_LABELS.height_cm} htmlFor="profile-height">
        <Input
          id="profile-height"
          value={draft.height_cm}
          onChange={(event) => set("height_cm", event.target.value)}
          placeholder="170"
          inputMode="decimal"
          autoComplete="off"
        />
      </Row>
    </Card>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        <span className="text-brand-600"> *</span>
      </label>
      {children}
    </div>
  );
}
