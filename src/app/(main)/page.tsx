import Link from "next/link";
import { Users, Award, Trophy, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Countdown } from "@/components/shared/countdown";
import { Progress } from "@/components/ui/progress";
import { campaign, formatDeadline } from "@/lib/campaign";
import { formatReportDate } from "@/lib/dates";
import { getLatestReport, getPreviousReport, getSummary, getTeams } from "@/lib/leaderboard";
import type { Participant } from "@/lib/types";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function NameList({ people, renderValue }: { people: Participant[]; renderValue: (p: Participant) => string }) {
  return (
    <ul className="w-full max-w-sm space-y-2">
      {people.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-4">
          {p.profileUrl ? (
            <Link href={p.profileUrl} target="_blank" className="font-medium hover:underline truncate">
              {p.name}
            </Link>
          ) : (
            <span className="font-medium truncate">{p.name}</span>
          )}
          <span className="text-sm font-semibold text-primary whitespace-nowrap">{renderValue(p)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LandingPage() {
  const summary = getSummary();
  const latestReport = getLatestReport();
  const previousReport = getPreviousReport();
  const topTeam = getTeams()[0] ?? null;
  const finishersShown = summary.latestFinishers.slice(0, 5);

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 md:px-6">
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          {campaign.name}
        </h1>
        <p className="max-w-[800px] mx-auto text-lg text-muted-foreground">
          {campaign.community} (Live Progress)
        </p>
        {latestReport && (
          <p className="mt-2 text-sm text-muted-foreground">
            Updated from Google&apos;s daily report of {formatReportDate(latestReport.date)}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12 md:mb-16">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.enrolled}</div>
            <p className="text-xs text-muted-foreground">
              {summary.redeemed} redeemed their access code, {summary.active} earned at least one badge
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed All {campaign.totalBadges} Badges</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completed}</div>
            <p className="text-xs text-muted-foreground">
              {plural(summary.completedByTrack.student, "student")}, {plural(summary.completedByTrack.developer, "developer")}
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jam Ends In</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Countdown targetDate={campaign.deadline} />
            <p className="mt-2 text-xs text-muted-foreground">Deadline: {formatDeadline()}, no extensions</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
            <CardDescription>
              {summary.badgesEarned} of {summary.badgesPossible} possible skill badges earned across all participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Progress value={summary.overallProgress} className="h-3" />
              <span className="text-lg font-bold text-primary">{summary.overallProgress}%</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {summary.milestones.map(({ level, count }) => (
                <div key={level}>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">reached Milestone {level}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {campaign.swag.enabled && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Swag Eligibility Progress</CardTitle>
              <CardDescription>{campaign.swag.note}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={Math.min(summary.swagEligible, campaign.swag.limit)} max={campaign.swag.limit} className="h-3" />
                <span className="text-lg font-bold text-primary whitespace-nowrap">
                  {Math.min(summary.swagEligible, campaign.swag.limit)}/{campaign.swag.limit}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mb-12 md:mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Leaderboard Highlights</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="flex flex-col items-center p-6">
            <CardTitle className="mb-1 text-center">Latest Finishers</CardTitle>
            {summary.latestFinishDate ? (
              <>
                <CardDescription className="mb-4 text-center">
                  Completed all {campaign.totalBadges} badges{" "}
                  {summary.latestFinishDateIsFirstReport ? "by" : "on"} {formatReportDate(summary.latestFinishDate)}
                </CardDescription>
                <NameList people={finishersShown} renderValue={(p) => `Rank ${p.rank}`} />
                {summary.latestFinishers.length > finishersShown.length && (
                  <Link href="/progress" className="mt-4 text-sm text-primary hover:underline">
                    and {summary.latestFinishers.length - finishersShown.length} more
                  </Link>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Nobody has completed all {campaign.totalBadges} badges yet.</p>
            )}
          </Card>
          {topTeam ? (
            <Card className="flex flex-col items-center justify-center p-6">
              <CardTitle className="mb-4">Top Performing Team</CardTitle>
              <div className="text-xl font-bold mb-2" style={{ color: topTeam.color }}>{topTeam.name}</div>
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">{topTeam.progress}%</span>
                <p className="text-xs text-muted-foreground">Avg. Team Progress</p>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center p-6">
              <CardTitle className="mb-1 flex items-center gap-2 text-center">
                <TrendingUp className="h-5 w-5 text-primary" />
                Biggest Jumps
              </CardTitle>
              {previousReport ? (
                <>
                  <CardDescription className="mb-4 text-center">
                    Most badges earned since {formatReportDate(previousReport.date, { year: false })}
                  </CardDescription>
                  {summary.topMovers.length > 0 ? (
                    <NameList people={summary.topMovers} renderValue={(p) => `+${plural(p.gained ?? 0, "badge")}`} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No new badges since the previous report.</p>
                  )}
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Shown once there are two daily reports.</p>
              )}
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
