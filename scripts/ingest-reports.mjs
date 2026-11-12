#!/usr/bin/env node
/**
 * Turns the daily Google Cloud "Learn with Communities" progress reports (CSV files)
 * into src/data/leaderboard.json, which the site renders.
 *
 *   npm run ingest          rebuild from every CSV in data/reports/
 *   npm run ingest:watch    rebuild whenever a report is added or changed
 *
 * Save each day's CSV in data/reports/ under Google's name. The report date is read
 * from the file name, e.g. "GDGC-CUCHD [13 Nov].csv" (an ISO date such as
 * 2026-11-13 also works). Keep the old reports: the order in which people finished
 * is worked out by comparing them.
 *
 * Reports contain emails and access codes, so data/reports/ is gitignored. Emails are
 * only used to match people across reports and are never written to the output.
 *
 * Optional: data/teams.csv with an "Email" and a "Team" column assigns teams.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, watch, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS_DIR = join(ROOT, "data", "reports");
const TEAMS_FILE = join(ROOT, "data", "teams.csv");
const CONFIG_FILE = join(ROOT, "src", "config", "campaign.json");
const OUTPUT_FILE = join(ROOT, "src", "data", "leaderboard.json");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Column headers in Google's report. Matching ignores case and extra spaces.
const COLUMNS = {
  name: { header: "User Name", required: true },
  email: { header: "User Email", required: true },
  profileUrl: { header: "Google Skills Profile URL", required: true },
  profileStatus: { header: "Google Skills Profile Status", required: false },
  developerStatus: { header: "Google Developer Profile Status", required: false },
  accessCodeStatus: { header: "Access Code Redemption Status", required: false },
  milestone: { header: "Milestone Completed", required: false },
  gear: { header: "GEAR Digital Badges", required: false },
  badgeCount: { header: "Skill Badges Completed Count", required: true },
  badgeNames: { header: "Skill Badges Completed Names", required: true },
};

const EMPTY_VALUES = new Set(["", "not applicable", "n/a", "na", "none", "no badge", "-"]);

const rel = (path) => relative(ROOT, path).replaceAll("\\", "/");
const log = (message) => console.log(`[ingest] ${message}`);
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");
const isEmpty = (value) => EMPTY_VALUES.has((value ?? "").trim().toLowerCase());

/** RFC 4180 CSV parser: handles quoted fields, escaped quotes, commas and newlines in quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function readTable(text) {
  const [header = [], ...rows] = parseCsv(text.replace(/^\uFEFF/, ""));
  return { header: header.map((h) => h.replace(/\s+/g, " ").trim().toLowerCase()), rows };
}

function toIsoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

/** Reads the report date from names like "GDGC-CUCHD [12 Nov].csv", "Nov 12.csv" or "2026-11-12.csv". */
function reportDateFromFileName(fileName, year) {
  const iso = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  for (const match of fileName.matchAll(/(\d{1,2})(?:st|nd|rd|th)?[\s_-]*([A-Za-z]{3,9})/g)) {
    const month = MONTHS.indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
    if (month > 0) return toIsoDate(year, month, Number(match[1]));
  }
  for (const match of fileName.matchAll(/([A-Za-z]{3,9})[\s_-]*(\d{1,2})(?!\d)/g)) {
    const month = MONTHS.indexOf(match[1].slice(0, 3).toLowerCase()) + 1;
    if (month > 0) return toIsoDate(year, month, Number(match[2]));
  }
  return null;
}

