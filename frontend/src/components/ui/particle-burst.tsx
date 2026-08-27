"use client";

import { useEffect, useRef } from "react";

import {
  createBurst,
  opacityOf,
  stepParticles,
  type Particle,
} from "@/lib/particles/burst";

interface ParticleBurstProps {
  /** Viewport coordinates. Left out, it goes off in the middle of the screen. */
  x?: number;
  y?: number;
  /** Called once the last shard is gone, so the caller can move on. */
  onDone?: () => void;
}

/** Enough speed for the fastest shards to reach the edges of this screen. */
function speedFor(width: number, height: number): number {
  return Math.max(11, Math.min(width, height) / 40);
}

/**
 * A short burst of shards over the whole viewport: what deleting something for
 * good looks like. Purely decorative, so it never gets in the way of a pointer
 * and it never delays anything on its own — the caller decides what waits.
 */
export function ParticleBurst({ x, y, onDone }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read inside the animation rather than listed as a dependency: a caller that
  // rebuilds the callback each render must not restart the burst.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const finish = () => onDoneRef.current?.();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      finish();
      return;
    }

    // Someone who asked for less motion gets none of this, and no waiting either.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const { innerWidth: width, innerHeight: height } = window;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);

    let particles: Particle[] = createBurst(x ?? width / 2, y ?? height / 2, {
      count: 220,
      maxSpeed: speedFor(width, height),
    });
    let frame = 0;

    const draw = () => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        context.globalAlpha = opacityOf(particle);
        context.fillStyle = particle.color;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      context.globalAlpha = 1;

      particles = stepParticles(particles);

      if (particles.length === 0) {
        finish();
        return;
      }
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [x, y]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] size-full"
    />
  );
}
