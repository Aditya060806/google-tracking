import raw from "@/config/campaign.json";
import type { Track } from "@/lib/types";

export type Course = {
  title: string;
  url: string;
  credits: number;
};

export type TrackConfig = {
  label: string;
  curriculumUrl: string;
  /** Course titles, exactly as they appear in Google's "Skill Badges Completed Names" column. */
  badges: string[];
};

export type TeamConfig = {
  name: string;
  color?: string;
  mentor?: { name: string; avatar?: string };
};

export type CampaignConfig = {
  name: string;
  programName: string;
  community: string;
  year: number;
  /** ISO date-time with offset, e.g. "2026-11-23T23:59:59+05:30". */
  deadline: string;
  timeZone: string;
  totalBadges: number;
  swag: { enabled: boolean; limit: number; note: string };
  tracks: Record<Track, TrackConfig>;
  courses: Course[];
  teams: TeamConfig[];
};

/** Campaign settings. Edit src/config/campaign.json to change them. */
export const campaign = raw as CampaignConfig;

export const TRACKS: Track[] = ["student", "developer"];

export function getCourse(title: string): Course {
  return campaign.courses.find((course) => course.title === title) ?? { title, url: "", credits: 0 };
}

/** The campaign deadline in the campaign's time zone, e.g. "23 Nov 2026, 11:59 pm IST". */
export function formatDeadline(): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: campaign.timeZone,
    timeZoneName: "short",
  }).format(new Date(campaign.deadline));
}
