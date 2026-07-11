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

  it('resolves discontinuous ranges with an implied chapter', () => {
    const { verses } = resolveScriptureRef('Ex 15:1-3, 17-18');
    expect(Object.keys(verses)).toEqual(['1', '2', '3', '17', '18']);
  });

  it('resolves discontinuous and cross-chapter ranges', () => {
    const { verses } = resolveScriptureRef('1 Cor 12:31-13:2, 13:13');
    expect(Object.keys(verses)).toEqual(['12:31', '13:1', '13:2', '13:13']);
  });

  it('throws for an unknown book abbreviation', () => {
    expect(() => resolveScriptureRef('Xyz 1')).toThrow();
  });

  it('resolves every week-based Office of Readings scripture reference generated so far', () => {
    const files = import.meta.glob<{ scriptureReading: { ref?: string; refs?: string[] } }>(
      '../data/office-of-readings/**/week*/*.json',
      { eager: true, import: 'default' },
    );
    const refs = Object.values(files).flatMap((f) => f.scriptureReading.refs ?? [f.scriptureReading.ref!]);
    expect(Object.keys(files).length).toBe(700); // (34 + 4 + 5 + 7) weeks x 2 years x 7 days
    const invalid = refs.filter((ref) => {
      try { resolveScriptureRef(ref); return false; } catch { return true; }
    });
    expect(invalid).toEqual([]);
  });

  it('resolves every proper (Triduum/Christmas/Ash-Wednesday-stub) first-reading reference', () => {
    const files = import.meta.glob<{ firstReading?: { ref: string } }>('../data/proper-of-seasons/*.json', {
      eager: true,
      import: 'default',
    });
    const refs = Object.values(files)
      .map((f) => f.firstReading?.ref)
      .filter((ref): ref is string => Boolean(ref));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(() => resolveScriptureRef(ref)).not.toThrow();
    }
  });
});
