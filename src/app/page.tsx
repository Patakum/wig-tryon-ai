import Link from 'next/link';
import Image from 'next/image';
import {
  Facebook,
  Twitter,
  Globe,
  Search,
  Heart,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import HomeWigCard from '@/src/components/HomeWigCard';
import { getLatestWigs } from '@/src/services/wig';
import AuthButton from '../components/AuthButton';

export default async function Home() {
  const wigs = await getLatestWigs(8);

  return (
    <main className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-stone-300">
        {/* Hero image */}
        <Image
          src="https://res.cloudinary.com/dtj6h6gpv/image/upload/v1777210734/wig-ai/wigs/iwljmmjp5i52zkwncoz5.jpg"
          alt="Model wearing wig"
          width={400}
          height={500}
          className="w-full h-auto object-cover"
          priority
        />

        {/* Logo */}
        <div className="absolute top-4 left-6 z-10">
          <Image
            src="/icon.png"
            alt="Racheli Wig Design"
            width={140}
            height={140}
            className="rounded-full border-4 border-white bg-white p-2 shadow-md sm:w-[140px] sm:h-[140px]  object-cover"
            priority
          />
        </div>

        {/* Icons */}
        <div className="absolute top-4 right-6 z-10 flex gap-4">
          <button className="text-white hover:scale-110 transition-transform">
            <Search size={24} />
          </button>
          <AuthButton className="text-white hover:scale-110 transition-transform" />
          <button className="text-white hover:scale-110 transition-transform">
            <Heart size={24} />
          </button>
          <button className="text-white hover:scale-110 transition-transform">
            <ShoppingBag size={24} />
          </button>
        </div>

        {/* Text overlay */}
        <div className="absolute top-1/6 right-8 z-10 text-white">
          <h1 className="text-4xl font-light tracking-wider text-right">
            TRY WIGS
            <br />
            ON REAL TIME
          </h1>
        </div>

        {/* CTA Button */}
        <Link href="/upload" className="absolute bottom-6 right-6 z-10">
          <Button variant="default">TRY WIG</Button>
        </Link>
      </section>

      {/* ── Best Products ─────────────────────────────────────────────── */}
      {wigs.length > 0 && (
        <section className="px-4 py-6">
          <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
              Best Products
            </h2>
            <Link
              href="/catalog"
              className="text-xs font-semibold text-stone-700 transition-colors hover:text-stone-900"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {wigs.slice(0, 2).map((wig) => (
              <HomeWigCard key={wig.id} {...wig} />
            ))}
          </div>
        </section>
      )}

      {/* ── Sale ──────────────────────────────────────────────────────── */}
      {wigs.length > 2 && (
        <section className="px-4 py-6">
          <div className="mb-4 border-b border-stone-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
              Sale
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {wigs.slice(2, 4).map((wig) => (
              <HomeWigCard key={wig.id} {...wig} />
            ))}
          </div>
        </section>
      )}

      {/* ── New Arrivals ──────────────────────────────────────────────– */}
      {wigs.length > 4 && (
        <section className="px-4 py-6">
          <div className="mb-4 border-b border-stone-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
              New Arrivals
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {wigs.slice(4, 8).map((wig) => (
              <HomeWigCard key={wig.id} {...wig} />
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="mt-8 border-t border-stone-200 bg-stone-50 px-4 py-8 space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-bold text-stone-900">Contact us</h3>
          <p className="text-xs text-stone-600">St. Address</p>
          <p className="text-xs text-stone-600">+ 972 585332053</p>
          <p className="text-xs text-stone-600">support@company.com</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-stone-900">Follow us</h3>
          <div className="flex gap-4">
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-400 text-stone-600 transition-colors hover:bg-stone-200">
              <Facebook className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-400 text-stone-600 transition-colors hover:bg-stone-200">
              <Twitter className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-400 text-stone-600 transition-colors hover:bg-stone-200">
              <Globe className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-stone-600">© 2017 RACHELI</p>
      </footer>
    </main>
  );
}
