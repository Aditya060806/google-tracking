import { ProgressTable } from '@/components/shared/progress-table';
import { campaign } from '@/lib/campaign';
import { getLatestReport, getLeaderboardRows, hasTeams } from '@/lib/leaderboard';

export default function ProgressPage() {
  return (
    <ProgressTable
      rows={getLeaderboardRows()}
      totalBadges={campaign.totalBadges}
      lastUpdated={getLatestReport()?.date ?? null}
      showTeams={hasTeams()}
      swagNote={campaign.swag.enabled ? campaign.swag.note : null}
    />
  );
}
