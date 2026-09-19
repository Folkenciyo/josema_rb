import {
  buildMealDraft,
  countedItems,
  createCatalogItem,
  createManualItem,
  EMPTY_TOTALS,
  itemMacros,
  mealDraftToPayload,
  mealDraftTotals,
  validateMealItems,
} from "./meal-draft";
import type { Food, MacroTotals, MealTemplate } from "@/types/diet";

const chicken: Food = {
  id: "f1",
  name: "Pechuga de pollo",
  category: "Proteína animal",
  subcategory: "Aves",
  unit_amount: 100,
  unit_type: "g",
  unit_label: "100 g",
  slug: "pechuga-pollo",
  source: "seed",
  calories: 165,
  protein_g: 31,
  carbs_g: 0,
  sugars_g: 0,
  fat_g: 3.6,
  saturated_fat_g: 1,
  fiber_g: 0,
  salt_g: 0.1,
};

const egg: Food = {
  ...chicken,
  id: "f2",
  name: "Huevo M",
  subcategory: "Huevos",
  unit_amount: 1,
  unit_type: "unidad",
  unit_label: "1 unidad",
  slug: "huevo-m",
  calories: 78,
  protein_g: 6.3,
  carbs_g: 0.6,
  sugars_g: 0.6,
  fat_g: 5.3,
  saturated_fat_g: 1.6,
  salt_g: 0.17,
};

const foods = new Map<string, Food>([
  [chicken.id, chicken],
  [egg.id, egg],
]);

function totals(partial: Partial<MacroTotals>): MacroTotals {
  return { ...EMPTY_TOTALS, ...partial };
}

describe("createCatalogItem", () => {
  it("starts at one reference quantity in the food's own unit", () => {
    expect(createCatalogItem(chicken)).toMatchObject({
      mode: "catalog",
      food_id: "f1",
      quantity_amount: 100,
      quantity_unit: "g",
    });
  });

  it("starts at one piece for countable foods", () => {
    expect(createCatalogItem(egg)).toMatchObject({
      quantity_amount: 1,
      quantity_unit: "unidad",
    });
  });
});

describe("itemMacros", () => {
  it("scales the whole label by the real amount served", () => {
    const item = { ...createCatalogItem(chicken), quantity_amount: 150 };

    expect(itemMacros(item, foods)).toEqual(
      totals({
        calories: 247.5,
        protein_g: 46.5,
        fat_g: 5.4,
        saturated_fat_g: 1.5,
        salt_g: 0.15,
      }),
    );
  });

  it("scales countable units by pieces", () => {
    const item = { ...createCatalogItem(egg), quantity_amount: 2 };

    expect(itemMacros(item, foods)).toMatchObject({
      calories: 156,
      protein_g: 12.6,
      salt_g: 0.34,
    });
  });

  it("keeps manual values untouched", () => {
    const item = {
      ...createManualItem(),
      food_name: "Tostada",
      calories: 120,
      carbs_g: 22,
      fiber_g: 2,
    };

    expect(itemMacros(item, foods)).toMatchObject({
      calories: 120,
      carbs_g: 22,
      fiber_g: 2,
    });
  });

  it("returns zeros when the referenced food is gone", () => {
    const item = { ...createCatalogItem(chicken), food_id: "missing" };

    expect(itemMacros(item, foods)).toEqual(EMPTY_TOTALS);
  });
});

describe("mealDraftTotals", () => {
  it("adds up every line across the full label", () => {
    const items = [
      { ...createCatalogItem(chicken), quantity_amount: 200 },
      {
        ...createManualItem(),
        food_name: "Aceite",
        calories: 90,
        fat_g: 10,
        saturated_fat_g: 1.4,
      },
    ];

    expect(mealDraftTotals(items, foods)).toEqual(
      totals({
        calories: 420,
        protein_g: 62,
        fat_g: 17.2,
        saturated_fat_g: 3.4,
        salt_g: 0.2,
      }),
    );
  });
});

