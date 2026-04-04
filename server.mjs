import { createServer } from "node:http";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, ".env");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(envPath);

const dataDir = join(__dirname, "data");
const dbPath = join(dataDir, "app.db");
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
const sessionTtlDays = 30;
const ownerEmail = (process.env.OWNER_EMAIL || "chegekeith4@gmail.com").trim().toLowerCase();
const ownerUsername = (process.env.OWNER_USERNAME || "owner").trim();
const ownerFullName = (process.env.OWNER_FULL_NAME || "Owner").trim();
const ownerInitialPassword = process.env.OWNER_INITIAL_PASSWORD || "";
const passwordResetTtlMinutes = Number(process.env.PASSWORD_RESET_CODE_TTL_MINUTES || 10);
const passwordResetMaxAttempts = Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5);
const passwordResetCooldownSeconds = Number(process.env.PASSWORD_RESET_COOLDOWN_SECONDS || 60);
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || smtpUser || ownerEmail;
const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "";
const resendReplyTo = process.env.RESEND_REPLY_TO || ownerEmail;
const resendUserAgent = "kctech-password-reset/1.0";
const RESEND_TEST_DOMAIN = "resend.dev";
const darajaEnvironment = (process.env.DARAJA_ENV || "sandbox").trim().toLowerCase() === "production" ? "production" : "sandbox";
const darajaConsumerKey = (process.env.DARAJA_CONSUMER_KEY || "").trim();
const darajaConsumerSecret = (process.env.DARAJA_CONSUMER_SECRET || "").trim();
const darajaShortcode = (process.env.DARAJA_SHORTCODE || "").trim();
const darajaPasskey = (process.env.DARAJA_PASSKEY || "").trim();
const darajaCallbackUrl = (process.env.DARAJA_CALLBACK_URL || "").trim();
const darajaTransactionType = (process.env.DARAJA_TRANSACTION_TYPE || "CustomerPayBillOnline").trim();
const darajaAccountReference = (process.env.DARAJA_ACCOUNT_REFERENCE || "Tech Support Services").trim();
const darajaServiceDescription = (process.env.DARAJA_TRANSACTION_DESCRIPTION || "Service payment").trim();
const paymentSupportPhone = (process.env.PAYMENT_SUPPORT_PHONE || "0757152440").trim();

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const mailTransport =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    recovery_email TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    request_type TEXT NOT NULL DEFAULT 'service',
    service TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'not_requested',
    terms_version TEXT NOT NULL DEFAULT 'v1',
    agreement_accepted INTEGER NOT NULL DEFAULT 0,
    signature_name TEXT NOT NULL DEFAULT '',
    signed_at TEXT NOT NULL DEFAULT '',
    id_document_type TEXT NOT NULL DEFAULT '',
    id_document_name TEXT NOT NULL DEFAULT '',
    id_document_mime TEXT NOT NULL DEFAULT '',
    id_document_size INTEGER NOT NULL DEFAULT 0,
    id_document_data TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS lesson_assessments (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    course TEXT NOT NULL,
    session_label TEXT NOT NULL,
    topic_number INTEGER NOT NULL DEFAULT 0,
    assessment_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    read_time_required_seconds INTEGER NOT NULL DEFAULT 0,
    read_time_completed_at TEXT,
    submitted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (consultation_id, course, session_label, assessment_type)
  );

  CREATE TABLE IF NOT EXISTS saved_services (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    service_title TEXT NOT NULL,
    service_category TEXT NOT NULL,
    service_description TEXT NOT NULL,
    saved_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, service_title)
  );

  CREATE TABLE IF NOT EXISTS password_reset_otps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    otp_salt TEXT NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS service_payments (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    user_id TEXT,
    request_type TEXT NOT NULL DEFAULT 'service',
    service TEXT NOT NULL,
    complexity TEXT NOT NULL DEFAULT 'starter',
    payment_method TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    status TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT '',
    external_reference TEXT NOT NULL,
    merchant_request_id TEXT NOT NULL DEFAULT '',
    checkout_request_id TEXT NOT NULL DEFAULT '',
    receipt_number TEXT NOT NULL DEFAULT '',
    customer_transaction_code TEXT NOT NULL DEFAULT '',
    provider_response TEXT NOT NULL DEFAULT '',
    last_error TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    paid_at TEXT,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
`);

function getTableColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_assessments (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      course TEXT NOT NULL,
      session_label TEXT NOT NULL,
      topic_number INTEGER NOT NULL DEFAULT 0,
      assessment_type TEXT NOT NULL,
      score INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      read_time_required_seconds INTEGER NOT NULL DEFAULT 0,
      read_time_completed_at TEXT,
      submitted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (consultation_id, course, session_label, assessment_type)
    );

    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      otp_salt TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS service_payments (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      user_id TEXT,
      request_type TEXT NOT NULL DEFAULT 'service',
      service TEXT NOT NULL,
      complexity TEXT NOT NULL DEFAULT 'starter',
      payment_method TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KES',
      status TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      provider TEXT NOT NULL DEFAULT '',
      external_reference TEXT NOT NULL,
      merchant_request_id TEXT NOT NULL DEFAULT '',
      checkout_request_id TEXT NOT NULL DEFAULT '',
      receipt_number TEXT NOT NULL DEFAULT '',
      customer_transaction_code TEXT NOT NULL DEFAULT '',
      provider_response TEXT NOT NULL DEFAULT '',
      last_error TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      paid_at TEXT,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
    CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);
    CREATE INDEX IF NOT EXISTS idx_lesson_assessments_consultation_id ON lesson_assessments(consultation_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_assessments_user_id ON lesson_assessments(user_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_assessments_submitted_at ON lesson_assessments(submitted_at);
    CREATE INDEX IF NOT EXISTS idx_saved_services_user_id ON saved_services(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_services_saved_at ON saved_services(saved_at);
    CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
    CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);
    CREATE INDEX IF NOT EXISTS idx_service_payments_consultation_id ON service_payments(consultation_id);
    CREATE INDEX IF NOT EXISTS idx_service_payments_user_id ON service_payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_service_payments_checkout_request_id ON service_payments(checkout_request_id);
  `);

  const userColumns = new Set(getTableColumns("users"));
  if (!userColumns.has("recovery_email")) {
    db.exec("ALTER TABLE users ADD COLUMN recovery_email TEXT NOT NULL DEFAULT '';");
  }

  const consultationColumns = new Set(getTableColumns("consultations"));
  if (!consultationColumns.has("next_path")) {
    db.exec("ALTER TABLE consultations ADD COLUMN next_path TEXT NOT NULL DEFAULT 'service';");
  }
  if (!consultationColumns.has("next_path_status")) {
    db.exec("ALTER TABLE consultations ADD COLUMN next_path_status TEXT NOT NULL DEFAULT 'pending';");
  }
  if (!consultationColumns.has("owner_agreed")) {
    db.exec("ALTER TABLE consultations ADD COLUMN owner_agreed TEXT NOT NULL DEFAULT 'no';");
  }
  if (!consultationColumns.has("payment_status")) {
    db.exec("ALTER TABLE consultations ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'not_requested';");
  }
  if (!consultationColumns.has("request_type")) {
    db.exec("ALTER TABLE consultations ADD COLUMN request_type TEXT NOT NULL DEFAULT 'service';");
  }
  if (!consultationColumns.has("terms_version")) {
    db.exec("ALTER TABLE consultations ADD COLUMN terms_version TEXT NOT NULL DEFAULT 'v1';");
  }
  if (!consultationColumns.has("agreement_accepted")) {
    db.exec("ALTER TABLE consultations ADD COLUMN agreement_accepted INTEGER NOT NULL DEFAULT 0;");
  }
  if (!consultationColumns.has("signature_name")) {
    db.exec("ALTER TABLE consultations ADD COLUMN signature_name TEXT NOT NULL DEFAULT '';");
  }
  if (!consultationColumns.has("signed_at")) {
    db.exec("ALTER TABLE consultations ADD COLUMN signed_at TEXT NOT NULL DEFAULT '';");
  }
  if (!consultationColumns.has("id_document_type")) {
    db.exec("ALTER TABLE consultations ADD COLUMN id_document_type TEXT NOT NULL DEFAULT '';");
  }
  if (!consultationColumns.has("id_document_name")) {
    db.exec("ALTER TABLE consultations ADD COLUMN id_document_name TEXT NOT NULL DEFAULT '';");
  }
  if (!consultationColumns.has("id_document_mime")) {
    db.exec("ALTER TABLE consultations ADD COLUMN id_document_mime TEXT NOT NULL DEFAULT '';");
  }
  if (!consultationColumns.has("id_document_size")) {
    db.exec("ALTER TABLE consultations ADD COLUMN id_document_size INTEGER NOT NULL DEFAULT 0;");
  }
  if (!consultationColumns.has("id_document_data")) {
    db.exec("ALTER TABLE consultations ADD COLUMN id_document_data TEXT NOT NULL DEFAULT '';");
  }

  const servicePaymentColumns = new Set(getTableColumns("service_payments"));
  if (servicePaymentColumns.size > 0 && !servicePaymentColumns.has("customer_transaction_code")) {
    db.exec("ALTER TABLE service_payments ADD COLUMN customer_transaction_code TEXT NOT NULL DEFAULT '';");
  }
}

