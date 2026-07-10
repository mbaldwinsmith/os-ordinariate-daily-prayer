// Resolves the "O Antiphon" attached to the Magnificat at Vespers, Dec
// 16-23. This app follows the Sarum/English tradition of 8 antiphons
// (adding "O Virgo virginum" for Dec 23) rather than the Roman tradition's
// 7 (Dec 17-23) - see CONVENTIONS.md and SOURCES.md.
import type { OfficeDay } from './calendar';
import oAntiphons from '../data/texts/oAntiphons.json';

export interface OAntiphon {
  latin: string;
  english: string;
  hymn?: string;
  citation: string;
}

const antiphonsByDay: Record<string, OAntiphon> = oAntiphons;

export function resolveOAntiphon(day: OfficeDay): OAntiphon | null {
  const [, monthStr, dayStr] = day.date.split('-');
  if (Number(monthStr) !== 12) return null;
  return antiphonsByDay[String(Number(dayStr))] ?? null;
}
