import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AgendaNotificationPreferencesCard = dynamic(
  () =>
    import("@/components/calendar/agenda-notification-preferences").then(
      (module) => module.AgendaNotificationPreferencesCard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </div>
    ),
  }
);

const ProjectCalendar = dynamic(
  () => import("@/components/calendar/project-calendar").then((module) => module.ProjectCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-[240px]" />
          <Skeleton className="h-10 w-[240px]" />
          <Skeleton className="h-10 w-[220px]" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-[420px] w-full" />
        </div>
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </div>
    ),
  }
);

export default function CalendarPage() {
  return (
    <div className="container mx-auto space-y-6 py-10">
      <AgendaNotificationPreferencesCard />
      <ProjectCalendar />
    </div>
  );
}
