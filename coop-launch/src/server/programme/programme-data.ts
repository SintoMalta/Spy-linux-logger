import type { GateCriterionType, GateMetricKey } from "@prisma/client";

export type SeedTask = {
  title: string;
  description: string;
  dod: string[];
};

export type SeedGateCriterion = {
  type: GateCriterionType;
  label: string;
  targetValue?: number;
  metricKey?: GateMetricKey;
  code?: string;
};

export type SeedWeek = {
  weekNumber: number;
  title: string;
  description: string;
  tasks: SeedTask[];
  gateTitle: string;
  gateDescription: string;
  criteria: SeedGateCriterion[];
};

/** Operational 12-week programme — Project Foundation → Registration Preparation */
export const PROGRAMME_WEEKS: SeedWeek[] = [
  {
    weekNumber: 1,
    title: "Project Foundation",
    description: "Align purpose, evidence standards, working rhythm, and charter draft.",
    tasks: [
      {
        title: "Draft programme charter",
        description: "Purpose, scope, evidence standard, non-promises.",
        dod: ["Charter draft filed as document", "Industry Founder reviewed charter language"],
      },
      {
        title: "Agree working rhythm",
        description: "4h daily plan structure and communication norms.",
        dod: ["Rhythm note recorded", "Founder action channel confirmed"],
      },
    ],
    gateTitle: "Week 1 — Foundation gate",
    gateDescription: "Charter started and rhythm agreed.",
    criteria: [
      { type: "REQUIRED_DOCUMENT", label: "Charter draft uploaded", code: "W1_CHARTER", metricKey: "NONE" },
      { type: "MANUAL_APPROVAL", label: "Coordinator confirms kick-off complete", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 2,
    title: "Stakeholder Mapping",
    description: "Build construction CRM map and interview plan.",
    tasks: [
      {
        title: "Seed construction CRM targets",
        description: "Electrical, plumbing, builders, materials — fictional demo ok.",
        dod: ["≥5 organisations in CRM", "Follow-ups set on priority contacts"],
      },
      {
        title: "Approve interview plan",
        description: "Structured construction interview topics agreed.",
        dod: ["Interview template published", "Founder confirmed target list"],
      },
    ],
    gateTitle: "Week 2 — Stakeholder gate",
    gateDescription: "CRM and interview plan ready.",
    criteria: [
      { type: "MANUAL_APPROVAL", label: "Interview plan approved", metricKey: "NONE" },
      { type: "NUMERIC_MIN", label: "At least 5 CRM organisations", targetValue: 5, metricKey: "ORGANISATION_COUNT" },
    ],
  },
  {
    weekNumber: 3,
    title: "Problem Discovery",
    description: "Run discovery interviews across trades.",
    tasks: [
      {
        title: "Complete discovery interviews",
        description: "Use structured template; mark COMPLETED.",
        dod: ["≥3 completed interviews", "Notes captured per interview"],
      },
      {
        title: "Tag recurring problems",
        description: "Apply problem tags without leaking confidential finance.",
        dod: ["Tags applied on completed interviews"],
      },
    ],
    gateTitle: "Week 3 — Discovery gate",
    gateDescription: "Interviews logged and tags started.",
    criteria: [
      { type: "NUMERIC_MIN", label: "≥3 completed interviews", targetValue: 3, metricKey: "INTERVIEW_COUNT" },
    ],
  },
  {
    weekNumber: 4,
    title: "Problem Matrix",
    description: "Aggregate problems. If <3 distinct problems → REDESIGN/NO-GO.",
    tasks: [
      {
        title: "Build Problem Matrix",
        description: "Aggregate from completed interviews only.",
        dod: ["Matrix reviewed with founder", "Top problems ranked with evidence"],
      },
    ],
    gateTitle: "Week 4 — Matrix gate",
    gateDescription: "Need ≥3 distinct problem tags or redesign.",
    criteria: [
      { type: "NUMERIC_MIN", label: "≥3 distinct problem tags", targetValue: 3, metricKey: "PROBLEM_TAG_COUNT" },
      { type: "MANUAL_APPROVAL", label: "Matrix review recorded", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 5,
    title: "Founder Fit",
    description: "Assess potential founders with careful language.",
    tasks: [
      {
        title: "Draft founder assessments",
        description: "On Person/Organisation — positive indicators + red-flag prompts.",
        dod: ["≥1 assessment with evidence notes", "Industry Founder review invited"],
      },
    ],
    gateTitle: "Week 5 — Founder fit gate",
    gateDescription: "Founder candidates identified.",
    criteria: [
      { type: "NUMERIC_MIN", label: "≥1 potential founder candidate", targetValue: 1, metricKey: "FOUNDER_CANDIDATE_COUNT" },
      { type: "MANUAL_APPROVAL", label: "Assessment language reviewed", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 6,
    title: "Solution Options",
    description: "Document cooperative solution options with evidence.",
    tasks: [
      {
        title: "Document solution shortlist",
        description: "Options linked to problem evidence.",
        dod: ["Options note filed", "Evidence links present"],
      },
    ],
    gateTitle: "Week 6 — Options gate",
    gateDescription: "Options documented.",
    criteria: [
      { type: "REQUIRED_DOCUMENT", label: "Options pack uploaded", code: "W6_OPTIONS", metricKey: "NONE" },
      { type: "MANUAL_APPROVAL", label: "Options accepted for economic work", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 7,
    title: "Supplier Scan",
    description: "Discuss with materials suppliers; capture offers.",
    tasks: [
      {
        title: "Run supplier discussions",
        description: "Log discussions and provisional offers.",
        dod: ["≥1 supplier discussion logged", "≥1 offer with confidence label"],
      },
    ],
    gateTitle: "Week 7 — Supplier gate",
    gateDescription: "Supplier engagement evidenced.",
    criteria: [
      { type: "NUMERIC_MIN", label: "≥1 supplier discussion", targetValue: 1, metricKey: "SUPPLIER_DISCUSSION_COUNT" },
      { type: "NUMERIC_MIN", label: "≥1 supplier offer", targetValue: 1, metricKey: "SUPPLIER_OFFER_COUNT" },
    ],
  },
  {
    weekNumber: 8,
    title: "Economic Feasibility",
    description: "Labelled assumptions across CONSERVATIVE/BASE/UPSIDE.",
    tasks: [
      {
        title: "Enter financial assumptions",
        description: "Startup, operating, membership, purchasing, savings.",
        dod: ["Assumptions present in all three scenarios", "Every row labelled VERIFIED|ESTIMATE|ASSUMPTION"],
      },
      {
        title: "Draft member value calculation",
        description: "Editable preliminary calcs.",
        dod: ["Member value statement saved"],
      },
    ],
    gateTitle: "Week 8 — Economics gate",
    gateDescription: "Assumptions labelled; calcs drafted.",
    criteria: [
      { type: "MANUAL_APPROVAL", label: "Economics pack reviewed", metricKey: "NONE" },
      { type: "REQUIRED_DOCUMENT", label: "Economics workbook/evidence", code: "W8_ECON", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 9,
    title: "Go / Conditional / No-go",
    description: "Record WEEK9 decision. NO_GO blocks registration work.",
    tasks: [
      {
        title: "Record go decision",
        description: "GO | CONDITIONAL_GO | NO_GO with rationale.",
        dod: ["Decision recorded in programme flags", "Rationale in meeting/decision log"],
      },
    ],
    gateTitle: "Week 9 — Decision gate",
    gateDescription: "Explicit go-path required.",
    criteria: [
      { type: "BOOLEAN", label: "Week 9 decision is GO or CONDITIONAL_GO", metricKey: "WEEK9_DECISION" },
      { type: "REQUIRED_REVIEW", label: "Decision review logged", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 10,
    title: "Governance Pack",
    description: "Advice, meetings, decisions, risks current.",
    tasks: [
      {
        title: "Bring governance pack current",
        description: "Advice register, risks, decisions.",
        dod: ["Advice items updated", "Key risks rated", "Immutable decisions finalised where needed"],
      },
    ],
    gateTitle: "Week 10 — Governance gate",
    gateDescription: "Governance artefacts present.",
    criteria: [
      { type: "MANUAL_APPROVAL", label: "Governance pack signed off", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 11,
    title: "Registration Pack",
    description: "Open full checklist; list mandatory blockers.",
    tasks: [
      {
        title: "Complete registration checklist setup",
        description: "All checklist rows present with owners/dates.",
        dod: ["Checklist rows exist", "Mandatory blockers listed on readiness view"],
      },
    ],
    gateTitle: "Week 11 — Registration pack gate",
    gateDescription: "Checklist open and blockers visible.",
    criteria: [
      { type: "MANUAL_APPROVAL", label: "Checklist reviewed", metricKey: "NONE" },
    ],
  },
  {
    weekNumber: 12,
    title: "Registration Preparation",
    description: "REGISTRATION_READY then REGISTRATION_SUBMITTED only after verified submission.",
    tasks: [
      {
        title: "Attach mandatory registration evidence",
        description: "IDs, statute, feasibility, declarations, etc.",
        dod: ["All mandatory requirements have evidence", "Readiness can reach 100%"],
      },
      {
        title: "Verify submission",
        description: "Never auto-infer submission.",
        dod: ["Explicit verified submission recorded by coordinator"],
      },
    ],
    gateTitle: "Week 12 — Registration readiness gate",
    gateDescription: "Ready ≠ submitted.",
    criteria: [
      { type: "MANUAL_APPROVAL", label: "Registration pack complete", metricKey: "NONE" },
      { type: "BOOLEAN", label: "Submission verified (manual flag)", metricKey: "REGISTRATION_SUBMITTED" },
    ],
  },
];

export const INTERVIEW_TOPICS: { topic: string; prompt: string; kind?: "TEXT" | "CONFIDENTIAL_FINANCIAL" | "TAG" }[] = [
  { topic: "purchasing", prompt: "How do you currently purchase materials?" },
  { topic: "supplier_terms", prompt: "What supplier terms cause the most friction?" },
  { topic: "labour", prompt: "What labour / subcontracting pressures affect you?" },
  { topic: "tendering", prompt: "How does tendering / quoting work for you today?" },
  { topic: "admin", prompt: "Where does admin overhead hurt most?" },
  { topic: "compliance", prompt: "Which compliance requirements are hardest?" },
  { topic: "equipment", prompt: "Equipment access or cost pain points?" },
  { topic: "cash_flow", prompt: "Cash flow timing issues? (no figures required here)" },
  { topic: "cooperation", prompt: "Openness to cooperating with other trades?" },
  { topic: "larger_projects", prompt: "Barriers to accessing larger projects?" },
  { topic: "governance", prompt: "Views on cooperative governance?" },
  { topic: "capital", prompt: "Approximate annual materials spend (confidential)", kind: "CONFIDENTIAL_FINANCIAL" },
  { topic: "objections", prompt: "Main objections to joining a cooperative?" },
  { topic: "tags", prompt: "Primary problem tag", kind: "TAG" },
];

export const REGISTRATION_CHECKLIST: {
  code: string;
  title: string;
  description: string;
  priority: "MANDATORY" | "IMPORTANT" | "OPTIONAL";
}[] = [
  { code: "NAME", title: "Proposed cooperative name", description: "Working name for registration", priority: "MANDATORY" },
  { code: "OFFICE", title: "Registered office address", description: "Malta address for filing", priority: "MANDATORY" },
  { code: "FOUNDERS", title: "Founding members list", description: "Names of founding members", priority: "MANDATORY" },
  { code: "IDS", title: "Founder identification documents", description: "ID evidence for founders", priority: "MANDATORY" },
  { code: "STATUTE", title: "Draft statute", description: "Cooperative statute draft", priority: "MANDATORY" },
  { code: "FEASIBILITY", title: "Feasibility summary", description: "Evidence-based feasibility note", priority: "MANDATORY" },
  { code: "VIABILITY", title: "Viability / economics summary", description: "Labelled assumptions pack", priority: "MANDATORY" },
  { code: "CAPITAL", title: "Capital contribution plan", description: "How capital will be raised", priority: "MANDATORY" },
  { code: "PAYMENTS", title: "Payment / banking arrangements", description: "Banking approach (provisional)", priority: "IMPORTANT" },
  { code: "PRESIDENT", title: "President nominee", description: "Proposed President", priority: "MANDATORY" },
  { code: "SECRETARY", title: "Secretary nominee", description: "Proposed Secretary", priority: "MANDATORY" },
  { code: "MC", title: "Management Committee nominees", description: "MC members", priority: "MANDATORY" },
  { code: "MINUTES", title: "Founding meeting minutes", description: "Minutes of founding decisions", priority: "MANDATORY" },
  { code: "DECLARATIONS", title: "Statutory declarations", description: "Required declarations", priority: "MANDATORY" },
  { code: "SIGNATURES", title: "Signature pages", description: "Signed forms", priority: "MANDATORY" },
  { code: "BOARD_CORR", title: "Board correspondence", description: "Correspondence with Board / authority", priority: "IMPORTANT" },
];
