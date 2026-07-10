// Resolves a calendar day to its four-week-psalter skeleton content
// (data/psalter/weekN/<day>.json). See TASKS.md Phase 5 and
// SOURCES.md for the important caveat that this skeleton is an
// unverified best-effort reconstruction, not a transcription of the
// official assignment.
import complineData from '../data/psalter/compline.json';
import type { DayOfWeek, PsalterWeek, Season } from './calendar';

export type PsalmodyItem =
  | { type: 'psalm'; ref: string }
  | { type: 'canticle'; scriptureRef: string; name?: string }
  | { type: 'canticle'; fixedId: 'benedicite' };

export interface ShortReadingRef {
  ref: string;
  verified: boolean;
}

export interface PsalterHour {
  psalmody: PsalmodyItem[];
  shortReading?: ShortReadingRef;
}

export interface PsalterDay {
  verified: boolean;
  officeOfReadings: PsalterHour | { ordinaryTime: PsalterHour; strongSeasons: PsalterHour };
  lauds: PsalterHour;
  daytimePrayer: PsalterHour;
  vespers?: PsalterHour;
  firstVespers?: PsalterHour;
}

const files = import.meta.glob<PsalterDay>('../data/psalter/week*/*.json', { eager: true, import: 'default' });

const skeleton = new Map<string, PsalterDay>();
for (const [path, content] of Object.entries(files)) {
  const match = path.match(/week(\d)\/(\w+)\.json$/);
  if (!match) throw new Error(`Unexpected psalter skeleton file path: ${path}`);
  const [, week, day] = match;
  skeleton.set(`${week}:${day}`, content);
}

/** Returns null for the Easter octave's special psalter (psalterWeek 'easter') - not part of the four-week skeleton this phase builds. */
export function resolvePsalterDay(psalterWeek: PsalterWeek, dayOfWeek: DayOfWeek): PsalterDay | null {
  if (psalterWeek === 'easter') return null;
  const day = skeleton.get(`${psalterWeek}:${dayOfWeek}`);
  if (!day) throw new Error(`No psalter skeleton file for week ${psalterWeek} ${dayOfWeek}`);
  return day;
}

const compline = complineData as { invitatory: { default: string; alternatives: string[] }; days: Record<DayOfWeek, PsalterHour> };

export function resolveCompline(dayOfWeek: DayOfWeek): PsalterHour { return compline.days[dayOfWeek]; }
export function resolveInvitatoryPsalmody() { return compline.invitatory; }

export function selectOfficeOfReadings(day: PsalterDay, season: Season): PsalterHour {
  if ('psalmody' in day.officeOfReadings) return day.officeOfReadings;
  return season === 'ordinaryTime' ? day.officeOfReadings.ordinaryTime : day.officeOfReadings.strongSeasons;
}