ensureSchema();

const statements = {
  createUser: db.prepare(`
    INSERT INTO users (
      id, email, password_hash, username, full_name, phone, recovery_email, avatar_url, bio, company, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, '', '', '', '', '', ?, ?)
  `),
  findUserByEmail: db.prepare(`
    SELECT id, email, password_hash, username, full_name, phone, recovery_email, avatar_url, bio, company, created_at, updated_at
    FROM users
    WHERE email = ?
  `),
  findUserByUsername: db.prepare(`
    SELECT id FROM users WHERE username = ?
  `),
  getUserProfile: db.prepare(`
    SELECT id, email, username, full_name, phone, recovery_email, avatar_url, bio, company, created_at, updated_at
    FROM users
    WHERE id = ?
  `),
  updateProfile: db.prepare(`
    UPDATE users
    SET username = ?, full_name = ?, phone = ?, recovery_email = ?, bio = ?, company = ?, updated_at = ?
    WHERE id = ?
  `),
  updatePassword: db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = ?
    WHERE id = ?
  `),
  createSession: db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `),
  getSessionUser: db.prepare(`
    SELECT
      s.token,
      s.expires_at,
      u.id,
      u.email,
      u.username,
      u.full_name,
      u.phone,
      u.recovery_email,
      u.avatar_url,
      u.bio,
      u.company,
      u.created_at,
      u.updated_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `),
  deleteSession: db.prepare(`DELETE FROM sessions WHERE token = ?`),
  deleteSessionsByUser: db.prepare(`DELETE FROM sessions WHERE user_id = ?`),
  cleanupExpiredSessions: db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`),
  insertConsultation: db.prepare(`
    INSERT INTO consultations (
      id, user_id, full_name, email, phone, request_type, service, message, status, next_path, next_path_status, owner_agreed, payment_status,
      terms_version, agreement_accepted, signature_name, signed_at, id_document_type, id_document_name, id_document_mime, id_document_size, id_document_data, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  listConsultationsByUser: db.prepare(`
    SELECT
      id, full_name, email, phone, request_type, service, message, status, next_path, next_path_status, owner_agreed, payment_status,
      terms_version, agreement_accepted, signature_name, signed_at, id_document_type, id_document_name, id_document_mime, id_document_size, id_document_data, created_at
    FROM consultations
    WHERE user_id = ?
    ORDER BY datetime(created_at) DESC
  `),
  listAllConsultations: db.prepare(`
    SELECT
      id, user_id, full_name, email, phone, request_type, service, message, status, next_path, next_path_status, owner_agreed, payment_status,
      terms_version, agreement_accepted, signature_name, signed_at, id_document_type, id_document_name, id_document_mime, id_document_size, id_document_data, created_at
    FROM consultations
    ORDER BY datetime(created_at) DESC
  `),
  getConsultationById: db.prepare(`
    SELECT
      id, user_id, full_name, email, phone, request_type, service, message, status, next_path, next_path_status, owner_agreed, payment_status,
      terms_version, agreement_accepted, signature_name, signed_at, id_document_type, id_document_name, id_document_mime, id_document_size, id_document_data, created_at
    FROM consultations
    WHERE id = ?
  `),
  insertServicePayment: db.prepare(`
    INSERT INTO service_payments (
      id, consultation_id, user_id, request_type, service, complexity, payment_method, amount, currency, status, phone,
      provider, external_reference, merchant_request_id, checkout_request_id, receipt_number, customer_transaction_code, provider_response, last_error,
      created_at, updated_at, paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getServicePaymentById: db.prepare(`
    SELECT
      id, consultation_id, user_id, request_type, service, complexity, payment_method, amount, currency, status, phone,
      provider, external_reference, merchant_request_id, checkout_request_id, receipt_number, customer_transaction_code, provider_response, last_error,
      created_at, updated_at, paid_at
    FROM service_payments
    WHERE id = ?
  `),
  getServicePaymentByCheckoutRequestId: db.prepare(`
    SELECT
      id, consultation_id, user_id, request_type, service, complexity, payment_method, amount, currency, status, phone,
      provider, external_reference, merchant_request_id, checkout_request_id, receipt_number, customer_transaction_code, provider_response, last_error,
      created_at, updated_at, paid_at
    FROM service_payments
    WHERE checkout_request_id = ?
  `),
  updateServicePaymentStatus: db.prepare(`
    UPDATE service_payments
    SET status = ?, provider_response = ?, last_error = ?, receipt_number = ?, updated_at = ?, paid_at = ?
    WHERE id = ?
  `),
  updateServicePaymentStkMeta: db.prepare(`
    UPDATE service_payments
    SET status = ?, provider = ?, merchant_request_id = ?, checkout_request_id = ?, provider_response = ?, last_error = ?, updated_at = ?
    WHERE id = ?
  `),
  listLessonAssessmentsByUser: db.prepare(`
    SELECT
      la.id,
      la.consultation_id,
      la.user_id,
      la.course,
      la.session_label,
      la.topic_number,
      la.assessment_type,
      la.score,
      la.correct_answers,
      la.total_questions,
      la.read_time_required_seconds,
      la.read_time_completed_at,
      la.submitted_at,
      la.updated_at,
      c.service AS consultation_service
    FROM lesson_assessments la
    JOIN consultations c ON c.id = la.consultation_id
    WHERE la.user_id = ?
    ORDER BY datetime(la.submitted_at) DESC
  `),
  listAllLessonAssessments: db.prepare(`
    SELECT
      la.id,
      la.consultation_id,
      la.user_id,
      la.course,
      la.session_label,
      la.topic_number,
      la.assessment_type,
      la.score,
      la.correct_answers,
      la.total_questions,
      la.read_time_required_seconds,
      la.read_time_completed_at,
      la.submitted_at,
      la.updated_at,
      c.service AS consultation_service,
      c.full_name AS learner_name,
      c.email AS learner_email
    FROM lesson_assessments la
    JOIN consultations c ON c.id = la.consultation_id
    ORDER BY datetime(la.submitted_at) DESC
  `),
  upsertLessonAssessment: db.prepare(`
    INSERT INTO lesson_assessments (
      id,
      consultation_id,
      user_id,
      course,
      session_label,
      topic_number,
      assessment_type,
      score,
      correct_answers,
      total_questions,
      read_time_required_seconds,
      read_time_completed_at,
      submitted_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(consultation_id, course, session_label, assessment_type) DO UPDATE SET
      user_id = excluded.user_id,
      topic_number = excluded.topic_number,
      score = excluded.score,
      correct_answers = excluded.correct_answers,
      total_questions = excluded.total_questions,
      read_time_required_seconds = excluded.read_time_required_seconds,
      read_time_completed_at = excluded.read_time_completed_at,
      submitted_at = excluded.submitted_at,
      updated_at = excluded.updated_at
  `),
  getLessonAssessmentByIdentity: db.prepare(`
    SELECT
      la.id,
      la.consultation_id,
      la.user_id,
      la.course,
      la.session_label,
      la.topic_number,
      la.assessment_type,
      la.score,
      la.correct_answers,
      la.total_questions,
      la.read_time_required_seconds,
      la.read_time_completed_at,
      la.submitted_at,
      la.updated_at,
      c.service AS consultation_service,
      c.full_name AS learner_name,
      c.email AS learner_email
    FROM lesson_assessments la
    JOIN consultations c ON c.id = la.consultation_id
    WHERE la.consultation_id = ? AND la.course = ? AND la.session_label = ? AND la.assessment_type = ?
  `),
  updateConsultationStatus: db.prepare(`
    UPDATE consultations
    SET status = ?
    WHERE id = ?
  `),
  updateConsultationWorkflow: db.prepare(`
    UPDATE consultations
    SET next_path = ?, next_path_status = ?, owner_agreed = ?
    WHERE id = ?
  `),
  updateConsultationPaymentStatus: db.prepare(`
    UPDATE consultations
    SET payment_status = ?
    WHERE id = ?
  `),
  listSavedServicesByUser: db.prepare(`
    SELECT id, service_title, service_category, service_description, saved_at
    FROM saved_services
    WHERE user_id = ?
    ORDER BY datetime(saved_at) DESC
  `),
  insertSavedService: db.prepare(`
    INSERT INTO saved_services (id, user_id, service_title, service_category, service_description, saved_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  deleteSavedServiceById: db.prepare(`
    DELETE FROM saved_services
    WHERE id = ? AND user_id = ?
  `),
  deleteSavedServiceByTitle: db.prepare(`
    DELETE FROM saved_services
    WHERE user_id = ? AND service_title = ?
  `),
  latestPasswordResetOtpByEmail: db.prepare(`
    SELECT id, created_at
    FROM password_reset_otps
    WHERE email = ?
    ORDER BY datetime(created_at) DESC
    LIMIT 1
  `),
  deletePasswordResetOtpsByEmail: db.prepare(`
    DELETE FROM password_reset_otps
    WHERE email = ?
  `),
  createPasswordResetOtp: db.prepare(`
    INSERT INTO password_reset_otps (
      id, user_id, email, otp_hash, otp_salt, attempt_count, expires_at, created_at, used_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, NULL)
  `),
  getActivePasswordResetOtpByEmail: db.prepare(`
    SELECT id, user_id, email, otp_hash, otp_salt, attempt_count, expires_at, created_at
    FROM password_reset_otps
    WHERE email = ? AND used_at IS NULL
    ORDER BY datetime(created_at) DESC
    LIMIT 1
  `),
  incrementPasswordResetOtpAttempts: db.prepare(`
    UPDATE password_reset_otps
    SET attempt_count = attempt_count + 1
    WHERE id = ?
  `),
  markPasswordResetOtpUsed: db.prepare(`
    UPDATE password_reset_otps
    SET used_at = ?
    WHERE id = ?
  `),
  deleteExpiredPasswordResetOtps: db.prepare(`
    DELETE FROM password_reset_otps
    WHERE used_at IS NOT NULL OR expires_at <= ?
  `),
};

seedOwnerAccount();

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return randomBytes(16).toString("hex");
}

function createOtp() {
  return String(randomBytes(4).readUInt32BE(0) % 1000000).padStart(6, "0");
}

const servicePricing = {
  "Software Development": { starter: 16000, professional: 58000, enterprise: 168000 },
  "Web & App Development": { starter: 15000, professional: 54000, enterprise: 162000 },
  "Artificial Intelligence & Machine Learning": { starter: 22000, professional: 76000, enterprise: 195000 },
  "Data Science & Analytics": { starter: 18000, professional: 62000, enterprise: 176000 },
  Cybersecurity: { starter: 20000, professional: 68000, enterprise: 185000 },
  "Cloud Computing & DevOps": { starter: 19000, professional: 66000, enterprise: 182000 },
  "IT Consulting & Systems Design": { starter: 15000, professional: 56000, enterprise: 164000 },
  "Technical Support & Maintenance": { starter: 12000, professional: 45000, enterprise: 138000 },
  "Game Development": { starter: 20000, professional: 70000, enterprise: 190000 },
  "Training & Education": { starter: 12000, professional: 40000, enterprise: 120000 },
  "Specialized Areas": { starter: 24000, professional: 82000, enterprise: 210000 },
  "Freelance & Business Services": { starter: 13000, professional: 48000, enterprise: 145000 },
};

const defaultServicePricing = { starter: 14000, professional: 52000, enterprise: 155000 };
const minimumServicePricing = { starter: 50000, professional: 80000, enterprise: 155000 };
const allowedConsultationRequestTypes = new Set(["service", "class"]);
const allowedConsultationDocumentTypes = new Set(["national_id", "drivers_license", "passport", "birth_certificate"]);
const allowedConsultationDocumentMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxConsultationDocumentBytes = 5 * 1024 * 1024;

function estimateBase64Bytes(base64Value) {
  const normalized = String(base64Value || "").replace(/\s+/g, "");
  if (!normalized) return 0;
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function parseConsultationDocument(document) {
  if (!document || typeof document !== "object") {
    return { valid: false, error: "Identification document is required." };
  }

  const documentType = String(document.document_type || "").trim();
  const fileName = String(document.file_name || "").trim();
  const mimeType = String(document.mime_type || "").trim().toLowerCase();
  const dataUrl = String(document.data_url || "").trim();
  const sizeBytes = Number(document.size_bytes || 0);

  if (!allowedConsultationDocumentTypes.has(documentType)) {
    return { valid: false, error: "Invalid identification document type." };
  }
  if (!fileName) {
    return { valid: false, error: "Identification document file name is required." };
  }
  if (!allowedConsultationDocumentMimeTypes.has(mimeType)) {
    return { valid: false, error: "Only PDF, JPG, PNG, or WEBP identification documents are allowed." };
  }
  if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
    return { valid: false, error: "Identification document data is invalid." };
  }

  const encodedContent = dataUrl.split(",", 2)[1] || "";
  const inferredBytes = estimateBase64Bytes(encodedContent);
  const normalizedSize = Math.max(Number.isFinite(sizeBytes) ? Math.round(sizeBytes) : 0, inferredBytes);

  if (!normalizedSize) {
    return { valid: false, error: "Identification document file is empty." };
  }
  if (normalizedSize > maxConsultationDocumentBytes) {
    return { valid: false, error: "Identification document must be 5 MB or smaller." };
  }

  return {
    valid: true,
    document: {
      document_type: documentType,
      file_name: fileName.slice(0, 180),
      mime_type: mimeType,
      size_bytes: normalizedSize,
      data_url: dataUrl,
    },
  };
}

function formatConsultationRecord(record) {
  if (!record) return null;

  return {
    ...record,
    agreement_accepted: Boolean(record.agreement_accepted),
    id_document:
      record.id_document_type && record.id_document_name && record.id_document_mime && record.id_document_data
        ? {
            document_type: record.id_document_type,
            file_name: record.id_document_name,
            mime_type: record.id_document_mime,
            size_bytes: Number(record.id_document_size || 0),
            data_url: record.id_document_data,
          }
        : null,
  };
}

function getServicePrice(service, complexity) {
  const priceBand = servicePricing[service] || defaultServicePricing;
  return Math.max(minimumServicePricing[complexity] || minimumServicePricing.starter, priceBand[complexity] || priceBand.starter);
}

function normalizeKenyanPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
  }
  if (digits.startsWith("1") && digits.length === 9) {
    return `254${digits}`;
  }
  return "";
}

