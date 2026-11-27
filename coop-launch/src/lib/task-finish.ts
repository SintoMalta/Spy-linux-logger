/**
 * Fields written when a task is marked finished.
 * Typed result notes are stored in the same update. Omitting them leaves a
 * previously saved result in place.
 */
export function achievedTaskData(now: Date, resultNotes: string | undefined) {
  return {
    status: "ACHIEVED" as const,
    achievedAt: now,
    ...(resultNotes !== undefined ? { resultNotes } : {}),
  };
}

/** Body sent by the task card when the user clicks Mark task finished. */
export function finishTaskRequest(notes: string, dodComplete: boolean, reason: string) {
  return {
    resultNotes: notes,
    overrideReason: dodComplete ? undefined : reason,
  };
}
