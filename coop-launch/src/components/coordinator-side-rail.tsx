import { NotesQuickCapture } from "@/components/notes-panel";
import { AppIssuesQuickCapture } from "@/components/app-issues-panel";

type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: string | Date;
};

type Issue = {
  id: string;
  title: string;
  body: string;
  pageOrTab: string;
  status: string;
  updatedAt: string | Date;
};

export function CoordinatorSideRail({
  notes,
  issues,
}: {
  notes: Note[];
  issues: Issue[];
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 p-4">
        <NotesQuickCapture recent={notes} />
      </section>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 p-4">
        <AppIssuesQuickCapture recent={issues} />
      </section>
    </aside>
  );
}
