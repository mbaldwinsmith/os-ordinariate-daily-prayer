import { describe, expect, it } from 'vitest';
import { getOfficeDay } from './calendar';
import { resolveDay } from './office';

describe('resolveDay', () => {
  it('attaches the Benedictus to Lauds, the Magnificat to Vespers, and the Nunc Dimittis to Compline', () => {
    const day = resolveDay(getOfficeDay(new Date(2024, 0, 14)));

    expect(day.lauds.canticle.name).toContain('Benedictus');
    expect(day.lauds.canticle.verses['1']).toContain('Blessed be the Lord God of Israel');

    expect(day.vespers.canticle.name).toContain('Magnificat');
    expect(day.vespers.canticle.verses['1']).toContain('My soul doth magnify the Lord');

    expect(day.compline.canticle.name).toContain('Nunc Dimittis');
    expect(day.compline.canticle.verses['1']).toContain('Lord, now lettest thou thy servant depart in peace');
  });

  it('gives every resolved hour at least one placeholder psalm', () => {
    const day = resolveDay(getOfficeDay(new Date(2024, 0, 14)));
    expect(day.lauds.psalms.length).toBeGreaterThan(0);
    expect(day.vespers.psalms.length).toBeGreaterThan(0);
    expect(day.compline.psalms.length).toBeGreaterThan(0);
  });
});
