# CoopLaunch Malta — Data Model

Prisma is the schema source of truth (`prisma/schema.prisma`). This document summarises entities, enums, relations, soft-delete, and audit expectations.

## Conventions

- IDs: `cuid()` strings.
- Timestamps: `createdAt`, `updatedAt`.
- Soft-delete: `deletedAt DateTime?` on important business records; default filters exclude deleted.
- Audit: `AuditLog` rows for status, gate, assumption, permission, and decision changes (append-only).
- Money: `Decimal` with currency code where needed; never float.

## Enums

| Enum | Values |
|------|--------|
| Role | COORDINATOR, INDUSTRY_FOUNDER, FOUNDING_MEMBER, ADVISER, READ_ONLY, ADMIN |
| TaskStatus | NOT_STARTED, IN_PROGRESS, BLOCKED, ACHIEVED, CANCELLED |
| GateCriterionType | BOOLEAN, NUMERIC_MIN, REQUIRED_DOCUMENT, REQUIRED_REVIEW, REQUIRED_EXTERNAL_ANSWER, MANUAL_APPROVAL |
| OrgPersonStatus | ACTIVE, CONTACTED, QUALIFIED, NURTURE, DO_NOT_PURSUE, ARCHIVED |
| AssumptionConfidence | VERIFIED, ESTIMATE, ASSUMPTION |
| FounderActionType | DONE, COMMENT, CALL_NESLI, DEFER |
| FounderActionStatus | OPEN, DONE, DEFERRED, CANCELLED |
| AdviceStatus | OPEN, IN_PROGRESS, ACCEPTED, DECLINED, DEFERRED |
| RiskStatus | OPEN, MITIGATING, CLOSED, ACCEPTED |
| RegistrationPriority | MANDATORY, IMPORTANT, OPTIONAL |

## Identity

- **User** — email (unique), name, passwordHash, role, active, deletedAt
- **Session** — tokenHash, userId, expiresAt, ip, userAgent
- **TotpCredential** — optional MFA stub (schema ready; not enforced in MVP)
- **LoginAttempt** — email/ip + timestamp for rate limiting

## Programme

- **Stage** — weekNumber (1–12), title, description, order, status
- **Task** — stageId, title, description, status, ownerUserId?, dueAt?, achievedAt?
- **TaskChecklistItem** — taskId, label, done, order
- **DefinitionOfDoneCriterion** — taskId, label, satisfied, order
- **TaskDependency** — taskId, dependsOnTaskId
- **DailyPlan** — userId, date, notes, plannedMinutes
- **DailyPlanItem** — planId, taskId?, title, minutes, done
- **TimeEntry** — userId, taskId?, minutes, note, spentAt

## Gates

- **Gate** — stageId (unique), title, description
- **GateCriterion** — gateId, type, label, targetValue?, satisfied, evidenceNote?
- **GateReview** — gateId, reviewerId, summary, passed, reviewedAt
- **GateOverride** — gateId, authoriserId, reason, createdAt (immutable; no update/delete API)

## CRM & interviews

- **Organisation** — name, sector, status (incl. DO_NOT_PURSUE), notes, soft-delete
- **Person** — organisationId?, name, email?, phone?, roleTitle?, status, notes
- **Communication** — personId?/organisationId?, channel, summary, occurredAt, userId
- **InterviewTemplate** — name, description
- **InterviewTemplateQuestion** — templateId, prompt, kind (TEXT|NUMBER|BOOLEAN|TAG|CONFIDENTIAL_FINANCIAL), order
- **Interview** — templateId, organisationId?, personId?, interviewerId, conductedAt
- **InterviewAnswer** — interviewId, questionId, valueText?, valueNumber?, valueBool?, confidential
- **ProblemTag** — name (unique)
- **InterviewAnswerTag** — answerId, tagId
- **FounderAssessment** — subjectUserId?, title, positiveNotes, redFlagPrompts, evidenceNotes, status

## Economic

- **Supplier** — name, category, contact, notes
- **SupplierOffer** — supplierId, description, unitPrice?, currency, confidentialMemberScope?, notes, assumptionConfidence
- **FinancialAssumption** — key, label, value, unit?, confidence, scenario?, notes
- **MemberValueStatement** — memberLabel, inputsJson, resultJson, calculatedAt, createdById

## Governance

- **AdviceItem** — category, title, body, status, adviserId?, soft-delete
- **Meeting** — title, scheduledAt, location?, notes, soft-delete
- **MeetingAttendee** — meetingId, userId / personId
- **Decision** — meetingId?, title, body, decidedAt, decidedById — **immutable after create**
- **Risk** — title, probability, impact, rating, mitigation, ownerId?, trigger, status
- **Document** — key, filename, mimeType, size, sha256, version, visibility, linkedType?, linkedId?, uploadedById
- **Template** — code (unique), name, body, category (§31–32 seeds)

## Registration & comms

- **RegistrationRequirement** — code, title, description, priority, evidenceDocumentId?, completed
- **FounderActionRequest** — title, detail, assigneeId, status, lastAction, comment?
- **Notification** — userId, title, body, readAt?
- **WeeklyReport** — weekNumber, body, authoredById, publishedAt?
- **AuditLog** — actorId?, action, entityType, entityId, beforeJson?, afterJson?, createdAt

## Relation highlights

- Stage 1—n Task; Stage 1—1 Gate; Gate 1—n Criterion / Review / Override
- Task 1—n DoD / Checklist; Task n—n via TaskDependency
- Organisation 1—n Person; Interview → Answers → optional ProblemTags
- Document polymorphic link via linkedType + linkedId

## Seed expectations

- Users: Nesli (COORDINATOR), Industry Founder, Adviser, Admin
- Full 12-week stages/tasks/DoD/gates
- Fictional organisations/people
- Sample supplier + offers
- Registration checklist with ≥1 mandatory item
- Templates §31–32 exact copy
