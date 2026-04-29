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
  return {
    title: t('title'),
    description: t('description'),
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
