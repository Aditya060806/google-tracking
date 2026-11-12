/**
 * All leaderboard rules live here: progress, finishing order, swag eligibility,
 * summary numbers and teams. Pages import from this module at build time, so the data
 * file is never shipped to the browser as a whole.
 */
import rawData from "@/data/leaderboard.json";
import { campaign, TRACKS } from "@/lib/campaign";
import type { LeaderboardData, LeaderboardRow, Participant, StoredParticipant, StoredReport, Team, Track } from "@/lib/types";

const data = rawData as unknown as LeaderboardData;
const TOTAL = campaign.totalBadges;

const TEAM_COLORS = [
  "hsl(var(--google-blue))",
  "hsl(var(--google-red))",
  "hsl(var(--google-yellow))",
  "hsl(var(--google-green))",
  "hsl(var(--chart-5))",
  "hsl(260 85% 65%)",
  "hsl(310 80% 60%)",
  "hsl(190 75% 55%)",
  "hsl(30 90% 58%)",
  "hsl(0 0% 63%)",
];

/**
 * Index of the report where the participant's current run of "all badges done" started.
 * Reports only come once a day, so this is the most precise finishing time we have.
 */
function completionReportIndex(participant: StoredParticipant): number {
  if (participant.badges < TOTAL) return -1;
  let index = -1;
  for (let i = participant.history.length - 1; i >= 0; i--) {
    const count = participant.history[i];
    if (count === null) continue;
    if (count < TOTAL) break;
    index = i;
  }
  return index;
}

function byLeaderboardOrder(a: Participant, b: Participant): number {
  if (a.rank !== null && b.rank !== null && a.rank !== b.rank) return a.rank - b.rank;
  if (a.rank !== null && b.rank === null) return -1;
  if (a.rank === null && b.rank !== null) return 1;
  if (a.badges !== b.badges) return b.badges - a.badges;
  return a.name.localeCompare(b.name);
}

function buildParticipants(): Participant[] {
  const indexes = data.participants.map(completionReportIndex);
  const finishedIndexes = indexes.filter((index) => index >= 0);

  return data.participants
    .map((participant, i): Participant => {
      const reportIndex = indexes[i];
      // Competition ranking: everyone who finished in the same report shares a rank.
      const rank = reportIndex >= 0 ? 1 + finishedIndexes.filter((other) => other < reportIndex).length : null;
      const history = participant.history;
      const previous = history.length > 1 ? history[history.length - 2] : null;

      return {
        ...participant,
        progress: Math.round((Math.min(participant.badges, TOTAL) / TOTAL) * 100),
        isComplete: reportIndex >= 0,
        completedOn: reportIndex >= 0 ? data.reports[reportIndex].date : null,
        completedByFirstReport: reportIndex === 0,
        rank,
        isSwagEligible: campaign.swag.enabled && rank !== null && rank <= campaign.swag.limit,
        gained: previous === null ? null : participant.badges - previous,
      };
    })
    .sort(byLeaderboardOrder);
}

const participants = buildParticipants();

/** Every participant in leaderboard order: finishers first, then by badges and name. */
export function getParticipants(): Participant[] {
  return participants;
}

export function getLeaderboardRows(): LeaderboardRow[] {
  return participants.map((p) => ({
    id: p.id,
    name: p.name,
    profileUrl: p.profileUrl,
    profileOk: p.profileOk,
    track: p.track,
    team: p.team,
    badges: Math.min(p.badges, TOTAL),
    milestone: p.milestone,
    progress: p.progress,
    isComplete: p.isComplete,
    completedOn: p.completedOn,
    completedByFirstReport: p.completedByFirstReport,
    rank: p.rank,
    isSwagEligible: p.isSwagEligible,
  }));
}

export function getReports(): StoredReport[] {
  return data.reports;
}

export function getLatestReport(): StoredReport | null {
  return data.reports.at(-1) ?? null;
}

export function getPreviousReport(): StoredReport | null {
  return data.reports.length > 1 ? data.reports[data.reports.length - 2] : null;
}

export function getSummary() {
  const count = (filter: (p: Participant) => boolean) => participants.filter(filter).length;
  const perTrack = (filter: (p: Participant) => boolean) =>
    Object.fromEntries(TRACKS.map((track) => [track, count((p) => p.track === track && filter(p))])) as Record<Track, number>;

  const finishers = participants.filter((p) => p.isComplete);
  const latestFinishDate = finishers.reduce<string | null>(
    (latest, p) => (p.completedOn && (!latest || p.completedOn > latest) ? p.completedOn : latest),
    null,
  );
  const badgesEarned = participants.reduce((sum, p) => sum + Math.min(p.badges, TOTAL), 0);

  return {
    enrolled: participants.length,
    enrolledByTrack: perTrack(() => true),
    redeemed: count((p) => p.accessCodeRedeemed),
    active: count((p) => p.badges > 0),
    completed: finishers.length,
    completedByTrack: perTrack((p) => p.isComplete),
    badgesEarned,
    badgesPossible: participants.length * TOTAL,
    overallProgress: participants.length ? Math.round((badgesEarned / (participants.length * TOTAL)) * 100) : 0,
    milestones: [1, 2, 3].map((level) => ({ level, count: count((p) => p.milestone >= level) })),
    swagEligible: count((p) => p.isSwagEligible),
    /** Everyone who finished in the most recent report that had a new finisher. */
    latestFinishers: finishers.filter((p) => p.completedOn === latestFinishDate),
    latestFinishDate,
    latestFinishDateIsFirstReport: latestFinishDate !== null && latestFinishDate === data.reports[0]?.date,
    /** Biggest badge gains since the previous report. */
    topMovers: participants
      .filter((p) => (p.gained ?? 0) > 0)
      .sort((a, b) => (b.gained ?? 0) - (a.gained ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 5),
  };
}

export function getTeams(): Team[] {
  const groups = new Map<string, Participant[]>();
  for (const p of participants) {
    if (!p.team) continue;
    groups.set(p.team, [...(groups.get(p.team) ?? []), p]);
  }

  const names = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  return names
    .map((name, i) => {
      const members = groups.get(name)!;
      const config = campaign.teams.find((team) => team.name.toLowerCase() === name.toLowerCase());
      const completedCount = members.filter((m) => m.isComplete).length;
      const activeCount = members.filter((m) => !m.isComplete && m.badges > 0).length;
      return {
        rank: 0,
        name,
        color: config?.color ?? TEAM_COLORS[i % TEAM_COLORS.length],
        mentor: config?.mentor ?? null,
        members,
        progress: Math.round(members.reduce((sum, m) => sum + m.progress, 0) / members.length),
        completedCount,
        activeCount,
        inactiveCount: members.length - completedCount - activeCount,
      };
    })
    .sort((a, b) => b.progress - a.progress || b.completedCount - a.completedCount || a.name.localeCompare(b.name))
    .map((team, i) => ({ ...team, rank: i + 1 }));
}

export function hasTeams(): boolean {
  return participants.some((p) => p.team);
}

/** How many participants on a track have earned a given badge. */
export function countBadgeEarners(title: string, track: Track): number {
  return participants.filter((p) => p.track === track && p.badgeNames.includes(title)).length;
}
