/**
 * Plain-language coach text for each programme task.
 * Keyed by the exact task title in PROGRAMME_WEEKS.
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
  "Draft programme charter": {
    plainTitle: "Start a short co-op charter draft",
    meaning:
      "Write a one-page note: why this co-op, who it is for, and what good evidence means for the pilot.",
    steps: [
      "Open Your notes or Decisions & docs.",
      "Write the purpose, who benefits, and what counts as proof this week.",
      "Paste the draft into the Result box and save.",
      "Tick the checklist, then mark the task finished.",
    ],
    putResultHere: "Paste the charter draft text (or a short summary plus the file name if you uploaded it).",
    doneLooksLike: "A short draft exists and is saved in the Result box.",
    openHref: "/my-notes",
    openLabel: "Open Your notes",
  },
  "Agree working rhythm": {
    plainTitle: "Agree how you and the founder will work each week",
    meaning: "Decide the meeting rhythm, who does what, and how you share updates.",
    steps: [
      "Talk with the founder, or send a Founder ask.",
      "Write the meeting day and time, the update method, and the response time.",
      "Save that agreement in the Result box.",
      "Tick the checklist, then mark the task finished.",
    ],
    putResultHere: "Write the agreed rhythm (for example a weekly call and updates in Founder asks).",
    doneLooksLike: "Both of you know when you meet and how you update each other.",
    openHref: "/founder",
    openLabel: "Open Founder asks",
  },
  "Seed construction CRM targets": {
    plainTitle: "Add the first companies and people to Contacts",
    meaning: "Build the list of construction companies and people you plan to talk to.",
    steps: [
      "Open Contacts.",
      "Add a company, then add a person (name, role, email if known).",
      "Aim for at least five organisations, with follow-ups on the priority contacts.",
      "In Result, write how many you added and who you will call first.",
    ],
    putResultHere: "Example: Added 8 companies. First calls: ABC Builders, XYZ Electrical.",
    doneLooksLike: "Contacts has real construction targets and follow-ups on the priority ones.",
    openHref: "/crm",
    openLabel: "Open Contacts",
  },
  "Approve interview plan": {
    plainTitle: "Write who to interview and in what order",
    meaning: "Make a simple interview plan the founder can agree with.",
    steps: [
      "From Contacts, pick who to interview first.",
      "Write the questions you will ask.",
      "Send the plan to the founder via Founder asks if you need agreement.",
      "Save the plan in Result, then finish the task.",
    ],
    putResultHere: "List the interviewees, the order, and the main questions.",
    doneLooksLike: "A clear interview order exists and the founder has confirmed the target list.",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Complete discovery interviews": {
    plainTitle: "Save the discovery interview notes",
    meaning: "After each talk, record what the person actually said.",
    steps: [
      "Open Interviews.",
      "Choose the company, write the problem they described, and add a short topic label.",
      "Mark the interview completed and save notes for each one.",
      "In Result, list who you interviewed. Aim for at least three completed interviews.",
    ],
    putResultHere: "Names and companies interviewed, with the date of each talk.",
    doneLooksLike: "At least three interviews are saved as completed, with notes.",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Tag recurring problems": {
    plainTitle: "Label common problems from interviews",
    meaning: "Use short topic labels so patterns show up (for example late payments or materials cost).",
    steps: [
      "Open Interviews and review the common problems.",
      "Make sure each completed interview has a short topic label.",
      "Keep confidential finance out of the tags.",
      "In Result, list the top recurring topics.",
    ],
    putResultHere: "Top recurring problem labels and how often they appear.",
    doneLooksLike: "Completed interviews have topic labels, and the common problems list shows repeats.",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Build Problem Matrix": {
    plainTitle: "Make a ranked problem matrix",
    meaning: "Turn interview tags into a ranked list of problems, with the evidence that supports each one.",
    steps: [
      "Look at common problems in Interviews. Use completed interviews only.",
      "Write a table: problem, how often it appears, and how painful it is, in your own words.",
      "Rank the top problems and note which interview supports each one.",
      "Review the matrix with the founder, then save it in Result or name the uploaded file.",
    ],
    putResultHere: "Paste the ranked matrix, or say where the file was uploaded.",
    doneLooksLike: "The founder can see a ranked problem list backed by interview evidence.",
    openHref: "/interviews",
    openLabel: "Open Interviews",
  },
  "Draft founder assessments": {
    plainTitle: "Draft careful founder-fit notes",
    meaning: "Write discussion notes about strengths and open questions, with the evidence each claim uses.",
    steps: [
      "Use Your notes or Decisions & docs.",
      "Write strengths, questions to explore, and the interview or document each claim comes from.",
      "Keep the language careful and provisional.",
      "Invite the industry founder to review, then paste the draft into Result.",
    ],
    putResultHere: "Draft founder-fit notes, with each claim pointing at its source.",
    doneLooksLike: "At least one assessment exists, with evidence notes, and the founder has been invited to review it.",
    openHref: "/my-notes",
    openLabel: "Open Your notes",
  },
  "Document solution shortlist": {
    plainTitle: "Write a shortlist of solution options",
    meaning: "List a few ways the co-op could help, and show the evidence for each option.",
    steps: [
      "From the top problems, write the options in plain words.",
      "Add a short pro and con, and the interview or document that supports each option.",
      "Upload files in Decisions & docs if you need them.",
      "Save the shortlist in Result.",
    ],
    putResultHere: "Each option, a one-line pro and con, and the evidence it rests on.",
    doneLooksLike: "The founder can see clear options, and every option has an evidence note.",
    openHref: "/governance",
    openLabel: "Open Decisions & docs",
  },
  "Run supplier discussions": {
    plainTitle: "Log supplier discussions and offers",
    meaning: "Talk with materials suppliers and record the discussion plus any provisional offer.",
    steps: [
      "List the suppliers you will compare, relevant to the chosen problems.",
      "Log each discussion, with the date and source.",
      "Record at least one offer and label how confident you are in it.",
      "Save the comparison notes in Result. Leave private member prices out.",
    ],
    putResultHere: "Supplier names, discussion dates, and the offer summary with its confidence label.",
    doneLooksLike: "At least one supplier discussion and one labelled offer are recorded.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Enter financial assumptions": {
    plainTitle: "Write labelled money assumptions for three cases",
    meaning:
      "Enter startup, operating, membership, purchasing, and savings assumptions for the cautious, base, and upside cases.",
    steps: [
      "Open Money & value.",
      "Enter the same kinds of assumptions for CONSERVATIVE, BASE, and UPSIDE.",
      "Label every row VERIFIED, ESTIMATE, or ASSUMPTION.",
      "Save the set in Result.",
    ],
    putResultHere: "The three cases, with each assumption labelled.",
    doneLooksLike: "All three cases have assumptions, and every row has a confidence label.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Draft member value calculation": {
    plainTitle: "Draft what a member might gain",
    meaning: "Write a plain member-value statement from the labelled numbers, then review it with the founder.",
    steps: [
      "Open Money & value.",
      "Draft what a typical member might gain, including fees.",
      "Send the draft to the founder and write their feedback in Result.",
      "Update the draft if the feedback changes it.",
    ],
    putResultHere: "The member value draft and a short note of the founder review.",
    doneLooksLike: "A member value statement is saved and the founder has seen it.",
    openHref: "/economic",
    openLabel: "Open Money & value",
  },
  "Record go decision": {
    plainTitle: "Record go, conditional go, or no-go",
    meaning:
      "Write an explicit GO, CONDITIONAL_GO, or NO_GO decision with the reason. A NO_GO stops registration work.",
    steps: [
      "Review the evidence from the weeks so far with the founder.",
      "Choose one decision: GO, CONDITIONAL_GO, or NO_GO.",
      "Write the reason in the Result box and in the decision log.",
      "Save it before anyone starts registration work.",
    ],
    putResultHere: "The decision (GO, CONDITIONAL_GO, or NO_GO) and the rationale.",
    doneLooksLike: "The decision and the reason are both recorded.",
    openHref: "/governance",
    openLabel: "Open Decisions & docs",
  },
  "Bring governance pack current": {
    plainTitle: "Bring advice, risks, and decisions up to date",
    meaning: "Make the advice register, the risk list, and the decision log match what is true now.",
    steps: [
      "Open Decisions & docs.",
      "Update open advice items and rate the key risks.",
      "Finalise decisions that are ready to lock.",
      "Summarise what changed in Result.",
    ],
    putResultHere: "What changed in advice, risks, and decisions.",
    doneLooksLike: "Advice is updated, key risks are rated, and current decisions are visible.",
    openHref: "/governance",
    openLabel: "Open Decisions & docs",
  },
  "Complete registration checklist setup": {
    plainTitle: "Open the registration checklist and list blockers",
    meaning: "Make sure every checklist row exists, then write the mandatory items that still block registration.",
    steps: [
      "Open Register co-op and read each checklist item.",
      "Confirm the rows exist, with an owner and a date where you know them.",
      "List the mandatory items that are still open.",
      "Save that blocker list in Result.",
    ],
    putResultHere: "Mandatory blockers, each with an owner.",
    doneLooksLike: "The checklist rows exist and the mandatory blockers are listed on the readiness view.",
    openHref: "/registration",
    openLabel: "Open Register co-op",
  },
  "Attach mandatory registration evidence": {
    plainTitle: "Attach the mandatory registration files",
    meaning: "Put the required evidence on each mandatory checklist row so readiness can reach complete.",
    steps: [
      "Open Register co-op.",
      "Attach the file for each mandatory item (identity, statute, feasibility, declarations, and the rest of the list).",
      "Leave a row open until its file is actually attached.",
      "In Result, list anything still missing.",
    ],
    putResultHere: "Which mandatory items now have evidence, and which are still missing.",
    doneLooksLike: "Every mandatory requirement has evidence, so readiness can reach 100%.",
    openHref: "/registration",
    openLabel: "Open Register co-op",
  },
  "Verify submission": {
    plainTitle: "Record submission only after it is verified",
    meaning: "A finished checklist means the pack is ready. Record submission only after you have verified that it was submitted.",
    steps: [
      "Open Register co-op and check the mandatory files again.",
      "Confirm the pack was actually submitted.",
      "Record the verified submission yourself. The app does not infer it.",
      "Write the date and how you verified it in Result.",
    ],
    putResultHere: "Submitted or not yet submitted, the date, and how you verified it.",
    doneLooksLike: "An explicit verified submission is recorded by the coordinator.",
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
    meaning: "Write labelled assumptions for the cautious, base, and upside cases, and draft member value.",
  },
  9: {
    title: "Week 9 — Go / conditional / no-go",
    meaning: "Record GO, CONDITIONAL_GO, or NO_GO. A NO_GO stops registration work.",
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
    title: "Week 12 — Registration preparation",
    meaning: "Attach mandatory evidence, then record submission only after it is verified.",
  },
};

const GENERIC_MEANING = "Complete this programme step and save what you produced.";

export function hasDedicatedGuide(title: string): boolean {
  return Object.prototype.hasOwnProperty.call(GUIDES, title);
}

export function guideForTask(title: string): TaskGuide {
  return (
    GUIDES[title] ?? {
      plainTitle: title,
      meaning: GENERIC_MEANING,
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
