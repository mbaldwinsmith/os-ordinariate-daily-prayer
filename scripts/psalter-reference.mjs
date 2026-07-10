const BOOKS = { Dan: 'Dn', Exod: 'Ex', Deut: 'Dt', Tobit: 'Tb', Judith: 'Jdt', Isa: 'Is', Hab: 'Hb', Sirach: 'Sir', Ezek: 'Ez', Rev: 'Rv', Peter: 'Pt', Thess: 'Thes' };

export function normalizePsalmRef(ref) {
  return ref.replace(/([0-9])([abc])\b/g, '$1').replace(/Ps (\d+):([^;]+);\s*/g, 'Ps $1:$2, ');
}

export function normalizeScriptureRef(ref) {
  let value = ref.replace(/([0-9])([abc])\b/g, '$1').replace(/;\s*/g, ', ');
  const match = value.match(/^(\d\s+)?([A-Za-z]+)(.*)$/);
  if (!match) return value;
  const [, ordinal = '', rawBook, rest] = match;
  return `${ordinal}${BOOKS[rawBook] ?? rawBook}${rest}`;
}
