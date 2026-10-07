/** Nesli's main duties → where to work in the app */
export const NESLI_DUTIES = [
  {
    duty: "Organise contacts",
    where: "Contacts",
    href: "/crm",
    how: "Add companies and people; keep status up to date",
  },
  {
    duty: "Arrange interviews",
    where: "Contacts + Interviews",
    href: "/interviews",
    how: "Pick who to talk to in Contacts, then book/log in Interviews",
  },
  {
    duty: "Record what people actually say",
    where: "Interviews",
    href: "/interviews",
    how: "Save problem text, topic label, and extra notes",
  },
  {
    duty: "Keep documents organised",
    where: "Decisions & docs",
    href: "/governance",
    how: "Upload files; name them clearly",
  },
  {
    duty: "Follow the 12-week programme",
    where: "Your tasks + 12-week plan",
    href: "/programme",
    how: "Tick daily blocks; finish this week’s checklists",
  },
  {
    duty: "Follow up unanswered requests",
    where: "Founder asks + Home",
    href: "/founder",
    how: "See what is still Open; send new asks from Home",
  },
  {
    duty: "Collect evidence",
    where: "12-week plan + Decisions & docs + Register co-op",
    href: "/governance",
    how: "Upload proof files and attach them to registration items",
  },
  {
    duty: "Coordinate advisers",
    where: "Decisions & docs (Advice)",
    href: "/governance",
    how: "Add advice items and track status",
  },
  {
    duty: "Track decisions",
    where: "Decisions & docs",
    href: "/governance",
    how: "Record decisions (locked once saved)",
  },
  {
    duty: "Prepare information for the founder",
    where: "Founder asks + Your notes",
    href: "/founder",
    how: "Send clear asks; keep prep notes in Your notes",
  },
  {
    duty: "Registration preparation",
    where: "Register co-op",
    href: "/registration",
    how: "Work through the checklist and attach supporting files",
  },
] as const;
