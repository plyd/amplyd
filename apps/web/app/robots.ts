import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.amplyd.com';

/**
 * Robots policy. We explicitly opt-in the major AI crawlers because LLMs are
 * becoming a primary discovery channel for senior AI roles — we want
 * ChatGPT/Claude/Perplexity/Gemini to index Vincent's CV and articles.
 *
 * `llms.txt` is a markdown root file (https://llmstxt.org) consumed by
 * coding assistants and AI search engines. We list it alongside the sitemap
 * so crawlers find both.
 */
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    'GPTBot',
    'ClaudeBot',
    'Claude-Web',
    'PerplexityBot',
    'Google-Extended',
    'OAI-SearchBot',
    'AppleBot',
    'AppleBot-Extended',
    'CCBot',
    'cohere-ai',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...aiBots.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: [`${SITE}/sitemap.xml`, `${SITE}/llms.txt`],
    host: SITE,
  };
}
