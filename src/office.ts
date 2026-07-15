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
import { getOfficeDay, type OfficeDay } from './calendar';
import { resolveCompline, resolvePsalterDay, selectOfficeOfReadings, type PsalmodyItem, type PsalterHour } from './psalter';
import { resolvePsalmRef } from './psalms';
import { resolveOfficeOfReadings } from './officeOfReadings';
import { resolveProperEntry, type HourName } from './proper';
import { resolveScriptureRef } from './scripture';
import { resolveInvitatoryAntiphon, type InvitatoryAntiphon } from './invitatory';
import { resolveOAntiphon, type OAntiphon } from './oAntiphon';
import { resolveMarianAntiphon, type MarianAntiphon } from './complineAntiphon';
import { resolveDecemberShortReading } from './decemberShortReadings';

type GospelCanticleId = 'benedictus' | 'magnificat' | 'nuncDimittis';

const HOUR_NAMES: HourName[] = ['officeOfReadings', 'lauds', 'daytimePrayer', 'vespers', 'compline'];

export type ResolvedPsalmodyItem =
  | { type: 'psalm'; ref: string; verses: Record<string, string> }
  | { type: 'canticle'; ref: string; name?: string; verses: Record<string, string> };

export interface HourView {
  psalmody: ResolvedPsalmodyItem[];
  shortReading: ({ ref: string; verified: boolean; verses: Record<string, string> }) | null;
  gospelCanticle: (typeof fixedCanticles)[GospelCanticleId] | null;
  /** The celebration this Hour belongs to; Vespers can differ from the selected civil day. */
  effectiveDay: OfficeDay;
  vespersKind: 'first' | 'second' | null;
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

function resolveHourContent(psalmody: PsalmodyItem[], hourName: HourName, effectiveDay: OfficeDay, vespersKind: HourView['vespersKind'], reading?: { ref: string; verified: boolean }): HourView {
  const gospelId = GOSPEL_CANTICLE_BY_HOUR[hourName];
  return {
    psalmody: resolvePsalmody(psalmody),
    shortReading: reading ? { ...reading, ...resolveScriptureRef(reading.ref) } : null,
    gospelCanticle: gospelId ? fixedCanticles[gospelId] : null,
    effectiveDay,
    vespersKind,
  };
}

function resolveLongReading(reading: { ref?: string; refs?: string[]; title?: string }): ReadingsView['scriptureReading'] {
  const refs = reading.refs ?? [reading.ref!];
  const resolved = refs.map(resolveScriptureRef);
  const multiple = resolved.length > 1;
  return {
    ref: refs.join('; '),
    title: reading.title,
    verses: Object.fromEntries(resolved.flatMap((part) => Object.entries(part.verses).map(([verse, value]) => [multiple ? `${part.ref.split(' ')[0]} ${verse}` : verse, value]))),
  };
}

function nextCivilDay(day: OfficeDay): OfficeDay {
  const [year, month, date] = day.date.split('-').map(Number);
  return getOfficeDay(new Date(year, month - 1, date + 1));
}

function saturdayBeginsSunday(day: OfficeDay, sunday: OfficeDay): boolean {
  if (day.dayOfWeek !== 'saturday') return false;
  if (day.rank !== 'solemnity') return true;
  return ['advent', 'lent', 'easter'].includes(sunday.season);
}

/**
 * Returns null only when there's neither a skeleton entry nor a full proper
 * override for every hour - in practice, just an unpopulated corner of the
 * Easter octave (psalterWeek 'easter' with no matching proper override yet).
 */
export function resolveDay(day: OfficeDay): DayView | null {
  const proper = resolveProperEntry(day);
  const skeleton = resolvePsalterDay(day.psalterWeek, day.dayOfWeek);
  const tomorrow = day.dayOfWeek === 'saturday' ? nextCivilDay(day) : null;
  const firstVespers = tomorrow ? saturdayBeginsSunday(day, tomorrow) : false;
  const vespersDay = firstVespers ? tomorrow! : day;
  const vespersProper = firstVespers ? resolveProperEntry(vespersDay) : proper;
  // Saturday has no ferial Vespers row. A Saturday solemnity can supply its
  // proper reading while retaining the following Sunday's First-Vespers
  // psalmody as the existing best-effort structural fallback.
  const saturdaySundaySkeleton = tomorrow ? resolvePsalterDay(tomorrow.psalterWeek, 'sunday') : null;
  const vespersSkeleton = firstVespers ? saturdaySundaySkeleton : skeleton;

  if (!skeleton && !HOUR_NAMES.every((hourName) => proper?.hours?.[hourName])) return null;

  const readingsDay = resolveOfficeOfReadings(day);
  const ferialHours: Partial<Record<HourName, PsalterHour>> = skeleton ? {
    officeOfReadings: selectOfficeOfReadings(skeleton, day.season),
    lauds: skeleton.lauds,
    daytimePrayer: skeleton.daytimePrayer,
    vespers: day.dayOfWeek === 'saturday' ? saturdaySundaySkeleton?.firstVespers : vespersSkeleton?.vespers,
    compline: resolveCompline(day.dayOfWeek),
  } : {};
  if (day.season === 'lent' && day.dayOfWeek === 'sunday' && ferialHours.vespers) {
    ferialHours.vespers = { ...ferialHours.vespers, psalmody: ferialHours.vespers.psalmody.map((item, index, all) => index === all.length - 1 ? { type: 'canticle', scriptureRef: '1 Pt 2:21-24' } : item) };
  }

  const hourViews = Object.fromEntries(
    HOUR_NAMES.map((hourName) => {
      const hourProper = hourName === 'vespers' && firstVespers ? vespersProper?.hours?.firstVespers : proper?.hours?.[hourName];
      const psalmody = hourProper?.psalmody ?? ferialHours[hourName]?.psalmody;
      const effectiveDay = hourName === 'vespers' ? vespersDay : day;
      // Dec 17-24 overrides win over both the celebrationKey-based proper and the ferial
      // skeleton - see src/decemberShortReadings.ts for why celebrationKey isn't safe here.
      const shortReading = resolveDecemberShortReading(effectiveDay, hourName) ?? hourProper?.shortReading ?? ferialHours[hourName]?.shortReading;
      const vespersKind = hourName === 'vespers' ? (firstVespers ? 'first' : day.dayOfWeek === 'sunday' || day.rank === 'solemnity' ? 'second' : null) : null;
      return [hourName, resolveHourContent(psalmody!, hourName, effectiveDay, vespersKind, shortReading)];
    }),
  ) as Record<HourName, HourView>;

  return {
    verified: skeleton?.verified ?? proper!.verified,
    ...hourViews,
    readings: readingsDay && {
      verified: readingsDay.verified,
      scriptureReading: resolveLongReading(readingsDay.scriptureReading),
      patristicReading: readingsDay.patristicReading,
    },
    invitatory: resolveInvitatoryAntiphon(day),
    oAntiphon: resolveOAntiphon(day),
    complineAntiphon: resolveMarianAntiphon(day),
  };
}

/** Resolve one Hour without requiring callers to understand its effective liturgical day. */
export function resolveHour(day: OfficeDay, hourName: HourName): HourView | null {
  return resolveDay(day)?.[hourName] ?? null;
}
