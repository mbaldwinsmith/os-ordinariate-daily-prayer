// Resolves a calendar day to its four-week-psalter skeleton content
// (data/psalter/weekN/<day>.json). See TASKS.md Phase 5 and
// SOURCES.md for the important caveat that this skeleton is an
// unverified best-effort reconstruction, not a transcription of the
// official assignment.
import type { DayOfWeek, PsalterWeek } from './calendar';

export type PsalmodyItem =
  | { type: 'psalm'; ref: string }
  | { type: 'canticle'; scriptureRef: string; name?: string }
  | { type: 'canticle'; fixedId: 'benedicite' };

export interface ShortReadingRef {
  ref: string;
  verified: boolean;
}

interface PsalterHour {
  psalmody: PsalmodyItem[];
  shortReading?: ShortReadingRef;
}

export interface PsalterDay {
  verified: boolean;
  officeOfReadings: PsalterHour;
  lauds: PsalterHour;
  daytimePrayer: PsalterHour;
  vespers: PsalterHour;
  compline: PsalterHour;
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
