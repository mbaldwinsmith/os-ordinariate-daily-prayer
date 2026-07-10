import { describe, expect, it } from 'vitest';
import { resolveScriptureRef } from './scripture';

describe('resolveScriptureRef', () => {
  it('resolves a whole chapter', () => {
    const { verses } = resolveScriptureRef('Gn 1');
    expect(verses['1']).toContain('In the beginning God created heaven, and earth.');
  });

  it('resolves a single verse', () => {
    const { verses } = resolveScriptureRef('Rom 1:1');
    expect(Object.keys(verses)).toEqual(['1']);
  });

  it('resolves a verse range within a chapter', () => {
    const { verses } = resolveScriptureRef('Rom 1:1-7');
    expect(Object.keys(verses)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('throws for an unknown book abbreviation', () => {
    expect(() => resolveScriptureRef('Xyz 1')).toThrow();
  });

  it('resolves every scripture reference the Year I Ordinary Time generator produced', async () => {
    const files = import.meta.glob<{ scriptureReading: { ref: string } }>(
      '../data/office-of-readings/**/week*/*.json',
      { eager: true, import: 'default' },
    );
    const refs = Object.values(files).map((f) => f.scriptureReading.ref);
    expect(refs.length).toBe(238);
    for (const ref of refs) {
      expect(() => resolveScriptureRef(ref)).not.toThrow();
    }
  });
});
