import { cn } from '@/src/lib/utils';

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({
  className,
  orientation = 'horizontal',
}: DividerProps) {
  return (
    <div
      className={cn(
        'bg-stone-300',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}
