// Resolves a calendar day to its Office of Readings content. Two sources,
// depending on whether the day's season uses numbered weeks:
//  - Ordinary Time, Advent, Lent's 5 numbered weeks, and the Easter season
//    read from data/office-of-readings/<yearI|yearII>/<season>/weekN/<day>.json.
//  - Everything else (the Triduum, the Christmas season, the Ash-Wednesday
//    stub, and any solemnity with a proper override) reads from
//    src/proper.ts instead - see CONVENTIONS.md.
import type { OfficeDay } from './calendar';
import { resolveProperEntry } from './proper';

export interface OfficeOfReadingsDay {
  verified: boolean;
  scriptureReading: { ref: string; title?: string };
  patristicReading: { title: string; sourceRef?: string } | null;
}

const weekBasedFiles = import.meta.glob<OfficeOfReadingsDay>('../data/office-of-readings/**/week*/*.json', {
  eager: true,
  import: 'default',
});

const weekBased = new Map<string, OfficeOfReadingsDay>();
for (const [path, content] of Object.entries(weekBasedFiles)) {
  const match = path.match(/(year[I]+)\/(\w+)\/week(\d+)\/(\w+)\.json$/);
  if (!match) throw new Error(`Unexpected office-of-readings file path: ${path}`);
  const [, year, season, week, day] = match;
  weekBased.set(`${year}:${season}:${week}:${day}`, content);
}

export function resolveOfficeOfReadings(day: OfficeDay): OfficeOfReadingsDay | null {
  const proper = resolveProperEntry(day);
  if (proper?.firstReading) {
    return {
      verified: proper.verified,
      scriptureReading: proper.firstReading,
      patristicReading: proper.secondReading ?? null,
    };
  }

  if (day.weekOfSeason === null) return null;
  const key = `year${day.officeYear}:${day.season}:${day.weekOfSeason}:${day.dayOfWeek}`;
  return weekBased.get(key) ?? null;
}
