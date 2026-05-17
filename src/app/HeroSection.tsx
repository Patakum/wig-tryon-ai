'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import MainNav from '@/src/components/MainNav';
import Logo from '@/src/components/Logo';

const HERO_IMAGE =
  'https://res.cloudinary.com/dtj6h6gpv/image/upload/v1777210734/wig-ai/wigs/iwljmmjp5i52zkwncoz5.jpg';

export default function HeroSection() {
  return (
    <section className="relative bg-stone-300">
      <Image
        src={HERO_IMAGE}
        alt="Model wearing wig"
        width={400}
        height={500}
        className="w-full h-auto object-cover"
        priority
      />

      <div className="absolute top-4 left-2 z-10">
        <Logo size={140} />
      </div>

      <nav className="absolute top-4 right-4 z-10" aria-label="Main actions">
        <MainNav />
      </nav>

      <div className="absolute top-1/12 right-8 z-10 text-white text-center">
        <h1 className="text-2xl sm:text-3xl font-light tracking-wider">
          TRY WIGS
          <br />
          IN REAL TIME
        </h1>
      </div>

      <Button
        asChild
        variant="default"
        size="lg"
        className="absolute bottom-12 right-4 z-10"
      >
        <Link href="/catalog">TRY WIG</Link>
      </Button>
    </section>
  );
}
