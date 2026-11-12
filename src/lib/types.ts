export type Track = "student" | "developer";

/** A daily report as recorded in src/data/leaderboard.json. */
export type StoredReport = {
  /** Report date, e.g. "2026-11-12". */
  date: string;
  file: string;
  participants: number;
};

/** A participant as written by scripts/ingest-reports.mjs. Emails and access codes are never stored. */
export type StoredParticipant = {
  id: string;
  name: string;
  profileUrl: string | null;
  /** False when Google couldn't read the participant's Google Skills profile URL. */
  profileOk: boolean;
  track: Track;
  team: string | null;
  /** Skill badges completed, as counted by Google in the latest report. */
  badges: number;
  badgeNames: string[];
  /** 0 when no milestone has been reached yet. */
  milestone: number;
  accessCodeRedeemed: boolean;
  /** Gemini Enterprise Agent Ready (GEAR) digital badges. Developers only. */
  gear: string[];
  /** Badge count in each report, in the same order as `reports`. Null when absent from a report. */
  history: (number | null)[];
};

export type LeaderboardData = {
  reports: StoredReport[];
  participants: StoredParticipant[];
};

/** A participant with the values the pages show, derived in src/lib/leaderboard.ts. */
export type Participant = StoredParticipant & {
  /** 0 to 100. */
  progress: number;
  isComplete: boolean;
  /** Date of the first report that showed all badges completed. */
  completedOn: string | null;
  /** True when the participant had already finished in the earliest report we have. */
  completedByFirstReport: boolean;
  /** Finishing order. Participants who finished in the same report share a rank. */
  rank: number | null;
  isSwagEligible: boolean;
  /** Badges gained since the previous report. Null when there is no previous report. */
  gained: number | null;
};

/** The subset of a participant that the leaderboard table needs on the client. */
export type LeaderboardRow = Pick<
  Participant,
  | "id"
  | "name"
  | "profileUrl"
  | "profileOk"
  | "track"
  | "team"
  | "badges"
  | "milestone"
  | "progress"
  | "isComplete"
  | "completedOn"
  | "completedByFirstReport"
  | "rank"
  | "isSwagEligible"
>;

export type Team = {
  rank: number;
  name: string;
  color: string;
  mentor: { name: string; avatar?: string } | null;
  members: Participant[];
  progress: number;
  completedCount: number;
  activeCount: number;
  inactiveCount: number;
};
