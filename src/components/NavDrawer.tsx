'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  Heart,
  History,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react';
import { authClient } from '@/src/lib/auth-client';
import { cn } from '@/src/lib/utils';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import SignOutDialog from '@/src/components/SignOutDialog';

type NavItem = { href: string; label: string; icon: LucideIcon };

const ITEMS: NavItem[] = [
  { href: '/', label: 'דף הבית', icon: Home },
  { href: '/catalog', label: 'קטלוג הפאות', icon: LayoutGrid },
  { href: '/favorites', label: 'המועדפים שלי', icon: Heart },
  { href: '/my-try-ons', label: 'הניסיונות שלי', icon: History },
  { href: '/cart', label: 'עגלה', icon: ShoppingBag },
  { href: '/privacy', label: 'מדיניות פרטיות', icon: ShieldCheck },
];

const ROW =
  'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-base text-gray-900 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900';

export default function NavDrawer({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="תפריט"
          className={cn(
            'flex size-11 items-center justify-center text-gray-800 transition-transform hover:scale-110',
            className,
          )}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay className="bg-black/30" />
        <DialogPrimitive.Content
          data-slot="nav-drawer"
          className="fixed inset-y-0 start-0 z-50 flex w-[82%] max-w-xs flex-col bg-white p-4 shadow-xl outline-none duration-200 data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right"
        >
          <div className="mb-2 flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">תפריט</DialogTitle>
            <DialogClose
              aria-label="סגירה"
              className="flex size-11 items-center justify-center rounded-full hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <X size={20} aria-hidden="true" />
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">
            ניווט בין עמודי האתר והחשבון שלי
          </DialogDescription>

          <nav aria-label="תפריט ראשי">
            <ul className="list-none space-y-1">
              {ITEMS.map(({ href, label, icon: Icon }) => {
                const active =
                  href === '/' ? pathname === '/' : pathname.startsWith(href);

                return (
                  <li key={href}>
                    <DialogClose asChild>
                      <Link
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(ROW, active && 'bg-stone-100 font-semibold')}
                      >
                        <Icon size={20} aria-hidden="true" />
                        {label}
                      </Link>
                    </DialogClose>
                  </li>
                );
              })}
              {isAdmin && (
                <li>
                  <DialogClose asChild>
                    <Link href="/admin" className={ROW}>
                      <Settings size={20} aria-hidden="true" />
                      ניהול האתר
                    </Link>
                  </DialogClose>
                </li>
              )}
            </ul>
          </nav>

          <div className="mt-auto border-t pt-3">
            {session ? (
              <>
                <p className="mb-1 truncate px-3 text-sm text-muted-foreground">
                  {session.user.email}
                </p>
                <SignOutDialog
                  className={ROW}
                  onSignedOut={() => setOpen(false)}
                >
                  <LogOut size={20} aria-hidden="true" />
                  התנתקות
                </SignOutDialog>
              </>
            ) : (
              <DialogClose asChild>
                <Link href="/login" className={ROW}>
                  <LogIn size={20} aria-hidden="true" />
                  התחברות / הרשמה
                </Link>
              </DialogClose>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
