// Resolves a day into hour-by-hour content: the psalmody from the
// four-week skeleton (src/psalter.ts) plus, for Lauds/Vespers/Compline,
// the fixed Gospel canticle that's prayed there every day regardless of
// the skeleton (Benedictus/Magnificat/Nunc Dimittis - see CONVENTIONS.md
// for why Benedicite doesn't work the same way).
//
// A proper-of-seasons/proper-of-saints override (src/proper.ts) takes
// precedence hour-by-hour over the skeleton when present - this is how a
// solemnity's own psalmody replaces the ferial one. The Easter octave has
// no skeleton entry at all (psalterWeek 'easter'), so it relies entirely
// on a full proper override instead - see TASKS.md Phase 8.
import fixedCanticles from '../data/texts/fixedCanticles.json';
import type { OfficeDay } from './calendar';
import { resolvePsalterDay, type PsalmodyItem } from './psalter';
import { resolvePsalmRef } from './psalms';
import { resolveOfficeOfReadings } from './officeOfReadings';
import { resolveProperEntry, type HourName } from './proper';
import { resolveScriptureRef } from './scripture';
import { resolveInvitatoryAntiphon, type InvitatoryAntiphon } from './invitatory';
import { resolveOAntiphon, type OAntiphon } from './oAntiphon';
import { resolveMarianAntiphon, type MarianAntiphon } from './complineAntiphon';

type GospelCanticleId = 'benedictus' | 'magnificat' | 'nuncDimittis';

const HOUR_NAMES: HourName[] = ['officeOfReadings', 'lauds', 'daytimePrayer', 'vespers', 'compline'];

export type ResolvedPsalmodyItem =
  | { type: 'psalm'; ref: string; verses: Record<string, string> }
  | { type: 'canticle'; ref: string; name?: string; verses: Record<string, string> };

export interface HourView {
  psalmody: ResolvedPsalmodyItem[];
  shortReading: ({ ref: string; verified: boolean; verses: Record<string, string> }) | null;
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
  /** Said before the Venite/Jubilate - this app always attaches it to Office of Readings, see CONVENTIONS.md. */
  invitatory: InvitatoryAntiphon;
  /** Attached to the Magnificat at Vespers, Dec 16-23 only - null every other day. */
  oAntiphon: OAntiphon | null;
  /** The seasonal Marian antiphon said at the end of Compline. Always "verified": false - see SOURCES.md. */
  complineAntiphon: MarianAntiphon;
}

const GOSPEL_CANTICLE_BY_HOUR: Partial<Record<HourName, GospelCanticleId>> = {
  lauds: 'benedictus',
  vespers: 'magnificat',
  compline: 'nuncDimittis',
};

function resolvePsalmody(psalmody: PsalmodyItem[]): ResolvedPsalmodyItem[] {
  return psalmody.map((item) => {
    if (item.type === 'psalm') return { ...item, ...resolvePsalmRef(item.ref) };
    if ('fixedId' in item) {
      const canticle = fixedCanticles[item.fixedId];
      return { type: 'canticle', ref: canticle.scriptureRef, name: canticle.name, verses: canticle.verses };
    }
    return {
      type: 'canticle',
      ref: item.scriptureRef,
      name: item.name,
      verses: resolveScriptureRef(item.scriptureRef).verses,
    };
  });
}

function resolveHour(psalmody: PsalmodyItem[], hourName: HourName, reading?: { ref: string; verified: boolean }): HourView {
  const gospelId = GOSPEL_CANTICLE_BY_HOUR[hourName];
  return {
    psalmody: resolvePsalmody(psalmody),
    shortReading: reading ? { ...reading, ...resolveScriptureRef(reading.ref) } : null,
    gospelCanticle: gospelId ? fixedCanticles[gospelId] : null,
  };
}

/**
 * Returns null only when there's neither a skeleton entry nor a full proper
 * override for every hour - in practice, just an unpopulated corner of the
 * Easter octave (psalterWeek 'easter' with no matching proper override yet).
 */
export function resolveDay(day: OfficeDay): DayView | null {
  const proper = resolveProperEntry(day);
  const skeleton = resolvePsalterDay(day.psalterWeek, day.dayOfWeek);

  if (!skeleton && !HOUR_NAMES.every((hourName) => proper?.hours?.[hourName])) return null;

  const readingsDay = resolveOfficeOfReadings(day);

  const hourViews = Object.fromEntries(
    HOUR_NAMES.map((hourName) => {
      const psalmody = proper?.hours?.[hourName]?.psalmody ?? skeleton?.[hourName].psalmody;
      const shortReading = proper?.hours?.[hourName]?.shortReading ?? skeleton?.[hourName].shortReading;
      return [hourName, resolveHour(psalmody!, hourName, shortReading)];
    }),
  ) as Record<HourName, HourView>;

  return {
    verified: skeleton?.verified ?? proper!.verified,
    ...hourViews,
    readings: readingsDay && {
      verified: readingsDay.verified,
      scriptureReading: {
        ...readingsDay.scriptureReading,
        ...resolveScriptureRef(readingsDay.scriptureReading.ref),
      },
      patristicReading: readingsDay.patristicReading,
    },
    invitatory: resolveInvitatoryAntiphon(day),
    oAntiphon: resolveOAntiphon(day),
    complineAntiphon: resolveMarianAntiphon(day),
  };
}
