

import { cn } from '@/src/lib/utils';

type ImageSlotSkeletonProps = {
  className?: string;
};

export default function ImageSlotSkeleton({
  className,
}: ImageSlotSkeletonProps) {
  return (
    <div
      className={cn(
        'h-full min-h-[400px] w-full rounded-lg border-2 border-dashed border-muted',
        'bg-[#D9D9D9] animate-pulse',
        className,
      )}
    />
  );
}
