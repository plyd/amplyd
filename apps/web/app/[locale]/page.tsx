import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/hero/Hero';
import { Resume } from '@/components/cv/Resume';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero locale={locale} />
      <Resume locale={locale} />
    </>
  );
}
