import { createServer } from "node:http";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
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
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || smtpUser || ownerEmail;

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
    service TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
`);

const statements = {
  createUser: db.prepare(`
    INSERT INTO users (
      id, email, password_hash, username, full_name, phone, avatar_url, bio, company, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, '', '', '', '', ?, ?)
  `),
  findUserByEmail: db.prepare(`
    SELECT id, email, password_hash, username, full_name, phone, avatar_url, bio, company, created_at, updated_at
    FROM users
    WHERE email = ?
  `),
  findUserByUsername: db.prepare(`
    SELECT id FROM users WHERE username = ?
  `),
  getUserProfile: db.prepare(`
    SELECT id, email, username, full_name, phone, avatar_url, bio, company, created_at, updated_at
    FROM users
    WHERE id = ?
  `),
  updateProfile: db.prepare(`
    UPDATE users
    SET username = ?, full_name = ?, phone = ?, bio = ?, company = ?, updated_at = ?
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
  cleanupExpiredSessions: db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`),
  insertConsultation: db.prepare(`
    INSERT INTO consultations (id, user_id, full_name, email, phone, service, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  listConsultationsByUser: db.prepare(`
    SELECT id, full_name, email, phone, service, message, status, created_at
    FROM consultations
    WHERE user_id = ?
    ORDER BY datetime(created_at) DESC
  `),
  listAllConsultations: db.prepare(`
    SELECT id, user_id, full_name, email, phone, service, message, status, created_at
    FROM consultations
    ORDER BY datetime(created_at) DESC
  `),
  getConsultationById: db.prepare(`
    SELECT id, user_id, full_name, email, phone, service, message, status, created_at
    FROM consultations
    WHERE id = ?
  `),
  updateConsultationStatus: db.prepare(`
    UPDATE consultations
    SET status = ?
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
};

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return randomBytes(16).toString("hex");
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

function sanitizeUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    full_name: row.full_name,
    phone: row.phone,
    avatar_url: row.avatar_url,
    bio: row.bio,
    company: row.company,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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

async function sendConsultationNotification(consultation) {
  if (!mailTransport) {
    return { enabled: false, sent: false };
  }

  const subject = `New consultation: ${consultation.service}`;
  const lines = [
    "A new consultation was submitted on Expert Tech Solutions & Training.",
    "",
    `Name: ${consultation.full_name}`,
    `Email: ${consultation.email}`,
    `Phone: ${consultation.phone || "Not provided"}`,
    `Service: ${consultation.service}`,
    `Status: ${consultation.status}`,
    `Submitted: ${consultation.created_at}`,
    "",
    "Message:",
    consultation.message,
  ];

  await mailTransport.sendMail({
    from: smtpFrom,
    to: ownerEmail,
    replyTo: consultation.email,
    subject,
    text: lines.join("\n"),
  });

  return { enabled: true, sent: true };
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
  return json(res, 200, {
    ok: true,
    ownerEmail,
    emailNotificationsEnabled: Boolean(mailTransport),
  });
}

async function handleProfileUpdate(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;

  const body = await readBody(req);
  const username = String(body.username || "").trim();
  const fullName = String(body.full_name || "").trim();
  const phone = String(body.phone || "").trim();
  const bio = String(body.bio || "").trim();
  const company = String(body.company || "").trim();

  if (!username || !fullName) {
    return json(res, 400, { error: "Username and full name are required." });
  }

  const existingUser = statements.findUserByUsername.get(username);
  if (existingUser && existingUser.id !== session.user.id) {
    return json(res, 409, { error: "That username is already taken." });
  }

  statements.updateProfile.run(username, fullName, phone, bio, company, nowIso(), session.user.id);
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

async function handleConsultationCreate(req, res) {
  const body = await readBody(req);
  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const service = String(body.service || "").trim();
  const message = String(body.message || "").trim();
  const status = String(body.status || "pending").trim() || "pending";

  if (!fullName || !email || !service || !message) {
    return json(res, 400, { error: "Name, email, service, and message are required." });
  }

  const session = getSession(req);
  const createdAt = nowIso();
  const consultation = {
    id: createId(),
    user_id: session?.user.id || null,
    full_name: fullName,
    email,
    phone,
    service,
    message,
    status,
    created_at: createdAt,
  };

  statements.insertConsultation.run(
    consultation.id,
    consultation.user_id,
    consultation.full_name,
    consultation.email,
    consultation.phone,
    consultation.service,
    consultation.message,
    consultation.status,
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

function handleConsultationList(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  const consultations = statements.listConsultationsByUser.all(session.user.id);
  return json(res, 200, { consultations });
}

function handleAdminConsultationList(req, res) {
  const session = requireOwner(req, res);
  if (!session) return;
  const consultations = statements.listAllConsultations.all();
  return json(res, 200, { consultations, ownerEmail });
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

  return json(res, 200, { consultation });
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

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const { pathname } = url;

    if (req.method === "GET" && pathname === "/api/health") return await handleHealth(req, res);
    if (req.method === "POST" && pathname === "/api/auth/signup") return await handleSignup(req, res);
    if (req.method === "POST" && pathname === "/api/auth/signin") return await handleSignin(req, res);
    if (req.method === "POST" && pathname === "/api/auth/signout") return await handleSignout(req, res);
    if (req.method === "GET" && pathname === "/api/auth/me") return await handleMe(req, res);
    if (req.method === "PATCH" && pathname === "/api/auth/password") return await handlePasswordUpdate(req, res);
    if (req.method === "PATCH" && pathname === "/api/profile") return await handleProfileUpdate(req, res);
    if (req.method === "GET" && pathname === "/api/consultations") return await handleConsultationList(req, res);
    if (req.method === "POST" && pathname === "/api/consultations") return await handleConsultationCreate(req, res);
    if (req.method === "GET" && pathname === "/api/admin/consultations") return await handleAdminConsultationList(req, res);
    if (
      req.method === "PATCH" &&
      pathname.startsWith("/api/admin/consultations/") &&
      pathname.endsWith("/status")
    ) {
      const id = pathname.replace("/api/admin/consultations/", "").replace("/status", "").replace(/\//g, "");
      return await handleConsultationStatusUpdate(req, res, id);
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
  console.log(
    `Email notifications: ${mailTransport ? "enabled" : "disabled (set SMTP_USER and SMTP_PASS in .env)"}`
  );
});
