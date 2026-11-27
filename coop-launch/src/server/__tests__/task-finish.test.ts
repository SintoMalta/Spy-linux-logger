import { describe, expect, it } from "vitest";
import { achievedTaskData, finishTaskRequest } from "@/lib/task-finish";

describe("finishing a task", () => {
  const now = new Date("2030-01-15T09:00:00.000Z");

  it("stores the typed result in the same update that marks the task finished", () => {
    expect(achievedTaskData(now, "Charter draft v1")).toEqual({
      status: "ACHIEVED",
      achievedAt: now,
      resultNotes: "Charter draft v1",
    });
  });

  it("leaves an already saved result alone when finish does not send notes", () => {
    expect(achievedTaskData(now, undefined)).toEqual({
      status: "ACHIEVED",
      achievedAt: now,
    });
  });

  it("sends the text still sitting in the result box when the task is finished", () => {
    const body = finishTaskRequest("Interview notes not saved yet", true, "");
    expect(body.resultNotes).toBe("Interview notes not saved yet");
    expect(JSON.parse(JSON.stringify(body))).toEqual({
      resultNotes: "Interview notes not saved yet",
    });
  });

  it("still sends the result when the checklist is finished with a reason", () => {
    expect(finishTaskRequest("Partial notes", false, "Founder away")).toEqual({
      resultNotes: "Partial notes",
      overrideReason: "Founder away",
    });
  });
});
