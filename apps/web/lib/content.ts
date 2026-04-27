import { promises as fs } from 'node:fs';
import path from 'node:path';

export type ArticleMeta = {
  slug: string;
  locale: string;
  title: string;
  draft: boolean;
};

export type TimelineEntry = {
  period: string;
  title: string;
  company: string;
  blurb: string;
};

export type ProjectEntry = {
  key: string;
  title: string;
  blurb: string;
  href?: string;
  stack: string[];
};

export type EducationEntry = {
  year: string;
  institution: string;
  title: string;
  blurb: string;
};

const ROOT = path.join(process.cwd(), 'content');
const FALLBACK = path.join(process.cwd(), 'content.example');

async function readDirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function readFileSafe(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return null;
  }
}

/** Tiny YAML frontmatter extractor — supports `key: "value"` and unquoted values. */
function parseFrontmatter(raw: string): Record<string, string> {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[kv[1]] = val;
  }
  return out;
}

export async function listArticles(locale: string): Promise<ArticleMeta[]> {
  const articlesDir = path.join(ROOT, 'articles');
  let files = await readDirSafe(articlesDir);
  let baseDir = articlesDir;
  if (files.length === 0) {
    baseDir = path.join(FALLBACK, 'articles');
    files = await readDirSafe(baseDir);
  }
  const metas: ArticleMeta[] = [];
  for (const f of files) {
    if (!f.endsWith(`.${locale}.mdx`)) continue;
    const raw = await readFileSafe(path.join(baseDir, f));
    if (!raw) continue;
    const fm = parseFrontmatter(raw);
    metas.push({
      slug: fm.slug ?? f.replace(`.${locale}.mdx`, ''),
      locale,
      title: fm.title ?? fm.slug ?? f,
      draft: fm.draft === 'true',
    });
  }
  return metas
    .filter((m) => !m.draft)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

async function readJson<T>(name: string, envVar: string): Promise<T | null> {
  // 1. Production: read from Vercel env var (real CV, never committed)
  const fromEnv = process.env[envVar];
  if (fromEnv) {
    try {
      return JSON.parse(fromEnv) as T;
    } catch {
      // fall through to filesystem
    }
  }
  // 2. Local dev: gitignored content/ then fork-safe content.example/
  for (const base of [ROOT, FALLBACK]) {
    const raw = await readFileSafe(path.join(base, name));
    if (!raw) continue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export async function loadTimeline(locale: string): Promise<TimelineEntry[]> {
  const envVar = `AMPLYD_TIMELINE_${locale.toUpperCase()}`;
  return (await readJson<TimelineEntry[]>(`timeline.${locale}.json`, envVar)) ?? [];
}

export async function loadProjects(locale: string): Promise<ProjectEntry[]> {
  const envVar = `AMPLYD_PROJECTS_${locale.toUpperCase()}`;
  return (await readJson<ProjectEntry[]>(`projects.${locale}.json`, envVar)) ?? [];
}

export async function loadEducation(locale: string): Promise<EducationEntry[]> {
  const envVar = `AMPLYD_EDUCATION_${locale.toUpperCase()}`;
  return (await readJson<EducationEntry[]>(`education.${locale}.json`, envVar)) ?? [];
}

export async function readArticle(
  locale: string,
  slug: string,
): Promise<{ meta: ArticleMeta; body: string } | null> {
  for (const base of [ROOT, FALLBACK]) {
    const file = path.join(base, 'articles', `${slug}.${locale}.mdx`);
    const raw = await readFileSafe(file);
    if (!raw) continue;
    const fm = parseFrontmatter(raw);
    const body = raw.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
    return {
      meta: {
        slug,
        locale,
        title: fm.title ?? slug,
        draft: fm.draft === 'true',
      },
      body,
    };
  }
  return null;
}