describe("alternatives", () => {
  it("keeps each alternative's own macros but only counts the first in totals", () => {
    const seaBass = {
      ...createManualItem(),
      food_name: "Lubina",
      calories: 145.5,
      protein_g: 27.6,
      alternative_group: "grupo-1",
    };
    const salmon = {
      ...createManualItem(),
      food_name: "Salmón",
      calories: 416,
      protein_g: 40.8,
      alternative_group: "grupo-1",
    };

    expect(countedItems([seaBass, salmon])).toEqual([seaBass]);
    expect(mealDraftTotals([seaBass, salmon], foods)).toEqual(
      totals({ calories: 145.5, protein_g: 27.6 }),
    );
  });

  it("counts every group once, plus any ungrouped item", () => {
    const veggies = { ...createManualItem(), food_name: "Verduras", calories: 60 };
    const seaBass = {
      ...createManualItem(),
      food_name: "Lubina",
      calories: 145.5,
      alternative_group: "grupo-1",
    };
    const salmon = {
      ...createManualItem(),
      food_name: "Salmón",
      calories: 416,
      alternative_group: "grupo-1",
    };

    expect(mealDraftTotals([veggies, seaBass, salmon], foods)).toEqual(
      totals({ calories: 205.5 }),
    );
  });
});

describe("mealDraftToPayload", () => {
  it("sends the amount served so the backend derives the multiplier", () => {
    const payload = mealDraftToPayload([
      { ...createCatalogItem(chicken), quantity_amount: 150 },
    ]);

    expect(payload[0]).toEqual({ food_id: "f1", quantity_amount: 150 });
  });

  it("includes the alternative_group only when the item belongs to one", () => {
    const payload = mealDraftToPayload([
      { ...createCatalogItem(chicken), alternative_group: "grupo-1" },
    ]);

    expect(payload[0]).toMatchObject({ alternative_group: "grupo-1" });
  });

  it("sends name and the full label for manual items", () => {
    const payload = mealDraftToPayload([
      {
        ...createManualItem(),
        food_name: "  Tostada  ",
        calories: 120,
        carbs_g: 22,
        fiber_g: 2,
      },
    ]);

    expect(payload[0]).toMatchObject({
      food_name: "Tostada",
      calories: 120,
      fiber_g: 2,
    });
    expect(payload[0].food_id).toBeUndefined();
  });
});

describe("validateMealItems", () => {
  it("rejects an empty meal", () => {
    expect(validateMealItems([])).toContain("al menos un alimento");
  });

  it("rejects a manual item without a name", () => {
    expect(validateMealItems([createManualItem()])).toContain("nombre");
  });

  it("rejects a non-positive quantity", () => {
    const item = { ...createCatalogItem(chicken), quantity_amount: 0 };

    expect(validateMealItems([item])).toContain("mayor que cero");
  });

  it("rejects sugars above carbs on a manual line", () => {
    const item = {
      ...createManualItem(),
      food_name: "Zumo",
      carbs_g: 10,
      sugars_g: 12,
    };

    expect(validateMealItems([item])).toContain("azúcares");
  });

  it("accepts a valid mix", () => {
    const manual = { ...createManualItem(), food_name: "Tostada" };

    expect(validateMealItems([createCatalogItem(chicken), manual])).toBeNull();
  });
});

describe("buildMealDraft", () => {
  it("restores mode, ordering and the amount served", () => {
    const template: MealTemplate = {
      id: "m1",
      name: "Desayuno",
      notes: null,
      totals: EMPTY_TOTALS,
      items: [
        {
          id: "i2",
          food_id: null,
          food_name: "Café",
          quantity_label: null,
          quantity_amount: null,
          quantity_unit: null,
          quantity_multiplier: null,
          calories: 5,
          protein_g: 0,
          carbs_g: 1,
          sugars_g: 0,
          fat_g: 0,
          saturated_fat_g: 0,
          fiber_g: 0,
          salt_g: 0,
          order_index: 1,
          alternative_group: null,
        },
        {
          id: "i1",
          food_id: "f1",
          food_name: "Pechuga de pollo",
          quantity_label: "150 g",
          quantity_amount: 150,
          quantity_unit: "g",
          quantity_multiplier: 1.5,
          calories: 247.5,
          protein_g: 46.5,
          carbs_g: 0,
          sugars_g: 0,
          fat_g: 5.4,
          saturated_fat_g: 1.5,
          fiber_g: 0,
          salt_g: 0.15,
          order_index: 0,
          alternative_group: null,
        },
      ],
    };

    const draft = buildMealDraft(template);

    expect(draft.map((item) => item.mode)).toEqual(["catalog", "manual"]);
    expect(draft[0].quantity_amount).toBe(150);
    expect(draft[0].quantity_unit).toBe("g");
  });
});
