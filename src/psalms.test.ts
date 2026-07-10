import { describe, expect, it } from 'vitest';
import { resolvePsalmRef } from './psalms';

describe('resolvePsalmRef', () => {
  it('resolves a whole psalm', () => {
    const { verses } = resolvePsalmRef('Ps 23');
    expect(Object.keys(verses)).toHaveLength(6);
    expect(verses['1']).toContain('The Lord is my shepherd');
  });

  it('resolves a single verse', () => {
    const { verses } = resolvePsalmRef('Ps 100:1');
    expect(Object.keys(verses)).toEqual(['1']);
    expect(verses['1']).toContain('O be joyful in the Lord');
  });

  it('resolves a verse range, e.g. a Psalm 119 section', () => {
    const { verses } = resolvePsalmRef('Ps 119:1-8');
    expect(Object.keys(verses)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  });

  it('resolves the canonical psalter\'s discontiguous verse selections', () => {
    expect(Object.keys(resolvePsalmRef('Ps 110:1-5, 7').verses)).toEqual(['1', '2', '3', '4', '5', '7']);
  });

  it('throws for a psalm/verse combination that does not exist', () => {
    expect(() => resolvePsalmRef('Ps 23:99')).toThrow();
  });
});
