import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export type ArticleMeta = {
  slug: string;
  locale: string;
  title: string;
  draft: boolean;
};

// ──────────────────────────────────────────────────────────────────────────
// Schemas (Zod) — single source of truth for both runtime validation and types.
// All long-form fields are optional so existing JSON files keep working.
// ──────────────────────────────────────────────────────────────────────────

export const TimelineEntrySchema = z.object({
  // Compact (rendered by default)
  period: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  blurb: z.string().min(1),

  // Long-form (read by the LLM, optionally surfaced via CvView)
  narrative: z.string().optional(),
  anecdotes: z.array(z.string().min(1)).optional(),
  achievements: z.array(z.string().min(1)).optional(),
  outcomes: z.array(z.string().min(1)).optional(),
  lessons: z.array(z.string().min(1)).optional(),
  stack: z.array(z.string().min(1)).optional(),
  keywords: z.array(z.string().min(1)).optional(),
  context: z.string().optional(),
});

export const ProjectEntrySchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  blurb: z.string().min(1),
  href: z.string().url().optional(),
  stack: z.array(z.string().min(1)),

  narrative: z.string().optional(),
  anecdotes: z.array(z.string().min(1)).optional(),
  outcomes: z.array(z.string().min(1)).optional(),
  lessons: z.array(z.string().min(1)).optional(),
  keywords: z.array(z.string().min(1)).optional(),
  context: z.string().optional(),
});

export const EducationEntrySchema = z.object({
  year: z.string().min(1),
  institution: z.string().min(1),
  title: z.string().min(1),
  blurb: z.string().min(1),

  narrative: z.string().optional(),
  why: z.string().optional(),
  highlights: z.array(z.string().min(1)).optional(),
});

export const SKILL_GROUP_KEYS = [
  'agents',
  'rag',
  'routing',
  'governance',
  'platform',
  'languages',
] as const;

export const SkillEntrySchema = z.object({
  group: z.enum(SKILL_GROUP_KEYS),
  name: z.string().min(1),
  level: z.enum(['exposure', 'working', 'expert']).optional(),
  years_xp: z.number().int().nonnegative().optional(),
  evidence_project_keys: z.array(z.string().min(1)).optional(),
  story: z.string().optional(),
});

export const PreferencesSchema = z.object({
  remote: z.enum(['full', 'hybrid', 'onsite']),
  locations: z.array(z.string().min(1)),
  availability: z.string().optional(),
  contract_types: z.array(z.enum(['freelance', 'cdi'])),
  sectors_of_interest: z.array(z.string().min(1)).optional(),
  values: z.string().optional(),
  red_flags: z.array(z.string().min(1)).optional(),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type SkillEntry = z.infer<typeof SkillEntrySchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type SkillGroupKey = (typeof SKILL_GROUP_KEYS)[number];

// ──────────────────────────────────────────────────────────────────────────
// Loaders
// ──────────────────────────────────────────────────────────────────────────

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

export async function loadSkills(locale: string): Promise<SkillEntry[]> {
  const envVar = `AMPLYD_SKILLS_${locale.toUpperCase()}`;
  return (await readJson<SkillEntry[]>(`skills.${locale}.json`, envVar)) ?? [];
}

export async function loadPreferences(locale: string): Promise<Preferences | null> {
  const envVar = `AMPLYD_PREFERENCES_${locale.toUpperCase()}`;
  return await readJson<Preferences>(`preferences.${locale}.json`, envVar);
}

/**
 * Returns the entire CV corpus for the LLM agent. Long-form fields are
 * included; the page itself only renders compact fields by default.
 */
export async function loadAllForAgent(locale: string): Promise<{
  timeline: TimelineEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  preferences: Preferences | null;
}> {
  const [timeline, projects, education, skills, preferences] = await Promise.all([
    loadTimeline(locale),
    loadProjects(locale),
    loadEducation(locale),
    loadSkills(locale),
    loadPreferences(locale),
  ]);
  return { timeline, projects, education, skills, preferences };
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
