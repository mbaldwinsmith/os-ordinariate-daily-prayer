import { describe, expect, it } from 'vitest';
import { getOfficeDay } from './calendar';
import { resolveDay } from './office';

// A cheap, broad regression net: every civil date of a full year should
// resolve without throwing. This is how two real bugs were actually found
// (not from a hypothesis, from this test crashing): the "1 Sam" vs "1 Sm"
// abbreviation typo in data/psalter/week2/wednesday.json's Lauds canticle,
// and Holy Saturday's Vespers crashing because Easter Sunday - uniquely
// among Sundays - has neither a skeleton entry nor a proper `firstVespers`
// to defer to (see the dedicated Holy Saturday test in office.test.ts).
function assertYearResolves(year: number) {
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const day = getOfficeDay(new Date(d));
    expect(() => resolveDay(day), `resolveDay threw for ${day.date}`).not.toThrow();
  }
}

describe('every day of a full year resolves without throwing', () => {
  it('2024 (leap year, includes Holy Saturday and the Dec 31 -> Jan 1 boundary)', () => {
    assertYearResolves(2024);
  });

  it('2025 (non-leap year)', () => {
    assertYearResolves(2025);
  });
});
