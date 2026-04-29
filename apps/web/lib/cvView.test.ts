import { describe, expect, it } from 'vitest';
import { parseCvView } from './cvView';

describe('parseCvView', () => {
  it('accepts a minimal valid payload', () => {
    const out = parseCvView({ reason: 'why' });
    expect(out).not.toBeNull();
    expect(out?.reason).toBe('why');
    expect(out?.timeline).toEqual([]);
    expect(out?.projects).toEqual([]);
  });

  it('accepts a full payload with timeline + projects + skills_pinned', () => {
    const out = parseCvView({
      reason: 'RAG senior',
      timeline: [
        { idx: 0, pinned: true, expand: true, show_anecdotes: [0, 1] },
      ],
      projects: [
        { key: 'amplyd', pinned: true, expand: true, show_outcomes: [0] },
      ],
      hidden_keys: ['timeline:8'],
      skills_pinned: ['LangGraph'],
    });
    expect(out).not.toBeNull();
    expect(out?.timeline).toHaveLength(1);
    expect(out?.projects[0]?.key).toBe('amplyd');
    expect(out?.skills_pinned).toEqual(['LangGraph']);
  });

  it('returns null when reason is empty', () => {
    expect(parseCvView({ reason: '' })).toBeNull();
  });

  it('returns null when reason exceeds 280 chars', () => {
    expect(parseCvView({ reason: 'a'.repeat(281) })).toBeNull();
  });

  it('returns null on negative timeline idx', () => {
    expect(
      parseCvView({ reason: 'x', timeline: [{ idx: -1 }] }),
    ).toBeNull();
  });

  it('returns null on non-integer timeline idx', () => {
    expect(
      parseCvView({ reason: 'x', timeline: [{ idx: 1.5 }] }),
    ).toBeNull();
  });

  it('returns null when project.key is empty', () => {
    expect(
      parseCvView({ reason: 'x', projects: [{ key: '' }] }),
    ).toBeNull();
  });

  it('returns null on completely malformed input', () => {
    expect(parseCvView(null)).toBeNull();
    expect(parseCvView(undefined)).toBeNull();
    expect(parseCvView('hello')).toBeNull();
    expect(parseCvView({})).toBeNull();
  });
});
