import { describe, expect, it } from 'vitest';
import { getOfficeDay } from './calendar';
import { resolveInvitatoryAntiphon } from './invitatory';
import { resolveOAntiphon } from './oAntiphon';
import { resolveMarianAntiphon } from './complineAntiphon';

function day(year: number, month: number, date: number) {
  return getOfficeDay(new Date(year, month - 1, date));
}

describe('resolveInvitatoryAntiphon', () => {
  it('uses the weekday rotation on an ordinary Sunday', () => {
    // 2024-01-14: 2nd Sunday of Ordinary Time.
    expect(resolveInvitatoryAntiphon(day(2024, 1, 14)).firstLine).toBe('The earth is the Lord’s for he made it:');
  });

  it('uses the Advent antiphon throughout Advent', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 12, 1)).firstLine).toBe('Our King and Savior now draws near:');
  });

  it('uses the pre-Epiphany Christmas antiphon on Christmas Day', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 12, 25)).firstLine).toBe('Alleluia, to us a child is born:');
  });

  it('switches to the post-Epiphany Christmas antiphon after Jan 6', () => {
    // 2025-01-10: still Christmas season (before the Baptism of the Lord), after Epiphany.
    expect(resolveInvitatoryAntiphon(day(2025, 1, 10)).firstLine).toBe('The Lord has shown forth his glory:');
  });

  it('uses the Lent antiphon on Ash Wednesday', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 2, 14)).firstLine).toBe('The Lord is full of compassion and mercy:');
  });

  it('uses the Easter antiphon on Easter Sunday', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 3, 31)).firstLine).toBe('Alleluia. The Lord is risen indeed:');
  });

  it('overrides with a specific antiphon for Ascension', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 5, 9)).firstLine).toBe('Alleluia. Christ the Lord has ascended into heaven:');
  });

  it('overrides with a specific antiphon for Pentecost', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 5, 19)).firstLine).toBe('Alleluia. The Spirit of the Lord renews the face of the earth:');
  });

  it('overrides with a specific antiphon for Trinity Sunday', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 5, 26)).firstLine).toBe('Father, Son, and Holy Spirit, one God:');
  });

  it('uses the generic solemnity antiphon for other solemnities (e.g. the Assumption)', () => {
    expect(resolveInvitatoryAntiphon(day(2024, 8, 15)).firstLine).toBe('The Lord is glorious in his saints:');
  });
});

describe('resolveOAntiphon', () => {
  it('resolves O Sapientia on Dec 16 (the Sarum tradition starts one day early)', () => {
    expect(resolveOAntiphon(day(2024, 12, 16))?.english).toContain('O Wisdom');
  });

  it('resolves O Virgo virginum on Dec 23 (the Sarum 8th antiphon)', () => {
    expect(resolveOAntiphon(day(2024, 12, 23))?.english).toContain('O Virgin of virgins');
  });

  it('returns null before Dec 16', () => {
    expect(resolveOAntiphon(day(2024, 12, 15))).toBeNull();
  });

  it('returns null after Dec 23', () => {
    expect(resolveOAntiphon(day(2024, 12, 24))).toBeNull();
  });

  it('returns null outside December entirely', () => {
    expect(resolveOAntiphon(day(2024, 6, 20))).toBeNull();
  });
});

describe('resolveMarianAntiphon', () => {
  it('flags every antiphon as unverified', () => {
    expect(resolveMarianAntiphon(day(2024, 12, 1)).verified).toBe(false);
  });

  it('uses Alma Redemptoris Mater during Advent', () => {
    expect(resolveMarianAntiphon(day(2024, 12, 1)).name).toBe('Alma Redemptoris Mater');
  });

  it('keeps Alma Redemptoris Mater into January, before Candlemas', () => {
    expect(resolveMarianAntiphon(day(2024, 1, 14)).name).toBe('Alma Redemptoris Mater');
  });

  it('switches to Ave Regina Caelorum from Candlemas (Feb 2)', () => {
    expect(resolveMarianAntiphon(day(2024, 2, 2)).name).toBe('Ave Regina Caelorum');
  });

  it('uses Ave Regina Caelorum through Lent', () => {
    expect(resolveMarianAntiphon(day(2024, 2, 14)).name).toBe('Ave Regina Caelorum');
  });

  it('uses Regina Caeli during the Easter season', () => {
    expect(resolveMarianAntiphon(day(2024, 3, 31)).name).toBe('Regina Caeli');
  });

  it('uses Salve Regina for the rest of the year, from Trinity Sunday', () => {
    expect(resolveMarianAntiphon(day(2024, 5, 26)).name).toBe('Salve Regina');
    expect(resolveMarianAntiphon(day(2024, 8, 15)).name).toBe('Salve Regina');
  });
});
