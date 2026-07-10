// Thin wrapper around romcal (General Roman Calendar engine) that resolves
// a JS Date into the liturgical facts the rest of the app needs: season,
// week-of-season, rank, psalter week, Office of Readings year, and Sunday
// Mass cycle letter. See TASKS.md Phase 2 and the derivation notes below.
import romcal from 'romcal';

export type Season = 'advent' | 'christmas' | 'ordinaryTime' | 'lent' | 'triduum' | 'easter';
export type Rank = 'solemnity' | 'feast' | 'memorial' | 'optionalMemorial' | 'weekday';
export type PsalterWeek = 1 | 2 | 3 | 4 | 'easter';
export type OfficeYear = 'I' | 'II';
export type SundayCycle = 'A' | 'B' | 'C';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const DAYS_OF_WEEK: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export interface OfficeDay {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  dayOfWeek: DayOfWeek;
  /** romcal's celebration name for the day (a saint's feast, "2nd Sunday of Advent", etc). */
  celebrationName: string;
  /**
   * romcal's own stable celebration key (e.g. "christmas", "holyThursday",
   * "saintStephenTheFirstMartyr"). Reliable for high-ranking days (nothing
   * displaces a solemnity/feast/Triduum day); NOT reliable for ferias that
   * an optional memorial or commemoration might be occupying instead - see
   * CONVENTIONS.md before using this to look up proper-of-seasons/-saints.
   */
  celebrationKey: string;
  season: Season;
  /**
   * null for the Christmas season, the Triduum, and the handful of days
   * between Ash Wednesday and the first Sunday of Lent - none of these
   * stretches use a numbered "week of season" in the Liturgy of the Hours.
   */
  weekOfSeason: number | null;
  rank: Rank;
  psalterWeek: PsalterWeek;
  officeYear: OfficeYear;
  sundayCycle: SundayCycle;
}

/** romcal's raw per-date output shape (the library ships no types of its own). */
interface RomcalEntry {
  moment: string;
  type: string;
  name: string;
  key: string;
  data: {
    season: { key: string; value: string };
    meta: {
      psalterWeek: { key: number; value: string };
      cycle: { key: number; value: string };
    };
  };
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const yearCache = new Map<number, RomcalEntry[]>();

function getYear(year: number): RomcalEntry[] {
  let entries = yearCache.get(year);
  if (!entries) {
    entries = romcal.calendarFor({ year }) as unknown as RomcalEntry[];
    yearCache.set(year, entries);
  }
  return entries;
}

function findEntry(year: number, dateKey: string): RomcalEntry | undefined {
  return getYear(year).find((entry) => entry.moment.slice(0, 10) === dateKey);
}

const SEASON_MAP: Record<string, Season> = {
  Advent: 'advent',
  Christmas: 'christmas',
  'Ordinary Time': 'ordinaryTime',
  Lent: 'lent',
  Eastertide: 'easter',
  // 'Holy Week' is handled specially in mapSeason: Monday-Wednesday are
  // still Lent, and Thursday-Saturday are the Triduum (romcal tags those
  // three days with type TRIDUUM, which is what we key off of).
};

const RANK_MAP: Record<string, Rank> = {
  SOLEMNITY: 'solemnity',
  SUNDAY: 'solemnity',
  TRIDUUM: 'solemnity',
  // Monday-Wednesday of Holy Week: privileged ferias, but ferias
  // nonetheless - they outrank ordinary memorials but there's no separate
  // slot for that nuance in our 5-value rank vocabulary.
  HOLY_WEEK: 'weekday',
  FEAST: 'feast',
  MEMORIAL: 'memorial',
  OPT_MEMORIAL: 'optionalMemorial',
  COMMEMORATION: 'optionalMemorial',
  FERIA: 'weekday',
};

function mapSeason(entry: RomcalEntry): Season {
  const { value } = entry.data.season;
  if (value === 'Holy Week') {
    return entry.type === 'TRIDUUM' ? 'triduum' : 'lent';
  }
  const mapped = SEASON_MAP[value];
  if (!mapped) throw new Error(`Unrecognized romcal season value: ${value}`);
  return mapped;
}

function mapPsalterWeek(entry: RomcalEntry): PsalterWeek {
  const { key } = entry.data.meta.psalterWeek;
  if (key === 5) return 'easter';
  if (key >= 1 && key <= 4) return key as 1 | 2 | 3 | 4;
  throw new Error(`Unrecognized romcal psalter week key: ${key}`);
}

function mapSundayCycle(entry: RomcalEntry): SundayCycle {
  const letter = entry.data.meta.cycle.value.replace('Year ', '');
  if (letter === 'A' || letter === 'B' || letter === 'C') return letter;
  throw new Error(`Unrecognized romcal cycle value: ${entry.data.meta.cycle.value}`);
}

const WEEK_NUMBER_PATTERN = /(\d+)(?:st|nd|rd|th)\s+(?:sunday|week)/i;

/**
 * Ordinary Time's week count runs continuously through romcal's internal
 * "Early"/"Later Ordinary Time" split (both report season.value "Ordinary
 * Time"), and Advent/Lent/Easter number their weeks too - but the name
 * shown for a given date is often a saint's feast/memorial that carries no
 * week number at all. A memorial never displaces every day of its calendar
 * week, so scan the rest of that Sunday-Saturday week (which always shares
 * the same week-of-season) for a day whose name does carry the number.
 */
function findWeekOfSeason(date: Date, entry: RomcalEntry): number | null {
  const { value: seasonValue } = entry.data.season;

  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());

  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + offset);
    const dayEntry = findEntry(day.getFullYear(), toDateKey(day));
    if (!dayEntry || dayEntry.data.season.value !== seasonValue) continue;
    const match = dayEntry.name.match(WEEK_NUMBER_PATTERN);
    if (match) return Number(match[1]);
  }

  return null;
}

export function getOfficeDay(date: Date): OfficeDay {
  const dateKey = toDateKey(date);
  const entry = findEntry(date.getFullYear(), dateKey);
  if (!entry) throw new Error(`No romcal entry found for ${dateKey}`);

  const season = mapSeason(entry);
  const rank = RANK_MAP[entry.type];
  if (!rank) throw new Error(`Unrecognized romcal celebration type: ${entry.type}`);

  return {
    date: dateKey,
    dayOfWeek: DAYS_OF_WEEK[date.getDay()],
    celebrationName: entry.name,
    celebrationKey: entry.key,
    season,
    weekOfSeason: season === 'christmas' || season === 'triduum' ? null : findWeekOfSeason(date, entry),
    rank,
    psalterWeek: mapPsalterWeek(entry),
    // The Office of Readings' two-year cycle follows the plain civil
    // calendar year and flips on January 1st - unlike the Sunday Mass
    // cycle (A/B/C), it does NOT wait for Advent to turn over.
    officeYear: date.getFullYear() % 2 === 1 ? 'I' : 'II',
    sundayCycle: mapSundayCycle(entry),
  };
}
