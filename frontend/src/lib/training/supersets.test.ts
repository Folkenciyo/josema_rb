import { supersetLabels, toSupersetBlocks } from "./supersets";

const exercise = (superset_group: number | null, name = "") => ({
  superset_group,
  name,
});

describe("toSupersetBlocks", () => {
  it("leaves ungrouped exercises on their own", () => {
    const blocks = toSupersetBlocks([exercise(null), exercise(null)]);

    expect(blocks).toHaveLength(2);
    expect(blocks.every((block) => block.letter === null)).toBe(true);
  });

  it("joins consecutive exercises of the same group", () => {
    const blocks = toSupersetBlocks([
      exercise(null, "calentamiento"),
      exercise(1, "fondos"),
      exercise(1, "polea"),
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[1].letter).toBe("A");
    expect(blocks[1].exercises.map((item) => item.name)).toEqual([
      "fondos",
      "polea",
    ]);
  });

  it("does not treat a group of one as a superset", () => {
    const blocks = toSupersetBlocks([exercise(1), exercise(null), exercise(1)]);

    expect(blocks.every((block) => block.letter === null)).toBe(true);
  });
});

describe("supersetLabels", () => {
  it("numbers each exercise within its block", () => {
    expect(
      supersetLabels([
        exercise(1),
        exercise(1),
        exercise(null),
        exercise(2),
        exercise(2),
      ]),
    ).toEqual(["A1", "A2", null, "B1", "B2"]);
  });
});
