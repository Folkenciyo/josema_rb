import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { DayOfWeek } from "@/types/common";

import { TrainingDayJump, dayAnchorId } from "./training-day-jump";

function day(day_of_week: DayOfWeek, exercises: number) {
  return { day_of_week, exercises: Array.from({ length: exercises }) };
}

describe("TrainingDayJump", () => {
  it("lists only the days that have exercises, with their count", () => {
    render(
      <TrainingDayJump
        days={[day("monday", 12), day("tuesday", 0), day("thursday", 9)]}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Lun12",
      "Jue9",
    ]);
  });

  it("is not drawn for a week with a single training day", () => {
    render(<TrainingDayJump days={[day("monday", 5), day("friday", 0)]} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("scrolls to the day that is tapped", async () => {
    const thursday = document.createElement("section");
    thursday.id = dayAnchorId("thursday");
    thursday.scrollIntoView = jest.fn();
    document.body.appendChild(thursday);

    render(<TrainingDayJump days={[day("monday", 3), day("thursday", 4)]} />);
    await userEvent.click(screen.getByRole("button", { name: /Jue/ }));

    expect(thursday.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    thursday.remove();
  });
});
