import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });
  const title = t('title');
  const description = t('intro');
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { en: '/en/privacy', fr: '/fr/privacy', 'x-default': '/en/privacy' },
    },
    openGraph: {
      type: 'article',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      title,
      description,
      url: `/${locale}/privacy`,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage locale={locale} namespace="privacyPage" />;
}
