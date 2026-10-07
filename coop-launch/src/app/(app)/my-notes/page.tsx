import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { listNotes } from "@/server/coordinator/notes";
import { NotesQuickCapture } from "@/components/notes-panel";
import { NoteDeleteButton } from "@/components/note-delete-button";

export default async function MyNotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const notes = await listNotes(user, 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Your notes
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Personal working notes. Save anytime; open this page whenever you need them.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 lg:max-w-xl">
        <NotesQuickCapture recent={[]} />
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Saved notes</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No notes yet — use the box above.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{n.title || "Untitled note"}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Updated {n.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                    </p>
                  </div>
                  <NoteDeleteButton noteId={n.id} />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
