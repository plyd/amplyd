import { describe, it, expect } from 'vitest';
import { routing } from '@/i18n/routing';

describe('i18n routing config', () => {
  it('exposes en and fr', () => {
    expect(routing.locales).toEqual(['en', 'fr']);
  });

  it('defaults to en', () => {
    expect(routing.defaultLocale).toBe('en');
  });
});
