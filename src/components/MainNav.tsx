import Link from 'next/link';
import { Heart, History, Search, ShoppingBag } from 'lucide-react';
import NavDrawer from '@/src/components/NavDrawer';

const LINK_BASE =
  'flex size-11 items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 rounded-full';
const TONES = {
  dark: 'text-gray-800 focus-visible:ring-gray-900',
  // Over the hero photo the icons stay white and get a soft shadow.
  light: 'text-white drop-shadow-md focus-visible:ring-white',
} as const;
const ICON_SIZE = 22;

type MainNavProps = {
  // "full" shows the quick-access icons (home page); "compact" keeps the
  // header clean and leaves everything else to the menu drawer.
  variant?: 'full' | 'compact';
  tone?: keyof typeof TONES;
};

export default function MainNav({
  variant = 'compact',
  tone = 'dark',
}: MainNavProps) {
  const LINK_CLASS = `${LINK_BASE} ${TONES[tone]}`;

  return (
    <nav aria-label="פעולות מהירות">
      <ul className="flex items-center list-none">
        <li>
          <NavDrawer className={TONES[tone]} />
        </li>
        <li>
          <Link href="/catalog#search" aria-label="חיפוש" className={LINK_CLASS}>
            <Search size={ICON_SIZE} aria-hidden="true" />
          </Link>
        </li>
        {variant === 'full' && (
          <>
            <li>
              <Link href="/favorites" aria-label="המועדפים שלי" className={LINK_CLASS}>
                <Heart size={ICON_SIZE} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href="/my-try-ons" aria-label="הניסיונות שלי" className={LINK_CLASS}>
                <History size={ICON_SIZE} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href="/cart" aria-label="עגלה" className={LINK_CLASS}>
                <ShoppingBag size={ICON_SIZE} aria-hidden="true" />
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
