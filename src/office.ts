// Resolves a day into hour-by-hour content: the psalmody from the
// four-week skeleton (src/psalter.ts) plus, for Lauds/Vespers/Compline,
// the fixed Gospel canticle that's prayed there every day regardless of
// the skeleton (Benedictus/Magnificat/Nunc Dimittis - see CONVENTIONS.md
// for why Benedicite doesn't work the same way).
import fixedCanticles from '../data/texts/fixedCanticles.json';
import type { OfficeDay } from './calendar';
import { resolvePsalterDay, type PsalmodyItem } from './psalter';
import { resolvePsalmRef } from './psalms';
import { resolveOfficeOfReadings } from './officeOfReadings';
import { resolveScriptureRef } from './scripture';

type GospelCanticleId = 'benedictus' | 'magnificat' | 'nuncDimittis';
type HourName = 'officeOfReadings' | 'lauds' | 'daytimePrayer' | 'vespers' | 'compline';

export type ResolvedPsalmodyItem =
  | { type: 'psalm'; ref: string; verses: Record<string, string> }
  | Exclude<PsalmodyItem, { type: 'psalm' }>;

export interface HourView {
  psalmody: ResolvedPsalmodyItem[];
  gospelCanticle: (typeof fixedCanticles)[GospelCanticleId] | null;
}

export interface ReadingsView {
  verified: boolean;
  scriptureReading: { ref: string; title?: string; verses: Record<string, string> };
  patristicReading: { title: string; sourceRef?: string } | null;
}

export interface DayView {
  /** false = this day's skeleton content is an unverified reconstruction - see SOURCES.md. */
  verified: boolean;
  officeOfReadings: HourView;
  lauds: HourView;
  daytimePrayer: HourView;
  vespers: HourView;
  compline: HourView;
  /** null when Office of Readings content isn't populated yet for this year/season (see TASKS.md Phase 7's scope). */
  readings: ReadingsView | null;
}

const GOSPEL_CANTICLE_BY_HOUR: Partial<Record<HourName, GospelCanticleId>> = {
  lauds: 'benedictus',
  vespers: 'magnificat',
  compline: 'nuncDimittis',
};

function resolvePsalmody(psalmody: PsalmodyItem[]): ResolvedPsalmodyItem[] {
  return psalmody.map((item) => (item.type === 'psalm' ? { ...item, ...resolvePsalmRef(item.ref) } : item));
}

function resolveHour(psalmody: PsalmodyItem[], hourName: HourName): HourView {
  const gospelId = GOSPEL_CANTICLE_BY_HOUR[hourName];
  return {
    psalmody: resolvePsalmody(psalmody),
    gospelCanticle: gospelId ? fixedCanticles[gospelId] : null,
  };
}

/** Returns null for the Easter octave (psalterWeek 'easter') - its special psalter isn't part of the Phase 5 skeleton. */
export function resolveDay(day: OfficeDay): DayView | null {
  const skeleton = resolvePsalterDay(day.psalterWeek, day.dayOfWeek);
  if (!skeleton) return null;

  const readingsDay = resolveOfficeOfReadings(day);

  return {
    verified: skeleton.verified,
    officeOfReadings: resolveHour(skeleton.officeOfReadings.psalmody, 'officeOfReadings'),
    lauds: resolveHour(skeleton.lauds.psalmody, 'lauds'),
    daytimePrayer: resolveHour(skeleton.daytimePrayer.psalmody, 'daytimePrayer'),
    vespers: resolveHour(skeleton.vespers.psalmody, 'vespers'),
    compline: resolveHour(skeleton.compline.psalmody, 'compline'),
    readings: readingsDay && {
      verified: readingsDay.verified,
      scriptureReading: {
        ...readingsDay.scriptureReading,
        ...resolveScriptureRef(readingsDay.scriptureReading.ref),
      },
      patristicReading: readingsDay.patristicReading,
    },
  };
}
