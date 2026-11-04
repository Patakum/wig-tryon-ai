import Link from 'next/link';
import { Heart, History, Search, ShoppingBag } from 'lucide-react';
import AuthButton from '@/src/components/AuthButton';
import IconButton from '@/src/components/IconButton';

const ICON_SIZE = 20;

export default function MainNav() {
  return (
    <nav aria-label="Main actions">
      <ul className="flex items-center gap-4 list-none">
        <li>
          <IconButton label="Shopping bag">
            <ShoppingBag size={ICON_SIZE} />
          </IconButton>
        </li>
        <li>
          <Link
            href="/favorites"
            aria-label="Favorites"
            className="text-gray-800 hover:scale-110 transition-transform inline-block"
          >
            <Heart size={ICON_SIZE} />
          </Link>
        </li>
        <li>
          <Link
            href="/my-try-ons"
            aria-label="My try-ons"
            className="text-gray-800 hover:scale-110 transition-transform inline-block"
          >
            <History size={ICON_SIZE} />
          </Link>
        </li>
        <li>
          <AuthButton />
        </li>
        <li>
          <IconButton label="Search">
            <Search size={ICON_SIZE} />
          </IconButton>
        </li>
      </ul>
    </nav>
  );
}
