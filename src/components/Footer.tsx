import { Facebook, Twitter, Globe } from 'lucide-react';
import { Divider } from '@/src/components/ui/divider';
import { prisma } from '@/src/lib/prisma';

const SOCIAL_LINKS = [
  { icon: Facebook, label: 'Facebook', url: '#' },
  { icon: Twitter, label: 'Twitter', url: '#' },
  { icon: Globe, label: 'Website', url: '#' },
];

async function ContactSection() {
  const businessInfo = await prisma.businessInfo.findFirst();

  if (!businessInfo) {
    return (
      <address className="not-italic text-sm flex flex-col gap-2">
        <h3 className="mb-2 text-sm font-bold text-stone-900">צור קשר</h3>
        <p className="text-xs text-stone-600">Contact information not yet configured</p>
      </address>
    );
  }

  const whatsappPhone = businessInfo.whatsappNumber?.replace(/[^0-9+]/g, '') || '';

  return (
    <address className="not-italic text-sm flex flex-col gap-2">
      <h3 className="mb-2 text-sm font-bold text-stone-900">צור קשר</h3>
      {businessInfo.address && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(businessInfo.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-stone-600 hover:text-stone-900 transition-colors"
        >
          כתובת שלנו - {businessInfo.address}
        </a>
      )}
      {businessInfo.whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-stone-600 hover:text-stone-900 transition-colors"
        >
          WhatsApp: {businessInfo.whatsappNumber}
        </a>
      )}
      {businessInfo.phone && (
        <a
          href={`tel:${businessInfo.phone}`}
          className="block text-xs text-stone-600 hover:text-stone-900 transition-colors"
        >
          {businessInfo.phone}
        </a>
      )}
      {businessInfo.email && (
        <a
          href={`mailto:${businessInfo.email}`}
          className="block text-xs text-stone-600 hover:text-stone-900 transition-colors"
        >
          {businessInfo.email}
        </a>
      )}
    </address>
  );
}

function SocialSection() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-stone-900">תעקבו אחרינו</h3>
      <ul className="flex gap-4 list-none">
        {SOCIAL_LINKS.map(({ icon: Icon, label, url }) => (
          <li key={label}>
            <a
              href={url}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-400 text-stone-600 transition-colors hover:bg-stone-200"
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-stone-200 px-4 py-8 space-y-6">
      <ContactSection />
      <SocialSection />
      <Divider />
      <p className="text-xs text-stone-600 text-end">© {new Date().getFullYear()} Wig Try-On</p>
    </footer>
  );
}
