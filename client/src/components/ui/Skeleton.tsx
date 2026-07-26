import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-gray-200", className)} {...props} />
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white p-6 shadow-sm", className)}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === 0 ? "w-32" : i === 1 ? "w-20" : "w-16")} />
      ))}
    </div>
  );
}

function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, StatCardSkeleton, TableRowSkeleton, ListSkeleton };
