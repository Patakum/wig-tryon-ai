import { Facebook, Twitter, Globe } from 'lucide-react';
import { Divider } from '@/src/components/ui/divider';

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

function ContactSection() {
  return (
    <address className="not-italic">
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
      <p className="text-xs text-stone-600 text-end">© 2017 RACHELI</p>
    </footer>
  );
}
