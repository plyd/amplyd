/**
 * Server entry: loads CV data + i18n strings, hands them to the client view.
 *
 * The default render (no CvView dispatched) is byte-equivalent to the previous
 * server-only render. The overlay only kicks in when an agent (or the demo
 * trigger) dispatches a CvView through the provider — which is mounted higher
 * up in `[locale]/layout.tsx` so it spans both the Resume and the ChatPanel.
 */

import { getTranslations } from 'next-intl/server';
import {
  SKILL_GROUP_KEYS,
  loadEducation,
  loadProjects,
  loadSkills,
  loadTimeline,
} from '@/lib/content';
import { ResumeView, type ResumeStrings } from '@/components/cv/ResumeView';

export async function Resume({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'resume' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const [roles, projects, education, skills] = await Promise.all([
    loadTimeline(locale),
    loadProjects(locale),
    loadEducation(locale),
    loadSkills(locale),
  ]);

  // Pre-resolve i18n strings server-side so the client component stays free of
  // next-intl client wiring (lighter bundle, simpler types).
  const strings: ResumeStrings = {
    sections: {
      experience: t('sections.experience'),
      projects: t('sections.projects'),
      education: t('sections.education'),
      skills: t('sections.skills'),
      languages: t('sections.languages'),
      contact: t('sections.contact'),
    },
    languagesList: t('languagesList'),
    contactBody: t('contactBody'),
    matchBadge: 'Match',
    resetLabel: locale === 'fr' ? 'Voir le CV original' : 'Reset to default CV',
    skillGroupNames: Object.fromEntries(
      SKILL_GROUP_KEYS.map((k) => [k, tSkills(`groups.${k}`)]),
    ) as Record<(typeof SKILL_GROUP_KEYS)[number], string>,
  };

  const skillGroups = SKILL_GROUP_KEYS.map((key) => ({
    key,
    items: skills.filter((s) => s.group === key).map((s) => s.name),
  })).filter((g) => g.items.length > 0);

  return (
    <ResumeView
      timeline={roles}
      projects={projects}
      education={education}
      skillGroups={skillGroups}
      strings={strings}
    />
  );
}