function formatDarajaTimestamp(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function getDarajaBaseUrl() {
  return darajaEnvironment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function validateDarajaConfig() {
  const issues = [];
  if (!darajaConsumerKey) issues.push("DARAJA_CONSUMER_KEY is missing.");
  if (!darajaConsumerSecret) issues.push("DARAJA_CONSUMER_SECRET is missing.");
  if (!darajaShortcode) issues.push("DARAJA_SHORTCODE is missing.");
  if (!darajaPasskey) issues.push("DARAJA_PASSKEY is missing.");
  if (!darajaCallbackUrl) issues.push("DARAJA_CALLBACK_URL is missing.");
  return {
    configured: issues.length === 0,
    issues,
  };
}

async function getDarajaAccessToken() {
  const authToken = Buffer.from(`${darajaConsumerKey}:${darajaConsumerSecret}`).toString("base64");
  const response = await fetch(`${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authToken}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(
      typeof data.errorMessage === "string" && data.errorMessage
        ? data.errorMessage
        : "Could not generate Daraja access token.",
    );
  }

  return data.access_token;
}

async function initiateDarajaStkPush({ amount, phone, reference, description }) {
  const accessToken = await getDarajaAccessToken();
  const timestamp = formatDarajaTimestamp();
  const password = Buffer.from(`${darajaShortcode}${darajaPasskey}${timestamp}`).toString("base64");
  const payload = {
    BusinessShortCode: darajaShortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: darajaTransactionType,
    Amount: Math.max(1, Math.round(amount)),
    PartyA: phone,
    PartyB: darajaShortcode,
    PhoneNumber: phone,
    CallBackURL: darajaCallbackUrl,
    AccountReference: reference || darajaAccountReference,
    TransactionDesc: description || darajaServiceDescription,
  };

  const response = await fetch(`${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.errorMessage === "string" && data.errorMessage
        ? data.errorMessage
        : "Daraja STK push request failed.",
    );
  }

  return data;
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(":");
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const original = Buffer.from(hashHex, "hex");
  return timingSafeEqual(derived, original);
}

function hashOtp(email, otp, salt = randomBytes(16)) {
  const hash = createHash("sha256")
    .update(salt)
    .update(`${email}:${otp}`)
    .digest("hex");

  return {
    saltHex: salt.toString("hex"),
    hashHex: hash,
  };
}

function verifyOtp(email, otp, saltHex, hashHex) {
  const actual = hashOtp(email, otp, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(Buffer.from(actual.hashHex, "hex"), Buffer.from(hashHex, "hex"));
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function extractEmailAddress(value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return "";
  }

  const match = normalized.match(/<([^>]+)>/);
  return (match ? match[1] : normalized).trim().toLowerCase();
}

function maskEmailAddress(value) {
  const email = extractEmailAddress(value);
  if (!email || !email.includes("@")) {
    return "";
  }

  const [localPart, domainPart] = email.split("@");
  const localPrefix = localPart.length <= 2 ? localPart.slice(0, 1) : localPart.slice(0, 2);
  const domainSegments = domainPart.split(".");
  const domainName = domainSegments.shift() || "";
  const domainSuffix = domainSegments.join(".");
  const domainPrefix = domainName.length <= 2 ? domainName.slice(0, 1) : domainName.slice(0, 2);

  return `${localPrefix || "*"}***@${domainPrefix || "*"}***${domainSuffix ? `.${domainSuffix}` : ""}`;
}

function maskSender(value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return "";
  }

  const maskedEmail = maskEmailAddress(normalized);
  const match = normalized.match(/^([^<]+)<([^>]+)>$/);
  if (match && maskedEmail) {
    return `${match[1].trim()} <${maskedEmail}>`;
  }

  return maskedEmail || normalized;
}

function summarizeResendConfig() {
  const apiKey = normalizeWhitespace(resendApiKey);
  const fromRaw = normalizeWhitespace(resendFromEmail);
  const fromAddress = extractEmailAddress(fromRaw);
  const fromDomain = fromAddress.includes("@") ? fromAddress.split("@").pop() || "" : "";
  const issues = [];

  if (!apiKey) {
    issues.push("RESEND_API_KEY is missing.");
  }

  if (!fromRaw) {
    issues.push("RESEND_FROM_EMAIL is missing.");
  } else {
    if (fromRaw.toLowerCase().includes("yourdomain.com")) {
      issues.push("RESEND_FROM_EMAIL is still using the placeholder yourdomain.com.");
    }
    if (!fromAddress.includes("@")) {
      issues.push("RESEND_FROM_EMAIL must contain a valid sender email address.");
    }
  }

  return {
    configured: Boolean(apiKey && fromRaw),
    fromMasked: maskSender(fromRaw),
    senderMode: fromDomain === RESEND_TEST_DOMAIN ? "resend_test" : fromDomain ? "custom_domain" : "unknown",
    issues,
  };
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function extractResendErrorMessage(responseText) {
  const normalizedText = normalizeWhitespace(responseText);
  if (!normalizedText) {
    return "";
  }

  try {
    const parsed = JSON.parse(responseText);
    return normalizeWhitespace(
      parsed?.message ||
        parsed?.error?.message ||
        parsed?.error ||
        parsed?.name ||
        normalizedText,
    );
  } catch {
    return normalizedText;
  }
}

function formatResendFailureMessage(status, responseText = "") {
  const resendConfig = summarizeResendConfig();
  if (resendConfig.issues.length > 0) {
    return `Password reset email is not configured correctly: ${resendConfig.issues.join(" ")}`;
  }

  const senderLabel = resendConfig.fromMasked || "the configured sender";
  const apiMessage = extractResendErrorMessage(responseText);

  if (status === 401) {
    return "Resend rejected the API key. Check that RESEND_API_KEY is valid and has Sending or Full access.";
  }

  if (status === 403 && resendConfig.senderMode === "resend_test") {
    return `Resend rejected ${senderLabel}. The resend.dev testing sender only works for the email address on your Resend account. Use a verified custom-domain sender for other recipients.`;
  }

  if (status === 403) {
    return apiMessage
      ? `Resend rejected ${senderLabel}: ${apiMessage}`
      : `Resend rejected ${senderLabel}. Verify that the sender is approved in Resend.`;
  }

  if (status === 422) {
    return apiMessage
      ? `Resend rejected the email payload: ${apiMessage}`
      : "Resend rejected the email payload. Check the sender and recipient values.";
  }

  if (apiMessage) {
    return `Resend email failed (${status}): ${apiMessage}`;
  }

  return `Resend email failed (${status}). Check the sender, recipient, and API key configuration.`;
}

function canSendEmail() {
  const resendConfig = summarizeResendConfig();
  return Boolean((smtpUser && smtpPass) || (resendConfig.configured && resendConfig.issues.length === 0));
}

function sanitizeUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    full_name: row.full_name,
    phone: row.phone,
    recovery_email: row.recovery_email,
    avatar_url: row.avatar_url,
    bio: row.bio,
    company: row.company,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function seedOwnerAccount() {
  if (!ownerInitialPassword) {
    console.log("Owner bootstrap skipped: OWNER_INITIAL_PASSWORD is not set.");
    return;
  }

  const existingOwner = statements.findUserByEmail.get(ownerEmail);
  if (existingOwner) {
    console.log(`Owner account already exists for ${ownerEmail}.`);
    return;
  }

  const usernameTaken = statements.findUserByUsername.get(ownerUsername);
  if (usernameTaken) {
    console.warn(
      `Owner bootstrap skipped: username \"${ownerUsername}\" is already in use. Set OWNER_USERNAME to a different value.`,
    );
    return;
  }

  const createdAt = nowIso();
  statements.createUser.run(
    createId(),
    ownerEmail,
    hashPassword(ownerInitialPassword),
    ownerUsername,
    ownerFullName,
    createdAt,
    createdAt,
  );
  console.log(`Seeded owner account for ${ownerEmail} with username "${ownerUsername}".`);
}

function isOwner(user) {
  return Boolean(user?.email) && user.email.trim().toLowerCase() === ownerEmail;
}

function json(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function isSqliteLockedError(error) {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    ("code" in error && error.code === "ERR_SQLITE_ERROR") &&
    ("errstr" in error && typeof error.errstr === "string" && error.errstr.includes("database is locked"))
  );
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function getToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

function getSession(req) {
  statements.cleanupExpiredSessions.run(nowIso());
  const token = getToken(req);
  if (!token) {
    return null;
  }

  const session = statements.getSessionUser.get(token);
  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    statements.deleteSession.run(token);
    return null;
  }

  return {
    token,
    user: sanitizeUser(session),
  };
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    json(res, 401, { error: "Unauthorized" });
    return null;
  }
  return session;
}

function requireOwner(req, res) {
  const session = requireAuth(req, res);
  if (!session) {
    return null;
  }

  if (!isOwner(session.user)) {
    json(res, 403, { error: "Owner access required." });
    return null;
  }

  return session;
}

async function sendEmailMessage({ to, replyTo, subject, text, html }) {
  if (resendApiKey && resendFromEmail) {
    const resendConfig = summarizeResendConfig();
    if (resendConfig.issues.length > 0) {
      throw createHttpError(502, formatResendFailureMessage(0));
    }

    let response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "User-Agent": resendUserAgent,
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [to],
          subject,
          text,
          html,
          reply_to: replyTo || resendReplyTo,
        }),
      });
    } catch (error) {
      console.error("Password reset email transport error", error);
      throw createHttpError(502, "Could not reach Resend from the local server. Try again in a moment.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Password reset email send failed", {
        status: response.status,
        sender: resendConfig.fromMasked,
        errorText,
      });
      throw createHttpError(502, formatResendFailureMessage(response.status, errorText));
    }

    return;
  }

  if (!mailTransport) {
    throw new Error("Email delivery is not configured.");
  }

  await mailTransport.sendMail({
    from: smtpFrom,
    to,
    replyTo,
    subject,
    text,
    html,
  });
}

