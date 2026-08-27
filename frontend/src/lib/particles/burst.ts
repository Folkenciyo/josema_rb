/**
 * The physics behind the burst that plays when something is destroyed for good.
 * Kept apart from the canvas so it can be reasoned about — and tested — without
 * a drawing surface: every function here takes numbers and returns numbers.
 */

export interface Particle {
  x: number;
  y: number;
  /** Pixels per frame, at the 60 fps the loop is written for. */
  vx: number;
  vy: number;
  size: number;
  color: string;
  /** Counts down to zero; what is left of it is also the opacity. */
  life: number;
  maxLife: number;
}

export interface BurstOptions {
  count?: number;
  /** Slowest and fastest a shard leaves the centre. */
  minSpeed?: number;
  maxSpeed?: number;
  minLife?: number;
  maxLife?: number;
  colors?: readonly string[];
  /** Injected by the tests so a burst can be reproduced exactly. */
  random?: () => number;
}

/** Brand red breaking apart, with a little slate for the debris. */
export const BURST_COLORS = [
  "#8b1e24",
  "#b02a32",
  "#e0777c",
  "#f5c6c8",
  "#94a3b8",
] as const;

export const GRAVITY = 0.3;
/** Air: without it the shards fly off the screen in a straight line. */
export const FRICTION = 0.985;

export function createBurst(
  originX: number,
  originY: number,
  options: BurstOptions = {},
): Particle[] {
  const {
    count = 140,
    minSpeed = 2,
    maxSpeed = 11,
    minLife = 40,
    maxLife = 80,
    colors = BURST_COLORS,
    random = Math.random,
  } = options;

  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const speed = minSpeed + random() * (maxSpeed - minSpeed);
    const life = minLife + random() * (maxLife - minLife);

    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + random() * 3,
      color: colors[Math.floor(random() * colors.length)],
      life,
      maxLife: life,
    };
  });
}

/** One frame of flight. Returns a new array: nothing is moved in place. */
export function stepParticles(particles: Particle[]): Particle[] {
  return particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vx: particle.vx * FRICTION,
      vy: particle.vy * FRICTION + GRAVITY,
      life: particle.life - 1,
    }))
    .filter((particle) => particle.life > 0);
}

/** Fades out over the second half of a shard's life, so nothing pops out. */
export function opacityOf(particle: Particle): number {
  return Math.min(1, particle.life / (particle.maxLife / 2));
}
