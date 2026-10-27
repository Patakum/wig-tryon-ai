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
        <Logo size={120} />
      </div>

      <div className="absolute top-3 right-2 z-10">
        <MainNav variant="full" />
      </div>

      {/* Soft dark fade behind the headline only, so white text stays readable
          on any photo without dimming the nav icons above it. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-0 h-[48%] bg-[radial-gradient(ellipse_at_72%_40%,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.35)_40%,transparent_72%)]"
      />

      <div className="absolute top-[14%] right-4 z-10 max-w-[64%]">
        <h1 className="text-2xl md:text-5xl font-bold leading-snug text-white drop-shadow-md">
          תנסי פאה על עצמך,
          <br />
          אל תחכי עד שתגיעי לחנות
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