async function sendConsultationNotification(consultation) {
  if (!canSendEmail()) {
    return { enabled: false, sent: false };
  }

  const documentLabelMap = {
    national_id: "National ID",
    drivers_license: "Driver's License",
    passport: "Passport",
    birth_certificate: "Birth Certificate",
  };
  const documentLabel = consultation.id_document
    ? documentLabelMap[consultation.id_document.document_type] || consultation.id_document.document_type
    : "Not provided";
  const subject = `New consultation: ${consultation.service}`;
  const lines = [
    "A new consultation was submitted on Expert Tech Solutions & Training.",
    "",
    `Name: ${consultation.full_name}`,
    `Email: ${consultation.email}`,
    `Phone: ${consultation.phone || "Not provided"}`,
    `Request type: ${consultation.request_type}`,
    `Service: ${consultation.service}`,
    `Status: ${consultation.status}`,
    `Terms version: ${consultation.terms_version}`,
    `Agreement accepted: ${consultation.agreement_accepted ? "Yes" : "No"}`,
    `Signed by: ${consultation.signature_name || "Not provided"}`,
    `Signed at: ${consultation.signed_at || "Not provided"}`,
    `ID document: ${documentLabel}`,
    `Document file: ${consultation.id_document?.file_name || "Not provided"}`,
    `Submitted: ${consultation.created_at}`,
    "",
    "Message:",
    consultation.message,
  ];

  await sendEmailMessage({
    to: ownerEmail,
    replyTo: consultation.email,
    subject,
    text: lines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #dbe5f0">
          <h2 style="margin:0 0 16px;font-size:24px">New consultation: ${consultation.service}</h2>
          <p style="margin:0 0 8px"><strong>Name:</strong> ${consultation.full_name}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> ${consultation.email}</p>
          <p style="margin:0 0 8px"><strong>Phone:</strong> ${consultation.phone || "Not provided"}</p>
          <p style="margin:0 0 8px"><strong>Request type:</strong> ${consultation.request_type}</p>
          <p style="margin:0 0 8px"><strong>Status:</strong> ${consultation.status}</p>
          <p style="margin:0 0 8px"><strong>Terms version:</strong> ${consultation.terms_version}</p>
          <p style="margin:0 0 8px"><strong>Signed by:</strong> ${consultation.signature_name || "Not provided"}</p>
          <p style="margin:0 0 8px"><strong>Signed at:</strong> ${consultation.signed_at || "Not provided"}</p>
          <p style="margin:0 0 8px"><strong>ID document:</strong> ${documentLabel}</p>
          <p style="margin:0 0 8px"><strong>Document file:</strong> ${consultation.id_document?.file_name || "Not provided"}</p>
          <p style="margin:0 0 20px"><strong>Submitted:</strong> ${consultation.created_at}</p>
          <p style="margin:0 0 8px"><strong>Message:</strong></p>
          <div style="padding:16px;border-radius:12px;background:#eff6ff;color:#1e3a8a;line-height:1.6">
            ${consultation.message}
          </div>
        </div>
      </div>
    `,
  });

  return { enabled: true, sent: true };
}

async function sendPasswordResetOtpEmail(email, fullName, otp) {
  if (!canSendEmail()) {
    throw new Error("Password reset email is not configured.");
  }

  const recipientName = fullName || email;
  const subject = "Your KCJ Tech password reset code";
  const text = [
    `Hello ${recipientName},`,
    "",
    `Use this OTP to reset your KCJ Tech password: ${otp}`,
    `This code expires in ${passwordResetTtlMinutes} minutes.`,
    "",
    "If you did not request this reset, you can safely ignore this email.",
  ].join("\n");

  await sendEmailMessage({
    to: email,
    replyTo: ownerEmail,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #dbe5f0">
          <p style="margin:0 0 16px;font-size:16px">Hello ${recipientName},</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6">
            Use this one-time password to reset your KCJ Tech account password.
          </p>
          <div style="margin:0 0 20px;padding:18px 20px;border-radius:14px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#ffffff;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px">
            ${otp}
          </div>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6">
            This code expires in ${passwordResetTtlMinutes} minutes.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#475569">
            If you did not request this reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

function issuePasswordResetOtp(user) {
  const email = String(user.email || "").trim().toLowerCase();
  const otp = createOtp();
  const { saltHex, hashHex } = hashOtp(email, otp);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + passwordResetTtlMinutes * 60 * 1000).toISOString();

  statements.deletePasswordResetOtpsByEmail.run(email);
  statements.createPasswordResetOtp.run(createId(), user.id, email, hashHex, saltHex, expiresAt, createdAt);

  return { email, otp, createdAt, expiresAt };
}

async function handleSignup(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const username = String(body.username || "").trim();
  const fullName = String(body.fullName || "").trim();

  if (!email || !password || !username || !fullName) {
    return json(res, 400, { error: "Email, password, username, and full name are required." });
  }
  if (password.length < 6) {
    return json(res, 400, { error: "Password must be at least 6 characters." });
  }
  if (username.length < 3) {
    return json(res, 400, { error: "Username must be at least 3 characters." });
  }
  if (statements.findUserByEmail.get(email)) {
    return json(res, 409, { error: "An account with that email already exists." });
  }
  if (statements.findUserByUsername.get(username)) {
    return json(res, 409, { error: "That username is already taken." });
  }

  const id = createId();
  const createdAt = nowIso();
  statements.createUser.run(id, email, hashPassword(password), username, fullName, createdAt, createdAt);

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionTtlDays * 24 * 60 * 60 * 1000).toISOString();
  statements.createSession.run(token, id, expiresAt, createdAt);

  const user = statements.getUserProfile.get(id);
  return json(res, 201, { token, user: sanitizeUser(user), profile: sanitizeUser(user) });
}

async function handleSignin(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return json(res, 400, { error: "Email and password are required." });
  }

  const user = statements.findUserByEmail.get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return json(res, 401, { error: "Invalid email or password." });
  }

  const token = randomBytes(32).toString("hex");
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + sessionTtlDays * 24 * 60 * 60 * 1000).toISOString();
  statements.createSession.run(token, user.id, expiresAt, createdAt);

  const profile = sanitizeUser(user);
  return json(res, 200, { token, user: { id: user.id, email: user.email }, profile });
}

function handleSignout(req, res) {
  const token = getToken(req);
  if (token) {
    statements.deleteSession.run(token);
  }
  return json(res, 200, { success: true });
}

function handleMe(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  return json(res, 200, {
    user: { id: session.user.id, email: session.user.email },
    profile: session.user,
  });
}

function handleHealth(req, res) {
  const resendConfig = summarizeResendConfig();
  const smtpConfigured = Boolean(smtpUser && smtpPass);
  return json(res, 200, {
    ok: true,
    ownerEmail,
    emailNotificationsEnabled: canSendEmail(),
    emailDiagnostics: smtpConfigured
      ? {
          provider: "smtp",
          configured: true,
          sender: maskEmailAddress(smtpFrom) || smtpFrom,
        }
      : {
          provider: "resend",
          configured: resendConfig.configured,
          sender: resendConfig.fromMasked || null,
          senderMode: resendConfig.senderMode,
          issues: resendConfig.issues,
        },
  });
}

async function handleProfileUpdate(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;

  const body = await readBody(req);
  const username = String(body.username || "").trim();
  const fullName = String(body.full_name || "").trim();
  const phone = String(body.phone || "").trim();
  const recoveryEmail = String(body.recovery_email || "").trim().toLowerCase();
  const bio = String(body.bio || "").trim();
  const company = String(body.company || "").trim();

  if (!username || !fullName) {
    return json(res, 400, { error: "Username and full name are required." });
  }
  if (recoveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
    return json(res, 400, { error: "Recovery email must be a valid email address." });
  }

  const existingUser = statements.findUserByUsername.get(username);
  if (existingUser && existingUser.id !== session.user.id) {
    return json(res, 409, { error: "That username is already taken." });
  }

  statements.updateProfile.run(username, fullName, phone, recoveryEmail, bio, company, nowIso(), session.user.id);
  const updated = statements.getUserProfile.get(session.user.id);
  return json(res, 200, { profile: sanitizeUser(updated) });
}

async function handlePasswordUpdate(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;

  const body = await readBody(req);
  const password = String(body.password || "");
  if (password.length < 6) {
    return json(res, 400, { error: "Password must be at least 6 characters." });
  }

  statements.updatePassword.run(hashPassword(password), nowIso(), session.user.id);
  return json(res, 200, { success: true });
}

async function handlePasswordResetRequest(req, res) {
  const resendConfig = summarizeResendConfig();
  if (!canSendEmail()) {
    return json(res, 503, {
      error:
        resendConfig.configured && resendConfig.issues.length > 0
          ? `Password reset email is not configured correctly: ${resendConfig.issues.join(" ")}`
          : "Password reset email is not configured yet. Set SMTP credentials or valid Resend credentials in the server environment.",
    });
  }

  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return json(res, 400, { error: "Email is required." });
  }

  const user = statements.findUserByEmail.get(email);
  if (!user) {
    return json(res, 200, { success: true });
  }

  const deliveryEmail = String(user.recovery_email || user.email || "").trim().toLowerCase();

  const latestOtp = statements.latestPasswordResetOtpByEmail.get(email);
  if (latestOtp) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(latestOtp.created_at).getTime()) / 1000);
    if (elapsedSeconds < passwordResetCooldownSeconds) {
      return json(res, 429, {
        error: `Please wait ${passwordResetCooldownSeconds - elapsedSeconds} seconds before requesting another OTP.`,
      });
    }
  }

  const { otp } = issuePasswordResetOtp(user);
  try {
    await sendPasswordResetOtpEmail(deliveryEmail, user.full_name, otp);
  } catch (error) {
    console.error("Password reset request email error", error);
    const status = Number(error?.status);
    return json(res, status >= 400 && status < 600 ? status : 502, {
      error: error instanceof Error ? error.message : "Password reset email could not be sent.",
    });
  }

  return json(res, 200, { success: true, deliveryEmailMasked: maskEmailAddress(deliveryEmail) });
}

async function handleOwnerPasswordResetOtpCreate(req, res) {
  const session = requireOwner(req, res);
  if (!session) return;

  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return json(res, 400, { error: "Email is required." });
  }

  const user = statements.findUserByEmail.get(email);
  if (!user) {
    return json(res, 404, { error: "No account exists for that email." });
  }

  const reset = issuePasswordResetOtp(user);
  return json(res, 200, {
    success: true,
    email: reset.email,
    otp: reset.otp,
    expiresAt: reset.expiresAt,
    ttlMinutes: passwordResetTtlMinutes,
  });
}

async function handlePasswordResetConfirm(req, res) {
  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const otp = String(body.otp || "").trim();
  const password = String(body.password || "");

  if (!email || !otp || !password) {
    return json(res, 400, { error: "Email, OTP, and new password are required." });
  }

  if (!/^\d{6}$/.test(otp)) {
    return json(res, 400, { error: "OTP must be a 6-digit code." });
  }

  if (password.length < 6) {
    return json(res, 400, { error: "Password must be at least 6 characters." });
  }

  const resetRecord = statements.getActivePasswordResetOtpByEmail.get(email);
  if (!resetRecord) {
    return json(res, 400, { error: "The OTP is invalid or has expired." });
  }

  if (new Date(resetRecord.expires_at).getTime() <= Date.now()) {
    statements.deletePasswordResetOtpsByEmail.run(email);
    return json(res, 400, { error: "The OTP is invalid or has expired." });
  }

  if ((resetRecord.attempt_count || 0) >= passwordResetMaxAttempts) {
    return json(res, 429, { error: "Too many invalid OTP attempts. Request a new code and try again." });
  }

  if (!verifyOtp(email, otp, resetRecord.otp_salt, resetRecord.otp_hash)) {
    statements.incrementPasswordResetOtpAttempts.run(resetRecord.id);
    return json(res, 400, { error: "The OTP is invalid or has expired." });
  }

  const updatedAt = nowIso();
  statements.updatePassword.run(hashPassword(password), updatedAt, resetRecord.user_id);
  statements.deleteSessionsByUser.run(resetRecord.user_id);
  statements.markPasswordResetOtpUsed.run(updatedAt, resetRecord.id);

  return json(res, 200, { success: true });
}

async function handleConsultationCreate(req, res) {
  const body = await readBody(req);
  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const requestType = String(body.request_type || "service").trim();
  const service = String(body.service || "").trim();
  const message = String(body.message || "").trim();
  const status = String(body.status || "pending").trim() || "pending";
  const termsVersion = String(body.terms_version || "v1").trim() || "v1";
  const agreementAccepted = body.agreement_accepted === true;
  const signatureName = String(body.signature_name || "").trim();
  const signedAt = String(body.signed_at || "").trim();
  const parsedDocument = parseConsultationDocument(body.id_document);

  if (!fullName || !email || !service || !message) {
    return json(res, 400, { error: "Name, email, service, and message are required." });
  }
  if (!allowedConsultationRequestTypes.has(requestType)) {
    return json(res, 400, { error: "Invalid request type." });
  }
  if (!agreementAccepted) {
    return json(res, 400, { error: "You must accept the terms and conditions before submitting." });
  }
  if (!signatureName) {
    return json(res, 400, { error: "Typed signature is required before submitting." });
  }
  if (!signedAt) {
    return json(res, 400, { error: "Agreement signing time is required." });
  }
  if (!parsedDocument.valid) {
    return json(res, 400, { error: parsedDocument.error });
  }

  const session = getSession(req);
  const createdAt = nowIso();
  const consultation = {
    id: createId(),
    user_id: session?.user.id || null,
    full_name: fullName,
    email,
    phone,
    request_type: requestType,
    service,
    message,
    status,
    next_path: "service",
    next_path_status: "pending",
    owner_agreed: "no",
    payment_status: "not_requested",
    terms_version: termsVersion,
    agreement_accepted: true,
    signature_name: signatureName,
    signed_at: signedAt,
    id_document: parsedDocument.document,
    created_at: createdAt,
  };

  statements.insertConsultation.run(
    consultation.id,
    consultation.user_id,
    consultation.full_name,
    consultation.email,
    consultation.phone,
    consultation.request_type,
    consultation.service,
    consultation.message,
    consultation.status,
    consultation.next_path,
    consultation.next_path_status,
    consultation.owner_agreed,
    consultation.payment_status,
    consultation.terms_version,
    consultation.agreement_accepted ? 1 : 0,
    consultation.signature_name,
    consultation.signed_at,
    consultation.id_document.document_type,
    consultation.id_document.file_name,
    consultation.id_document.mime_type,
    consultation.id_document.size_bytes,
    consultation.id_document.data_url,
    consultation.created_at,
  );

  let notification = { enabled: Boolean(mailTransport), sent: false };
  try {
    notification = await sendConsultationNotification(consultation);
  } catch (error) {
    console.error("Consultation notification error:", error);
  }

  return json(res, 201, { consultation, notification });
}

function createServicePaymentRecord({
  consultation,
  session,
  requestType,
  service,
  complexity,
  paymentMethod,
  amount,
  phone,
  status,
  provider,
  externalReference,
  merchantRequestId = "",
  checkoutRequestId = "",
  providerResponse = "",
  lastError = "",
  receiptNumber = "",
  customerTransactionCode = "",
  paidAt = null,
}) {
  const timestamp = nowIso();
  const payment = {
    id: createId(),
    consultation_id: consultation.id,
    user_id: session.user.id,
    request_type: requestType,
    service,
    complexity,
    payment_method: paymentMethod,
    amount,
    currency: "KES",
    status,
    phone: phone || "",
    provider,
    external_reference: externalReference,
    merchant_request_id: merchantRequestId,
    checkout_request_id: checkoutRequestId,
    receipt_number: receiptNumber,
    customer_transaction_code: customerTransactionCode,
    provider_response: providerResponse,
    last_error: lastError,
    created_at: timestamp,
    updated_at: timestamp,
    paid_at: paidAt,
  };

  statements.insertServicePayment.run(
    payment.id,
    payment.consultation_id,
    payment.user_id,
    payment.request_type,
    payment.service,
    payment.complexity,
    payment.payment_method,
    payment.amount,
    payment.currency,
    payment.status,
    payment.phone,
    payment.provider,
    payment.external_reference,
    payment.merchant_request_id,
    payment.checkout_request_id,
    payment.receipt_number,
    payment.customer_transaction_code,
    payment.provider_response,
    payment.last_error,
    payment.created_at,
    payment.updated_at,
    payment.paid_at,
  );

  return statements.getServicePaymentById.get(payment.id);
}

async function handlePaymentInitialize(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;

  const body = await readBody(req);
  const consultationId = String(body.consultation_id || "").trim();
  const requestType = String(body.request_type || "service").trim();
  const service = String(body.service || "").trim();
  const complexity = String(body.complexity || "starter").trim();
  const paymentMethod = String(body.payment_method || "mpesa").trim();
  const providedAmount = Number(body.amount || 0);
  const normalizedPhone = normalizeKenyanPhone(body.phone || "");
  const transactionCode = String(body.transaction_code || "").trim().toUpperCase();
  const validRequestTypes = new Set(["service", "class"]);
  const validComplexities = new Set(["starter", "professional", "enterprise"]);
  const validMethods = new Set(["mpesa", "manual_mpesa", "card", "bank"]);

  if (!consultationId || !service) {
    return json(res, 400, { error: "Consultation and service are required." });
  }
  if (!validRequestTypes.has(requestType)) {
    return json(res, 400, { error: "Invalid request type." });
  }
  if (!validComplexities.has(complexity)) {
    return json(res, 400, { error: "Invalid service complexity." });
  }
  if (!validMethods.has(paymentMethod)) {
    return json(res, 400, { error: "Invalid payment method." });
  }
  if (paymentMethod === "manual_mpesa" && !transactionCode) {
    return json(res, 400, { error: "Manual M-Pesa transaction code is required." });
  }

  const consultation = statements.getConsultationById.get(consultationId);
  if (!consultation || consultation.user_id !== session.user.id) {
    return json(res, 404, { error: "Consultation not found." });
  }

  const amount = Math.max(1, Math.round(providedAmount || getServicePrice(service, complexity)));
  const externalReference = `${service.slice(0, 18).replace(/\s+/g, "-")}-${consultationId.slice(0, 8)}`;

  if (paymentMethod === "manual_mpesa") {
    const payment = createServicePaymentRecord({
      consultation,
      session,
      requestType,
      service,
      complexity,
      paymentMethod,
      amount,
      phone: paymentSupportPhone,
      status: "manual_mpesa_pending",
      provider: "manual",
      externalReference,
      customerTransactionCode: transactionCode,
      lastError: "Manual M-Pesa selected. Awaiting customer payment to 0757152440 and receipt confirmation.",
    });

    return json(res, 200, {
      success: true,
      payment,
      message: "Manual M-Pesa instructions recorded.",
      customerMessage: "Send the payment to 0757152440, then keep the M-Pesa message and share the transaction code for verification.",
    });
  }

  if (paymentMethod === "bank") {
    const payment = createServicePaymentRecord({
      consultation,
      session,
      requestType,
      service,
      complexity,
      paymentMethod,
      amount,
      phone: consultation.phone,
      status: "bank_option_pending",
      provider: "manual",
      externalReference,
      lastError: "Bank transfer selected, but bank account details have not been added yet.",
    });

    return json(res, 200, {
      success: true,
      payment,
      message: "Bank transfer option recorded.",
      customerMessage: "Bank transfer is listed on the site, but bank settlement is not active yet because no bank account has been added.",
    });
  }

  if (paymentMethod === "card") {
    const payment = createServicePaymentRecord({
      consultation,
      session,
      requestType,
      service,
      complexity,
      paymentMethod,
      amount,
      phone: consultation.phone,
      status: "card_option_recorded",
      provider: "manual",
      externalReference,
      lastError: "Card checkout preference captured. Gateway credentials are still required before live card charging.",
    });

    return json(res, 200, {
      success: true,
      payment,
      message: "Card checkout preference recorded.",
      customerMessage: "Debit or credit card payment has been captured as your preferred route, but live card charging still needs a connected card processor.",
    });
  }

  if (!normalizedPhone) {
    return json(res, 400, { error: "A valid Safaricom phone number is required for M-Pesa STK Push." });
  }

  const darajaConfig = validateDarajaConfig();
  if (!darajaConfig.configured) {
    return json(res, 503, {
      error: `Daraja STK Push is not configured yet. ${darajaConfig.issues.join(" ")}`,
    });
  }

  const pendingPayment = createServicePaymentRecord({
    consultation,
    session,
    requestType,
    service,
    complexity,
    paymentMethod,
    amount,
    phone: normalizedPhone,
    status: "stk_initiated",
    provider: "mpesa_daraja",
    externalReference,
  });

  try {
    const stkResponse = await initiateDarajaStkPush({
      amount,
      phone: normalizedPhone,
      reference: externalReference,
      description: `${service} ${complexity}`,
    });

    statements.updateServicePaymentStkMeta.run(
      "stk_requested",
      "mpesa_daraja",
      String(stkResponse.MerchantRequestID || ""),
      String(stkResponse.CheckoutRequestID || ""),
      JSON.stringify(stkResponse),
      "",
      nowIso(),
      pendingPayment.id,
    );

    const payment = statements.getServicePaymentById.get(pendingPayment.id);
    return json(res, 200, {
      success: true,
      payment,
      message: "STK Push sent to your phone.",
      checkoutRequestId: payment.checkout_request_id || null,
      customerMessage:
        String(stkResponse.CustomerMessage || "").trim() ||
        `Complete the M-Pesa prompt sent to ${normalizedPhone}.`,
    });
  } catch (error) {
    statements.updateServicePaymentStatus.run(
      "stk_failed",
      "",
      error instanceof Error ? error.message : "STK push could not be started.",
      "",
      nowIso(),
      null,
      pendingPayment.id,
    );

    return json(res, 502, {
      error: error instanceof Error ? error.message : "M-Pesa STK push could not be started.",
    });
  }
}

async function handleMpesaCallback(req, res) {
  const body = await readBody(req);
  const callback =
    body?.Body?.stkCallback ||
    body?.body?.stkCallback ||
    body?.stkCallback ||
    null;

  if (!callback) {
    return json(res, 400, { error: "Invalid M-Pesa callback payload." });
  }

  const checkoutRequestId = String(callback.CheckoutRequestID || "").trim();
  if (!checkoutRequestId) {
    return json(res, 400, { error: "Missing CheckoutRequestID." });
  }

  const payment = statements.getServicePaymentByCheckoutRequestId.get(checkoutRequestId);
  if (!payment) {
    return json(res, 200, { success: true });
  }

  const items = Array.isArray(callback.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item : [];
  const receiptNumber = String(items.find((item) => item.Name === "MpesaReceiptNumber")?.Value || "").trim();
  const paidAmount = Number(items.find((item) => item.Name === "Amount")?.Value || payment.amount || 0);
  const resultCode = Number(callback.ResultCode || 1);
  const resultDesc = String(callback.ResultDesc || "").trim();
  const paidAt = resultCode === 0 ? nowIso() : null;

  statements.updateServicePaymentStatus.run(
    resultCode === 0 ? "paid" : "failed",
    JSON.stringify({ ...callback, Amount: paidAmount || payment.amount }),
    resultCode === 0 ? "" : resultDesc,
    receiptNumber,
    nowIso(),
    paidAt,
    payment.id,
  );

  return json(res, 200, { success: true });
}

function handleConsultationList(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  const consultations = statements.listConsultationsByUser.all(session.user.id).map(formatConsultationRecord);
  return json(res, 200, { consultations });
}

function handleAdminConsultationList(req, res) {
  const session = requireOwner(req, res);
  if (!session) return;
  const consultations = statements.listAllConsultations.all().map(formatConsultationRecord);
  return json(res, 200, { consultations, ownerEmail });
}

function handleLessonAssessmentList(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  const records = statements.listLessonAssessmentsByUser.all(session.user.id);
  return json(res, 200, { records });
}

function handleAdminLessonAssessmentList(req, res) {
  const session = requireOwner(req, res);
  if (!session) return;
  const records = statements.listAllLessonAssessments.all();
  return json(res, 200, { records });
}

async function handleLessonAssessmentUpsert(req, res, consultationId) {
  const session = requireAuth(req, res);
  if (!session) return;

  const consultation = statements.getConsultationById.get(consultationId);
  if (!consultation || consultation.user_id !== session.user.id) {
    return json(res, 404, { error: "Consultation not found." });
  }

  const body = await readBody(req);
  const course = String(body.course || "").trim();
  const sessionLabel = String(body.session_label || "").trim();
  const assessmentType = String(body.assessment_type || "").trim();
  const topicNumber = Number(body.topic_number || 0);
  const score = Number(body.score);
  const correctAnswers = Number(body.correct_answers);
  const totalQuestions = Number(body.total_questions);
  const readTimeRequiredSeconds = Math.max(0, Number(body.read_time_required_seconds || 0));
  const readTimeCompletedAt = body.read_time_completed_at ? String(body.read_time_completed_at) : null;
  const allowedAssessmentTypes = new Set(["topic_quiz", "final_exam"]);

  if (!course || !sessionLabel || !allowedAssessmentTypes.has(assessmentType)) {
    return json(res, 400, { error: "Course, session label, and assessment type are required." });
  }

  if (
    !Number.isFinite(topicNumber) ||
    !Number.isFinite(score) ||
    !Number.isFinite(correctAnswers) ||
    !Number.isFinite(totalQuestions) ||
    totalQuestions <= 0
  ) {
    return json(res, 400, { error: "Assessment scores are invalid." });
  }

  const now = nowIso();
  const recordId = createId();

  statements.upsertLessonAssessment.run(
    recordId,
    consultationId,
    session.user.id,
    course,
    sessionLabel,
    Math.max(0, Math.round(topicNumber)),
    assessmentType,
    Math.max(0, Math.round(score)),
    Math.max(0, Math.round(correctAnswers)),
    Math.max(1, Math.round(totalQuestions)),
    Math.round(readTimeRequiredSeconds),
    readTimeCompletedAt,
    now,
    now,
  );

  const record = statements.getLessonAssessmentByIdentity.get(
    consultationId,
    course,
    sessionLabel,
    assessmentType,
  );

  return json(res, 200, { record });
}

async function handleConsultationStatusUpdate(req, res, id) {
  const session = requireOwner(req, res);
  if (!session) return;

  const body = await readBody(req);
  const status = String(body.status || "").trim();
  const allowedStatuses = new Set(["pending", "in_progress", "completed", "cancelled"]);

  if (!allowedStatuses.has(status)) {
    return json(res, 400, { error: "Invalid consultation status." });
  }

  statements.updateConsultationStatus.run(status, id);
  const consultation = statements.getConsultationById.get(id);

  if (!consultation) {
    return json(res, 404, { error: "Consultation not found." });
  }

  return json(res, 200, { consultation: formatConsultationRecord(consultation) });
}

async function handleConsultationWorkflowUpdate(req, res, id) {
  const session = requireOwner(req, res);
  if (!session) return;

  const existingConsultation = statements.getConsultationById.get(id);
  if (!existingConsultation) {
    return json(res, 404, { error: "Consultation not found." });
  }

  const body = await readBody(req);
  const nextPath = String(body.next_path || existingConsultation.next_path || "service").trim();
  const nextPathStatus = String(body.next_path_status || existingConsultation.next_path_status || "pending").trim();
  const ownerAgreed =
    body.owner_agreed === undefined
      ? existingConsultation.owner_agreed
      : body.owner_agreed === true || body.owner_agreed === "yes"
      ? "yes"
      : "no";
  const allowedNextPath = new Set(["service", "class"]);
  const allowedNextPathStatus = new Set(["pending", "test_in_progress", "test_completed", "certification_started"]);

  if (!allowedNextPath.has(nextPath)) {
    return json(res, 400, { error: "Invalid next path." });
  }

  if (!allowedNextPathStatus.has(nextPathStatus)) {
    return json(res, 400, { error: "Invalid next path status." });
  }

  if (ownerAgreed === "yes" && existingConsultation.payment_status !== "paid") {
    return json(res, 400, { error: "Payment must be received before approving this request." });
  }

  statements.updateConsultationWorkflow.run(nextPath, nextPathStatus, ownerAgreed, id);

  const consultation = statements.getConsultationById.get(id);
  if (!consultation) {
    return json(res, 404, { error: "Consultation not found." });
  }

  return json(res, 200, { consultation: formatConsultationRecord(consultation) });
}

async function handleConsultationPaymentStatusUpdate(req, res, id) {
  const session = requireOwner(req, res);
  if (!session) return;

  const consultation = statements.getConsultationById.get(id);
  if (!consultation) {
    return json(res, 404, { error: "Consultation not found." });
  }

  const body = await readBody(req);
  const paymentStatus = String(body.payment_status || "").trim();
  const allowedPaymentStatuses = new Set(["not_requested", "awaiting_payment", "paid"]);

  if (!allowedPaymentStatuses.has(paymentStatus)) {
    return json(res, 400, { error: "Invalid payment status." });
  }

  statements.updateConsultationPaymentStatus.run(paymentStatus, id);

  if (paymentStatus !== "paid" && consultation.owner_agreed === "yes") {
    statements.updateConsultationWorkflow.run(
      consultation.next_path,
      consultation.next_path_status,
      "no",
      id,
    );
  }

  const updatedConsultation = statements.getConsultationById.get(id);
  return json(res, 200, { consultation: formatConsultationRecord(updatedConsultation) });
}

function handleSavedServicesList(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  const savedServices = statements.listSavedServicesByUser.all(session.user.id);
  return json(res, 200, { savedServices });
}

async function handleSavedServiceCreate(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;

  const body = await readBody(req);
  const title = String(body.service_title || "").trim();
  const category = String(body.service_category || "").trim();
  const description = String(body.service_description || "").trim();

  if (!title || !category || !description) {
    return json(res, 400, { error: "Service title, category, and description are required." });
  }

  statements.deleteSavedServiceByTitle.run(session.user.id, title);

  const savedService = {
    id: createId(),
    service_title: title,
    service_category: category,
    service_description: description,
    saved_at: nowIso(),
  };

  statements.insertSavedService.run(
    savedService.id,
    session.user.id,
    savedService.service_title,
    savedService.service_category,
    savedService.service_description,
    savedService.saved_at,
  );

  return json(res, 201, { savedService });
}

function handleSavedServiceDelete(req, res, id) {
  const session = requireAuth(req, res);
  if (!session) return;
  statements.deleteSavedServiceById.run(id, session.user.id);
  return json(res, 200, { success: true });
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      return json(res, 400, { error: "Invalid request." });
    }

    if (req.method === "OPTIONS") {
      return json(res, 200, { ok: true });
    }

    statements.deleteExpiredPasswordResetOtps.run(nowIso());

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const { pathname } = url;

    if (req.method === "GET" && pathname === "/api/health") return await handleHealth(req, res);
    if (req.method === "POST" && pathname === "/api/auth/signup") return await handleSignup(req, res);
    if (req.method === "POST" && pathname === "/api/auth/signin") return await handleSignin(req, res);
    if (req.method === "POST" && pathname === "/api/auth/password-reset/request") {
      return await handlePasswordResetRequest(req, res);
    }
    if (req.method === "POST" && pathname === "/api/auth/password-reset/confirm") {
      return await handlePasswordResetConfirm(req, res);
    }
    if (req.method === "POST" && pathname === "/api/auth/signout") return await handleSignout(req, res);
    if (req.method === "GET" && pathname === "/api/auth/me") return await handleMe(req, res);
    if (req.method === "PATCH" && pathname === "/api/auth/password") return await handlePasswordUpdate(req, res);
    if (req.method === "PATCH" && pathname === "/api/profile") return await handleProfileUpdate(req, res);
    if (req.method === "GET" && pathname === "/api/consultations") return await handleConsultationList(req, res);
    if (req.method === "POST" && pathname === "/api/consultations") return await handleConsultationCreate(req, res);
    if (req.method === "POST" && pathname === "/api/payments/initialize") return await handlePaymentInitialize(req, res);
    if (req.method === "POST" && pathname === "/api/payments/mpesa/callback") return await handleMpesaCallback(req, res);
    if (req.method === "GET" && pathname === "/api/lesson-assessments") return await handleLessonAssessmentList(req, res);
    if (req.method === "GET" && pathname === "/api/admin/consultations") return await handleAdminConsultationList(req, res);
    if (req.method === "GET" && pathname === "/api/admin/lesson-assessments") {
      return await handleAdminLessonAssessmentList(req, res);
    }
    if (req.method === "POST" && pathname === "/api/admin/password-reset-otp") {
      return await handleOwnerPasswordResetOtpCreate(req, res);
    }
    if (
      req.method === "POST" &&
      pathname.startsWith("/api/consultations/") &&
      pathname.endsWith("/lesson-assessments")
    ) {
      const id = pathname.replace("/api/consultations/", "").replace("/lesson-assessments", "").replace(/\//g, "");
      return await handleLessonAssessmentUpsert(req, res, id);
    }
    if (
      req.method === "PATCH" &&
      pathname.startsWith("/api/admin/consultations/") &&
      pathname.endsWith("/status")
    ) {
      const id = pathname.replace("/api/admin/consultations/", "").replace("/status", "").replace(/\//g, "");
      return await handleConsultationStatusUpdate(req, res, id);
    }
    if (
      req.method === "PATCH" &&
      pathname.startsWith("/api/admin/consultations/") &&
      pathname.endsWith("/workflow")
    ) {
      const id = pathname.replace("/api/admin/consultations/", "").replace("/workflow", "").replace(/\//g, "");
      return await handleConsultationWorkflowUpdate(req, res, id);
    }
    if (
      req.method === "PATCH" &&
      pathname.startsWith("/api/admin/consultations/") &&
      pathname.endsWith("/payment")
    ) {
      const id = pathname.replace("/api/admin/consultations/", "").replace("/payment", "").replace(/\//g, "");
      return await handleConsultationPaymentStatusUpdate(req, res, id);
    }
    if (req.method === "GET" && pathname === "/api/saved-services") return await handleSavedServicesList(req, res);
    if (req.method === "POST" && pathname === "/api/saved-services") return await handleSavedServiceCreate(req, res);
    if (req.method === "DELETE" && pathname.startsWith("/api/saved-services/")) {
      const id = pathname.replace("/api/saved-services/", "");
      return await handleSavedServiceDelete(req, res, id);
    }

    return json(res, 404, { error: "Not found." });
  } catch (error) {
    if (isSqliteLockedError(error)) {
      return json(res, 503, {
        error: "The database is busy right now. Close any editing window in DB Browser for SQLite and try again.",
      });
    }

    console.error(error);
    return json(res, 500, { error: "Internal server error." });
  }
});

server.listen(port, () => {
  console.log(`SQLite API running on http://localhost:${port}`);
  console.log(`Database file: ${dbPath}`);
  console.log(`Owner email: ${ownerEmail}`);
  console.log(`Email notifications: ${canSendEmail() ? "enabled" : "disabled (set SMTP or Resend credentials in .env)"}`);
});
