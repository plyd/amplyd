import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { CvViewProvider } from '@/components/cv/CvViewContext';
import { JsonLd } from '@/components/seo/JsonLd';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('title');
  const description = t('description');
  const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';
  const ogLocaleAlt = locale === 'fr' ? 'en_US' : 'fr_FR';

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        fr: '/fr',
        'x-default': '/en',
      },
    },
    openGraph: {
      type: 'profile',
      locale: ogLocale,
      alternateLocale: [ogLocaleAlt],
      siteName: 'Vincent Juhel',
      title,
      description,
      url: `/${locale}`,
      firstName: 'Vincent',
      lastName: 'Juhel',
      // The opengraph-image.tsx route generates the actual PNG; Next will
      // wire it up automatically via metadata file conventions.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.amplyd.com';

function personSchema(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Vincent Juhel',
    url: `${SITE}/${locale}`,
    jobTitle:
      locale === 'fr' ? 'Architecte IA senior' : 'Senior AI Architect',
    worksFor: {
      '@type': 'Organization',
      name: 'Vinland SASU',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Rennes',
        addressCountry: 'FR',
      },
    },
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'INSA Rennes' },
      { '@type': 'CollegeOrUniversity', name: 'HEC Paris' },
      { '@type': 'CollegeOrUniversity', name: 'MIT' },
    ],
    knowsAbout: [
      'AI agents',
      'LangGraph',
      'RAG',
      'Multi-LLM routing',
      'ISO/IEC 42001 governance',
      'MCP',
      'Cloud Run',
    ],
    knowsLanguage: [
      { '@type': 'Language', name: 'French', alternateName: 'fr' },
      { '@type': 'Language', name: 'English', alternateName: 'en' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rennes',
      addressCountry: 'FR',
    },
    sameAs: [
      'https://github.com/plyd',
      'https://www.linkedin.com/in/vincentjuhel',
    ],
  };
}

function websiteSchema(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vincent Juhel',
    url: `${SITE}/${locale}`,
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased">
        <JsonLd data={personSchema(locale)} />
        <JsonLd data={websiteSchema(locale)} />
        <NextIntlClientProvider>
          <SessionProvider>
            <CvViewProvider>
              <div className="flex min-h-screen flex-col lg:flex-row">
                <div className="flex min-w-0 flex-1 flex-col">
                  <Header locale={locale} />
                  <main className="flex-1">{children}</main>
                  <Footer locale={locale} />
                </div>
                <ChatPanel />
              </div>
            </CvViewProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
