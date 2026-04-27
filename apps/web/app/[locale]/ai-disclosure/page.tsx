import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aiPage' });
  return { title: t('title') };
}

export default async function AiDisclosurePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage locale={locale} namespace="aiPage" />;
}
