import { compareToTargets, hasAnyTarget, type DailyTargets } from "./macro-targets";
import { EMPTY_TOTALS } from "./meal-draft";
import type { MacroTotals } from "@/types/diet";

const targets: DailyTargets = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fat_g: 60,
};

function totals(partial: Partial<MacroTotals>): MacroTotals {
  return { ...EMPTY_TOTALS, ...partial };
}

describe("compareToTargets", () => {
  it("marks a day inside the tolerance as on target", () => {
    const result = compareToTargets(totals({ calories: 1950 }), {
      ...targets,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ status: "on-target", difference: -50 });
  });

  it("flags falling short, not just going over", () => {
    const result = compareToTargets(
      totals({ calories: 2000, protein_g: 90, carbs_g: 200, fat_g: 60 }),
      targets,
    );

    const protein = result.find((entry) => entry.key === "protein_g");
    expect(protein).toMatchObject({ status: "under", difference: -60 });
  });

  it("flags going over", () => {
    const result = compareToTargets(totals({ fat_g: 90 }), {
      calories: null,
      protein_g: null,
      carbs_g: null,
      fat_g: 60,
    });

    expect(result[0]).toMatchObject({ status: "over", difference: 30 });
  });

  it("ignores targets the trainer left empty", () => {
    const result = compareToTargets(totals({ calories: 1000 }), {
      calories: 2000,
      protein_g: null,
      carbs_g: 0,
      fat_g: null,
    });

    expect(result.map((entry) => entry.key)).toEqual(["calories"]);
  });

  it("never lets the bar overflow its track", () => {
    const result = compareToTargets(totals({ calories: 6000 }), {
      ...targets,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
    });

    expect(result[0].percentage).toBe(100);
  });
});

describe("hasAnyTarget", () => {
  it("is false when the plan has no targets at all", () => {
    expect(
      hasAnyTarget({
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
      }),
    ).toBe(false);
  });

  it("is true as soon as one target is set", () => {
    expect(hasAnyTarget({ ...targets, protein_g: null })).toBe(true);
  });
});
