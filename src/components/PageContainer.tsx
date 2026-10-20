import { cn } from '@/src/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  className,
}: PageContainerProps) {
  return (
    <main className={cn('min-h-screen bg-white', className)}>{children}</main>
  );
}
