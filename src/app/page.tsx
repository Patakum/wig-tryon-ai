import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Globe } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import HomeWigCard from '@/src/components/HomeWigCard';
import { getLatestWigs } from '@/src/services/wig';
import AuthButton from '../components/AuthButton';

export default async function Home() {
  const wigs = await getLatestWigs(4);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[58vh] flex-col items-center
       justify-between gap-6 bg-linear-to-b from-stone-200 to-stone-100 px-6 text-center"
      >
        <div className="flex flex-row items-center gap-6">
          <div className="space-y-2">
            <AuthButton />

            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight text-stone-800">
              Try Wigs
              <br />
              On Real Time
            </h1>
          </div>
          <Image
            src="/icon.png"
            alt="Racheli Wig Design"
            width={110}
            height={110}
            className=" rounded-full border border-stone-300 bg-white p-3 shadow-sm"
            priority
          />
        </div>

        <Link href="/upload">
          <Button className="rounded-full bg-stone-600 px-10 text-white hover:bg-stone-700">
            TRY WIG
          </Button>
        </Link>
      </section>

      {/* ── Best Products ─────────────────────────────────────────────── */}
      {wigs.length > 0 && (
        <section className="px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
              Best Products
            </h2>
            <Link
              href="/catalog"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {wigs.map((wig) => (
              <HomeWigCard key={wig.id} {...wig} />
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="mt-6 border-t bg-stone-50 px-4 py-8 space-y-6">
        <div>
          <h3 className="mb-2 font-bold">Contact us</h3>
          <p className="text-sm text-muted-foreground">St. Address</p>
          <p className="text-sm text-muted-foreground">+ 972 585332053</p>
          <p className="text-sm text-muted-foreground">support@company.com</p>
        </div>

        <div>
          <h3 className="mb-2 font-bold">Follow us</h3>
          <div className="flex gap-4">
            <Facebook className="h-5 w-5 text-muted-foreground" />
            <Twitter className="h-5 w-5 text-muted-foreground" />
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2017 RACHELI</p>
      </footer>
    </main>
  );
}
