import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./rozgarsetu.db';
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export async function seedDatabase() {
  console.log('🌱 Starting RozgarSetu AI seed on fictional data...');

  // 1. Create tables if they do not exist
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      dob TEXT,
      qualification_level TEXT,
      qualification_stream TEXT,
      category TEXT,
      disability TEXT,
      preferred_district TEXT,
      language TEXT NOT NULL DEFAULT 'en',
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      body_name TEXT NOT NULL,
      url TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'web',
      update_frequency TEXT NOT NULL DEFAULT 'daily',
      permitted_use_note TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vacancies (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      org_name TEXT NOT NULL,
      area TEXT NOT NULL,
      source_id TEXT,
      source_url TEXT NOT NULL,
      published_on TEXT NOT NULL,
      last_date TEXT NOT NULL,
      last_checked_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      advertised_pay_min INTEGER,
      advertised_pay_max INTEGER,
      current_notice_version_id TEXT,
      FOREIGN KEY (source_id) REFERENCES sources (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS notice_versions (
      id TEXT PRIMARY KEY,
      vacancy_id TEXT NOT NULL,
      version_no INTEGER NOT NULL DEFAULT 1,
      content_hash TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      change_note TEXT,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      notice_version_id TEXT NOT NULL,
      criterion TEXT NOT NULL,
      params_json TEXT NOT NULL,
      source_clause TEXT,
      ambiguous INTEGER NOT NULL DEFAULT 0,
      has_corrigendum INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (notice_version_id) REFERENCES notice_versions (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS document_items (
      id TEXT PRIMARY KEY,
      notice_version_id TEXT NOT NULL,
      label_key TEXT NOT NULL,
      required_always INTEGER NOT NULL DEFAULT 1,
      condition_note TEXT,
      format_note TEXT,
      FOREIGN KEY (notice_version_id) REFERENCES notice_versions (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS verification_checks (
      id TEXT PRIMARY KEY,
      vacancy_id TEXT NOT NULL,
      check_key TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_on TEXT,
      completed_by TEXT,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS scam_flags (
      id TEXT PRIMARY KEY,
      vacancy_id TEXT NOT NULL,
      asks_fee INTEGER NOT NULL DEFAULT 0,
      personal_number_only INTEGER NOT NULL DEFAULT 0,
      no_business_details INTEGER NOT NULL DEFAULT 0,
      unrealistic_pay INTEGER NOT NULL DEFAULT 0,
      urgency_pressure INTEGER NOT NULL DEFAULT 0,
      applied_by TEXT,
      applied_on TEXT,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      vacancy_id TEXT NOT NULL,
      progress TEXT NOT NULL DEFAULT 'saved',
      last_seen_version_id TEXT,
      reminder_on TEXT,
      sms_consent INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (vacancy_id) REFERENCES vacancies (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      ref TEXT NOT NULL UNIQUE,
      vacancy_id TEXT NOT NULL,
      reasons_json TEXT NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'received',
      acknowledged_by TEXT,
      created_at TEXT NOT NULL,
      ack_due_at TEXT NOT NULL,
      triage_due_at TEXT NOT NULL,
      FOREIGN KEY (vacancy_id) REFERENCES vacancies (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT NOT NULL,
      proposed_by TEXT NOT NULL,
      approved_by TEXT,
      applied_at TEXT,
      FOREIGN KEY (report_id) REFERENCES reports (id),
      FOREIGN KEY (proposed_by) REFERENCES users (id),
      FOREIGN KEY (approved_by) REFERENCES users (id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      message_key TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Clear existing seed data cleanly
  const tables = [
    'outbox', 'audit_log', 'decisions', 'reports', 'saved_jobs',
    'scam_flags', 'verification_checks', 'document_items', 'rules',
    'notice_versions', 'vacancies', 'sources', 'users',
  ];
  for (const tbl of tables) {
    await client.execute(`DELETE FROM ${tbl};`);
  }

  // 2. Seed Users (All fictitious demo accounts with fake 00000-series mobile numbers)
  const userPasswordHash = await bcrypt.hash('demo_user_123', 10);
  const reviewerPasswordHash = await bcrypt.hash('demo_review_123', 10);
  const adminPasswordHash = await bcrypt.hash('demo_admin_123', 10);

  await client.execute({
    sql: `INSERT INTO users (id, name, mobile, password_hash, dob, qualification_level, qualification_stream, category, disability, preferred_district, language, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'user-1',
      'Illustrative Candidate',
      '0000000001',
      userPasswordHash,
      '2002-05-15', // Age 24 on 2026-08-01
      'higher_secondary',
      'Arts',
      null, // Category unentered per mock-up Screen 4 test profile
      null,
      'Paschim Bardhaman',
      'en',
      'user',
      '2026-10-01T09:00:00Z',
    ],
  });

  await client.execute({
    sql: `INSERT INTO users (id, name, mobile, password_hash, dob, qualification_level, language, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['rev-1', 'Demo Reviewer 1', '0000000002', reviewerPasswordHash, '1990-01-01', 'graduate', 'en', 'reviewer', '2026-10-01T09:00:00Z'],
  });

  await client.execute({
    sql: `INSERT INTO users (id, name, mobile, password_hash, dob, qualification_level, language, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['rev-2', 'Demo Reviewer 2', '0000000003', reviewerPasswordHash, '1992-02-02', 'graduate', 'en', 'reviewer2', '2026-10-01T09:00:00Z'],
  });

  await client.execute({
    sql: `INSERT INTO users (id, name, mobile, password_hash, dob, qualification_level, language, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['admin-1', 'Demo Administrator', '0000000004', adminPasswordHash, '1985-03-03', 'postgraduate', 'en', 'admin', '2026-10-01T09:00:00Z'],
  });

  // 3. Seed Sources (All Fictional per AGENTS.md rule 10)
  await client.execute({
    sql: `INSERT INTO sources (id, body_name, url, format, update_frequency, permitted_use_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['src-1', 'Example Recruiting Body', 'https://example-recruiting.internal.gov/notices', 'web', 'daily', 'Public official notification circular'],
  });

  await client.execute({
    sql: `INSERT INTO sources (id, body_name, url, format, update_frequency, permitted_use_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['src-2', 'Example State Board', 'https://example-stateboard.internal.gov/recruitment', 'pdf', 'weekly', 'Official state circular'],
  });

  await client.execute({
    sql: `INSERT INTO sources (id, body_name, url, format, update_frequency, permitted_use_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['src-3', 'Example Municipal Council', 'https://example-municipal.internal.gov/jobs', 'web', 'daily', 'Local municipal job notice'],
  });

  await client.execute({
    sql: `INSERT INTO sources (id, body_name, url, format, update_frequency, permitted_use_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['src-4', 'Example Local MSME Directory', 'https://example-msme.internal.org', 'web', 'daily', 'Local verified employer portal'],
  });

  // 4. Seed Vacancies
  // 4a. Notice A (Government - Screen 2/3/4/5 exact reproduction)
  await client.execute({
    sql: `INSERT INTO vacancies (id, type, title, org_name, area, source_id, source_url, published_on, last_date, last_checked_at, status, advertised_pay_min, advertised_pay_max, current_notice_version_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'notice-a',
      'government',
      'Clerk (Group C)',
      'Example Recruiting Body',
      'Statewide',
      'src-1',
      'https://example-recruiting.internal.gov/notices/2026/notice-a',
      '2026-10-01',
      '2026-11-12',
      '2026-10-14 10:30 IST',
      'active',
      19900,
      63200,
      'ver-notice-a-1',
    ],
  });

  await client.execute({
    sql: `INSERT INTO notice_versions (id, vacancy_id, version_no, content_hash, snapshot_json, created_at, change_note)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'ver-notice-a-1',
      'notice-a',
      1,
      'hash-notice-a-v1',
      JSON.stringify({
        deadline: '2026-11-12',
        cutoffDate: '2026-08-01',
        requirements: { minAge: 18, maxAge: 30, qualification: 'graduate' },
        documents: ['certificates', 'photo_signature', 'dob_proof', 'category_certificate', 'id_proof'],
      }),
      '2026-10-01T08:00:00Z',
      'Initial verified publication',
    ],
  });

  // Rules for Notice A (Screen 4 reproduction)
  // Rule 1: Age
  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'rule-notice-a-age',
      'ver-notice-a-1',
      'age',
      JSON.stringify({
        minAge: 18,
        maxAge: 30,
        cutoffDate: '2026-08-01',
        relaxationTable: { SC: 5, ST: 5, OBC: 3 },
      }),
      '3(a)',
      0,
      0,
    ],
  });

  // Rule 2: Qualification
  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'rule-notice-a-qual',
      'ver-notice-a-1',
      'qualification',
      JSON.stringify({
        requiredLevel: 'graduate',
        equivalentsClause: '4(b)',
      }),
      '4(a)',
      0,
      0,
    ],
  });

  // Rule 3: Category Relaxation
  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'rule-notice-a-cat',
      'ver-notice-a-1',
      'category_relaxation',
      JSON.stringify({
        relaxationTable: { SC: 5, ST: 5, OBC: 3 },
      }),
      '3(b)',
      0,
      0,
    ],
  });

  // Rule 4: Equivalent Qualification Clause (ambiguous per mock-up)
  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'rule-notice-a-equiv',
      'ver-notice-a-1',
      'equivalent_qualification',
      JSON.stringify({
        clause: '4(b)',
        acceptedList: ['B.Tech', 'B.Sc Honours'],
      }),
      '4(b)',
      1, // Ambiguous = true
      0,
    ],
  });

  // Verification checks for Notice A: exactly 3 checks completed per screen 3
  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-na-1', 'notice-a', 'official_link_recorded', 1, '2026-10-14', 'Demo Reviewer 1'],
  });
  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-na-2', 'notice-a', 'dates_checked', 1, '2026-10-14', 'Demo Reviewer 1'],
  });
  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-na-3', 'notice-a', 'rules_entered', 1, '2026-10-14', 'Demo Reviewer 1'],
  });

  // Document items for Notice A (Screen 5 reproduction)
  await client.execute({
    sql: `INSERT INTO document_items (id, notice_version_id, label_key, required_always, condition_note, format_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['doc-na-1', 'ver-notice-a-1', 'educational_certificates', 1, null, 'Self-attested copies of mark sheets and certificates'],
  });
  await client.execute({
    sql: `INSERT INTO document_items (id, notice_version_id, label_key, required_always, condition_note, format_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['doc-na-2', 'ver-notice-a-1', 'photo_signature', 1, null, 'in the size the notice asks (3.5cm x 4.5cm, under 50KB)'],
  });
  await client.execute({
    sql: `INSERT INTO document_items (id, notice_version_id, label_key, required_always, condition_note, format_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['doc-na-3', 'ver-notice-a-1', 'dob_proof', 1, null, 'Madhyamik or equivalent admit card / birth certificate'],
  });
  await client.execute({
    sql: `INSERT INTO document_items (id, notice_version_id, label_key, required_always, condition_note, format_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['doc-na-4', 'ver-notice-a-1', 'category_certificate', 0, 'only if claiming relaxation', 'Issued by competent authority (SDO / District Magistrate)'],
  });
  await client.execute({
    sql: `INSERT INTO document_items (id, notice_version_id, label_key, required_always, condition_note, format_note) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['doc-na-5', 'ver-notice-a-1', 'id_proof', 1, null, 'Aadhaar / Voter ID / Passport'],
  });

  // 4b. Government Notice B: Junior Field Assistant
  await client.execute({
    sql: `INSERT INTO vacancies (id, type, title, org_name, area, source_id, source_url, published_on, last_date, last_checked_at, status, advertised_pay_min, advertised_pay_max, current_notice_version_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'notice-b',
      'government',
      'Junior Field Assistant',
      'Example State Board',
      'Kolkata & Burdwan',
      'src-2',
      'https://example-stateboard.internal.gov/recruitment/jfa-2026',
      '2026-10-05',
      '2026-11-20',
      '2026-10-14 11:00 IST',
      'active',
      15000,
      28000,
      'ver-notice-b-1',
    ],
  });

  await client.execute({
    sql: `INSERT INTO notice_versions (id, vacancy_id, version_no, content_hash, snapshot_json, created_at, change_note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['ver-notice-b-1', 'notice-b', 1, 'hash-notice-b-v1', JSON.stringify({ deadline: '2026-11-20' }), '2026-10-05T08:00:00Z', 'Published'],
  });

  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['rule-nb-age', 'ver-notice-b-1', 'age', JSON.stringify({ minAge: 18, maxAge: 27, cutoffDate: '2026-08-01' }), '2(a)', 0, 0],
  });
  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['rule-nb-qual', 'ver-notice-b-1', 'qualification', JSON.stringify({ requiredLevel: 'secondary' }), '3(a)', 0, 0],
  });
  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-nb-1', 'notice-b', 'official_link_recorded', 1, '2026-10-14', 'Demo Reviewer 1'],
  });

  // 4c. Government Notice C: Data Entry Operator
  await client.execute({
    sql: `INSERT INTO vacancies (id, type, title, org_name, area, source_id, source_url, published_on, last_date, last_checked_at, status, advertised_pay_min, advertised_pay_max, current_notice_version_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'notice-c',
      'government',
      'Data Entry Operator',
      'Example Municipal Council',
      'Durgapur & Asansol',
      'src-3',
      'https://example-municipal.internal.gov/jobs/deo-2026',
      '2026-10-10',
      '2026-11-25',
      '2026-10-14 12:00 IST',
      'active',
      16000,
      32000,
      'ver-notice-c-1',
    ],
  });

  await client.execute({
    sql: `INSERT INTO notice_versions (id, vacancy_id, version_no, content_hash, snapshot_json, created_at, change_note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['ver-notice-c-1', 'notice-c', 1, 'hash-notice-c-v1', JSON.stringify({ deadline: '2026-11-25' }), '2026-10-10T08:00:00Z', 'Published'],
  });

  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['rule-nc-age', 'ver-notice-c-1', 'age', JSON.stringify({ minAge: 18, maxAge: 35, cutoffDate: '2026-08-01' }), '1(a)', 0, 0],
  });
  await client.execute({
    sql: `INSERT INTO rules (id, notice_version_id, criterion, params_json, source_clause, ambiguous, has_corrigendum) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['rule-nc-qual', 'ver-notice-c-1', 'qualification', JSON.stringify({ requiredLevel: 'higher_secondary' }), '2(a)', 0, 0],
  });
  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-nc-1', 'notice-c', 'official_link_recorded', 1, '2026-10-14', 'Demo Reviewer 2'],
  });

  // 4d. MSME 1: Delivery helper (fee-asking red flag per Screen 2 / 7 / 9 mock-up)
  await client.execute({
    sql: `INSERT INTO vacancies (id, type, title, org_name, area, source_id, source_url, published_on, last_date, last_checked_at, status, advertised_pay_min, advertised_pay_max, current_notice_version_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'msme-delivery',
      'msme',
      'Delivery helper',
      'Illustrative local MSME',
      'Durgapur area',
      'src-4',
      'https://example-msme.internal.org/jobs/dh-01',
      '2026-10-12',
      '2026-11-15',
      '2026-10-14 14:00 IST',
      'active',
      9000,
      11000,
      'ver-msme-1',
    ],
  });

  await client.execute({
    sql: `INSERT INTO notice_versions (id, vacancy_id, version_no, content_hash, snapshot_json, created_at, change_note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['ver-msme-1', 'msme-delivery', 1, 'hash-msme-1', JSON.stringify({ pay: '9,000 to 11,000' }), '2026-10-12T08:00:00Z', 'MSME card submitted'],
  });

  // Contact not yet verified -> NO completed checks!
  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed) VALUES (?, ?, ?, ?)`,
    args: ['vc-msme1-1', 'msme-delivery', 'contact_called_back', 0],
  });

  // Scam Shield flags: asks_fee: true, personal_number_only: true
  await client.execute({
    sql: `INSERT INTO scam_flags (id, vacancy_id, asks_fee, personal_number_only, no_business_details, unrealistic_pay, urgency_pressure, applied_by, applied_on)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['sf-msme1', 'msme-delivery', 1, 1, 0, 0, 0, 'Demo Reviewer 1', '2026-10-14'],
  });

  // Seed sample Report RS-0001 against this vacancy (matching Screen 7 & 9 mock-up)
  await client.execute({
    sql: `INSERT INTO reports (id, ref, vacancy_id, reasons_json, note, status, acknowledged_by, created_at, ack_due_at, triage_due_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'rep-1',
      'RS-0001',
      'msme-delivery',
      JSON.stringify(['asks_fee', 'personal_number_only']),
      'Caller requested ₹350 registration fee via personal UPI number.',
      'under_review',
      'Demo Reviewer 1',
      '2026-10-14T15:00:00Z',
      '2026-10-15T15:00:00Z',
      '2026-10-16T15:00:00Z',
    ],
  });

  // 4e. MSME 2: Packaging Assistant
  await client.execute({
    sql: `INSERT INTO vacancies (id, type, title, org_name, area, source_id, source_url, published_on, last_date, last_checked_at, status, advertised_pay_min, advertised_pay_max, current_notice_version_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'msme-packaging',
      'msme',
      'Packaging Assistant',
      'Illustrative local MSME',
      'Asansol area',
      'src-4',
      'https://example-msme.internal.org/jobs/pa-02',
      '2026-10-08',
      '2026-11-18',
      '2026-10-14 14:15 IST',
      'active',
      10000,
      12000,
      'ver-msme-2',
    ],
  });

  await client.execute({
    sql: `INSERT INTO notice_versions (id, vacancy_id, version_no, content_hash, snapshot_json, created_at, change_note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['ver-msme-2', 'msme-packaging', 1, 'hash-msme-2', JSON.stringify({ pay: '10,000 to 12,000' }), '2026-10-08T08:00:00Z', 'Verified card'],
  });

  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-msme2-1', 'msme-packaging', 'contact_called_back', 1, '2026-10-10', 'Demo Reviewer 1'],
  });

  // 4f. MSME 3: Retail Billing Clerk
  await client.execute({
    sql: `INSERT INTO vacancies (id, type, title, org_name, area, source_id, source_url, published_on, last_date, last_checked_at, status, advertised_pay_min, advertised_pay_max, current_notice_version_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'msme-billing',
      'msme',
      'Retail Billing Clerk',
      'Illustrative local MSME',
      'Raniganj area',
      'src-4',
      'https://example-msme.internal.org/jobs/rbc-03',
      '2026-10-09',
      '2026-11-19',
      '2026-10-14 14:30 IST',
      'active',
      11000,
      13000,
      'ver-msme-3',
    ],
  });

  await client.execute({
    sql: `INSERT INTO notice_versions (id, vacancy_id, version_no, content_hash, snapshot_json, created_at, change_note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['ver-msme-3', 'msme-billing', 1, 'hash-msme-3', JSON.stringify({ pay: '11,000 to 13,000' }), '2026-10-09T08:00:00Z', 'Documented employer'],
  });

  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-msme3-1', 'msme-billing', 'contact_called_back', 1, '2026-10-11', 'Demo Reviewer 2'],
  });
  await client.execute({
    sql: `INSERT INTO verification_checks (id, vacancy_id, check_key, completed, completed_on, completed_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['vc-msme3-2', 'msme-billing', 'business_doc_seen', 1, '2026-10-12', 'Demo Reviewer 2'],
  });

  // 5. Seed saved job for Demo User (Screen 6 reproduction)
  await client.execute({
    sql: `INSERT INTO saved_jobs (id, user_id, vacancy_id, progress, last_seen_version_id, reminder_on, sms_consent) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['sj-1', 'user-1', 'notice-a', 'saved', 'ver-notice-a-1', '2026-11-05', 1],
  });

  console.log('✅ Seed complete: 4 users, 4 sources, 6 vacancies (3 gov, 3 MSME), rules, document items, verification checks, scam flags, reports, saved jobs.');
}

if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
