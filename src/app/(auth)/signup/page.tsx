import { SignupForm } from '@/components/signup-form';
import { getSafeRedirect } from '@/src/lib/auth-redirect';

type SignupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function Page({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm returnTo={getSafeRedirect(next)} />
      </div>
    </div>
  );
}
