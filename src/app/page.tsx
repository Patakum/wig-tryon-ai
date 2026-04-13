import Link from 'next/link';

export default async function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-center space-y-4 flex justify-baseline gap-1">
        <Link href="/admin/wigs/new" className="text-blue-500">Create New Wig</Link>
        <Link href="/catalog" className="text-red-500">View Catalog</Link>
      </div>
    </div>
  );
}
