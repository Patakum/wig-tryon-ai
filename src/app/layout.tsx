import type { Metadata } from 'next';
import { Roboto, Josefin_Sans } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import Providers from '../components/Providers';

const josefinSans = Josefin_Sans({
  variable: '--font-josefin-sans',
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
});

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin', 'greek'],
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Racheli Wig AI',
  description:
    'Try wigs in real time with Racheli Wig AI. Upload your photo and see how different wigs look on you instantly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${josefinSans.variable} ${roboto.variable} antialiased pt-10`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
