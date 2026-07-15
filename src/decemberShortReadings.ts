// Resolves the Dec 17-24 "greater ferias" (O Antiphon stretch) short-reading override, by
// calendar date rather than by romcal celebration key - see SOURCES.md, "Advent/Lent proper
// short readings" for why: the version of romcal this app depends on assigns those 8 days an
// ordinary week-based celebration key (e.g. "wednesdayOfThe4thWeekOfAdvent") that shifts year
// to year depending on where Christmas falls, so a celebrationKey-keyed proper-of-seasons file
// would silently mis-assign the reading in some years. Mirrors src/oAntiphon.ts, which resolves
// the O Antiphons themselves the same way.
import type { OfficeDay } from './calendar';
import type { HourName } from './proper';
import type { ShortReadingRef } from './psalter';
import decemberShortReadings from '../data/texts/decemberShortReadings.json';

type DecemberHour = 'lauds' | 'daytimePrayer' | 'vespers';

const readingsByDay: Record<string, Partial<Record<DecemberHour, ShortReadingRef>>> = decemberShortReadings;

function isDecemberHour(hourName: HourName): hourName is DecemberHour {
  return hourName === 'lauds' || hourName === 'daytimePrayer' || hourName === 'vespers';
}

/**
 * Sunday keeps its own dedicated proper-of-seasons short reading (e.g.
 * 4thSundayOfAdvent.json) rather than being overridden here - a Sunday falling in this
 * date range is still that Sunday's own celebration, not a ferial "greater feria" day.
 */
export function resolveDecemberShortReading(day: OfficeDay, hourName: HourName): ShortReadingRef | null {
  if (day.dayOfWeek === 'sunday' || !isDecemberHour(hourName)) return null;
  const [, monthStr, dayStr] = day.date.split('-');
  if (Number(monthStr) !== 12) return null;
  return readingsByDay[String(Number(dayStr))]?.[hourName] ?? null;
}
