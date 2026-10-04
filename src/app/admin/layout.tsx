import { redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.user as unknown as { role: string }).role !== 'admin') {
    redirect('/catalog');
  }

  return <>{children}</>;
}
