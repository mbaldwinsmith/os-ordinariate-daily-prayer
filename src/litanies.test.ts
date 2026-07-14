import { describe, expect, it } from 'vitest';
import { listLitanies } from './litanies';
import data from '../data/texts/litanies.json';

describe('Litanies & personal devotions', () => {
  it('resolves every order id to an item', () => {
    for (const id of data.order) expect(data.items).toHaveProperty(id);
  });

  it('returns items in order sequence', () => {
    const titles = listLitanies().map((item) => item.title);
    const expectedTitles = data.order.map((id) => (data.items as Record<string, { title: string }>)[id].title);
    expect(titles).toEqual(expectedTitles);
  });

  it('gives every item text or responses', () => {
    for (const item of listLitanies()) expect(item.text || item.responses).toBeTruthy();
  });

  it('includes the Litany of the Blessed Virgin Mary with its full invocation sequence', () => {
    const litany = listLitanies().find((item) => item.title === 'Litany of the Blessed Virgin Mary');
    expect(litany?.responses?.at(0)).toEqual({ leader: 'Lord, have mercy on us.', people: 'Lord, have mercy on us.' });
    expect(litany?.responses?.at(-1)).toEqual({
      leader: 'Pray for us, O Holy Mother of God,',
      people: 'That we may be made worthy of the promises of Christ.',
    });
  });

  it("splits St. Patrick's Breastplate into its traditional stanzas", () => {
    const breastplate = listLitanies().find((item) => item.title === "St. Patrick's Breastplate");
    expect(Array.isArray(breastplate?.text)).toBe(true);
    expect((breastplate?.text as string[]).length).toBeGreaterThan(1);
  });
});
