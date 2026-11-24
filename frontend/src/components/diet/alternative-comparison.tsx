import { ScrollTable } from "@/components/ui/scroll-table";
import { itemMacros, type MealItemDraft } from "@/lib/diet/meal-draft";
import type { Food, MacroTotals } from "@/types/diet";

const ROWS: { key: keyof MacroTotals; label: string; unit: string }[] = [
  { key: "calories", label: "Kcal", unit: "" },
  { key: "protein_g", label: "Proteína", unit: "g" },
  { key: "carbs_g", label: "Hidratos", unit: "g" },
  { key: "fat_g", label: "Grasa", unit: "g" },
];

function format(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/**
 * Side-by-side macro comparison for a group of interchangeable alternatives.
 * Purely informational — nothing here judges which option is "better".
 */
export function AlternativeComparison({
  items,
  foodMap,
}: {
  items: MealItemDraft[];
  foodMap: Map<string, Food>;
}) {
  if (items.length < 2) {
    return null;
  }

  const macros = items.map((item) => itemMacros(item, foodMap));

  // Two to four columns on a tinted box: pinning the labels would paint a
  // white stripe over it and buy nothing.
  return (
    <ScrollTable
      stickyColumn={false}
      className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
    >
      <thead>
        <tr>
          <th className="p-1 text-left font-medium text-slate-500">
            Comparativa
          </th>
          {items.map((item) => (
            <th
              key={item.key}
              className="p-1 text-right font-medium text-slate-600"
            >
              {item.food_name || "Sin nombre"}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map(({ key, label, unit }) => (
          <tr key={key} className="border-t border-slate-200">
            <td className="p-1 text-slate-500">{label}</td>
            {macros.map((entry, index) => (
              <td
                key={items[index].key}
                className="p-1 text-right font-semibold text-slate-700"
              >
                {format(entry[key])}
                {unit}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}