/** "RAHUL  KUMAR" or "rahul kumar" becomes "Rahul Kumar". Mixed-case names are left alone. */
function cleanName(raw) {
  const name = (raw ?? "").replace(/\s+/g, " ").trim();
  if (name !== name.toUpperCase() && name !== name.toLowerCase()) return name;
  return name.toLowerCase().replace(/(^|[\s.'-])(\p{L})/gu, (_, separator, letter) => separator + letter.toUpperCase());
}

/** Returns an absolute http(s) URL or null. Adds the missing "https://" Google sometimes leaves out. */
function cleanProfileUrl(raw) {
  let url = (raw ?? "").trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url.replace(/^\/+/, "")}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Badge names are comma-separated, but some titles contain commas
 * ("Store, Process, and Manage Data on Google Cloud - Console"), so known titles from
 * the campaign config are matched first, joining up to 4 comma-separated pieces.
 */
function splitBadgeNames(raw, titlesBySlug) {
  const pieces = (raw ?? "").split(",").map((piece) => piece.trim());
  const badges = [];
  for (let i = 0; i < pieces.length; ) {
    let matched = false;
    for (let length = Math.min(4, pieces.length - i); length >= 1; length--) {
      const title = titlesBySlug.get(slug(pieces.slice(i, i + length).join(", ")));
      if (title) {
        badges.push(title);
        i += length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (pieces[i] && !isEmpty(pieces[i])) badges.push(pieces[i]);
      i++;
    }
  }
  return [...new Set(badges)];
}

function parseReport(text, fileName, titlesBySlug) {
  const { header, rows } = readTable(text);
  const index = {};
  for (const [key, column] of Object.entries(COLUMNS)) {
    index[key] = header.indexOf(column.header.toLowerCase());
    if (column.required && index[key] === -1) {
      throw new Error(
        `"${fileName}" has no "${column.header}" column. Columns found: ${header.join(", ") || "(none)"}. ` +
          `If Google renamed a column, update COLUMNS in scripts/ingest-reports.mjs.`,
      );
    }
  }
  const cell = (row, key) => (index[key] === -1 ? "" : (row[index[key]] ?? "").trim());

  return rows.map((row) => {
    const email = cell(row, "email").toLowerCase();
    const profileUrl = cleanProfileUrl(cell(row, "profileUrl"));
    const name = cleanName(cell(row, "name"));
    const badgeNames = splitBadgeNames(cell(row, "badgeNames"), titlesBySlug);
    const count = Number.parseInt(cell(row, "badgeCount"), 10);
    const profileStatus = cell(row, "profileStatus");
    const milestone = Number.parseInt(cell(row, "milestone").match(/\d+/)?.[0] ?? "0", 10);

    return {
      key: email || profileUrl || name.toLowerCase(),
      email,
      name,
      profileUrl,
      profileOk: profileUrl !== null && (index.profileStatus === -1 || !profileStatus || /all good/i.test(profileStatus)),
      track: isEmpty(cell(row, "developerStatus")) ? "student" : "developer",
      accessCodeRedeemed: /^y(es)?$/i.test(cell(row, "accessCodeStatus")),
      milestone,
      gear: cell(row, "gear")
        .split(",")
        .map((badge) => badge.trim())
        .filter((badge) => !isEmpty(badge)),
      badges: Number.isFinite(count) ? count : badgeNames.length,
      badgeNames,
    };
  });
}

function readTeams() {
  if (!existsSync(TEAMS_FILE)) return null;
  const { header, rows } = readTable(readFileSync(TEAMS_FILE, "utf8"));
  const emailIndex = header.findIndex((h) => ["user email", "email", "email address"].includes(h));
  const teamIndex = header.findIndex((h) => ["team", "team name"].includes(h));
  if (emailIndex === -1 || teamIndex === -1) {
    throw new Error(`${rel(TEAMS_FILE)} needs an "Email" column and a "Team" column. Columns found: ${header.join(", ")}`);
  }
  const teams = new Map();
  for (const row of rows) {
    const email = (row[emailIndex] ?? "").trim().toLowerCase();
    const team = (row[teamIndex] ?? "").replace(/\s+/g, " ").trim();
    if (email && team) teams.set(email, team);
  }
  return teams;
}

function participantId(row, usedIds) {
  const uuid = row.profileUrl?.match(/public_profiles\/([0-9a-f-]{36})/i)?.[1];
  const base = uuid ? uuid.toLowerCase() : createHash("sha256").update(`name:${row.name}`).digest("hex").slice(0, 16);
  let id = base;
  for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
  usedIds.add(id);
  return id;
}

function serialize(output) {
  const list = (items, indent) => (items.length ? `\n${items.map((item) => indent + JSON.stringify(item)).join(",\n")}\n  ` : "");
  return `{\n  "reports": [${list(output.reports, "    ")}],\n  "participants": [${list(output.participants, "    ")}]\n}\n`;
}

function writeOutput(output) {
  const text = serialize(output);
  if (existsSync(OUTPUT_FILE) && readFileSync(OUTPUT_FILE, "utf8") === text) return false;
  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, text);
  return true;
}

function formatDay(isoDate) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

function ingest() {
  const config = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
  const titlesBySlug = new Map();
  for (const title of [...config.courses.map((course) => course.title), ...Object.values(config.tracks).flatMap((t) => t.badges)]) {
    titlesBySlug.set(slug(title), title);
  }

  const files = existsSync(REPORTS_DIR) ? readdirSync(REPORTS_DIR).filter((file) => /\.csv$/i.test(file)).sort() : [];
  if (files.length === 0) {
    log(`No CSV reports in ${rel(REPORTS_DIR)}/. Keeping ${rel(OUTPUT_FILE)} as it is.`);
    if (!existsSync(OUTPUT_FILE)) writeOutput({ reports: [], participants: [] });
    return;
  }

  // 1. Read every report, keyed by its date.
  const reportsByDate = new Map();
  for (const file of files) {
    const date = reportDateFromFileName(file, config.year);
    if (!date) {
      throw new Error(
        `Can't tell the report date from "${file}". Keep Google's file name (e.g. "GDGC-CUCHD [13 Nov].csv") ` +
          `or rename it to include a date like ${config.year}-11-13.`,
      );
    }
    const text = readFileSync(join(REPORTS_DIR, file), "utf8");
    const hash = createHash("sha256").update(text).digest("hex");
    const existing = reportsByDate.get(date);
    if (existing) {
      if (existing.hash === hash) {
        // Re-downloads like "Report [12 Nov] (1).csv" are ignored; keep the shorter, original name.
        const [kept, skipped] = file.length < existing.file.length ? [file, existing.file] : [existing.file, file];
        existing.file = kept;
        log(`Skipping "${skipped}": it's identical to "${kept}".`);
        continue;
      }
      throw new Error(`Two different reports are dated ${date}: "${existing.file}" and "${file}". Delete the wrong one.`);
    }
    reportsByDate.set(date, { date, file, hash, rows: parseReport(text, file, titlesBySlug) });
  }
  const reports = [...reportsByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const latest = reports[reports.length - 1];
  const warnings = [];

  // 2. Build each person's badge count history across reports, matched by email.
  const history = new Map();
  reports.forEach((report, reportIndex) => {
    const seen = new Map();
    for (const row of report.rows) {
      const previous = seen.get(row.key);
      if (previous) {
        warnings.push(`"${report.file}" lists the same participant twice; kept the row with more badges.`);
        if (previous.badges >= row.badges) continue;
      }
      seen.set(row.key, row);
      if (!history.has(row.key)) history.set(row.key, Array(reports.length).fill(null));
      history.get(row.key)[reportIndex] = row.badges;
    }
    report.rows = [...seen.values()];
  });

  // 3. The latest report decides who is on the leaderboard.
  const teams = readTeams();
  const usedIds = new Set();
  const trackBadges = Object.fromEntries(Object.entries(config.tracks).map(([track, t]) => [track, new Set(t.badges)]));
  const unknownBadges = new Map();
  let offTrack = 0;
  let countMismatch = 0;

  const participants = latest.rows
    .map((row) => {
      for (const badge of row.badgeNames) {
        if (!titlesBySlug.has(slug(badge))) unknownBadges.set(badge, (unknownBadges.get(badge) ?? 0) + 1);
      }
      if (row.badgeNames.some((badge) => trackBadges[row.track] && !trackBadges[row.track].has(badge))) offTrack++;
      if (row.badgeNames.length !== row.badges) countMismatch++;

      return {
        id: participantId(row, usedIds),
        name: row.name,
        profileUrl: row.profileUrl,
        profileOk: row.profileOk,
        track: row.track,
        team: teams?.get(row.email) ?? null,
        badges: row.badges,
        badgeNames: row.badgeNames,
        milestone: row.milestone,
        accessCodeRedeemed: row.accessCodeRedeemed,
        gear: row.gear,
        history: history.get(row.key),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

  const latestKeys = new Set(latest.rows.map((row) => row.key));
  const dropped = [...history.keys()].filter((key) => !latestKeys.has(key)).length;
  if (dropped) warnings.push(`${dropped} participant(s) from older reports are missing from the latest one and were left out.`);
  if (unknownBadges.size) {
    warnings.push(
      `Badges not in src/config/campaign.json (add them if they're part of the curriculum): ` +
        [...unknownBadges].map(([badge, count]) => `"${badge}" (${count})`).join(", "),
    );
  }
  if (offTrack) warnings.push(`${offTrack} participant(s) have badges outside their track's curriculum.`);
  if (countMismatch) warnings.push(`${countMismatch} row(s) have a badge count that differs from the number of badge names.`);
  const badUrls = participants.filter((p) => !p.profileOk).length;
  if (badUrls) warnings.push(`${badUrls} participant(s) have a missing or invalid Google Skills profile URL.`);
  if (teams) {
    const withoutTeam = participants.filter((p) => !p.team).length;
    if (withoutTeam) warnings.push(`${withoutTeam} participant(s) aren't in ${rel(TEAMS_FILE)}.`);
  }

  const changed = writeOutput({
    reports: reports.map((report) => ({ date: report.date, file: report.file, participants: report.rows.length })),
    participants,
  });

  const finished = participants.filter((p) => p.badges >= config.totalBadges).length;
  const range = reports.length > 1 ? `${formatDay(reports[0].date)} to ${formatDay(latest.date)}` : formatDay(latest.date);
  log(
    `${reports.length} report(s) (${range}): ${participants.length} participants, ` +
      `${finished} with all ${config.totalBadges} badges.`,
  );
  for (const warning of warnings) log(`Warning: ${warning}`);
  log(changed ? `Wrote ${rel(OUTPUT_FILE)}.` : `${rel(OUTPUT_FILE)} is already up to date.`);
}

/** Runs one ingest. Returns the error instead of throwing so watch mode keeps going. */
function run() {
  try {
    ingest();
    return null;
  } catch (error) {
    console.error(`[ingest] Error: ${error instanceof Error ? error.message : error}`);
    return error;
  }
}

if (process.argv.includes("--watch")) {
  mkdirSync(REPORTS_DIR, { recursive: true });
  let timer;
  let retries = 0;
  const schedule = (delay = 500) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const error = run();
      // Windows locks a file while it's still being downloaded or copied.
      if (error && ["EBUSY", "EPERM"].includes(error.code) && retries < 10) {
        retries++;
        log("A report is still being saved. Trying again in a second.");
        schedule(1000);
      } else {
        retries = 0;
      }
    }, delay);
  };
  watch(REPORTS_DIR, (_event, file) => {
    if (!file || /\.csv$/i.test(file)) schedule();
  });
  watch(dirname(TEAMS_FILE), (_event, file) => {
    if (file === "teams.csv") schedule();
  });
  log(`Watching ${rel(REPORTS_DIR)}/ for new reports. Press Ctrl+C to stop.`);
  schedule(0);
} else if (run()) {
  process.exitCode = 1;
}
