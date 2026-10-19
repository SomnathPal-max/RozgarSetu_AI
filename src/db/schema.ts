import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mobile: text('mobile').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  dob: text('dob'), // YYYY-MM-DD
  qualificationLevel: text('qualification_level'), // 'below_secondary' | 'secondary' | 'higher_secondary' | 'diploma_iti' | 'graduate' | 'postgraduate'
  qualificationStream: text('qualification_stream'),
  category: text('category'), // 'SC' | 'ST' | 'OBC' | 'GEN' (optional per AGENTS.md rule 9)
  disability: text('disability'), // optional
  preferredDistrict: text('preferred_district'),
  language: text('language').notNull().default('en'), // 'en' | 'bn' | 'hi'
  role: text('role').notNull().default('user'), // 'user' | 'reviewer' | 'reviewer2' | 'admin'
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// 2. Sources (fictional)
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  bodyName: text('body_name').notNull(), // Fictional e.g. "Example Recruiting Body"
  url: text('url').notNull(),
  format: text('format').notNull().default('web'), // 'web' | 'pdf' | 'api'
  updateFrequency: text('update_frequency').notNull().default('daily'),
  permittedUseNote: text('permitted_use_note'),
});

// 3. Vacancies
export const vacancies = sqliteTable('vacancies', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'government' | 'msme'
  title: text('title').notNull(),
  orgName: text('org_name').notNull(), // Recruiting Body name
  area: text('area').notNull(), // e.g. "Durgapur area", "Asansol area", "All India", "State-wide"
  sourceId: text('source_id').references(() => sources.id),
  sourceUrl: text('source_url').notNull(),
  publishedOn: text('published_on').notNull(), // YYYY-MM-DD
  lastDate: text('last_date').notNull(), // YYYY-MM-DD
  lastCheckedAt: text('last_checked_at').notNull(), // ISO timestamp
  status: text('status').notNull().default('active'), // 'active' | 'expired' | 'under_review' | 'suspended'
  advertisedPayMin: integer('advertised_pay_min'),
  advertisedPayMax: integer('advertised_pay_max'),
  currentNoticeVersionId: text('current_notice_version_id'),
  // Production metadata
  noticeNumber: text('notice_number'), // Official gazette / recruitment notice number
  gazettePdfUrl: text('gazette_pdf_url'), // Link to full official notice PDF
  officialWebsiteUrl: text('official_website_url'), // Link to official recruiting body domain
  applicationPortalUrl: text('application_portal_url'), // Link to official online application portal
  feeGeneral: integer('fee_general').default(0), // Application fee in INR
  feeVaivedFor: text('fee_waived_for'), // e.g. "SC / ST / PwBD / Female candidates"
  examDateTentative: text('exam_date_tentative'), // Tentative exam month/year
  totalVacancies: integer('total_vacancies'),
  firstReviewerId: text('first_reviewer_id'),
  firstReviewedAt: text('first_reviewed_at'),
  secondReviewerId: text('second_reviewer_id'),
  secondReviewedAt: text('second_reviewed_at'),
  isSourceChecked: integer('is_source_checked', { mode: 'boolean' }).notNull().default(true),
});

// 4. Notice Versions
export const noticeVersions = sqliteTable('notice_versions', {
  id: text('id').primaryKey(),
  vacancyId: text('vacancy_id').notNull().references(() => vacancies.id),
  versionNo: integer('version_no').notNull().default(1),
  contentHash: text('content_hash').notNull(),
  snapshotJson: text('snapshot_json').notNull(), // JSON: { deadline, requirements, documents }
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  changeNote: text('change_note'),
});

// 4b. Corrigenda & Amendments
export const corrigenda = sqliteTable('corrigenda', {
  id: text('id').primaryKey(),
  vacancyId: text('vacancy_id').notNull().references(() => vacancies.id),
  corrigendumNumber: text('corrigendum_number').notNull(),
  amendmentType: text('amendment_type').notNull(), // 'deadline_extended' | 'age_relaxed' | 'vacancy_revised' | 'clarification'
  oldDeadline: text('old_deadline'),
  newDeadline: text('new_deadline'),
  summaryEn: text('summary_en').notNull(),
  summaryHi: text('summary_hi'),
  summaryBn: text('summary_bn'),
  pdfUrl: text('pdf_url'),
  publishedAt: text('published_at').notNull().default(new Date().toISOString()),
});

// 5. Rules
export const rules = sqliteTable('rules', {
  id: text('id').primaryKey(),
  noticeVersionId: text('notice_version_id').notNull().references(() => noticeVersions.id),
  criterion: text('criterion').notNull(), // 'age' | 'qualification' | 'category_relaxation' | 'equivalent_qualification'
  paramsJson: text('params_json').notNull(), // JSON: { minAge, maxAge, cutoffDate, requiredLevel, relaxationTable, equivalents }
  sourceClause: text('source_clause'), // e.g. "4(b)"
  ambiguous: integer('ambiguous', { mode: 'boolean' }).notNull().default(false),
  hasCorrigendum: integer('has_corrigendum', { mode: 'boolean' }).notNull().default(false),
});

