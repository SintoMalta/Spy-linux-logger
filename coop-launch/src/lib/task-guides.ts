/**
 * Plain-language coach text for each programme task.
 * Keyed by exact seeded task title.
 */
export type TaskGuide = {
  plainTitle: string;
  meaning: string;
  steps: string[];
  putResultHere: string;
  doneLooksLike: string;
  openHref?: string;
  openLabel?: string;
};

const GUIDES: Record<string, TaskGuide> = {
  "Charter draft started": {
    plainTitle: "Start a short co-op charter draft",
    meaning:
      "Write a one-page note: why this co-op, who it is for, and what “good evidence” means for the pilot.",
    steps: [
      "Open Your notes (right side) or Decisions & docs.",
      "Write: purpose, who benefits, and what counts as proof this week.",
      "Paste the draft into the Result box below and save.",
      "Tick the checklist, then mark the task finished.",
    ],
    putResultHere: "Paste the charter draft text (or a short summary + file name if uploaded).",
    doneLooksLike: "A short draft exists and is saved in the Result box.",
    openHref: "/my-notes",
    openLabel: "Open Your notes",
  },
  "Working rhythm agreed": {
    plainTitle: "Agree how you and the founder will work each week",
    meaning: "Decide meeting rhythm, who does what, and how you share updates.",
    steps: [
      "Talk with the founder (or send a Founder ask).",
      "Write: meeting day/time, update method, and response time.",
      "Save that agreement in the Result box.",
      "Tick checklist → Mark task finished.",
    ],
    putResultHere: "Write the agreed rhythm (e.g. weekly call Monday 10:00, updates in Founder asks).",
    doneLooksLike: "Both of you know when you meet and how you update each other.",
    openHref: "/founder",
    openLabel: "Open Founder asks",
  },
  "CRM seeded with target list": {
    plainTitle: "Add the first companies and people to Contacts",
    meaning: "Build the list of construction companies/people you plan to talk to.",
    steps: [
      "Open Contacts.",
      "Add company → then Add person (name, role, email if known).",
      "Aim for a small real list (even 5–10 is fine to start).",
      "In Result, write how many you added and who is first to call.",
    ],
    putResultHere: "Example: Added 8 companies. First calls: ABC Builders, XYZ Electrical.",
    doneLooksLike: "Contacts is no longer empty and has real construction targets.",
    openHref: "/crm",
    openLabel: "Open Contacts",
  },
  "Interview plan approved": {
    plainTitle: "Write who to interview and in what order",
    meaning: "Make a simple interview plan the founder can agree with.",
    steps: [
      "From Contacts, pick who to interview first.",
      "Write 3–5 questions you will ask.",
      "Send plan to founder via Founder asks if needed.",
      "Save the plan in Result, then finish the task.",
    ],
    putResultHere: "List interviewees + order + main questions.",
    doneLooksLike: "A clear interview order exists and is agreed (or founder asked).",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Log first interview set": {
    plainTitle: "Save the first real interview notes",
    meaning: "After each talk, record what the person actually said.",
    steps: [
      "Open Interviews.",
      "Choose company, write the problem they described, add a short topic label.",
      "Save.",
      "In Result, list who you interviewed.",
    ],
    putResultHere: "Names/companies interviewed and date.",
    doneLooksLike: "At least one interview is saved in Interviews.",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Tag recurring problems": {
    plainTitle: "Label common problems from interviews",
    meaning: "Use short topic labels so patterns show up (e.g. late payments, materials cost).",
    steps: [
      "Open Interviews and review Common problems.",
      "Make sure each interview has a short topic label.",
      "In Result, list the top 3 recurring topics.",
    ],
    putResultHere: "Top recurring problem labels and how often they appear.",
    doneLooksLike: "Common problems list shows repeated tags.",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Build Problem Matrix view": {
    plainTitle: "Make a simple problem matrix",
    meaning: "Turn interview tags into a ranked list of problems (no confidential prices).",
    steps: [
      "Look at Common problems in Interviews.",
      "Write a table: problem → how often → how painful (your words).",
      "Save that table in Result (or upload a file in Decisions & docs and name it here).",
    ],
    putResultHere: "Paste the matrix or say where the file was uploaded.",
    doneLooksLike: "You can show the founder a ranked problem list.",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Rank top problems with evidence": {
    plainTitle: "Pick the top problems with evidence",
    meaning: "Choose the most important problems and point to interview evidence.",
    steps: [
      "From your matrix, pick top 3–5 problems.",
      "For each, note which interview/company supports it (no secret prices).",
      "Save ranking in Result.",
    ],
    putResultHere: "Top problems + evidence links (interview names).",
    doneLooksLike: "A short ranked list ready for founder review.",
  },
  "Draft FounderAssessment": {
    plainTitle: "Draft careful founder-fit notes",
    meaning: "Write discussion notes about strengths and open questions — not a final judgment.",
    steps: [
      "Use Your notes or Decisions & docs.",
      "Write strengths, questions to explore, and evidence sources.",
      "Keep language careful and provisional.",
      "Paste draft into Result.",
    ],
    putResultHere: "Draft founder-fit notes.",
    doneLooksLike: "A careful draft exists for discussion.",
    openHref: "/my-notes",
    openLabel: "Open Your notes",
  },
  "Capture evidence notes": {
    plainTitle: "Attach evidence notes to the founder draft",
    meaning: "Link claims to interviews, meetings, or documents.",
    steps: [
      "List each claim and where the evidence is.",
      "Upload supporting files in Decisions & docs if needed.",
      "Save the evidence list in Result.",
    ],
    putResultHere: "Evidence list (claim → source).",
    doneLooksLike: "Draft claims point to real sources.",
    openHref: "/governance",
    openLabel: "Open Decisions & docs",
  },
  "Option shortlist documented": {
    plainTitle: "Write a shortlist of solution options",
    meaning: "List 2–4 possible ways the co-op could help members.",
    steps: [
      "Based on top problems, write option A/B/C in plain words.",
      "Note pros/cons briefly.",
      "Save shortlist in Result.",
    ],
    putResultHere: "Option shortlist with one-line pros/cons.",
    doneLooksLike: "Founder can see clear options.",
  },
  "Evidence attached to options": {
    plainTitle: "Link evidence to each option",
    meaning: "Show why each option is on the list.",
    steps: [
      "For each option, add interview/document evidence.",
      "Upload files if needed.",
      "Save links in Result.",
    ],
    putResultHere: "Option → evidence mapping.",
    doneLooksLike: "Every option has at least one evidence note.",
    openHref: "/governance",
    openLabel: "Open Decisions & docs",
  },
  "Identify suppliers": {
    plainTitle: "List possible suppliers to compare",
    meaning: "Find suppliers relevant to the chosen problems/options.",
    steps: [
      "Add supplier names in Money & value / notes.",
      "Prefer construction-relevant suppliers.",
      "Save the list in Result.",
    ],
    putResultHere: "Supplier names + what they supply.",
    doneLooksLike: "A starter supplier list exists.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Capture comparable offers": {
    plainTitle: "Capture comparable supplier offers",
    meaning: "Record like-for-like offers without leaking private member prices.",
    steps: [
      "Collect offer summaries (ranges OK if needed).",
      "Note date and source.",
      "Save comparison notes in Result.",
    ],
    putResultHere: "Offer comparison notes.",
    doneLooksLike: "At least one comparable set is recorded.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Record labelled assumptions": {
    plainTitle: "Write money assumptions with clear labels",
    meaning: "List assumptions (fees, discounts, volumes) and label them as assumptions.",
    steps: [
      "Open Money & value.",
      "Write each assumption and label it clearly.",
      "Save in Result.",
    ],
    putResultHere: "Labelled assumptions list.",
    doneLooksLike: "Assumptions are written and labelled.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Build scenario A/B": {
    plainTitle: "Build two simple money scenarios",
    meaning: "Show a cautious case and a better case using the labelled assumptions.",
    steps: [
      "Scenario A = cautious, Scenario B = better case.",
      "Use the same assumption labels.",
      "Save both in Result.",
    ],
    putResultHere: "Scenario A and B summaries.",
    doneLooksLike: "Two scenarios exist for discussion.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Draft MemberValueStatement": {
    plainTitle: "Draft what a member might gain",
    meaning: "Write a plain member-value statement from the labelled numbers.",
    steps: [
      "Open Money & value.",
      "Draft what a typical member might gain and any fees.",
      "Save draft in Result.",
    ],
    putResultHere: "Member value draft text.",
    doneLooksLike: "A draft members can understand exists.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Review with founder": {
    plainTitle: "Review member value with the founder",
    meaning: "Get founder comments before treating the draft as ready.",
    steps: [
      "Send a Founder ask with the draft.",
      "Write their feedback in Result.",
      "Update draft if needed.",
    ],
    putResultHere: "Founder feedback summary.",
    doneLooksLike: "Founder has seen the draft and feedback is saved.",
    openHref: "/founder",
    openLabel: "Open Founder asks",
  },
  "Advice register current": {
    plainTitle: "Keep the advice list up to date",
    meaning: "Log adviser questions/answers in Decisions & docs.",
    steps: [
      "Open Decisions & docs.",
      "Add advice items for open questions.",
      "Update status when answered.",
      "Summarise in Result.",
    ],
    putResultHere: "List of open/closed advice items.",
    doneLooksLike: "Advice list matches reality.",
    openHref: "/governance",
    openLabel: "Open Decisions & docs",
  },
  "Risks and decisions updated": {
    plainTitle: "Update risks and decisions",
    meaning: "Record important risks and locked decisions.",
    steps: [
      "Review risks and decisions in Decisions & docs.",
      "Add any new decision that was made.",
      "Note changes in Result.",
    ],
    putResultHere: "What changed in risks/decisions.",
    doneLooksLike: "Current risks/decisions are visible in the app.",
    openHref: "/governance",
    openLabel: "Open Decisions & docs",
  },
  "Open registration checklist": {
    plainTitle: "Open and review the registration checklist",
    meaning: "Know every item needed before legal registration.",
    steps: [
      "Open Register co-op.",
      "Read each checklist item.",
      "Note blockers in Result.",
    ],
    putResultHere: "Blockers and next documents needed.",
    doneLooksLike: "You know what registration still needs.",
    openHref: "/registration",
    openLabel: "Open Register co-op",
  },
  "List mandatory blockers": {
    plainTitle: "List mandatory registration blockers",
    meaning: "Write what must be done before registration can proceed.",
    steps: [
      "From Register co-op, list required items still not done.",
      "Assign who will get each document.",
      "Save blocker list in Result.",
    ],
    putResultHere: "Mandatory blockers + owners.",
    doneLooksLike: "A clear blocker list exists.",
    openHref: "/registration",
    openLabel: "Open Register co-op",
  },
  "Run final gate review": {
    plainTitle: "Run the final week review",
    meaning: "Check whether the pilot evidence supports go / conditional / no-go.",
    steps: [
      "Review unfinished tasks and registration %.",
      "Write recommendation draft with the founder.",
      "Save recommendation in Result.",
    ],
    putResultHere: "Go / conditional / no-go draft + reasons.",
    doneLooksLike: "A clear recommendation is written.",
  },
  "Confirm registration readiness": {
    plainTitle: "Confirm registration readiness",
    meaning: "Check Register co-op % and required files one last time.",
    steps: [
      "Open Register co-op.",
      "Confirm required items have files attached.",
      "Write readiness summary in Result.",
    ],
    putResultHere: "Ready / not ready + missing items.",
    doneLooksLike: "Readiness status is explicit and evidence-backed.",
    openHref: "/registration",
    openLabel: "Open Register co-op",
  },
};

const WEEK_PLAIN: Record<number, { title: string; meaning: string }> = {
  1: {
    title: "Week 1 — Get aligned",
    meaning: "Agree why you are doing this and how you will work together.",
  },
  2: {
    title: "Week 2 — Who to talk to",
    meaning: "Build your Contacts list and interview plan.",
  },
  3: {
    title: "Week 3 — Listen and record",
    meaning: "Do interviews and save what people actually say.",
  },
  4: {
    title: "Week 4 — Find the big problems",
    meaning: "Turn interview notes into a ranked problem list.",
  },
  5: {
    title: "Week 5 — Founder fit notes",
    meaning: "Careful notes on strengths and open questions.",
  },
  6: {
    title: "Week 6 — Solution options",
    meaning: "Shortlist ways the co-op could help, with evidence.",
  },
  7: {
    title: "Week 7 — Supplier scan",
    meaning: "Find and compare relevant supplier offers.",
  },
  8: {
    title: "Week 8 — Money assumptions",
    meaning: "Write labelled assumptions and two scenarios.",
  },
  9: {
    title: "Week 9 — Member value",
    meaning: "Draft what a member might gain; review with founder.",
  },
  10: {
    title: "Week 10 — Governance pack",
    meaning: "Keep advice, risks, and decisions current.",
  },
  11: {
    title: "Week 11 — Registration pack",
    meaning: "Open the registration checklist and list blockers.",
  },
  12: {
    title: "Week 12 — Go / no-go",
    meaning: "Final review: ready to register or not.",
  },
};

export function guideForTask(title: string): TaskGuide {
  return (
    GUIDES[title] ?? {
      plainTitle: title,
      meaning: "Complete this programme step and save what you produced.",
      steps: [
        "Read the task title carefully.",
        "Do the work in the matching menu (Contacts, Interviews, docs, etc.).",
        "Write your result in the Result box and save.",
        "Tick the checklist, then mark the task finished.",
      ],
      putResultHere: "Write what you produced for this task.",
      doneLooksLike: "Result is saved and checklist is ticked.",
    }
  );
}

export function plainWeek(weekNumber: number, fallbackTitle: string) {
  return WEEK_PLAIN[weekNumber] ?? { title: `Week ${weekNumber} — ${fallbackTitle}`, meaning: fallbackTitle };
}
