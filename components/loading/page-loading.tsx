import { Skeleton } from "@/components/ui/skeleton";

type PageLoadingProps = {
  cards?: number;
  showFilters?: boolean;
  showTable?: boolean;
  showSidebar?: boolean;
};

export function PageLoading({
  cards = 4,
  showFilters = false,
  showTable = false,
  showSidebar = false,
}: PageLoadingProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>

      {showFilters ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {showSidebar ? (
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 rounded-lg border p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[320px] w-full" />
          </div>
          <div className="lg:col-span-3 rounded-lg border p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : null}

      {showTable ? (
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectDetailLoading() {
  return (
    <div className="space-y-6 py-8">
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ClientPortalLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-44" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
