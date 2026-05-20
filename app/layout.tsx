import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Barlow_Condensed, Barlow } from 'next/font/google';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-condensed',
  display: 'swap',
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CCI Football — Live Scores',
  description: 'Live scores, fixtures, lineups and match events for CCI Football.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlowCondensed.variable} ${barlow.variable} font-body bg-black text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
