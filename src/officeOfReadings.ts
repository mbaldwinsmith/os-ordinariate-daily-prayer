// Resolves a calendar day to its Office of Readings content. Two sources,
// depending on whether the day's season uses numbered weeks:
//  - Ordinary Time, Advent, Lent's 5 numbered weeks, and the Easter season
//    read from data/office-of-readings/<yearI|yearII>/<season>/weekN/<day>.json.
//  - The Triduum, the Christmas season, and the Ash-Wednesday-to-Saturday
//    stub before Lent's numbered weeks begin have no week number at all,
//    so they read from data/proper-of-seasons/<key>.json instead - see
//    CONVENTIONS.md for why and how each is keyed.
import type { DayOfWeek, OfficeDay } from './calendar';

export interface OfficeOfReadingsDay {
  verified: boolean;
  scriptureReading: { ref: string; title?: string };
  patristicReading: { title: string; sourceRef?: string } | null;
}

interface ProperEntry {
  key: string;
  verified: boolean;
  name?: string;
  firstReading?: { ref: string; title?: string };
  secondReading?: { title: string; sourceRef?: string } | null;
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

const properFiles = import.meta.glob<ProperEntry>('../data/proper-of-seasons/*.json', {
  eager: true,
  import: 'default',
});

const properByKey = new Map<string, ProperEntry>();
for (const entry of Object.values(properFiles)) {
  properByKey.set(entry.key, entry);
}

// Ash Wednesday through the following Saturday has no week number, and
// (unlike the Triduum) its romcal celebration key isn't reliably stable -
// an occasional commemoration can occupy the Saturday in a given year
// (see SOURCES.md) - so this maps by day-of-week instead.
const ASH_WEDNESDAY_STUB_KEYS: Partial<Record<DayOfWeek, string>> = {
  wednesday: 'ashWednesday',
  thursday: 'thursdayAfterAshWednesday',
  friday: 'fridayAfterAshWednesday',
  saturday: 'saturdayAfterAshWednesday',
};

function fromProper(entry: ProperEntry | undefined): OfficeOfReadingsDay | null {
  if (!entry?.firstReading) return null;
  return {
    verified: entry.verified,
    scriptureReading: entry.firstReading,
    patristicReading: entry.secondReading ?? null,
  };
}

export function resolveOfficeOfReadings(day: OfficeDay): OfficeOfReadingsDay | null {
  if (day.season === 'triduum' || day.season === 'christmas') {
    return fromProper(properByKey.get(day.celebrationKey));
  }

  if (day.season === 'lent' && day.weekOfSeason === null) {
    const key = ASH_WEDNESDAY_STUB_KEYS[day.dayOfWeek];
    return key ? fromProper(properByKey.get(key)) : null;
  }

  if (day.weekOfSeason === null) return null;
  const key = `year${day.officeYear}:${day.season}:${day.weekOfSeason}:${day.dayOfWeek}`;
  return weekBased.get(key) ?? null;
}
