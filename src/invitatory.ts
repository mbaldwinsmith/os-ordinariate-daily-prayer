// Resolves the antiphon said before the Venite/Jubilate at the start of the
// day's first Hour. This app always attaches the Invitatory to Office of
// Readings (the first Hour in HOURS' own listed order) rather than to
// whichever Hour a given user happens to pray first, which is a deliberate
// simplification - see CONVENTIONS.md.
import type { DayOfWeek, OfficeDay } from './calendar';
import invitatoryAntiphons from '../data/texts/invitatoryAntiphons.json';

export interface InvitatoryAntiphon {
  firstLine: string;
  secondLine: string;
}

type WeekdayGroup = keyof typeof invitatoryAntiphons.weekdayGroups;

const WEEKDAY_GROUP: Record<DayOfWeek, WeekdayGroup> = {
  sunday: 'sunWedSat',
  monday: 'monThu',
  tuesday: 'tueFri',
  wednesday: 'sunWedSat',
  thursday: 'monThu',
  friday: 'tueFri',
  saturday: 'sunWedSat',
};

const celebrations: Record<string, InvitatoryAntiphon> = invitatoryAntiphons.celebrations;

export function resolveInvitatoryAntiphon(day: OfficeDay): InvitatoryAntiphon {
  const celebration = celebrations[day.celebrationKey];
  if (celebration) return celebration;

  if (day.season === 'advent') return invitatoryAntiphons.seasons.advent;

  if (day.season === 'christmas') {
    const [, monthStr, dayStr] = day.date.split('-');
    const beforeEpiphany = Number(monthStr) === 12 || Number(dayStr) < 6;
    return beforeEpiphany ? invitatoryAntiphons.seasons.christmasBeforeEpiphany : invitatoryAntiphons.seasons.christmasAfterEpiphany;
  }

  if (day.season === 'lent' || day.season === 'triduum') return invitatoryAntiphons.seasons.lentAndTriduum;
  if (day.season === 'easter') return invitatoryAntiphons.seasons.easter;

  return invitatoryAntiphons.weekdayGroups[WEEKDAY_GROUP[day.dayOfWeek]];
}
