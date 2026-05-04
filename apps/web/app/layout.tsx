import type { Metadata } from 'next';
import './globals.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.amplyd.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  applicationName: 'Vincent Juhel',
  title: {
    default: 'Vincent Juhel',
    template: '%s — Vincent Juhel',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      fr: '/fr',
      'x-default': '/en',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
