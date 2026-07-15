import { describe, expect, it } from 'vitest';
import { getOfficeDay } from './calendar';
import { resolveDecemberShortReading } from './decemberShortReadings';

function day(year: number, month: number, date: number) {
  return getOfficeDay(new Date(year, month - 1, date));
}

describe('resolveDecemberShortReading', () => {
  it('resolves the date-keyed reading for an ordinary weekday in the range', () => {
    // 2024-12-18 is a Wednesday (a plain ferial day within the range).
    expect(resolveDecemberShortReading(day(2024, 12, 18), 'lauds')?.ref).toBe('Rom 13:11-12');
    expect(resolveDecemberShortReading(day(2024, 12, 18), 'daytimePrayer')?.ref).toBe('1 Thes 3:12-13');
    expect(resolveDecemberShortReading(day(2024, 12, 18), 'vespers')?.ref).toBe('Phil 4:4-5');
  });

  it('flags every entry as unverified (single-sourced from Breviarium)', () => {
    expect(resolveDecemberShortReading(day(2024, 12, 18), 'lauds')?.verified).toBe(false);
  });

  it('returns null outside Dec 17-24', () => {
    expect(resolveDecemberShortReading(day(2024, 12, 16), 'lauds')).toBeNull();
    expect(resolveDecemberShortReading(day(2024, 12, 25), 'lauds')).toBeNull();
    expect(resolveDecemberShortReading(day(2024, 6, 20), 'lauds')).toBeNull();
  });

  it('returns null for the Office of Readings and Compline, which this override does not cover', () => {
    expect(resolveDecemberShortReading(day(2024, 12, 18), 'officeOfReadings')).toBeNull();
    expect(resolveDecemberShortReading(day(2024, 12, 18), 'compline')).toBeNull();
  });

  it('returns null for a Sunday in the range, deferring to that Sunday\'s own proper-of-seasons file', () => {
    // 2028-12-17 is the 3rd Sunday of Advent.
    expect(day(2028, 12, 17).dayOfWeek).toBe('sunday');
    expect(resolveDecemberShortReading(day(2028, 12, 17), 'lauds')).toBeNull();
  });

  it('omits an Hour whose Breviarium citation was marked "(cfr.)" (approximate, not exact)', () => {
    // Dec 19 Daytime Prayer and Dec 20 Vespers are both dropped for this reason - see
    // scripts/generate-december-short-readings.mjs.
    expect(resolveDecemberShortReading(day(2024, 12, 19), 'daytimePrayer')).toBeNull();
    expect(resolveDecemberShortReading(day(2024, 12, 20), 'vespers')).toBeNull();
  });
});
