import { describe, expect, it } from 'vitest';
import { getOfficeDay } from './calendar';
import { resolveDay } from './office';
import { resolveScriptureRef } from './scripture';

interface ReadingRef {
  ref: string;
  verified: boolean;
}

interface PsalterFile {
  officeOfReadings: { shortReading?: ReadingRef };
  lauds: { shortReading?: ReadingRef };
  daytimePrayer: { shortReading?: ReadingRef };
  vespers: { shortReading?: ReadingRef };
  compline: { shortReading?: ReadingRef };
}

const files = import.meta.glob<PsalterFile>('../data/psalter/week*/*.json', {
  eager: true,
  import: 'default',
});

function resolveDate(date: Date) {
  const day = resolveDay(getOfficeDay(date));
  if (!day) throw new Error('expected a resolved day');
  return day;
}

describe('short readings', () => {
  it('populates all four applicable Hours across all 28 ferial psalter days', () => {
    expect(Object.keys(files)).toHaveLength(28);
    for (const file of Object.values(files)) {
      expect(file.officeOfReadings.shortReading).toBeUndefined();
      for (const hourName of ['lauds', 'daytimePrayer', 'vespers', 'compline'] as const) {
        const reading = file[hourName].shortReading;
        expect(reading, `${hourName} short reading`).toBeDefined();
        expect(reading?.verified).toBe(false);
        expect(() => resolveScriptureRef(reading!.ref)).not.toThrow();
        expect(Object.keys(resolveScriptureRef(reading!.ref).verses).length).toBeGreaterThan(0);
      }
    }
  });

  it('uses the same fixed Compline reading for a weekday in every psalter week', () => {
    const mondayReadings = Object.entries(files)
      .filter(([path]) => path.endsWith('/monday.json'))
      .map(([, file]) => file.compline.shortReading?.ref);
    expect(mondayReadings).toHaveLength(4);
    expect(new Set(mondayReadings)).toEqual(new Set(['1 Thes 5:9-10']));
  });

  it('never assigns an ordinary Gospel reading', () => {
    const refs = Object.values(files).flatMap((file) =>
      [file.lauds, file.daytimePrayer, file.vespers, file.compline].map((hour) => hour.shortReading!.ref),
    );
    expect(refs.some((ref) => /^(Mt|Mk|Lk|Jn) /.test(ref))).toBe(false);
  });

  it('uses proper short readings for Christmas instead of the ferial assignment', () => {
    const day = resolveDate(new Date(2024, 11, 25));
    expect(day.lauds.shortReading?.ref).toBe('Heb 1:1-4');
    expect(day.vespers.shortReading?.ref).toBe('1 Jn 1:1-3');
    expect(day.compline.shortReading).not.toBeNull();
  });

  it('uses the representative Proper of Saints override for the Assumption', () => {
    const day = resolveDate(new Date(2024, 7, 15));
    expect(day.lauds.shortReading?.ref).toBe('Is 61:10');
    expect(day.daytimePrayer.shortReading?.ref).toBe('Rv 12:1');
    expect(day.vespers.shortReading?.ref).toBe('1 Cor 15:22-23');
    expect(day.compline.shortReading).not.toBeNull();
  });

  it('uses sourced Easter proper readings and leaves an unavailable proper visible as missing', () => {
    const day = resolveDate(new Date(2024, 2, 31));
    expect(day.lauds.shortReading?.ref).toBe('Acts 10:40-43');
    expect(day.vespers.shortReading?.ref).toBe('Heb 10:12-14');
    expect(day.compline.shortReading?.ref).toBe('Rv 22:4-5');
    expect(day.daytimePrayer.shortReading).toBeNull();
  });
});
