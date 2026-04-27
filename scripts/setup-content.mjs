#!/usr/bin/env node
/**
 * setup-content.mjs
 *
 * Copies apps/web/content.example/ → apps/web/content/ on first install,
 * so that:
 *   - Forks of this repo have working content immediately.
 *   - The owner's real, private content (gitignored) is never overwritten.
 *
 * If apps/web/content/ already exists, this script is a no-op.
 */
import { existsSync, cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const example = join(repoRoot, 'apps/web/content.example');
const target = join(repoRoot, 'apps/web/content');

if (!existsSync(example)) {
  // No example dir yet (e.g. very early scaffolding). Skip silently.
  process.exit(0);
}

if (existsSync(target)) {
  console.log('[setup-content] apps/web/content/ already exists — skipping.');
  process.exit(0);
}

mkdirSync(target, { recursive: true });
cpSync(example, target, { recursive: true });
console.log('[setup-content] Seeded apps/web/content/ from content.example/.');
console.log('[setup-content] Edit those MDX files with your own profile.');
