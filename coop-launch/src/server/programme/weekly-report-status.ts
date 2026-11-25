export const WEEKLY_REPORT_DRAFT = "DRAFT";
export const WEEKLY_REPORT_FINAL = "FINAL";

/** Match the open draft only. A finalised report must stay final. */
export function weeklyReportDraftWhere(userId: string, weekNumber: number) {
  return {
    weekNumber,
    authoredById: userId,
    status: WEEKLY_REPORT_DRAFT,
  };
}

/** Fields written by Save draft and Finalise. */
export function weeklyReportPersist(body: string, finalise: boolean, now = new Date()) {
  return {
    body,
    status: finalise ? WEEKLY_REPORT_FINAL : WEEKLY_REPORT_DRAFT,
    publishedAt: finalise ? now : null,
  };
}
