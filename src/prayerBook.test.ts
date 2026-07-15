import { describe, expect, it } from 'vitest';
import { resolvePrayerBook } from './prayerBook';

describe('Prayer Book supplement', () => {
  it('attaches morning and evening material in source order', () => {
    expect(resolvePrayerBook('lauds', 'monday').map((item) => item.title)).toEqual(['The Suffrages', 'A Collect for Peace', 'A Collect for Grace']);
    expect(resolvePrayerBook('vespers', 'monday').map((item) => item.title)).toEqual(['The Suffrages', 'A Collect for Peace', 'A Collect for Aid against All Perils']);
  });

  it('adds the Litany only on Sunday, Wednesday, and Friday', () => {
    for (const day of ['sunday', 'wednesday', 'friday'] as const) expect(resolvePrayerBook('lauds', day).at(-1)?.kind).toBe('litany');
    expect(resolvePrayerBook('lauds', 'tuesday').some((item) => item.kind === 'litany')).toBe(false);
  });

  it('provides sourced material for all five app Hours', () => {
    for (const hour of ['officeOfReadings', 'lauds', 'daytimePrayer', 'vespers', 'compline'] as const) expect(resolvePrayerBook(hour, 'monday').length).toBeGreaterThan(0);
  });
});
