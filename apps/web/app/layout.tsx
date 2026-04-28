import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amplyd.com'),
  title: {
    default: 'Vincent Juhel',
    template: '%s — Vincent Juhel',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
