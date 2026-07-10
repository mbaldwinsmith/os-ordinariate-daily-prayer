import data from '../data/texts/prayerBookPrayers.json';
import type { DayOfWeek } from './calendar';
import type { HourName } from './proper';

export interface PrayerBookItem {
  title: string;
  kind: 'prayer' | 'versicles' | 'litany';
  verified: true;
  sourceRef: string;
  text?: string;
  responses?: { leader: string; people: string }[];
}

const items = data.items as Record<string, PrayerBookItem>;

export function resolvePrayerBook(hour: HourName, dayOfWeek: DayOfWeek): PrayerBookItem[] {
  const ids = [...data.assignments[hour]];
  if (hour === 'lauds' && (data.litanyDays as DayOfWeek[]).includes(dayOfWeek)) ids.push('litany');
  return ids.map((id) => {
    const item = items[id];
    if (!item) throw new Error(`Unknown Prayer Book prayer id: ${id}`);
    return item;
  });
}
