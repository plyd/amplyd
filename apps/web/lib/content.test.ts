import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  EducationEntrySchema,
  PreferencesSchema,
  ProjectEntrySchema,
  SkillEntrySchema,
  TimelineEntrySchema,
} from './content';

const KEBAB_LOWER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LOCALES = ['en', 'fr'] as const;
const ROOT = path.resolve(__dirname, '..');
const DIRS = ['content', 'content.example'] as const;

async function readJson(file: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

type Spec = {
  name: string;
  filename: (locale: string) => string;
  schema: z.ZodTypeAny;
  isArray: boolean;
};

const SPECS: Spec[] = [
  {
    name: 'timeline',
    filename: (l) => `timeline.${l}.json`,
    schema: TimelineEntrySchema,
    isArray: true,
  },
  {
    name: 'projects',
    filename: (l) => `projects.${l}.json`,
    schema: ProjectEntrySchema,
    isArray: true,
  },
  {
    name: 'education',
    filename: (l) => `education.${l}.json`,
    schema: EducationEntrySchema,
    isArray: true,
  },
  {
    name: 'skills',
    filename: (l) => `skills.${l}.json`,
    schema: SkillEntrySchema,
    isArray: true,
  },
  {
    name: 'preferences',
    filename: (l) => `preferences.${l}.json`,
    schema: PreferencesSchema,
    isArray: false,
  },
];

describe('content schemas', () => {
  for (const dir of DIRS) {
    for (const locale of LOCALES) {
      for (const spec of SPECS) {
        const file = path.join(ROOT, dir, spec.filename(locale));
        it(`${dir}/${spec.filename(locale)} validates against ${spec.name} schema`, async () => {
          const data = await readJson(file);
          if (data === null) {
            // Fork-friendly: skip files that aren't present in this directory.
            return;
          }
          if (spec.isArray) {
            expect(Array.isArray(data)).toBe(true);
            const parsed = z.array(spec.schema).safeParse(data);
            if (!parsed.success) {
              throw new Error(parsed.error.message);
            }
          } else {
            const parsed = spec.schema.safeParse(data);
            if (!parsed.success) {
              throw new Error(parsed.error.message);
            }
          }
        });
      }
    }
  }
});

describe('content rétro-compat (blurb required everywhere)', () => {
  it('every timeline/projects/education entry has a non-empty blurb', async () => {
    for (const dir of DIRS) {
      for (const locale of LOCALES) {
        for (const name of ['timeline', 'projects', 'education']) {
          const file = path.join(ROOT, dir, `${name}.${locale}.json`);
          const data = (await readJson(file)) as Array<{ blurb?: unknown }> | null;
          if (data === null) continue;
          for (const entry of data) {
            expect(typeof entry.blurb).toBe('string');
            expect((entry.blurb as string).trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

describe('keywords are kebab-case ASCII lowercase', () => {
  it('every keyword in timeline/projects matches /^[a-z0-9]+(-[a-z0-9]+)*$/', async () => {
    const failures: string[] = [];
    for (const dir of DIRS) {
      for (const locale of LOCALES) {
        for (const name of ['timeline', 'projects']) {
          const file = path.join(ROOT, dir, `${name}.${locale}.json`);
          const data = (await readJson(file)) as
            | Array<{ keywords?: string[] }>
            | null;
          if (data === null) continue;
          data.forEach((entry, idx) => {
            for (const kw of entry.keywords ?? []) {
              if (!KEBAB_LOWER.test(kw)) {
                failures.push(
                  `${dir}/${name}.${locale}.json[${idx}].keywords: "${kw}"`,
                );
              }
            }
          });
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
