import {
  buildMealDraft,
  createCatalogItem,
  createManualItem,
  itemMacros,
  mealDraftToPayload,
  mealDraftTotals,
  validateMealItems,
} from "./meal-draft";
import type { Food, MealTemplate } from "@/types/diet";

const chicken: Food = {
  id: "f1",
  name: "Pechuga de pollo",
  unit_label: "100 g",
  calories: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
};

const foods = new Map<string, Food>([[chicken.id, chicken]]);

describe("createCatalogItem", () => {
  it("starts at one reference unit with the food's own label", () => {
    const item = createCatalogItem(chicken);

    expect(item).toMatchObject({
      mode: "catalog",
      food_id: "f1",
      quantity_label: "100 g",
      quantity_multiplier: 1,
    });
  });
});

describe("itemMacros", () => {
  it("scales catalog macros by the multiplier", () => {
    const item = { ...createCatalogItem(chicken), quantity_multiplier: 1.5 };

    expect(itemMacros(item, foods)).toEqual({
      calories: 247.5,
      protein_g: 46.5,
      carbs_g: 0,
      fat_g: 5.4,
    });
  });

  it("keeps manual macros untouched", () => {
    const item = {
      ...createManualItem(),
      food_name: "Tostada",
      calories: 120,
      protein_g: 4,
      carbs_g: 22,
      fat_g: 1.5,
    };

    expect(itemMacros(item, foods)).toMatchObject({ calories: 120, carbs_g: 22 });
  });

  it("returns zeros when the referenced food is gone", () => {
    const item = { ...createCatalogItem(chicken), food_id: "missing" };

    expect(itemMacros(item, foods)).toEqual({
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    });
  });
});

describe("mealDraftTotals", () => {
  it("adds up every line", () => {
    const items = [
      { ...createCatalogItem(chicken), quantity_multiplier: 2 },
      {
        ...createManualItem(),
        food_name: "Aceite",
        calories: 90,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 10,
      },
    ];

    expect(mealDraftTotals(items, foods)).toEqual({
      calories: 420,
      protein_g: 62,
      carbs_g: 0,
      fat_g: 17.2,
    });
  });
});

describe("mealDraftToPayload", () => {
  it("sends only the reference for catalog items so the backend recomputes macros", () => {
    const payload = mealDraftToPayload([
      { ...createCatalogItem(chicken), quantity_multiplier: 1.5 },
    ]);

    expect(payload[0]).toEqual({
      food_id: "f1",
      quantity_label: "100 g",
      quantity_multiplier: 1.5,
    });
  });

  it("sends name and macros for manual items", () => {
    const payload = mealDraftToPayload([
      {
        ...createManualItem(),
        food_name: "  Tostada  ",
        calories: 120,
        protein_g: 4,
        carbs_g: 22,
        fat_g: 1.5,
      },
    ]);

    expect(payload[0]).toMatchObject({ food_name: "Tostada", calories: 120 });
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
    const item = { ...createCatalogItem(chicken), quantity_multiplier: 0 };

    expect(validateMealItems([item])).toContain("mayor que cero");
  });

  it("accepts a valid mix", () => {
    const manual = { ...createManualItem(), food_name: "Tostada" };

    expect(validateMealItems([createCatalogItem(chicken), manual])).toBeNull();
  });
});

describe("buildMealDraft", () => {
  it("restores mode and ordering from a saved template", () => {
    const template: MealTemplate = {
      id: "m1",
      name: "Desayuno",
      notes: null,
      totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      items: [
        {
          id: "i2",
          food_id: null,
          food_name: "Café",
          quantity_label: null,
          quantity_multiplier: null,
          calories: 5,
          protein_g: 0,
          carbs_g: 1,
          fat_g: 0,
          order_index: 1,
        },
        {
          id: "i1",
          food_id: "f1",
          food_name: "Pechuga de pollo",
          quantity_label: "150 g",
          quantity_multiplier: 1.5,
          calories: 247.5,
          protein_g: 46.5,
          carbs_g: 0,
          fat_g: 5.4,
          order_index: 0,
        },
      ],
    };

    const draft = buildMealDraft(template);

    expect(draft.map((item) => item.mode)).toEqual(["catalog", "manual"]);
    expect(draft[0].quantity_multiplier).toBe(1.5);
  });
});
