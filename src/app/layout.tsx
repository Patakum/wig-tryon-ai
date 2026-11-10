import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ReactNode } from 'react';
import ConnectionBanner from '../components/ConnectionBanner';
import Providers from '../components/Providers';

const josefinSans = localFont({
  variable: '--font-josefin-sans',
  src: [
    {
      path: '../../node_modules/@fontsource/josefin-sans/files/josefin-sans-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/josefin-sans/files/josefin-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/josefin-sans/files/josefin-sans-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/josefin-sans/files/josefin-sans-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
});

const roboto = localFont({
  variable: '--font-roboto',
  src: [
    {
      path: '../../node_modules/@fontsource/roboto/files/roboto-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/roboto/files/roboto-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/roboto/files/roboto-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
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
        className={`${josefinSans.variable} ${roboto.variable} antialiased `}
      >
        <Providers>
          <ConnectionBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
