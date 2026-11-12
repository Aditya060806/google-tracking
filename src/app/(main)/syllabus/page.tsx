import Link from "next/link";
import { campaign, getCourse, TRACKS } from "@/lib/campaign";
import { countBadgeEarners, getSummary } from "@/lib/leaderboard";
import { CourseCard } from "@/components/shared/course-card";

export default function SyllabusPage() {
  const { enrolledByTrack } = getSummary();

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 md:px-6">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
          Syllabus & Learning Path
        </h1>
        <p className="max-w-[700px] mx-auto text-lg text-muted-foreground">
          Earn all {campaign.totalBadges} skill badges on your track to finish the Cloud Jam. Use your 200 credits
          carefully: there are no top-ups, and you can complete at most 15 labs a day.
        </p>
      </section>

      {TRACKS.map((track) => {
        const config = campaign.tracks[track];
        return (
          <section key={track} className="mb-12">
            <div className="mb-6 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <h2 className="text-2xl font-bold">
                {config.label} Curriculum
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({enrolledByTrack[track]} enrolled)
                </span>
              </h2>
              <Link href={config.curriculumUrl} target="_blank" className="text-sm text-primary hover:underline">
                Official {config.label.toLowerCase()} curriculum
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {config.badges.map((title, i) => (
                <CourseCard
                  key={title}
                  course={getCourse(title)}
                  number={i + 1}
                  earnedBy={countBadgeEarners(title, track)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
