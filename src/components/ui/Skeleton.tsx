import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-bg-tertiary",
        className
      )}
    />
  );
}

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-10 h-10 rounded" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function SongCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <Skeleton className="aspect-square w-full rounded-md" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
