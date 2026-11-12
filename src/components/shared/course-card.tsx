import { ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/lib/campaign";

type CourseCardProps = {
  course: Course;
  /** Position in the curriculum, starting at 1. */
  number: number;
  /** Participants on this track who have earned the badge. */
  earnedBy: number;
};

export const CourseCard = ({ course, number, earnedBy }: CourseCardProps) => {
  const content = (
    <Card className="flex flex-col h-full w-full transition-colors duration-300 hover:border-primary/60">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-medium leading-tight">
          <span className="text-muted-foreground mr-1">{number}.</span>
          {course.title}
        </CardTitle>
        {course.url && <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 pb-4">
        <Badge variant="outline" className="font-normal text-xs">
          {course.credits === 0 ? "No credits needed" : `${course.credits} credits`}
        </Badge>
        <span className="text-xs text-muted-foreground">Earned by {earnedBy}</span>
      </CardContent>
    </Card>
  );

  if (!course.url) return content;
  return (
    <Link href={course.url} target="_blank" aria-label={`Open ${course.title} on Google Skills`} className="h-full">
      {content}
    </Link>
  );
};
