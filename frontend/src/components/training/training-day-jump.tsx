"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { DAY_LABELS, type DayOfWeek } from "@/types/common";

// Below the bar plus the gap a jump leaves above the day (its scroll margin).
const BAR_CLEARANCE = 120;

export function dayAnchorId(day: DayOfWeek): string {
  return `dia-${day}`;
}

interface TrainingDayJumpProps {
  days: { day_of_week: DayOfWeek; exercises: unknown[] }[];
}

/**
 * On a phone a four-day week is fourteen screens of scroll: this bar stays at
 * the top, says which day is on screen and jumps to any other in one tap.
 * Rest days are left out; they have nothing to edit and only crowd the bar.
 */
export function TrainingDayJump({ days }: TrainingDayJumpProps) {
  const trainingDays = days.filter((day) => day.exercises.length > 0);
  const [current, setCurrent] = useState<DayOfWeek | null>(
    trainingDays[0]?.day_of_week ?? null,
  );
  const dayKey = trainingDays.map((day) => day.day_of_week).join();

  useEffect(() => {
    const sections = dayKey
      .split(",")
      .filter(Boolean)
      .map((day) => document.getElementById(dayAnchorId(day as DayOfWeek)))
      .filter((section): section is HTMLElement => section !== null);

    // The day on screen is the last one whose top has passed under the bar.
    const pickCurrent = () => {
      const passed = sections.filter(
        (section) => section.getBoundingClientRect().top <= BAR_CLEARANCE,
      );
      const section = passed.at(-1) ?? sections[0];
      if (section) {
        setCurrent(section.id.replace("dia-", "") as DayOfWeek);
      }
    };

    pickCurrent();
    window.addEventListener("scroll", pickCurrent, { passive: true });
    return () => window.removeEventListener("scroll", pickCurrent);
  }, [dayKey]);

  if (trainingDays.length < 2) {
    return null;
  }

  return (
    <nav
      aria-label="Ir a un día"
      className="bg-surface/95 sticky top-0 z-20 flex [scrollbar-width:none] gap-1 overflow-x-auto border-b border-slate-200 py-1 backdrop-blur sm:hidden"
    >
      {trainingDays.map((day) => (
        <button
          key={day.day_of_week}
          type="button"
          aria-current={current === day.day_of_week ? "location" : undefined}
          onClick={() =>
            document
              .getElementById(dayAnchorId(day.day_of_week))
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className={cn(
            // Equal shares of the width; a day never shrinks under its label, and a
            // week too long for the phone scrolls with no bar to show for it.
            "h-11 flex-1 rounded-lg px-1 text-sm font-semibold whitespace-nowrap transition-colors",
            current === day.day_of_week
              ? "bg-inverse text-white"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {DAY_LABELS[day.day_of_week].slice(0, 3)}
          <span className="ml-1 font-normal opacity-70">
            {day.exercises.length}
          </span>
        </button>
      ))}
    </nav>
  );
}
