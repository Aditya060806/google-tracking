'use client';

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Award, Search, X } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress as UiProgress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Medal } from "@/components/icons/medal";
import { formatReportDate } from "@/lib/dates";
import type { LeaderboardRow } from "@/lib/types";

/** Keeps the search box in sync with ?q= without forcing the page to render on the client only. */
function useSearchQuery() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, []);

  const update = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return [query, update] as const;
}

function SearchBar({ query, onChange }: { query: string; onChange: (value: string) => void }) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search participant..."
        aria-label="Search participant"
        className="pl-9"
        value={query}
        onChange={(e) => onChange(e.target.value)}
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

type ProgressTableProps = {
  rows: LeaderboardRow[];
  totalBadges: number;
  /** Date of the latest Google report, e.g. "2026-11-12". */
  lastUpdated: string | null;
  showTeams: boolean;
  swagNote: string | null;
};

export function ProgressTable({ rows, totalBadges, lastUpdated, showTeams, swagNote }: ProgressTableProps) {
  const [query, setQuery] = useSearchQuery();

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((p) => p.name.toLowerCase().includes(search) || p.team?.toLowerCase().includes(search));
  }, [rows, query]);

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 md:px-6">
      <section className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
          Participant Leaderboard
        </h1>
        <p className="max-w-[700px] mx-auto text-lg text-muted-foreground">
          See where you stand among your peers. Keep pushing forward!
        </p>
      </section>

      {swagNote && (
        <Alert className="mb-8 border-primary/30 bg-primary/10">
          <AlertTitle className="font-semibold">Heads Up, Jammers!</AlertTitle>
          <AlertDescription className="text-muted-foreground">{swagNote}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <SearchBar query={query} onChange={setQuery} />
        <span className="text-sm text-muted-foreground text-center sm:text-right">
          {lastUpdated ? `Last updated: ${formatReportDate(lastUpdated)} (daily report from Google)` : "No reports yet"}
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Ranks follow the order in which participants completed all {totalBadges} skill badges. Google sends one report a
        day, so everyone who finished on the same day shares a rank.
      </p>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Rank</TableHead>
              <TableHead>Participant</TableHead>
              {showTeams && <TableHead>Team</TableHead>}
              <TableHead className="text-center">Milestone</TableHead>
              <TableHead className="text-center">Badges</TableHead>
              <TableHead className="w-[200px]">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-lg text-center">
                  {p.rank !== null && p.rank <= 3 ? (
                    <Medal rank={p.rank as 1 | 2 | 3} className="mx-auto" role="img" aria-label={`Rank ${p.rank}`} />
                  ) : (
                    p.rank ?? "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.profileUrl ? (
                      <Link href={p.profileUrl} target="_blank" className="hover:underline font-medium">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{p.name}</span>
                    )}
                    {p.track === "developer" && (
                      <Badge variant="outline" className="font-normal">Developer</Badge>
                    )}
                    {p.isSwagEligible && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-none whitespace-nowrap">
                        <Award className="mr-1 h-3 w-3" />
                        Swag Eligible
                      </Badge>
                    )}
                    {!p.profileOk && (
                      <Badge variant="outline" className="border-destructive/50 text-destructive font-normal whitespace-nowrap">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Check profile URL
                      </Badge>
                    )}
                  </div>
                  {p.completedOn && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Finished {p.completedByFirstReport ? "by" : "on"} {formatReportDate(p.completedOn, { year: false })}
                    </p>
                  )}
                </TableCell>
                {showTeams && <TableCell className="font-medium">{p.team ?? "-"}</TableCell>}
                <TableCell className="text-center">{p.milestone > 0 ? p.milestone : "-"}</TableCell>
                <TableCell className="text-center whitespace-nowrap">{p.badges}/{totalBadges}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <UiProgress value={p.progress} className="w-[60%]" aria-label={`${p.progress}% complete`} />
                    <span className="text-sm font-medium text-muted-foreground">
                      {p.progress}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showTeams ? 6 : 5} className="py-10 text-center text-muted-foreground">
                  {rows.length === 0 ? "No participants yet." : `No participant matches "${query}".`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
