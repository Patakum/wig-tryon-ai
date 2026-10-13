import { redirect } from 'next/navigation';
import { getOptionalUser } from '@/src/lib/api/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  if (user?.role !== 'admin') {
    redirect('/catalog');
  }

  return <>{children}</>;
}
