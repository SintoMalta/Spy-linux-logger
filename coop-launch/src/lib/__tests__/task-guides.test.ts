import { describe, expect, it } from "vitest";
import { PROGRAMME_WEEKS } from "@/server/programme/programme-data";
import { guideForTask, hasDedicatedGuide, plainWeek } from "@/lib/task-guides";

describe("task coach guides", () => {
  it("gives every seeded programme task its own guide", () => {
    const titles = PROGRAMME_WEEKS.flatMap((week) => week.tasks.map((task) => task.title));
    expect(titles.length).toBeGreaterThan(0);

    for (const title of titles) {
      expect(hasDedicatedGuide(title), title).toBe(true);
      const guide = guideForTask(title);
      expect(guide.steps.length, title).toBeGreaterThan(0);
      expect(guide.meaning, title).not.toBe(
        "Complete this programme step and save what you produced.",
      );
    }
  });

  it("keeps an unknown task on the generic guide", () => {
    const guide = guideForTask("This task is not in the programme");
    expect(hasDedicatedGuide("This task is not in the programme")).toBe(false);
    expect(guide.plainTitle).toBe("This task is not in the programme");
    expect(guide.meaning).toBe("Complete this programme step and save what you produced.");
  });

  it("describes week 8 as three money cases and week 9 as the go decision", () => {
    const week8 = plainWeek(8, "Economic Feasibility");
    expect(week8.meaning).toMatch(/cautious/i);
    expect(week8.meaning).toMatch(/base/i);
    expect(week8.meaning).toMatch(/upside/i);
    expect(week8.title.toLowerCase()).not.toContain("member value");

    const week9 = plainWeek(9, "Go / Conditional / No-go");
    expect(week9.title.toLowerCase()).toContain("go");
    expect(week9.title.toLowerCase()).not.toContain("member value");
    expect(week9.meaning).toMatch(/NO_GO/);
    expect(week9.meaning.toLowerCase()).not.toContain("member value");

    const decision = guideForTask("Record go decision");
    expect(decision.meaning).toMatch(/NO_GO/);
    expect(decision.putResultHere).toMatch(/GO, CONDITIONAL_GO, or NO_GO/);
  });

  it("describes week 12 as registration preparation, with submission recorded only when verified", () => {
    const week12 = plainWeek(12, "Registration Preparation");
    expect(week12.title.toLowerCase()).toContain("registration");
    expect(week12.title.toLowerCase()).not.toContain("go / no-go");
    expect(week12.meaning.toLowerCase()).toContain("verified");

    const verify = guideForTask("Verify submission");
    expect(verify.meaning.toLowerCase()).toContain("verified");
    expect(verify.doneLooksLike.toLowerCase()).toContain("verified submission");
    expect(verify.steps.join(" ").toLowerCase()).toContain("does not infer");
  });
});
