import {
  BURST_COLORS,
  createBurst,
  opacityOf,
  stepParticles,
  type Particle,
} from "./burst";

/** A deterministic Math.random stand-in, so a burst can be checked exactly. */
function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("createBurst", () => {
  it("throws every shard from the point it was fired at", () => {
    const particles = createBurst(120, 80, { count: 20 });

    expect(particles).toHaveLength(20);
    expect(particles.every((p) => p.x === 120 && p.y === 80)).toBe(true);
  });

  it("gives each shard a speed inside the range asked for", () => {
    const particles = createBurst(0, 0, {
      count: 50,
      minSpeed: 3,
      maxSpeed: 6,
    });

    for (const particle of particles) {
      const speed = Math.hypot(particle.vx, particle.vy);
      expect(speed).toBeGreaterThanOrEqual(2.99);
      expect(speed).toBeLessThanOrEqual(6.01);
    }
  });

  it("paints only with the brand palette", () => {
    const particles = createBurst(0, 0, { count: 60 });

    expect(
      particles.every((p) => BURST_COLORS.includes(p.color as never)),
    ).toBe(true);
  });

  it("scatters in every direction rather than in one", () => {
    const particles = createBurst(0, 0, { count: 200 });

    expect(particles.some((p) => p.vx > 0)).toBe(true);
    expect(particles.some((p) => p.vx < 0)).toBe(true);
    expect(particles.some((p) => p.vy > 0)).toBe(true);
    expect(particles.some((p) => p.vy < 0)).toBe(true);
  });

  it("is reproducible when the randomness is", () => {
    const options = { count: 5, random: sequence([0.1, 0.4, 0.7, 0.2]) };

    expect(createBurst(0, 0, options)).toEqual(
      createBurst(0, 0, { count: 5, random: sequence([0.1, 0.4, 0.7, 0.2]) }),
    );
  });
});

describe("stepParticles", () => {
  const particle = (overrides: Partial<Particle> = {}): Particle => ({
    x: 0,
    y: 0,
    vx: 4,
    vy: -4,
    size: 3,
    color: "#8b1e24",
    life: 10,
    maxLife: 10,
    ...overrides,
  });

  it("moves each shard along its own velocity", () => {
    const [moved] = stepParticles([particle()]);

    expect(moved.x).toBe(4);
    expect(moved.y).toBe(-4);
  });

  it("pulls them down and slows them as they fly", () => {
    const [moved] = stepParticles([particle()]);

    expect(moved.vx).toBeLessThan(4);
    // Thrown upwards, gravity has already taken a bite out of the climb.
    expect(moved.vy).toBeGreaterThan(-4);
  });

  it("eventually turns the throw around", () => {
    let particles = [particle({ life: 100, maxLife: 100 })];
    for (let frame = 0; frame < 30; frame += 1) {
      particles = stepParticles(particles);
    }

    expect(particles[0].vy).toBeGreaterThan(0);
  });

  it("drops the shards whose life has run out", () => {
    const alive = stepParticles([particle({ life: 1 }), particle({ life: 5 })]);

    expect(alive).toHaveLength(1);
  });

  it("leaves the array it was given untouched", () => {
    const original = particle();
    stepParticles([original]);

    expect(original.x).toBe(0);
    expect(original.vy).toBe(-4);
  });

  it("ends with nothing left, so the loop can stop", () => {
    let particles = createBurst(0, 0, { count: 30, maxLife: 40 });
    for (let frame = 0; frame < 60; frame += 1) {
      particles = stepParticles(particles);
    }

    expect(particles).toHaveLength(0);
  });
});

describe("opacityOf", () => {
  const base: Particle = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 3,
    color: "#8b1e24",
    life: 40,
    maxLife: 40,
  };

  it("stays solid over the first half of the flight", () => {
    expect(opacityOf(base)).toBe(1);
    expect(opacityOf({ ...base, life: 20 })).toBe(1);
  });

  it("fades away over the second half", () => {
    expect(opacityOf({ ...base, life: 10 })).toBeCloseTo(0.5);
    expect(opacityOf({ ...base, life: 1 })).toBeCloseTo(0.05);
  });
});
