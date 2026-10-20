import { Heart, Search, ShoppingBag } from 'lucide-react';
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
          <IconButton label="Favorites">
            <Heart size={ICON_SIZE} />
          </IconButton>
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
