import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/hero/Hero';
import { ExperienceTimeline } from '@/components/cv/ExperienceTimeline';
import { EducationGrid } from '@/components/cv/EducationGrid';
import { SkillsGrid } from '@/components/cv/SkillsGrid';
import { ProjectGrid } from '@/components/cv/ProjectGrid';

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
      <ExperienceTimeline locale={locale} />
      <EducationGrid locale={locale} />
      <SkillsGrid locale={locale} />
      <ProjectGrid locale={locale} />
    </>
  );
}
