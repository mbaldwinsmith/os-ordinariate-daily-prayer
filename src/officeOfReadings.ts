// Resolves a calendar day to its Office of Readings content
// (data/office-of-readings/<yearI|yearII>/<season>/weekN/<day>.json).
// Only Year I / Ordinary Time is populated so far (TASKS.md Phase 7,
// deliberately scoped) - every other year/season combination returns
// null rather than throwing, since building them out is future work,
// not a bug.
import type { OfficeDay } from './calendar';

export interface OfficeOfReadingsDay {
  verified: boolean;
  scriptureReading: { ref: string; title?: string };
  patristicReading: { title: string; sourceRef?: string } | null;
}

const files = import.meta.glob<OfficeOfReadingsDay>('../data/office-of-readings/**/week*/*.json', {
  eager: true,
  import: 'default',
});

const readings = new Map<string, OfficeOfReadingsDay>();
for (const [path, content] of Object.entries(files)) {
  const match = path.match(/(year[I]+)\/(\w+)\/week(\d+)\/(\w+)\.json$/);
  if (!match) throw new Error(`Unexpected office-of-readings file path: ${path}`);
  const [, year, season, week, day] = match;
  readings.set(`${year}:${season}:${week}:${day}`, content);
}

export function resolveOfficeOfReadings(day: OfficeDay): OfficeOfReadingsDay | null {
  if (day.weekOfSeason === null) return null;
  const key = `year${day.officeYear}:${day.season}:${day.weekOfSeason}:${day.dayOfWeek}`;
  return readings.get(key) ?? null;
}
