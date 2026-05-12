import Link from 'next/link';
import Image from 'next/image';
import {
  Facebook,
  Twitter,
  Globe,
  Search,
  Heart,
  ShoppingBag,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Divider } from '@/src/components/ui/divider';
import HomeWigCard from '@/src/components/HomeWigCard';
import { getLatestWigs } from '@/src/services/wig';
import { Wig } from '@/src/types';
import AuthButton from '../components/AuthButton';

// Constants
const HERO_IMAGE =
  'https://res.cloudinary.com/dtj6h6gpv/image/upload/v1777210734/wig-ai/wigs/iwljmmjp5i52zkwncoz5.jpg';
const LOGO_IMAGE = '/logo.png';
const ICON_SIZE = 15;
const LOGO_SIZE = 140;

const CONTACT_INFO = {
  address: 'כתובת שלנו - רחוב הדוגמה 123, תל אביב',
  phone: '+972586332053',
  phoneDisplay: '+ 972-586-332053',
  email: 'support@company.com',
};

const SOCIAL_LINKS = [
  { icon: Facebook, label: 'Facebook', url: '#' },
  { icon: Twitter, label: 'Twitter', url: '#' },
  { icon: Globe, label: 'Website', url: '#' },
];

function HeroSection() {
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
        <Image
          src={LOGO_IMAGE}
          alt="Racheli Wig Design"
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          priority
        />
      </div>

      <nav
        className="absolute top-4 right-4 z-10 flex gap-4"
        aria-label="Main actions"
      >
        <IconButton icon={ShoppingBag} label="Shopping bag" />
        <IconButton icon={Heart} label="Favorites" />
        <AuthButton
          size={ICON_SIZE}
          className="text-black hover:scale-110 transition-transform"
        />
        <IconButton icon={Search} label="Search" />
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
        <Link href="/upload">TRY WIG</Link>
      </Button>
    </section>
  );
}

function IconButton({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      className="text-black hover:scale-110 transition-transform"
      aria-label={label}
      type="button"
    >
      <Icon size={ICON_SIZE} />
    </button>
  );
}

function SectionHeader({
  title,
  viewAllLink,
}: {
  title: string;
  viewAllLink?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b bg-secondary border-stone-200 px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
        {title}
      </h2>
      {viewAllLink && (
        <Link
          href={viewAllLink}
          className="text-xs text-center font-semibold text-stone-700 transition-colors hover:text-stone-900"
        >
          לראות את כל המוצרים
        </Link>
      )}
    </div>
  );
}

function WigSection({
  title,
  wigs,
  viewAllLink,
}: {
  title: string;
  wigs: Wig[];
  viewAllLink?: string;
}) {
  if (wigs.length === 0) return null;

  return (
    <section>
      <SectionHeader title={title} viewAllLink={viewAllLink} />
      <div className="grid grid-cols-2 gap-4 px-4 py-6">
        {wigs.map((wig) => (
          <HomeWigCard key={wig.id} {...wig} />
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-stone-200 px-4 py-8 space-y-6">
      <ContactSection />
      <SocialSection />
      <Divider />
      <p className="text-xs text-stone-600 text-end">© 2017 RACHELI</p>
    </footer>
  );
}

function ContactSection() {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-stone-900">צור קשר</h3>
      <a
        href={`https://maps.google.com/?q=${encodeURIComponent(CONTACT_INFO.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-stone-600 hover:text-stone-900 transition-colors"
      >
        {CONTACT_INFO.address}
      </a>
      <a
        href={`tel:${CONTACT_INFO.phone}`}
        className="block text-xs text-stone-600 hover:text-stone-900 transition-colors"
      >
        {CONTACT_INFO.phoneDisplay}
      </a>
      <a
        href={`mailto:${CONTACT_INFO.email}`}
        className="block text-xs text-stone-600 hover:text-stone-900 transition-colors"
      >
        {CONTACT_INFO.email}
      </a>
    </div>
  );
}

function SocialSection() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-stone-900">תעקבו אחרינו</h3>
      <div className="flex gap-4">
        {SOCIAL_LINKS.map(({ icon: Icon, label, url }) => (
          <a
            key={label}
            href={url}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-400 text-stone-600 transition-colors hover:bg-stone-200"
            aria-label={label}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const wigs = await getLatestWigs(8);

  return (
    <main className="bg-white font-sans">
      <HeroSection />
      <WigSection
        title="המוצרים הכי שווים"
        wigs={wigs.slice(0, 2)}
        viewAllLink="/catalog"
      />
      <WigSection title="מבצעים חמים" wigs={wigs.slice(2, 4)} />
      <WigSection title="מוצרים חדשים" wigs={wigs.slice(4, 8)} />
      <Footer />
    </main>
  );
}
