import {
  describeExpiry,
  describeMissingPlans,
  describeStaleWeighIn,
} from "./messages";

describe("describeMissingPlans", () => {
  it("names the two plans when neither is active", () => {
    expect(describeMissingPlans(["training", "diet"])).toBe(
      "Sin rutina ni dieta activas",
    );
  });

  it("names only the missing one", () => {
    expect(describeMissingPlans(["training"])).toBe("Sin rutina activa");
    expect(describeMissingPlans(["diet"])).toBe("Sin dieta activa");
  });
});

describe("describeExpiry", () => {
  it("treats an already expired plan as urgent", () => {
    expect(describeExpiry(-1)).toEqual({ label: "Caducó ayer", tone: "danger" });
    expect(describeExpiry(-5)).toEqual({
      label: "Caducó hace 5 días",
      tone: "danger",
    });
  });

  it("marks today and tomorrow apart", () => {
    expect(describeExpiry(0)).toEqual({ label: "Caduca hoy", tone: "danger" });
    expect(describeExpiry(1)).toEqual({
      label: "Caduca mañana",
      tone: "warning",
    });
  });

  it("counts the remaining days", () => {
    expect(describeExpiry(6)).toEqual({
      label: "Caduca en 6 días",
      tone: "warning",
    });
  });
});

describe("describeStaleWeighIn", () => {
  it("says so when the client has never been weighed", () => {
    expect(describeStaleWeighIn(null)).toBe("Nunca se ha pesado");
  });

  it("counts the days since the last weigh-in", () => {
    expect(describeStaleWeighIn(40)).toBe("40 días sin pesarse");
  });

  it("switches to months once the gap passes two of them", () => {
    expect(describeStaleWeighIn(59)).toBe("59 días sin pesarse");
    expect(describeStaleWeighIn(65)).toBe("2 meses sin pesarse");
    expect(describeStaleWeighIn(200)).toBe("6 meses sin pesarse");
  });
});
