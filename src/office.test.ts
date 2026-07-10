import { describe, expect, it } from 'vitest';
import { getOfficeDay } from './calendar';
import { resolveDay } from './office';

function resolveDayOrThrow(date: Date) {
  const day = resolveDay(getOfficeDay(date));
  if (!day) throw new Error('expected a resolved day (not the Easter octave)');
  return day;
}

describe('resolveDay', () => {
  it('attaches the Benedictus to Lauds, the Magnificat to Vespers, and the Nunc Dimittis to Compline', () => {
    const day = resolveDayOrThrow(new Date(2024, 0, 14));

    expect(day.lauds.gospelCanticle?.name).toContain('Benedictus');
    expect(day.lauds.gospelCanticle?.verses['1']).toContain('Blessed be the Lord God of Israel');

    expect(day.vespers.gospelCanticle?.name).toContain('Magnificat');
    expect(day.vespers.gospelCanticle?.verses['1']).toContain('My soul doth magnify the Lord');

    expect(day.compline.gospelCanticle?.name).toContain('Nunc Dimittis');
    expect(day.compline.gospelCanticle?.verses['1']).toContain('Lord, now lettest thou thy servant depart in peace');
  });

  it('gives Office of Readings and Daytime Prayer no Gospel canticle', () => {
    const day = resolveDayOrThrow(new Date(2024, 0, 14));
    expect(day.officeOfReadings.gospelCanticle).toBeNull();
    expect(day.daytimePrayer.gospelCanticle).toBeNull();
  });

  it('gives every hour at least one psalmody item, from the real skeleton', () => {
    const day = resolveDayOrThrow(new Date(2024, 0, 14));
    expect(day.officeOfReadings.psalmody.length).toBeGreaterThan(0);
    expect(day.lauds.psalmody.length).toBeGreaterThan(0);
    expect(day.daytimePrayer.psalmody.length).toBeGreaterThan(0);
    expect(day.vespers.psalmody.length).toBeGreaterThan(0);
    expect(day.compline.psalmody.length).toBeGreaterThan(0);
  });

  it('resolves psalm psalmody items to real Coverdale verse text', () => {
    const day = resolveDayOrThrow(new Date(2024, 0, 14));
    const psalmItem = day.officeOfReadings.psalmody.find((item) => item.type === 'psalm');
    expect(psalmItem).toBeDefined();
    if (psalmItem?.type !== 'psalm') throw new Error('expected a psalm item');
    expect(Object.keys(psalmItem.verses).length).toBeGreaterThan(0);
    expect(Object.values(psalmItem.verses).every((text) => text.length > 0)).toBe(true);
  });

  it('uses Benedicite (not a scripture canticle) as the Sunday Lauds canticle', () => {
    // 2024-01-14 is a Sunday.
    const day = resolveDayOrThrow(new Date(2024, 0, 14));
    const canticleItem = day.lauds.psalmody.find((item) => item.type === 'canticle');
    expect(canticleItem).toMatchObject({ type: 'canticle', fixedId: 'benedicite' });
  });

  it('flags every generated skeleton day as unverified', () => {
    const day = resolveDayOrThrow(new Date(2024, 0, 14));
    expect(day.verified).toBe(false);
  });

  it('returns null for the Easter octave, which is out of scope for the Phase 5 skeleton', () => {
    // Easter Sunday 2024.
    const day = resolveDay(getOfficeDay(new Date(2024, 2, 31)));
    expect(day).toBeNull();
  });

  it('resolves Office of Readings scripture text for Year I Ordinary Time, with no patristic reading', () => {
    // 2025-01-19: 2nd Sunday of Ordinary Time, an odd (Year I) year.
    const officeDay = getOfficeDay(new Date(2025, 0, 19));
    expect(officeDay.officeYear).toBe('I');
    const day = resolveDayOrThrow(new Date(2025, 0, 19));
    expect(day.readings).not.toBeNull();
    expect(day.readings?.scriptureReading.ref).toMatch(/^[A-Za-z0-9 ]+ \d+$/);
    expect(Object.values(day.readings!.scriptureReading.verses).length).toBeGreaterThan(0);
    expect(day.readings?.patristicReading).toBeNull();
  });

  it('returns null readings for Year II, which is not populated yet', () => {
    // 2024-01-14: also 2nd Sunday of Ordinary Time, but an even (Year II) year.
    const day = resolveDayOrThrow(new Date(2024, 0, 14));
    expect(day.readings).toBeNull();
  });
});