// 6. Document Items
export const documentItems = sqliteTable('document_items', {
  id: text('id').primaryKey(),
  noticeVersionId: text('notice_version_id').notNull().references(() => noticeVersions.id),
  labelKey: text('label_key').notNull(), // e.g. "educational_certificates", "photo_signature", "dob_proof", "category_certificate", "id_proof"
  requiredAlways: integer('required_always', { mode: 'boolean' }).notNull().default(true),
  conditionNote: text('condition_note'), // e.g. "only if claiming relaxation"
  formatNote: text('format_note'), // e.g. "in the size the notice asks"
  issuingAuthority: text('issuing_authority'), // e.g. "SDO / District Magistrate / Tehsildar"
  validityNotes: text('validity_notes'), // e.g. "Must be issued for FY 2026-27"
});

// 7. Verification Checks
export const verificationChecks = sqliteTable('verification_checks', {
  id: text('id').primaryKey(),
  vacancyId: text('vacancy_id').notNull().references(() => vacancies.id),
  checkKey: text('check_key').notNull(), // 'official_link_recorded' | 'dates_checked' | 'rules_entered' | 'contact_called_back' | 'business_doc_seen' | 'partner_confirmed'
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedOn: text('completed_on'),
  completedBy: text('completed_by'),
});

// 8. Scam Flags (deterministic curator checklist per AGENTS.md rule 7)
export const scamFlags = sqliteTable('scam_flags', {
  id: text('id').primaryKey(),
  vacancyId: text('vacancy_id').notNull().references(() => vacancies.id),
  asksFee: integer('asks_fee', { mode: 'boolean' }).notNull().default(false),
  personalNumberOnly: integer('personal_number_only', { mode: 'boolean' }).notNull().default(false),
  noBusinessDetails: integer('no_business_details', { mode: 'boolean' }).notNull().default(false),
  unrealisticPay: integer('unrealistic_pay', { mode: 'boolean' }).notNull().default(false),
  urgencyPressure: integer('urgency_pressure', { mode: 'boolean' }).notNull().default(false),
  appliedBy: text('applied_by'),
  appliedOn: text('applied_on'),
});

// 9. Saved Jobs & 6-Stage Application Lifecycle (set only by user per AGENTS.md rule 5)
export const savedJobs = sqliteTable('saved_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  vacancyId: text('vacancy_id').notNull().references(() => vacancies.id),
  progress: text('progress').notNull().default('saved'), // 'saved' | 'applied' | 'admit_card' | 'exam' | 'result' | 'interview'
  registrationNumber: text('registration_number'), // Application / Registration Number
  rollNumber: text('roll_number'), // Exam Roll Number / Hall Ticket Number
  examDate: text('exam_date'), // YYYY-MM-DD
  examCenter: text('exam_center'), // City / Venue
  candidateNotes: text('candidate_notes'), // Private user notes
  lastSeenVersionId: text('last_seen_version_id'),
  reminderOn: text('reminder_on'), // YYYY-MM-DD
  smsConsent: integer('sms_consent', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
});

// 10. Reports (user complaints)
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. "RS-0001"
  vacancyId: text('vacancy_id').notNull().references(() => vacancies.id),
  reasonsJson: text('reasons_json').notNull(), // stringified array of keys e.g. '["asks_fee", "personal_number_only"]'
  note: text('note'),
  status: text('status').notNull().default('received'), // 'received' | 'under_review' | 'closed'
  acknowledgedBy: text('acknowledged_by'),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  ackDueAt: text('ack_due_at').notNull(), // created_at + 24h
  triageDueAt: text('triage_due_at').notNull(), // created_at + 48h
});

// 11. Decisions (reviewer queue and second reviewer rule)
export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(),
  reportId: text('report_id').notNull().references(() => reports.id),
  action: text('action').notNull(), // 'suspend' | 'ask_correction' | 'close'
  reason: text('reason').notNull(),
  proposedBy: text('proposed_by').notNull().references(() => users.id),
  approvedBy: text('approved_by').references(() => users.id), // must be different user for high risk
  appliedAt: text('applied_at'),
});

// 12. Audit Log (per AGENTS.md engineering rule: every state-changing admin action writes audit_log)
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  reason: text('reason').notNull(),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// 13. Verification Receipts (Public Cryptographic Verification Hub /verify/[hash])
export const verificationReceipts = sqliteTable('verification_receipts', {
  id: text('id').primaryKey(),
  receiptHash: text('receipt_hash').notNull().unique(), // SHA-256 hash
  vacancyId: text('vacancy_id').notNull().references(() => vacancies.id),
  vacancyTitle: text('vacancy_title').notNull(),
  candidateAgeOnCutoff: text('candidate_age_on_cutoff').notNull(),
  candidateQualification: text('candidate_qualification').notNull(),
  candidateCategory: text('candidate_category'),
  evaluationResultJson: text('evaluation_result_json').notNull(), // Array of criteria verdicts
  rulesVersion: text('rules_version').notNull(),
  generatedAt: text('generated_at').notNull().default(new Date().toISOString()),
  isHelperMode: integer('is_helper_mode', { mode: 'boolean' }).notNull().default(false),
});

// 14. Outbox (stubs for SMS / in-app reminders)
export const outbox = sqliteTable('outbox', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  channel: text('channel').notNull(), // 'sms' | 'in_app'
  messageKey: text('message_key').notNull(),
  payloadJson: text('payload_json').notNull(),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

