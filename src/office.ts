// Resolves a day into hour-by-hour content: which canticle belongs at each
// of Lauds/Vespers/Compline, and its actual text. This is a Phase 4 proof
// that the render pipeline works end-to-end (calendar -> hour -> canticle
// text) - the psalms below are placeholders. The real 28-day psalter
// skeleton (data/psalter/weekN/<day>.json, schema/psalter-day.schema.json)
// is Phase 5's job, not this one's.
import fixedCanticles from '../data/texts/fixedCanticles.json';
import type { OfficeDay } from './calendar';

type CanticleId = keyof typeof fixedCanticles;

export interface HourView {
  psalms: string[];
  canticle: {
    name: string;
    scriptureRef: string;
    verses: Record<string, string>;
  };
}

export interface DayView {
  lauds: HourView;
  vespers: HourView;
  compline: HourView;
}

const PLACEHOLDER_PSALMS = ['Ps 1'];

function resolveHour(canticleId: CanticleId): HourView {
  return {
    psalms: PLACEHOLDER_PSALMS,
    canticle: fixedCanticles[canticleId],
  };
}

/** Lauds always closes with the Benedictus, Vespers with the Magnificat, Compline with the Nunc Dimittis. */
export function resolveDay(_day: OfficeDay): DayView {
  return {
    lauds: resolveHour('benedictus'),
    vespers: resolveHour('magnificat'),
    compline: resolveHour('nuncDimittis'),
  };
}
