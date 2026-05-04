import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { listArticles } from '@/lib/content';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.amplyd.com';

/**
 * Sitemap with hreflang `alternates.languages` so search engines (and AI
 * crawlers) understand that `/fr/...` and `/en/...` are translations of the
 * same content. Article slugs are loaded dynamically per locale.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = routing.locales;

  // Static routes that exist for every locale.
  const staticPaths = ['', '/articles', '/privacy', '/ai-disclosure'];

  // Per-locale article slugs.
  const articleSlugsByLocale = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      slugs: (await listArticles(locale)).map((a) => a.slug),
    })),
  );
  const allArticleSlugs = Array.from(
    new Set(articleSlugsByLocale.flatMap((e) => e.slugs)),
  );

  const urlFor = (locale: string, path: string) => `${SITE}/${locale}${path}`;

  const buildAlternates = (path: string): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const l of locales) out[l] = urlFor(l, path);
    return out;
  };

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const path of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, path),
        lastModified: now,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1.0 : 0.6,
        alternates: { languages: buildAlternates(path) },
      });
    }
  }

  for (const slug of allArticleSlugs) {
    const articlePath = `/articles/${slug}`;
    for (const locale of locales) {
      // Only emit for locales that actually have this slug published.
      const hasIt = articleSlugsByLocale
        .find((e) => e.locale === locale)
        ?.slugs.includes(slug);
      if (!hasIt) continue;
      entries.push({
        url: urlFor(locale, articlePath),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: { languages: buildAlternates(articlePath) },
      });
    }
  }

  return entries;
}
