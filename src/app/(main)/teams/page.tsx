import Link from "next/link";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress as UiProgress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { Medal } from "@/components/icons/medal";
import { campaign } from "@/lib/campaign";
import { getTeams } from "@/lib/leaderboard";
import type { Team } from "@/lib/types";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function TeamMembersTable({ team }: { team: Team }) {
  const sortedMembers = [...team.members].sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));

  return (
    <div className="p-4 bg-muted/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead className="text-center">Badges</TableHead>
            <TableHead className="w-[200px]">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  {p.profileUrl ? (
                    <Link href={p.profileUrl} target="_blank" className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{p.name}</span>
                  )}
                  {p.isSwagEligible && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-none whitespace-nowrap">
                      <Award className="mr-1 h-3 w-3" />
                      Swag Eligible
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                {Math.min(p.badges, campaign.totalBadges)}/{campaign.totalBadges}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-4">
                  <UiProgress value={p.progress} className="w-[60%]" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {p.progress}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TeamEngagementBar({ team }: { team: Team }) {
  const totalMembers = team.members.length;
  const percent = (count: number) => `${(count / totalMembers) * 100}%`;

  return (
    <div className="p-4 bg-muted/50 border-y">
      <div className="text-sm font-medium mb-2">Team Engagement</div>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted mb-2">
        <div className="bg-green-500" title={`Completed: ${team.completedCount}`} style={{ width: percent(team.completedCount) }} />
        <div className="bg-yellow-500" title={`Active: ${team.activeCount}`} style={{ width: percent(team.activeCount) }} />
        <div className="bg-gray-400 dark:bg-gray-600" title={`Not started: ${team.inactiveCount}`} style={{ width: percent(team.inactiveCount) }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          <span>Completed: {team.completedCount}</span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
          <span>Active: {team.activeCount}</span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></span>
          <span>Not started: {team.inactiveCount}</span>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Card className="overflow-hidden border-border/40">
      <Accordion type="single" collapsible>
        <AccordionItem value={team.name} className="border-b-0">
          <AccordionTrigger className="hover:no-underline [&[data-state=open]]:bg-muted/50">
            <div className="flex flex-row items-start gap-4 p-4 w-full">
              <div className="flex items-center gap-4 flex-1">
                <div className="text-2xl font-bold w-8 text-center shrink-0">
                  {team.rank <= 3 ? <Medal rank={team.rank as 1 | 2 | 3} className="mx-auto h-8 w-8" /> : team.rank}
                </div>
                {team.mentor && (
                  <Avatar className="hidden sm:flex h-12 w-12 border-2" style={{ borderColor: team.color }}>
                    {team.mentor.avatar && <AvatarImage src={team.mentor.avatar} alt={`Mentor ${team.mentor.name}`} />}
                    <AvatarFallback>{initials(team.mentor.name)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="grid gap-0.5 text-left">
                  <CardTitle className="group flex items-center gap-2 text-lg" style={{ color: team.color }}>
                    {team.name}
                  </CardTitle>
                  <CardDescription>
                    {team.members.length} members, {team.completedCount} completed
                    {team.mentor ? `, mentor: ${team.mentor.name}` : ""}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-2xl">
                  {team.progress}%
                </div>
                <div className="text-xs text-muted-foreground">Avg. Progress</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <TeamEngagementBar team={team} />
            <TeamMembersTable team={team} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

export default function TeamsPage() {
  const teams = getTeams();

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 md:px-6">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
          Team Leaderboard
        </h1>
        <p className="max-w-[700px] mx-auto text-lg text-muted-foreground">
          Collaboration is key. See how the teams are stacking up against each other.
        </p>
      </section>

      {teams.length > 0 ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.name} team={team} />
          ))}
        </section>
      ) : (
        <p className="text-center text-muted-foreground">Teams will appear here once they&apos;re announced.</p>
      )}
    </div>
  );
}
