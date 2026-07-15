import { describe, expect, it } from 'vitest';
import { getOfficeDay } from './calendar';

// Dates below are checked against known reference points for the current
// four-week psalter (see TASKS.md Phase 2's call to verify against a real
// breviary before trusting any of this).
describe('getOfficeDay', () => {
  it('assigns Psalter Week II to the 2nd Sunday of Ordinary Time', () => {
    // The "missing" 1st Sunday of Ordinary Time (superseded every year by
    // the Baptism of the Lord) still silently counts as Psalter Week I, so
    // the first Sunday that's actually celebrated as Ordinary Time uses
    // Week II - this is correct, not an off-by-one bug.
    const day = getOfficeDay(new Date(2024, 0, 14));
    expect(day.season).toBe('ordinaryTime');
    expect(day.weekOfSeason).toBe(2);
    expect(day.psalterWeek).toBe(2);
    expect(day.rank).toBe('solemnity');
  });

  it('assigns Psalter Week IV to Ash Wednesday, with no numbered week of season', () => {
    const day = getOfficeDay(new Date(2024, 1, 14));
    expect(day.season).toBe('lent');
    expect(day.psalterWeek).toBe(4);
    expect(day.weekOfSeason).toBeNull();
  });

  it('assigns Psalter Week II to Palm Sunday and the first week of Lent to Week I', () => {
    expect(getOfficeDay(new Date(2024, 2, 24)).psalterWeek).toBe(2); // Palm Sunday
    const firstLentSunday = getOfficeDay(new Date(2024, 1, 18));
    expect(firstLentSunday.season).toBe('lent');
    expect(firstLentSunday.weekOfSeason).toBe(1);
    expect(firstLentSunday.psalterWeek).toBe(1);
  });

  it('splits Holy Week into Lent (Mon-Wed) and the Triduum (Thu-Sat)', () => {
    expect(getOfficeDay(new Date(2024, 2, 25)).season).toBe('lent'); // Monday
    expect(getOfficeDay(new Date(2024, 2, 27)).season).toBe('lent'); // Wednesday
    expect(getOfficeDay(new Date(2024, 2, 28)).season).toBe('triduum'); // Holy Thursday
    expect(getOfficeDay(new Date(2024, 2, 29)).season).toBe('triduum'); // Good Friday
    expect(getOfficeDay(new Date(2024, 2, 30)).season).toBe('triduum'); // Holy Saturday
    expect(getOfficeDay(new Date(2024, 2, 31)).season).toBe('easter'); // Easter Sunday
  });

  it('uses the special Easter psalter through Divine Mercy Sunday, then resumes the 4-week cycle', () => {
    const easterSunday = getOfficeDay(new Date(2024, 2, 31));
    expect(easterSunday.psalterWeek).toBe('easter');
    // The Octave proper runs Easter Sunday through Divine Mercy Sunday (the
    // 2nd Sunday of Easter) inclusive - all eight days use the special
    // Easter psalter, not just the first.
    const divineMercySunday = getOfficeDay(new Date(2024, 3, 7));
    expect(divineMercySunday.psalterWeek).toBe('easter');
    const mondayAfter = getOfficeDay(new Date(2024, 3, 8));
    expect(mondayAfter.psalterWeek).not.toBe('easter');
  });

  it('resumes Ordinary Time’s running week count after Pentecost from where Ash Wednesday cut it off', () => {
    // Ash Wednesday 2024 fell on a Wednesday (Feb 14), interrupting the 7th
    // week of Ordinary Time mid-week (it had only reached Mon/Tue). That
    // week never finished, so when Ordinary Time resumes after Pentecost it
    // correctly continues as the 7th week rather than jumping to the 8th.
    const day = getOfficeDay(new Date(2024, 4, 20)); // Monday after Pentecost 2024
    expect(day.season).toBe('ordinaryTime');
    expect(day.weekOfSeason).toBe(7);
  });

  it('resolves week-of-season through a memorial that displaces the ferial name', () => {
    // Saint Bonaventure (a Memorial) falls within the 15th week of
    // Ordinary Time in 2024; his day's own name carries no week number.
    const day = getOfficeDay(new Date(2024, 6, 15));
    expect(day.rank).toBe('memorial');
    expect(day.weekOfSeason).toBe(15);
  });

  it('gives the Christmas season and the Triduum no week-of-season number', () => {
    expect(getOfficeDay(new Date(2024, 11, 25)).weekOfSeason).toBeNull(); // Christmas Day
    expect(getOfficeDay(new Date(2024, 2, 29)).weekOfSeason).toBeNull(); // Good Friday
  });

  it('flips the Office of Readings year on the plain calendar year, not at Advent', () => {
    expect(getOfficeDay(new Date(2024, 0, 1)).officeYear).toBe('II');
    expect(getOfficeDay(new Date(2024, 11, 31)).officeYear).toBe('II');
    expect(getOfficeDay(new Date(2025, 0, 1)).officeYear).toBe('I');
    // Still deep in the "Year B" Sunday-cycle liturgical year that began
    // Advent 2024 - the two cycles turn over independently.
    expect(getOfficeDay(new Date(2025, 0, 1)).sundayCycle).toBe(getOfficeDay(new Date(2024, 11, 1)).sundayCycle);
  });

  it('resets Psalter Week to I on the 1st Sunday of Advent', () => {
    const day = getOfficeDay(new Date(2024, 11, 1));
    expect(day.season).toBe('advent');
    expect(day.weekOfSeason).toBe(1);
    expect(day.psalterWeek).toBe(1);
  });

  it('lets romcal transfer the Annunciation off its usual date when it collides with Holy Week/Easter', () => {
    // In 2024 March 25th itself falls on the Monday of Holy Week, so romcal
    // relocates the Annunciation to the first available day after the
    // Easter octave rather than keeping it on its usual date. This matters
    // because src/proper.ts looks celebrations up by celebrationKey, not by
    // calendar date - so a transferred solemnity is picked up automatically,
    // with no extra transfer logic of this app's own needed (see
    // CONVENTIONS.md, "First Vespers of a weekday solemnity").
    expect(getOfficeDay(new Date(2024, 2, 25)).celebrationKey).not.toBe('annunciation');
    expect(getOfficeDay(new Date(2024, 3, 8)).celebrationKey).toBe('annunciation');
  });
});
