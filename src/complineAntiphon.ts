// Resolves the seasonal Marian antiphon said at the end of Compline. Uses
// the traditional four-way division - Alma Redemptoris Mater (Advent
// through Feb 1), Ave Regina Caelorum (Feb 2 through Holy Saturday), Regina
// Caeli (the Easter season), Salve Regina (the rest of the year) - applied
// against actual calendar dates rather than this app's own Season enum,
// since the boundary (Feb 1/2) falls in the middle of what this app calls
// 'ordinaryTime'. See CONVENTIONS.md and SOURCES.md - all four texts are
// "verified": false.
import type { OfficeDay } from './calendar';
import marianAntiphons from '../data/texts/marianAntiphons.json';

export interface MarianAntiphon {
  name: string;
  english: string;
  /** Always false in the shipped data file - see SOURCES.md. */
  verified: boolean;
}

export function resolveMarianAntiphon(day: OfficeDay): MarianAntiphon {
  const [, monthStr, dayStr] = day.date.split('-');
  const month = Number(monthStr);
  const dayOfMonth = Number(dayStr);

  if (day.season === 'advent' || day.season === 'christmas') return marianAntiphons.almaRedemptorisMater;
  if (day.season === 'easter') return marianAntiphons.reginaCaeli;

  // 'ordinaryTime' between Baptism of the Lord and Candlemas (Feb 2) still
  // carries the Christmas-season antiphon.
  if (day.season === 'ordinaryTime' && (month === 1 || (month === 2 && dayOfMonth === 1))) {
    return marianAntiphons.almaRedemptorisMater;
  }

  // 'lent'/'triduum', plus early 'ordinaryTime' (Feb 2 through Ash
  // Wednesday). Ordinary Time's pre-Lent stretch never reaches April, and
  // its post-Pentecost stretch never starts before mid-May, so a plain
  // month check safely tells the two apart.
  if (day.season === 'lent' || day.season === 'triduum' || (day.season === 'ordinaryTime' && month <= 3)) {
    return marianAntiphons.aveReginaCaelorum;
  }

  return marianAntiphons.salveRegina;
}
