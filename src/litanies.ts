import data from '../data/texts/litanies.json';

export interface LitanyItem {
  title: string;
  kind: 'prayer' | 'versicles' | 'litany';
  verified: true;
  sourceRef: string;
  text?: string | string[];
  responses?: { leader: string; people: string }[];
}

const items = data.items as Record<string, LitanyItem>;

export function listLitanies(): LitanyItem[] {
  return data.order.map((id) => {
    const item = items[id];
    if (!item) throw new Error(`Unknown litany id: ${id}`);
    return item;
  });
}
