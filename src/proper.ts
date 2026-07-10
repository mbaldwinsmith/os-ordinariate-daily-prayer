// Resolves the proper-of-seasons/proper-of-saints override (if any) for a
// day, by celebration key. Shared by src/officeOfReadings.ts (readings
// only) and src/office.ts (full hour overrides, e.g. for the Easter
// Octave, which has no psalter-skeleton entry at all - see TASKS.md
// Phase 8 and CONVENTIONS.md).
import type { DayOfWeek, OfficeDay } from './calendar';
import type { PsalmodyItem, ShortReadingRef } from './psalter';

export type HourName = 'officeOfReadings' | 'lauds' | 'daytimePrayer' | 'vespers' | 'compline';

export interface ProperEntry {
  key: string;
  verified: boolean;
  name?: string;
  firstReading?: { ref: string; title?: string };
  secondReading?: { title: string; sourceRef?: string } | null;
  hours?: Partial<Record<HourName, { psalmody?: PsalmodyItem[]; shortReading?: ShortReadingRef }>>;
}

const seasonFiles = import.meta.glob<ProperEntry>('../data/proper-of-seasons/*.json', {
  eager: true,
  import: 'default',
});
const saintFiles = import.meta.glob<ProperEntry>('../data/proper-of-saints/*.json', {
  eager: true,
  import: 'default',
});

const byKey = new Map<string, ProperEntry>();
for (const entry of [...Object.values(seasonFiles), ...Object.values(saintFiles)]) {
  byKey.set(entry.key, entry);
}

// Ash Wednesday through the following Saturday has no week number, and
// (unlike the Triduum or a solemnity) its romcal celebration key isn't
// reliably stable - an occasional commemoration can occupy the Saturday
// in a given year - so this maps by day-of-week instead. See SOURCES.md.
const ASH_WEDNESDAY_STUB_KEYS: Partial<Record<DayOfWeek, string>> = {
  wednesday: 'ashWednesday',
  thursday: 'thursdayAfterAshWednesday',
  friday: 'fridayAfterAshWednesday',
  saturday: 'saturdayAfterAshWednesday',
};

export function resolveProperEntry(day: OfficeDay): ProperEntry | null {
  if (day.season === 'lent' && day.weekOfSeason === null) {
    const key = ASH_WEDNESDAY_STUB_KEYS[day.dayOfWeek];
    return key ? (byKey.get(key) ?? null) : null;
  }
  return byKey.get(day.celebrationKey) ?? null;
}
